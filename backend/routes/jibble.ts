import { Router } from 'express';
import { JibbleService } from '../services/jibbleService';
import { db } from '../db'; // your db instance
import bodyParser from 'body-parser';

// Replace with your real auth middleware
function requireAuth(req: any, res: any, next: any) { if (!req.user) return res.status(401).json({ error: 'unauthorized' }); next(); }
function requireAdmin(req: any, res: any, next: any) { if (req.user?.role !== 'admin') return res.status(403).json({ error: 'forbidden' }); next(); }

const router = Router();
const service = new JibbleService(db);

router.get('/oauth/start', requireAuth, requireAdmin, (req, res) => {
  const state = Buffer.from(JSON.stringify({ u: req.user.id, r: req.query.return_to || '/admin/integrations/jibble' })).toString('base64url');
  const url = service.buildAuthorizeUrl(state);
  res.redirect(url);
});

router.get('/oauth/callback', async (req, res) => {
  try {
    const { code, state } = req.query as { code?: string, state?: string };
    if (!code) return res.status(400).send('Missing code');
    let authorizedBy: number | undefined;
    try {
      const raw = JSON.parse(Buffer.from(state || '', 'base64url').toString('utf8'));
      authorizedBy = raw?.u;
    } catch {}
    await service.exchangeCodeForToken(code, authorizedBy);
    const redirect = (() => {
      try {
        const raw = JSON.parse(Buffer.from(state || '', 'base64url').toString('utf8'));
        return raw?.r || '/admin/integrations/jibble';
      } catch { return '/admin/integrations/jibble'; }
    })();
    res.redirect(redirect);
  } catch (e: any) {
    res.status(500).send(e?.message || 'OAuth failed');
  }
});

router.get('/status', requireAuth, requireAdmin, async (_req, res) => {
  const status = await service.connectionStatus();
  res.json(status);
});

router.post('/sync', requireAuth, requireAdmin, async (req, res) => {
  const { from, to, hours } = req.body || {};
  try {
    let result;
    if (from && to) {
      result = await service.runSyncWindow(new Date(from), new Date(to));
    } else {
      result = await service.runSyncRecent(Number(hours) || 24);
    }
    res.json({ ok: true, ...result });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message });
  }
});

router.get('/logs', requireAuth, requireAdmin, async (_req, res) => {
  // lightweight view using sync_logs table
  const rows = await db.query.syncLogs.findMany({
    where: (t, { eq }) => eq(t.integration, 'jibble'),
    orderBy: (t, { desc }) => [desc(t.runAt)],
    limit: 100,
  });
  res.json(rows);
});

router.get('/diff', requireAuth, requireAdmin, async (req, res) => {
  const hours = Number(req.query.hours || 24);
  const to = new Date();
  const from = new Date(to.getTime() - hours * 3600_000);
  const diff = await service.computeDiff(from, to);
  res.json(diff);
});

router.post('/webhook', bodyParser.json({ type: '*/*' }), async (req, res) => {
  try {
    const sig = req.header('X-Jibble-Signature');
    await service.handleWebhook(sig ?? undefined, req.body);
    res.status(204).end();
  } catch (e: any) {
    res.status(400).json({ error: e?.message || 'invalid webhook' });
  }
});

// Call this once at server start (e.g., in app.ts)
export function startJibbleCron() {
  new JibbleService(db).startCron();
}

export default router;