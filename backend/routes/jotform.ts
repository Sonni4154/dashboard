import { Router } from 'express';
import bodyParser from 'body-parser';
import { JotformService } from '../services/jotformService';
import { db } from '../db';

const router = Router();
const service = new JotformService(db);

// reuse your real middlewares
function requireAdmin(req: any, res: any, next: any) { if (req.user?.role !== 'admin') return res.status(403).json({ error: 'forbidden' }); next(); }

router.post('/sync', requireAdmin, async (req, res) => {
  const hours = Number(req.body?.hours || 24);
  const result = await service.runSyncRecent(hours);
  res.json({ ok: true, ...result });
});

// Optional webhook receiver
router.post('/webhook', bodyParser.json(), async (req, res) => {
  const payload = req.body;
  // Store into jotform_submissions immediately
  try {
    const formId = payload?.formID || payload?.form_id;
    const submissionId = payload?.submissionID || payload?.submission_id;
    if (!submissionId) return res.status(400).json({ error: 'no submission id' });

    await db.insert(jotformSubmissions).values({
      formId, submissionId, payload, receivedAt: new Date(),
    }).onConflictDoNothing();

    res.status(204).end();
  } catch (e: any) {
    res.status(500).json({ error: e?.message });
  }
});

export default router;