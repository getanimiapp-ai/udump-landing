import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (_req) => {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const sixtyMinutesAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

  // Find active sessions over 60 minutes
  const { data: overstays } = await supabase
    .from('dump_sessions')
    .select(`
      id, user_id, started_at,
      profiles!inner(username, display_name, expo_push_token)
    `)
    .is('ended_at', null)
    .lt('started_at', sixtyMinutesAgo);

  if (!overstays) return new Response('No overstays found', { status: 200 });

  let notificationsSent = 0;

  for (const session of overstays) {
    const user = session.profiles as { username: string; display_name: string; expo_push_token: string | null };
    const startedAt = new Date(session.started_at);
    const minutesElapsed = Math.floor((Date.now() - startedAt.getTime()) / 60000);
    const isOver2Hours = startedAt < new Date(twoHoursAgo);

    // Get friends to notify
    const { data: friends } = await supabase
      .from('friendships')
      .select('friend_id, profiles!friendships_friend_id_fkey(expo_push_token)')
      .eq('user_id', session.user_id)
      .eq('status', 'accepted');

    if (!friends) continue;

    for (const friendship of friends) {
      const friendProfile = friendship.profiles as { expo_push_token: string | null } | null;
      if (!friendProfile?.expo_push_token) continue;

      const title = isOver2Hours ? 'MEDICAL ATTENTION MAY BE REQUIRED' : 'HELP!';
      const body = isOver2Hours
        ? `${user.display_name} has been on the toilet for 2 hours. Please respond.`
        : `${user.display_name} has exceeded 60 minutes on the toilet.`;

      await fetch(`${supabaseUrl}/functions/v1/send-notification`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: friendProfile.expo_push_token,
          title,
          body,
          data: { type: isOver2Hours ? 'overstay_120' : 'overstay_60', sessionId: session.id, userId: session.user_id },
        }),
      });

      // Record the notification event
      await supabase.from('notification_events').insert({
        from_user_id: session.user_id,
        to_user_id: friendship.friend_id,
        type: isOver2Hours ? 'overstay_120' : 'overstay_60',
        session_id: session.id,
        payload: { minutes: minutesElapsed },
      });

      notificationsSent++;
    }
  }

  return new Response(
    JSON.stringify({ overstays: overstays.length, notificationsSent }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});
