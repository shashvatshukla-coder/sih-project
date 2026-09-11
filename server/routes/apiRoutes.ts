import express, { Request, Response } from 'express';
import { db } from '../db/database.ts';
import { AIService } from '../services/aiService.ts';
import { StatsEngine } from '../services/statsEngine.ts';
import { PolicyService } from '../services/policyService.ts';
import { IngestionService } from '../services/ingestionService.ts';
import { GeminiService } from '../services/geminiService.ts';

const router = express.Router();

// System & Database Health
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    db: db.getDatabaseStatus()
  });
});

router.get('/system/db-status', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: db.getDatabaseStatus()
  });
});

// States
router.get('/states', (req: Request, res: Response) => {
  res.json({ success: true, data: db.getStates() });
});

router.get('/states/:stateCode', (req: Request, res: Response) => {
  const state = db.getStateByCode(req.params.stateCode);
  if (!state) return res.status(404).json({ success: false, error: 'State not found' });
  res.json({ success: true, data: state });
});

// Districts
router.get('/districts', (req: Request, res: Response) => {
  const stateCode = req.query.stateCode as string;
  res.json({ success: true, data: db.getDistricts(stateCode) });
});

router.get('/districts/:districtCode', (req: Request, res: Response) => {
  const district = db.getDistrictByCode(req.params.districtCode);
  if (!district) return res.status(404).json({ success: false, error: 'District not found' });
  res.json({ success: true, data: district });
});

// Land Use Records
router.get('/land-use/records', (req: Request, res: Response) => {
  const { state_code, district_code, year, category } = req.query;
  const records = db.getLandUseRecords({
    state_code: state_code as string,
    district_code: district_code as string,
    year: year ? Number(year) : undefined,
    category: category as string
  });
  res.json({ success: true, count: records.length, data: records });
});

