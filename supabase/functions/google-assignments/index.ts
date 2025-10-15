// supabase/functions/google-assignments/index.ts
import { getServiceClient } from '../_shared/db.ts';
Deno.serve(async (req) => {
  const sb = getServiceClient();
  if (req.method === 'GET') {
    const url = new URL(req.url);
    const eventId = url.searchParams.get('eventId') ?? undefined;
    const employeeId = url.searchParams.get('employeeId') ?? undefined;
    let q = sb.from('google.work_assignments').select('*').order('sequence_order', { ascending: true });
    if (eventId) q = q.eq('calendar_event_id', eventId);
    if (employeeId) q = q.eq('employee_id', employeeId);
    const { data, error } = await q;
    return new Response(JSON.stringify({ success: !error, data, error: error?.message }), { headers: { 'content-type': 'application/json' } });
  }
  if (req.method === 'POST') {
    const body = await req.json();
    const { error } = await sb.from('google.work_assignments').insert(body);
    return new Response(JSON.stringify({ success: !error, error: error?.message }), { headers: { 'content-type': 'application/json' } });
  }
  return new Response('Method Not Allowed', { status: 405 });
});
