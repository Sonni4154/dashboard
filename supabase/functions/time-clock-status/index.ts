// supabase/functions/time-clock-status/index.ts
import { getServiceClient } from '../_shared/db.ts';
Deno.serve(async (req) => {
  const sb = getServiceClient();
  const url = new URL(req.url);
  const userId = url.searchParams.get('userId');
  if (!userId) return new Response('userId required', { status: 400 });
  const { data, error } = await sb.from('dashboard.time_clock_entries').select('*').eq('user_id', userId).is('clock_out', null).order('clock_in', { ascending: false }).limit(1);
  return new Response(JSON.stringify({ success: !error, data: data?.[0] ?? null, error: error?.message }), { headers: { 'content-type': 'application/json' } });
});
