// supabase/functions/invoices-search/index.ts
import { getServiceClient } from '../_shared/db.ts';
Deno.serve(async (req) => {
  const url = new URL(req.url);
  const customerId = url.searchParams.get('customerId') ?? undefined;
  const docNumber = url.searchParams.get('docNumber') ?? undefined;
  const from = url.searchParams.get('from') ?? undefined;
  const to = url.searchParams.get('to') ?? undefined;
  const limit = Number(url.searchParams.get('limit') ?? '50');
  const sb = getServiceClient();
  let q = sb.from('quickbooks.invoices')
    .select('id, realm_id, doc_number, txn_date, due_date, customer_id, total_amt, balance, last_updated')
    .order('txn_date', { ascending: false })
    .limit(limit);
  if (customerId) q = q.eq('customer_id', customerId);
  if (docNumber)  q = q.eq('doc_number', docNumber);
  if (from)       q = q.gte('txn_date', from);
  if (to)         q = q.lte('txn_date', to);
  const { data, error } = await q;
  if (error) return new Response(error.message, { status: 500 });
  return new Response(JSON.stringify({ success: true, data }), { headers: { 'content-type': 'application/json' } });
});