// Trend Analysis Endpoint
router.get('/land-use/trends', (req: Request, res: Response) => {
  const stateCode = (req.query.state as string) || 'IN-UP';
  const districtCode = req.query.district as string;
  const category = (req.query.category as string) || 'agricultural';

  const records = db.getLandUseRecords({
    state_code: stateCode,
    district_code: districtCode
  }).sort((a, b) => a.year - b.year);

  const key = `${category}_pct`;
  const series = records.map(r => {
    const rec = r as any;
    return {
      year: r.year,
      value: typeof rec[key] === 'number' ? rec[key] : 0,
      agricultural: r.agricultural_pct,
      forest: r.forest_pct,
      builtup: r.builtup_pct,
      water: r.waterbodies_pct,
      barren: r.barren_pct,
      irrigated: r.irrigated_pct,
      degraded: r.degraded_pct
    };
  });

  const metrics = StatsEngine.analyzeTrend(series.map(s => ({ year: s.year, value: s.value })));

  const state = db.getStateByCode(stateCode);
  const district = districtCode && districtCode !== 'ALL' ? db.getDistrictByCode(districtCode) : undefined;

  // Compute 2030 and 2035 predictive forecast
  const lastVal = series[series.length - 1]?.value || 66.0;
  const cagrRate = metrics.cagr / 100;
  const forecast2030 = Math.max(0, Math.min(100, Number((lastVal * Math.pow(1 + cagrRate, 5)).toFixed(2))));
  const forecast2035 = Math.max(0, Math.min(100, Number((lastVal * Math.pow(1 + cagrRate, 10)).toFixed(2))));

  // Tehsil breakdown for Amethi
  const tehsilTrends = [
    {
      tehsil: 'Gauriganj (District HQ)',
      areaSqKm: 486,
      series: [
        { year: 2005, agricultural: 69.5, builtup: 8.0, barren: 9.8, irrigated: 76.0 },
        { year: 2010, agricultural: 67.8, builtup: 10.5, barren: 9.0, irrigated: 79.5 },
        { year: 2015, agricultural: 65.5, builtup: 13.5, barren: 7.8, irrigated: 84.0 },
        { year: 2020, agricultural: 63.8, builtup: 16.2, barren: 6.8, irrigated: 87.5 },
        { year: 2025, agricultural: 62.0, builtup: 18.5, barren: 5.9, irrigated: 90.2 }
      ]
    },
    {
      tehsil: 'Amethi Tehsil',
      areaSqKm: 612,
      series: [
        { year: 2005, agricultural: 71.2, builtup: 7.5, barren: 8.8, irrigated: 78.0 },
        { year: 2010, agricultural: 70.5, builtup: 8.4, barren: 8.0, irrigated: 80.5 },
        { year: 2015, agricultural: 69.6, builtup: 9.8, barren: 7.2, irrigated: 83.8 },
        { year: 2020, agricultural: 68.9, builtup: 11.0, barren: 6.5, irrigated: 87.0 },
        { year: 2025, agricultural: 68.2, builtup: 12.0, barren: 5.6, irrigated: 89.5 }
      ]
    },
    {
      tehsil: 'Musafirkhana Tehsil',
      areaSqKm: 654,
      series: [
        { year: 2005, agricultural: 68.0, builtup: 7.8, barren: 12.4, irrigated: 74.5 },
        { year: 2010, agricultural: 67.2, builtup: 8.9, barren: 11.0, irrigated: 78.0 },
        { year: 2015, agricultural: 66.8, builtup: 10.0, barren: 9.5, irrigated: 82.5 },
        { year: 2020, agricultural: 67.2, builtup: 11.0, barren: 7.8, irrigated: 86.2 },
        { year: 2025, agricultural: 67.5, builtup: 11.8, barren: 5.8, irrigated: 91.2 }
      ]
    },
    {
      tehsil: 'Tiloi Tehsil',
      areaSqKm: 577,
      series: [
        { year: 2005, agricultural: 69.2, builtup: 7.2, barren: 10.5, irrigated: 75.0 },
        { year: 2010, agricultural: 68.5, builtup: 8.0, barren: 9.8, irrigated: 78.2 },
        { year: 2015, agricultural: 67.8, builtup: 9.0, barren: 8.5, irrigated: 81.8 },
        { year: 2020, agricultural: 67.2, builtup: 9.8, barren: 7.5, irrigated: 85.5 },
        { year: 2025, agricultural: 66.8, builtup: 10.5, barren: 6.8, irrigated: 88.5 }
      ]
    }
  ];

  const policyMilestones = [
    { year: 2008, title: 'DILRMP Launch', description: 'Digital India Land Records Modernization Programme for cadastre geo-referencing.' },
    { year: 2010, title: 'UPSLRP Phase III', description: 'UP Sodic Lands Reclamation Project with gypsum amendment & drain branching.' },
    { year: 2015, title: 'PMKSY Notification', description: 'Pradhan Mantri Krishi Sinchayee Yojana accelerated canal networks.' },
    { year: 2020, title: 'PM-KUSUM & Solar Grid', description: 'Solar powered shallow tubewells expanding round-the-clock irrigation.' }
  ];

  res.json({
    success: true,
    geography: {
      type: district ? 'district' : stateCode === 'IN-ALL' ? 'national' : 'state',
      name: district ? district.district_name : state ? state.state_name : 'All India',
      stateCode,
      districtCode
    },
    category,
    period: {
      from: series[0]?.year || 2005,
      to: series[series.length - 1]?.year || 2025
    },
    data: series,
    summary: metrics,
    forecasts: {
      year2030: forecast2030,
      year2035: forecast2035,
      methodology: 'Least-Squares CAGR Extrapolation constrained to [0, 100%]'
    },
    tehsilTrends: districtCode === 'UP-AMT' || stateCode === 'IN-UP' ? tehsilTrends : [],
    policyMilestones,
    sources: [
      { name: 'Ministry of Agriculture & Farmers Welfare (DES)', year: '2025', url: 'https://desagri.gov.in' },
      { name: 'State Directorate of Land Records & Board of Revenue (UP)', year: '2025', url: 'https://updes.up.nic.in' },
      { name: 'National Remote Sensing Centre (Bhuvan LULC)', year: '2025', url: 'https://bhuvan.nrsc.gov.in' }
    ]
  });
});

// Comparison Endpoint
router.get('/land-use/compare', (req: Request, res: Response) => {
  const geo1 = (req.query.geo1 as string) || 'IN-UP';
  const geo2 = (req.query.geo2 as string) || 'IN-BR';
  const year = req.query.year ? Number(req.query.year) : 2025;

  const recs1 = db.getLandUseRecords({ state_code: geo1, year });
  const recs2 = db.getLandUseRecords({ state_code: geo2, year });

  const r1 = recs1[0] || db.getLandUseRecords({ state_code: geo1 })[0];
  const r2 = recs2[0] || db.getLandUseRecords({ state_code: geo2 })[0];

  const state1 = db.getStateByCode(geo1);
  const state2 = db.getStateByCode(geo2);

  res.json({
    success: true,
    year,
    comparison: {
      geo1: {
        code: geo1,
        name: state1?.state_name || geo1,
        record: r1
      },
      geo2: {
        code: geo2,
        name: state2?.state_name || geo2,
        record: r2
      },
      deltas: r1 && r2 ? {
        agricultural_diff: Number((r1.agricultural_pct - r2.agricultural_pct).toFixed(2)),
        forest_diff: Number((r1.forest_pct - r2.forest_pct).toFixed(2)),
        builtup_diff: Number((r1.builtup_pct - r2.builtup_pct).toFixed(2)),
        water_diff: Number((r1.waterbodies_pct - r2.waterbodies_pct).toFixed(2)),
        barren_diff: Number((r1.barren_pct - r2.barren_pct).toFixed(2)),
        irrigated_diff: Number((r1.irrigated_pct - r2.irrigated_pct).toFixed(2))
      } : null
    }
  });
});

