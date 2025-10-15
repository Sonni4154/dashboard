// supabase/functions/customers-search/index.ts
import { getServiceClient } from '../_shared/db.ts';
Deno.serve(async (req) => {
  const url = new URL(req.url);
  const search = url.searchParams.get('search') ?? '';
  const limit = Number(url.searchParams.get('limit') ?? '25');
  const sb = getServiceClient();
  const s = `%${search}%`;
  const { data, error } = await sb
    .from('quickbooks.customers')
    .select('id, realm_id, display_name, primary_email_addr, mobile_phone, primary_phone, active, balance, last_updated')
    .or(`display_name.ilike.${s},primary_email_addr.ilike.${s}`)
    .order('display_name', { ascending: true })
    .limit(limit);
  if (error) return new Response(error.message, { status: 500 });
  return new Response(JSON.stringify({ success: true, data }), { headers: { 'content-type': 'application/json' } });
});
