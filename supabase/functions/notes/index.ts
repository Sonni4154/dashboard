// supabase/functions/notes/index.ts
import { getServiceClient } from '../_shared/db.ts';
Deno.serve(async (req) => {
  const sb = getServiceClient();
  if (req.method === 'GET') {
    const url = new URL(req.url);
    const entityType = url.searchParams.get('entity_type') ?? undefined;
    const entityId = url.searchParams.get('entity_id') ?? undefined;
    const category = url.searchParams.get('category') ?? undefined;
    const pinnedOnly = (url.searchParams.get('pinned_only') ?? 'false') === 'true';
    let q = sb.from('dashboard.notes').select('*').order('created_at', { ascending: false });
    if (entityType) q = q.eq('entity_type', entityType);
    if (entityId) q = q.eq('entity_id', entityId);
    if (category) q = q.eq('category', category);
    if (pinnedOnly) q = q.eq('pinned', true);
    const { data, error } = await q;
    return new Response(JSON.stringify({ success: !error, data, error: error?.message }), { headers: { 'content-type': 'application/json' } });
  }
  if (req.method === 'POST') {
    const body = await req.json();
    const { error } = await sb.from('dashboard.notes').insert(body);
    return new Response(JSON.stringify({ success: !error, error: error?.message }), { headers: { 'content-type': 'application/json' } });
  }
  return new Response('Method Not Allowed', { status: 405 });
});
