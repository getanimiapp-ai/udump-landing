import { MOCK_ENABLED } from '../lib/mock-data';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { FadeInView } from '../components/ui/FadeInView';
import { GlassCard } from '../components/ui/GlassCard';
import { Colors } from '../constants/colors';
import { Fonts, Type } from '../constants/typography';
import type { NotificationType } from '../lib/utils/notifications';
import { supabase } from '../lib/supabase';
import { useUserStore } from '@/lib/store/user.store';

// ── Types ───────────────────────────────────────────────────────────────

interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
  fromUsername?: string;
}

// ── Icon + color mapping per notification type ─────────────────────────

const NOTIFICATION_META: Record<NotificationType, {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}> = {
  record_broken: { icon: 'trophy', color: Colors.goldBright },
  throne_claimed: { icon: 'flag', color: Colors.goldBright },
  throne_lost: { icon: 'skull-outline', color: Colors.red },
  overstay_60: { icon: 'alarm-outline', color: '#FF9500' },
  overstay_120: { icon: 'medkit', color: Colors.red },
  friend_active: { icon: 'person-outline', color: Colors.blue },
  streak_milestone: { icon: 'flame', color: '#FF6B00' },
  challenger_nearby: { icon: 'footsteps-outline', color: '#FF9500' },
  throne_under_attack: { icon: 'shield-outline', color: Colors.red },
  territory_invaded: { icon: 'warning-outline', color: Colors.red },
  revenge_available: { icon: 'flash-outline', color: Colors.goldBright },
};

// ── Mock Data ───────────────────────────────────────────────────────────

const now = Date.now();

const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: '1',
    type: 'throne_under_attack',
    title: 'YOUR THRONE IS UNDER ATTACK',
    body: 'Nick is currently on YOUR throne at Home Base. This is an act of war.',
    timestamp: new Date(now - 120_000).toISOString(),
    read: false,
    fromUsername: 'nick_throne',
  },
  {
    id: '2',
    type: 'record_broken',
    title: 'NEW PERSONAL RECORD',
    body: 'You just dropped 6.2 lbs in a single session. The throne trembles.',
    timestamp: new Date(now - 3_600_000).toISOString(),
    read: false,
  },
  {
    id: '3',
    type: 'challenger_nearby',
    title: 'CHALLENGER APPROACHING',
    body: 'Big Mike was spotted near The Office throne. Defend your territory.',
    timestamp: new Date(now - 7_200_000).toISOString(),
    read: true,
    fromUsername: 'big_mike_42',
  },
  {
    id: '4',
    type: 'streak_milestone',
    title: '14-DAY STREAK',
    body: 'Two weeks of royal consistency. The throne room respects your dedication.',
    timestamp: new Date(now - 14_400_000).toISOString(),
    read: true,
  },
  {
    id: '5',
    type: 'throne_lost',
    title: 'YOUR THRONE HAS FALLEN',
    body: 'Garret has claimed The Gym throne with a devastating 5.1 lb session.',
    timestamp: new Date(now - 28_800_000).toISOString(),
    read: true,
    fromUsername: 'garret_g',
  },
  {
    id: '6',
    type: 'revenge_available',
    title: 'REVENGE OPPORTUNITY',
    body: 'Garret\'s hold on The Gym throne is weakening. Strike now and reclaim what is yours.',
    timestamp: new Date(now - 43_200_000).toISOString(),
    read: true,
    fromUsername: 'garret_g',
  },
  {
    id: '7',
    type: 'friend_active',
    title: 'Bobby is on the throne',
    body: 'Bobby is currently at Home. 2 minutes and counting.',
    timestamp: new Date(now - 86_400_000).toISOString(),
    read: true,
    fromUsername: 'bobby_b',
  },
  {
    id: '8',
    type: 'territory_invaded',
    title: 'TERRITORY INVADED',
    body: 'ThroneSniper has entered your Downtown territory. This will not stand.',
    timestamp: new Date(now - 90_000_000).toISOString(),
    read: true,
    fromUsername: 'throne_sniper',
  },
  {
    id: '9',
    type: 'throne_claimed',
    title: 'THRONE CLAIMED',
    body: 'You claimed The Coffee Shop throne with 3.8 lbs in 12 minutes. All hail.',
    timestamp: new Date(now - 172_800_000).toISOString(),
    read: true,
  },
  {
    id: '10',
    type: 'overstay_60',
    title: 'WELFARE CHECK',
    body: 'You\'ve been on the throne for 60 minutes. Are you okay in there?',
    timestamp: new Date(now - 259_200_000).toISOString(),
    read: true,
  },
];

// ── Time formatting ─────────────────────────────────────────────────────

function formatTimeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(isoString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ── Notification Row ────────────────────────────────────────────────────

function NotificationRow({ item, index }: { item: NotificationItem; index: number }) {
  const meta = NOTIFICATION_META[item.type] ?? { icon: 'notifications-outline', color: Colors.text3 };

  return (
    <FadeInView delay={index * 60} slideDistance={12}>
      <GlassCard style={styles.notifCard}>
        <View style={styles.notifRow}>
          {/* Icon */}
          <View style={[styles.iconCircle, { borderColor: meta.color + '55' }]}>
            <Ionicons name={meta.icon} size={20} color={meta.color} />
          </View>

          {/* Content */}
          <View style={styles.notifContent}>
            <View style={styles.notifTitleRow}>
              <Text
                style={[styles.notifTitle, !item.read && styles.notifTitleUnread]}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              {!item.read && <View style={styles.unreadDot} />}
            </View>
            <Text style={styles.notifBody} numberOfLines={2}>
              {item.body}
            </Text>
            <Text style={styles.notifTime}>{formatTimeAgo(item.timestamp)}</Text>
          </View>
        </View>
      </GlassCard>
    </FadeInView>
  );
}

// ── Main Screen ─────────────────────────────────────────────────────────

export default function NotificationsScreen() {
  const router = useRouter();
  const { profile } = useUserStore();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (MOCK_ENABLED) {
      setNotifications(MOCK_NOTIFICATIONS);
      setLoading(false);
    } else {
      fetchNotifications();
    }
  }, []);

  async function fetchNotifications() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data } = await supabase
        .from('notification_events')
        .select('id, type, payload, created_at, read, from_user_id, from_user:profiles!notification_events_from_user_id_fkey(username)')
        .eq('to_user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (data) {
        setNotifications(
          data.map((n) => ({
            id: n.id,
            type: n.type as NotificationType,
            title: (n.payload as Record<string, string>)?.title ?? n.type.replace(/_/g, ' ').toUpperCase(),
            body: (n.payload as Record<string, string>)?.body ?? '',
            timestamp: n.created_at,
            read: n.read ?? true,
            fromUsername: (n.from_user as { username: string } | null)?.username,
          }))
        );

        // Mark all as read
        await supabase
          .from('notification_events')
          .update({ read: true })
          .eq('to_user_id', user.id)
          .eq('read', false);
      }
    } catch {
      // Non-blocking
    }
    setLoading(false);
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => { Haptics.selectionAsync(); router.back(); }}
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={20} color={Colors.gold} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <FadeInView delay={0} slideDistance={12}>
          <View style={styles.titleRow}>
            <Ionicons name="notifications" size={24} color={Colors.gold} />
            <Text style={styles.title}>NOTIFICATIONS</Text>
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>
        </FadeInView>
        <FadeInView delay={80} slideDistance={8}>
          <Text style={styles.subtitle}>Royal decrees & battle reports</Text>
        </FadeInView>
      </View>

      {/* List */}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => <NotificationRow item={item} index={index} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !loading ? (
            <FadeInView delay={200} slideDistance={10}>
              <View style={styles.emptyState}>
                <Ionicons name="notifications-off-outline" size={48} color={Colors.text3} />
                <Text style={styles.emptyTitle}>No notifications yet</Text>
                <Text style={styles.emptySubtitle}>
                  Claim thrones and challenge rivals to fill your inbox
                </Text>
              </View>
            </FadeInView>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.base,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    gap: 4,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    marginBottom: 8,
  },
  backText: {
    ...Type.body,
    color: Colors.gold,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontFamily: Fonts.displayFamily,
    fontSize: 28,
    letterSpacing: 2,
    color: Colors.gold,
  },
  unreadBadge: {
    backgroundColor: Colors.red,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  unreadBadgeText: {
    fontFamily: Fonts.bodySemiBoldFamily,
    fontSize: 11,
    color: Colors.text1,
  },
  subtitle: {
    ...Type.caption,
    color: Colors.text3,
    marginTop: 2,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },

  // ── Notification Card ──
  notifCard: {
    marginBottom: 10,
  },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    backgroundColor: Colors.glass2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  notifContent: {
    flex: 1,
    gap: 3,
  },
  notifTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notifTitle: {
    fontFamily: Fonts.bodySemiBoldFamily,
    fontSize: 13,
    color: Colors.text2,
    flex: 1,
    letterSpacing: 0.3,
  },
  notifTitleUnread: {
    color: Colors.text1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.gold,
  },
  notifBody: {
    ...Type.caption,
    color: Colors.text2,
    lineHeight: 17,
  },
  notifTime: {
    fontFamily: Fonts.monoFamily,
    fontSize: 10,
    color: Colors.text3,
    marginTop: 2,
  },

  // ── Empty State ──
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 12,
  },
  emptyTitle: {
    fontFamily: Fonts.displayFamily,
    fontSize: 20,
    color: Colors.text2,
    letterSpacing: 1,
  },
  emptySubtitle: {
    ...Type.caption,
    color: Colors.text3,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
