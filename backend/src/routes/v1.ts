import { Router, Request, Response } from 'express';
import { logger } from '../utils/logger.js';

const router = Router();

/**
 * API v1 Routes - Versioned aliases for all existing endpoints
 * 
 * This router provides /api/v1/* aliases for all existing endpoints
 * to maintain backward compatibility while supporting versioned APIs.
 */

// Health endpoints
router.get('/health/basic', (req: Request, res: Response) => {
  // Redirect to existing health endpoint
  res.redirect('/health');
});

router.get('/health/db', (req: Request, res: Response) => {
  // Redirect to existing API health endpoint
  res.redirect('/api/health');
});

router.get('/health/webhook', (req: Request, res: Response) => {
  // Redirect to existing webhook health endpoint
  res.redirect('/api/webhook/health');
});

router.get('/health/heartbeat', (req: Request, res: Response) => {
  // Redirect to existing sync health endpoint
  res.redirect('/api/sync/health');
});

// QuickBooks OAuth endpoints
router.get('/qbo/auth-url', (req: Request, res: Response) => {
  // Redirect to existing OAuth connect endpoint
  res.redirect('/api/qbo/connect');
});

router.get('/qbo/token-status', (req: Request, res: Response) => {
  // Redirect to existing token status endpoint
  res.redirect('/api/qbo/token-status');
});

router.post('/qbo/refresh', (req: Request, res: Response) => {
  // Redirect to existing token refresh endpoint
  res.redirect('/api/qbo/refresh-token');
});

// Token management endpoints
router.get('/qbo/tokens/status', (req: Request, res: Response) => {
  // Redirect to existing tokens status endpoint
  res.redirect('/api/tokens/status');
});

router.get('/qbo/tokens', (req: Request, res: Response) => {
  // Redirect to existing tokens info endpoint
  res.redirect('/api/tokens/info');
});

router.delete('/qbo/tokens/:id', (req: Request, res: Response) => {
  // Redirect to existing token delete endpoint
  res.redirect(`/api/tokens/${req.params.id}`);
});

// Sync endpoints
router.post('/sync/full', (req: Request, res: Response) => {
  // Redirect to existing sync endpoint
  res.redirect('/api/sync');
});

router.post('/sync/entity/:entityType', (req: Request, res: Response) => {
  // Redirect to existing entity sync endpoint
  res.redirect(`/api/sync/${req.params.entityType}`);
});

router.get('/sync/status', (req: Request, res: Response) => {
  // Redirect to existing sync status endpoint
  res.redirect('/api/sync/status');
});

// Customer endpoints
router.get('/customers', (req: Request, res: Response) => {
  // Redirect to existing customers endpoint
  res.redirect('/api/customers');
});

router.get('/customers/:id', (req: Request, res: Response) => {
  // Redirect to existing customer endpoint
  res.redirect(`/api/customers/${req.params.id}`);
});

router.get('/customers/stats', (req: Request, res: Response) => {
  // Redirect to existing customer stats endpoint
  res.redirect('/api/customers/stats');
});

// Item endpoints
router.get('/items', (req: Request, res: Response) => {
  // Redirect to existing items endpoint
  res.redirect('/api/items');
});

router.get('/items/:id', (req: Request, res: Response) => {
  // Redirect to existing item endpoint
  res.redirect(`/api/items/${req.params.id}`);
});

router.get('/items/stats', (req: Request, res: Response) => {
  // Redirect to existing item stats endpoint
  res.redirect('/api/items/stats');
});

// Invoice endpoints
router.get('/invoices', (req: Request, res: Response) => {
  // Redirect to existing invoices endpoint
  res.redirect('/api/invoices');
});

router.get('/invoices/:id', (req: Request, res: Response) => {
  // Redirect to existing invoice endpoint
  res.redirect(`/api/invoices/${req.params.id}`);
});

router.get('/invoices/stats', (req: Request, res: Response) => {
  // Redirect to existing invoice stats endpoint
  res.redirect('/api/invoices/stats');
});

// Estimate endpoints
router.get('/estimates', (req: Request, res: Response) => {
  // Redirect to existing estimates endpoint
  res.redirect('/api/estimates');
});

router.get('/estimates/:id', (req: Request, res: Response) => {
  // Redirect to existing estimate endpoint
  res.redirect(`/api/estimates/${req.params.id}`);
});

