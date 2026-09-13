import express, { Request, Response } from 'express';
import { PolicyLabService } from '../services/policyLabService.ts';

const router = express.Router();

router.get('/health', async (_req: Request, res: Response) => {
  const health = await PolicyLabService.health();
  res.status(health.available === false && health.configured ? 503 : 200).json({ success: true, data: health });
});

router.post('/predict', async (req: Request, res: Response) => {
  try {
    const data = await PolicyLabService.runPrediction(req.body || {});
    res.json(data);
  } catch (error) {
    res.status(502).json({ success: false, error: error instanceof Error ? error.message : String(error) });
  }
});

router.post('/scenarios', async (req: Request, res: Response) => {
  try {
    const data = await PolicyLabService.runScenarios(req.body || {});
    res.json(data);
  } catch (error) {
    res.status(502).json({ success: false, error: error instanceof Error ? error.message : String(error) });
  }
});

export default router;
