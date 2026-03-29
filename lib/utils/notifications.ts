import * as Notifications from 'expo-notifications';
import { supabase } from '../supabase';
import { NOTIFICATION_COPY } from '../../constants/achievements';

// Configure notification behavior (call once at app startup)
export function configureNotifications() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

// Register device push token and save to profile
export async function registerForPushNotifications(userId: string): Promise<void> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') return;

    const projectId = process.env.EXPO_PUBLIC_EXPO_PROJECT_ID;
    if (!projectId) return;

    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    const token = tokenData.data;

    await supabase
      .from('profiles')
      .update({ expo_push_token: token })
      .eq('id', userId);
  } catch {
    // Push notifications not available in Expo Go — silently skip
  }
}

export type NotificationType =
  | 'record_broken'
  | 'throne_claimed'
  | 'throne_lost'
  | 'overstay_60'
  | 'overstay_120'
  | 'friend_active'
  | 'streak_milestone'
  | 'challenger_nearby'
  | 'throne_under_attack'
  | 'territory_invaded'
  | 'revenge_available';

interface NotificationContent {
  title: string;
  body: string;
}

function buildContent(
  type: NotificationType,
  payload: Record<string, unknown>,
): NotificationContent | null {
  switch (type) {
    case 'record_broken': {
      const name = (payload.name as string) ?? 'Someone';
      const lbs = (payload.lbs as number) ?? 0;
      return {
        title: NOTIFICATION_COPY.record_broken.title,
        body: NOTIFICATION_COPY.record_broken.body(name, lbs),
      };
    }
    case 'throne_claimed': {
      const name = (payload.name as string) ?? 'Someone';
      const location = (payload.location as string) ?? 'a throne';
      const lbs = (payload.lbs as number) ?? 0;
      const mins = (payload.mins as number) ?? 0;
      return {
        title: NOTIFICATION_COPY.throne_claimed.title,
        body: NOTIFICATION_COPY.throne_claimed.body(name, location, lbs, mins),
      };
    }
    case 'throne_lost': {
      const friend = (payload.friend as string) ?? 'Someone';
      const location = (payload.location as string) ?? 'your throne';
      return {
        title: NOTIFICATION_COPY.throne_lost.title,
        body: NOTIFICATION_COPY.throne_lost.body(friend, location),
      };
    }
    case 'overstay_60': {
      const name = (payload.name as string) ?? 'Someone';
      return {
        title: NOTIFICATION_COPY.overstay_60.title,
        body: NOTIFICATION_COPY.overstay_60.body(name),
      };
    }
    case 'overstay_120': {
      const name = (payload.name as string) ?? 'Someone';
      return {
        title: NOTIFICATION_COPY.overstay_120.title,
        body: NOTIFICATION_COPY.overstay_120.body(name),
      };
    }
    case 'friend_active': {
      const name = (payload.name as string) ?? 'Someone';
      const location = (payload.location as string) ?? 'Unknown';
      const mins = (payload.mins as number) ?? 0;
      return {
        title: NOTIFICATION_COPY.friend_active.title(name),
        body: NOTIFICATION_COPY.friend_active.body(location, mins),
      };
    }
    case 'streak_milestone': {
      const days = (payload.days as number) ?? 7;
      return {
        title: NOTIFICATION_COPY.streak_milestone.title(days),
        body: NOTIFICATION_COPY.streak_milestone.body(),
      };
    }
    case 'challenger_nearby': {
      const challenger = (payload.name as string) ?? 'Someone';
      const location = (payload.location as string) ?? 'your area';
      return {
        title: NOTIFICATION_COPY.challenger_nearby.title,
        body: NOTIFICATION_COPY.challenger_nearby.body(challenger, location),
      };
    }
    case 'throne_under_attack': {
      const attacker = (payload.name as string) ?? 'Someone';
      const throne = (payload.throne as string) ?? 'your throne';
      return {
        title: NOTIFICATION_COPY.throne_under_attack.title,
        body: NOTIFICATION_COPY.throne_under_attack.body(attacker, throne),
      };
    }
    case 'territory_invaded': {
      const invader = (payload.name as string) ?? 'Someone';
      const zone = (payload.zone as string) ?? 'your territory';
      return {
        title: NOTIFICATION_COPY.territory_invaded.title,
        body: NOTIFICATION_COPY.territory_invaded.body(invader, zone),
      };
    }
    case 'revenge_available': {
      const rival = (payload.name as string) ?? 'Someone';
      const throne = (payload.throne as string) ?? 'a throne';
      return {
        title: NOTIFICATION_COPY.revenge_available.title,
        body: NOTIFICATION_COPY.revenge_available.body(rival, throne),
      };
    }
    default:
      return null;
  }
}

// Send a notification to all accepted friends
export async function notifyFriends(
  currentUserId: string,
  type: NotificationType,
  payload: Record<string, unknown>,
): Promise<void> {
  try {
    const content = buildContent(type, payload);
    if (!content) return;

    // Fetch accepted friends with push tokens
    const { data: friendships } = await supabase
      .from('friendships')
      .select('friend_id, friend:profiles!friendships_friend_id_fkey(expo_push_token)')
      .eq('user_id', currentUserId)
      .eq('status', 'accepted');

    if (!friendships || friendships.length === 0) return;

    for (const fs of friendships) {
      const friend = fs.friend as { expo_push_token: string | null } | null;
      if (!friend?.expo_push_token) continue;

      // Call the send-notification Edge Function
      await supabase.functions.invoke('send-notification', {
        body: {
          to: friend.expo_push_token,
          title: content.title,
          body: content.body,
          data: { type, ...payload },
        },
      });

      // Log to notification_events
      await supabase.from('notification_events').insert({
        from_user_id: currentUserId,
        to_user_id: fs.friend_id,
        type,
        payload,
      });
    }
  } catch {
    // Non-blocking — notification failure should not crash the session flow
  }
}

// Send a self-notification (for streak milestones that go to the user themselves)
export async function notifySelf(
  userId: string,
  type: NotificationType,
  payload: Record<string, unknown>,
): Promise<void> {
  try {
    const content = buildContent(type, payload);
    if (!content) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('expo_push_token')
      .eq('id', userId)
      .single();

    if (!profile?.expo_push_token) return;

    await supabase.functions.invoke('send-notification', {
      body: {
        to: profile.expo_push_token,
        title: content.title,
        body: content.body,
        data: { type, ...payload },
      },
    });
  } catch {
    // Non-blocking
  }
}
