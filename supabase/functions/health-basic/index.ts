// supabase/functions/health-basic/index.ts
Deno.serve(() => new Response('ok', { headers: { 'content-type': 'text/plain' } }));
