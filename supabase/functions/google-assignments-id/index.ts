// supabase/functions/google-assignments-id/index.ts
import { getServiceClient } from '../_shared/db.ts';
Deno.serve(async (req) => {
  const sb = getServiceClient();
  const id = new URL(req.url).pathname.split('/').pop();
  if (!id) return new Response('id required', { status: 400 });
  if (req.method === 'PATCH' || req.method === 'PUT') {
    const body = await req.json();
    const { error } = await sb.from('google.work_assignments').update(body).eq('id', id);
    return new Response(JSON.stringify({ success: !error, error: error?.message }), { headers: { 'content-type': 'application/json' } });
  }
  if (req.method === 'DELETE') {
    const { error } = await sb.from('google.work_assignments').delete().eq('id', id);
    return new Response(JSON.stringify({ success: !error, error: error?.message }), { headers: { 'content-type': 'application/json' } });
  }
  return new Response('Method Not Allowed', { status: 405 });
});