// Datasets
router.get('/datasets', (req: Request, res: Response) => {
  const { search, category } = req.query;
  const datasets = db.getDatasets(search as string, category as string);
  res.json({ success: true, count: datasets.length, data: datasets });
});

router.get('/datasets/:id', (req: Request, res: Response) => {
  const dataset = db.getDatasetById(req.params.id);
  if (!dataset) return res.status(404).json({ success: false, error: 'Dataset not found' });
  res.json({ success: true, data: dataset });
});

// Data Sources
router.get('/data-sources', (req: Request, res: Response) => {
  res.json({ success: true, data: db.getDataSources() });
});

router.post('/data-sources/:id/sync', (req: Request, res: Response) => {
  const synced = db.syncDataSource(req.params.id);
  if (!synced) return res.status(404).json({ success: false, error: 'Data source not found' });
  res.json({ success: true, message: `Data source ${synced.name} synchronized successfully`, data: synced });
});

// Policies
router.get('/policies', (req: Request, res: Response) => {
  res.json({ success: true, data: db.getPolicies() });
});

router.get('/policies/:id', (req: Request, res: Response) => {
  const policy = db.getPolicyById(req.params.id);
  if (!policy) return res.status(404).json({ success: false, error: 'Policy not found' });
  res.json({ success: true, data: policy });
});

router.get('/policies/:id/impact', (req: Request, res: Response) => {
  try {
    const stateCode = (req.query.state as string) || 'IN-UP';
    const impact = PolicyService.analyzePolicyImpact(req.params.id, stateCode);
    res.json({ success: true, data: impact });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Research Papers
router.get('/research', (req: Request, res: Response) => {
  const { search, tag } = req.query;
  const papers = db.getResearchPapers(search as string, tag as string);
  res.json({ success: true, count: papers.length, data: papers });
});

router.get('/research/:id', (req: Request, res: Response) => {
  const paper = db.getResearchPaperById(req.params.id);
  if (!paper) return res.status(404).json({ success: false, error: 'Research paper not found' });
  res.json({ success: true, data: paper });
});

// Anomalies
router.get('/anomalies', (req: Request, res: Response) => {
  const stateCode = req.query.state as string;
  res.json({ success: true, data: db.getAnomalies(stateCode) });
});

// AI Query Endpoint
router.post('/ai/query', async (req: Request, res: Response) => {
  const { query, apiKey } = req.body;
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ success: false, error: 'Query string is required' });
  }

  try {
    const answer = await AIService.answerQuery(query, apiKey);
    res.json({ success: true, data: answer });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to process AI query', details: err.message });
  }
});

router.get('/ai/recent-queries', (req: Request, res: Response) => {
  res.json({ success: true, data: db.getRecentAIQueries() });
});

// Test Gemini API Endpoint
router.get('/ai/test-gemini', async (req: Request, res: Response) => {
  const apiKey = req.query.apiKey as string | undefined;
  const result = await GeminiService.testConnection(apiKey);
  res.json(result);
});

router.post('/ai/test-gemini', async (req: Request, res: Response) => {
  const { apiKey } = req.body;
  const result = await GeminiService.testConnection(apiKey);
  res.json(result);
});

// Admin Ingestion
router.post('/admin/upload', (req: Request, res: Response) => {
  const { rawRows, columnMapping, metadata } = req.body;
  if (!rawRows || !columnMapping || !metadata) {
    return res.status(400).json({ success: false, error: 'Missing rawRows, columnMapping, or metadata payload' });
  }

  const result = IngestionService.validateAndTransform(rawRows, columnMapping, metadata);
  if (!result.validation.isValid) {
    return res.status(422).json({ success: false, validation: result.validation });
  }

  if (result.dataset && result.records) {
    db.addUploadedDataset(result.dataset, result.records);
  }

  res.json({
    success: true,
    message: `Successfully ingested ${result.records?.length} records into dataset "${result.dataset?.title}"`,
    validation: result.validation,
    dataset: result.dataset
  });
});

router.get('/admin/audit-logs', (req: Request, res: Response) => {
  res.json({ success: true, data: db.getAuditLogs() });
});

export default router;