router.get('/estimates/stats', (req: Request, res: Response) => {
  // Redirect to existing estimate stats endpoint
  res.redirect('/api/estimates/stats');
});

// Google Calendar endpoints
router.get('/google/events', (req: Request, res: Response) => {
  // Redirect to existing calendar events endpoint
  res.redirect('/api/calendar/events');
});

router.get('/google/events/today', (req: Request, res: Response) => {
  // Redirect to existing today's events endpoint
  res.redirect('/api/calendar/events/today');
});

router.post('/google/sync', (req: Request, res: Response) => {
  // Redirect to existing calendar sync endpoint
  res.redirect('/api/calendar/sync');
});

// Work assignment endpoints
router.post('/google/assignments', (req: Request, res: Response) => {
  // Redirect to existing assignments endpoint
  res.redirect('/api/assignments');
});

router.put('/google/assignments/:id', (req: Request, res: Response) => {
  // Redirect to existing assignment update endpoint
  res.redirect(`/api/assignments/${req.params.id}`);
});

router.delete('/google/assignments/:id', (req: Request, res: Response) => {
  // Redirect to existing assignment delete endpoint
  res.redirect(`/api/assignments/${req.params.id}`);
});

router.get('/google/assignments/by-employee/:employeeId', (req: Request, res: Response) => {
  // Redirect to existing employee assignments endpoint
  res.redirect(`/api/assignments/employee/${req.params.employeeId}`);
});

router.get('/google/assignments/today', (req: Request, res: Response) => {
  // Redirect to existing today's assignments endpoint
  res.redirect('/api/assignments/today');
});

router.get('/google/work-queue', (req: Request, res: Response) => {
  // Redirect to existing work queue endpoint
  res.redirect('/api/work-queue');
});

// Employee endpoints
router.get('/employees', (req: Request, res: Response) => {
  // Redirect to existing employees endpoint
  res.redirect('/api/employees');
});

router.get('/employees/working-today', (req: Request, res: Response) => {
  // Redirect to existing working today endpoint
  res.redirect('/api/employees/working-today');
});

// Notes endpoints
router.get('/notes', (req: Request, res: Response) => {
  // Redirect to existing notes endpoint
  res.redirect('/api/notes');
});

router.post('/notes', (req: Request, res: Response) => {
  // Redirect to existing notes create endpoint
  res.redirect('/api/notes');
});

router.put('/notes/:id', (req: Request, res: Response) => {
  // Redirect to existing notes update endpoint
  res.redirect(`/api/notes/${req.params.id}`);
});

router.delete('/notes/:id', (req: Request, res: Response) => {
  // Redirect to existing notes delete endpoint
  res.redirect(`/api/notes/${req.params.id}`);
});

// Time clock endpoints
router.post('/time-clock/entries/clock-in', (req: Request, res: Response) => {
  // Redirect to existing clock in endpoint
  res.redirect('/api/clock/in');
});

router.post('/time-clock/entries/clock-out', (req: Request, res: Response) => {
  // Redirect to existing clock out endpoint
  res.redirect('/api/clock/out');
});

router.get('/time-clock/status', (req: Request, res: Response) => {
  // Redirect to existing clock status endpoint
  res.redirect('/api/clock/status');
});

router.get('/time-clock/entries', (req: Request, res: Response) => {
  // Redirect to existing clock entries endpoint
  res.redirect('/api/clock/entries');
});

// User endpoints
router.get('/users/:id', (req: Request, res: Response) => {
  // Redirect to existing user endpoint
  res.redirect(`/api/users/${req.params.id}`);
});

router.delete('/users/:id', (req: Request, res: Response) => {
  // Redirect to existing user delete endpoint
  res.redirect(`/api/users/${req.params.id}`);
});

// Auth endpoints
router.post('/auth/login', (req: Request, res: Response) => {
  // Redirect to existing auth login endpoint
  res.redirect('/api/auth/login');
});

router.post('/auth/register', (req: Request, res: Response) => {
  // Redirect to existing auth register endpoint
  res.redirect('/api/auth/register');
});

router.post('/auth/logout', (req: Request, res: Response) => {
  // Redirect to existing auth logout endpoint
  res.redirect('/api/auth/logout');
});

router.get('/auth/verify', (req: Request, res: Response) => {
  // Redirect to existing auth verify endpoint
  res.redirect('/api/auth/verify');
});

export default router;
