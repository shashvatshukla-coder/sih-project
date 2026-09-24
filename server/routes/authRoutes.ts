import express, { NextFunction, Request, Response } from 'express';
import { adminLogin, deleteAccount, listUsers, requestOtp, suspendUser, updateAccount, verifyOtp, verifySession } from '../services/authService.ts';
import { db } from '../db/database.ts';

const router = express.Router();
type AuthedRequest = Request & { authUser?: Awaited<ReturnType<typeof verifySession>> };

function bearer(req: Request): string { return String(req.headers.authorization || '').replace(/^Bearer\s+/i, ''); }

export async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  try { req.authUser = await verifySession(bearer(req)); next(); }
  catch (error: any) { res.status(401).json({ success: false, error: error.message || 'Unauthorized' }); }
}

export async function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction) {
  await requireAuth(req, res, () => req.authUser?.role === 'admin' ? next() : res.status(403).json({ success: false, error: 'Administrator access required.' }));
}

router.post('/request-otp', async (req, res) => {
  try { await requestOtp(req.body); res.json({ success: true, message: 'Verification code sent.' }); }
  catch (error: any) { res.status(400).json({ success: false, error: error.message }); }
});

router.post('/verify-otp', async (req, res) => {
  try { res.json({ success: true, ...(await verifyOtp(req.body.email, req.body.otp)) }); }
  catch (error: any) { res.status(400).json({ success: false, error: error.message }); }
});

router.post('/admin-login', (req, res) => {
  try { res.json({ success: true, ...adminLogin(req.body.email, req.body.password) }); }
  catch (error: any) { res.status(401).json({ success: false, error: error.message }); }
});

router.get('/me', requireAuth, (req: AuthedRequest, res) => res.json({ success: true, user: req.authUser }));
router.put('/me', requireAuth, async (req: AuthedRequest, res) => {
  try { res.json({ success: true, user: await updateAccount(req.authUser!.email, req.body || {}) }); }
  catch (error: any) { res.status(400).json({ success: false, error: error.message }); }
});
router.delete('/me', requireAuth, async (req: AuthedRequest, res) => {
  if (req.authUser?.role === 'admin') return res.status(400).json({ success: false, error: 'The administrator account cannot be deleted here.' });
  await deleteAccount(req.authUser!.email); res.json({ success: true });
});

router.get('/admin/users', requireAdmin, async (_req, res) => {
  try {
    const users = await listUsers();
    const policies = db.getPolicies(undefined, undefined, true);
    const research = db.getResearchPapers(undefined, undefined, true);
    const sources = db.getDataSources();
    const enriched = users.map(user => ({
      ...user,
      uploadedWork: {
        policies: policies.filter((item: any) => item.ownerEmail === user.email || item.uploadedByEmail === user.email),
        research: research.filter((item: any) => item.authorEmail === user.email),
        sources: sources.filter((item: any) => item.ownerEmail === user.email || item.uploadedByEmail === user.email)
      }
    }));
    res.json({ success: true, total: enriched.length, users: enriched });
  } catch (error: any) { res.status(500).json({ success: false, error: error.message }); }
});

router.delete('/admin/users/:id', requireAdmin, async (req, res) => {
  try { res.json({ success: true, user: await suspendUser(req.params.id) }); }
  catch (error: any) { res.status(400).json({ success: false, error: error.message }); }
});

export default router;
