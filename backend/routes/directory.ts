import { Router } from 'express';
import { DirectoryService } from '../services/directoryService';
import { db } from '../db';
const router = Router();
const service = new DirectoryService(db);

function requireAdmin(req: any, res: any, next: any) { if (req.user?.role !== 'admin') return res.status(403).json({ error: 'forbidden' }); next(); }

router.post('/sync', requireAdmin, async (req, res) => {
  const updatedSince = req.body?.updatedSince;
  const result = await service.syncAll(updatedSince);
  res.json({ ok: true, ...result });
});

export default router;