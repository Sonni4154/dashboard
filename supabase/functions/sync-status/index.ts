// supabase/functions/sync-status/index.ts
import { getServiceClient } from '../_shared/db.ts';
Deno.serve(async () => {
  const sb = getServiceClient();
  const { data: states } = await sb.from('quickbooks.sync_state').select('*');
  const { data: hb } = await sb.from('dashboard.logs').select('created_at, meta').eq('event_type','sync.heartbeat').order('created_at',{ascending:false}).limit(1);
  return new Response(JSON.stringify({ success: true, data: { states, lastHeartbeat: hb?.[0] ?? null } }), { headers: { 'content-type': 'application/json' } });
});
