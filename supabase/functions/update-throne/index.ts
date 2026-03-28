import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface UpdateThronePayload {
  throneId: string;
  userId: string;
  sessionId: string;
  weightDelta: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } });
  }

  try {
    const { throneId, userId, sessionId, weightDelta }: UpdateThronePayload = await req.json();
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get current throne state
    const { data: throne } = await supabase
      .from('thrones')
      .select('current_king_id, current_king_weight_lbs, owner_user_id, name, profiles!thrones_current_king_id_fkey(expo_push_token, display_name)')
      .eq('id', throneId)
      .single();

    if (!throne) {
      return new Response(JSON.stringify({ error: 'Throne not found' }), { status: 404 });
    }

    const previousKingId = throne.current_king_id;
    const previousKingProfile = throne.profiles as { expo_push_token: string | null; display_name: string } | null;
    const wasClaimed = previousKingId !== userId && weightDelta > (throne.current_king_weight_lbs ?? 0);

    if (!wasClaimed) {
      return new Response(JSON.stringify({ claimed: false }), { status: 200 });
    }

    // Update throne
    await supabase.from('thrones').update({
      current_king_id: userId,
      current_king_weight_lbs: weightDelta,
      current_king_session_id: sessionId,
    }).eq('id', throneId);

    // Notify previous king
    if (previousKingId && previousKingProfile?.expo_push_token) {
      const { data: newKingProfile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', userId)
        .single();

      await fetch(`${supabaseUrl}/functions/v1/send-notification`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: previousKingProfile.expo_push_token,
          title: 'YOUR THRONE HAS FALLEN',
          body: `${newKingProfile?.display_name ?? 'Someone'} dethroned you at ${throne.name}. Reclaim it.`,
          data: { type: 'throne_lost', throneId },
        }),
      });

      await supabase.from('notification_events').insert({
        from_user_id: userId,
        to_user_id: previousKingId,
        type: 'throne_lost',
        session_id: sessionId,
        throne_id: throneId,
      });
    }

    return new Response(JSON.stringify({ claimed: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
