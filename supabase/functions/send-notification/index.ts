import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

interface PushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: string;
  priority?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } });
  }

  try {
    const { to, title, body, data }: PushMessage = await req.json();

    if (!to || !title || !body) {
      return new Response(JSON.stringify({ error: 'Missing required fields: to, title, body' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const message: PushMessage = {
      to,
      sound: 'default',
      title,
      body,
      data: data ?? {},
      priority: 'high',
    };

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
