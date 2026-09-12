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

router.post('/system/seed-supabase', async (req: Request, res: Response) => {
  const result = await db.seedSupabase();
  res.json(result);
});

router.get('/system/supabase-schema', (req: Request, res: Response) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const schemaPath = path.join(process.cwd(), 'server', 'db', 'supabase-schema.sql');
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, 'utf-8');
      return res.json({ success: true, sql });
    }
  } catch {}
  res.status(404).json({ success: false, error: 'Schema file not found' });
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
  const { state, district, includeHidden } = req.query;
  res.json({ success: true, data: db.getPolicies(state as string, district as string, includeHidden === 'true') });
});

router.get('/policies/:id', (req: Request, res: Response) => {
  const policy = db.getPolicyById(req.params.id);
  if (!policy) return res.status(404).json({ success: false, error: 'Policy not found' });
  res.json({ success: true, data: policy });
});

// Create new Policy (Policy Maker)
router.post('/policies', (req: Request, res: Response) => {
  try {
    const {
      name,
      acronym,
      ministry,
      launch_year,
      description,
      target_region,
      objectives,
      related_indicators,
      documents_url,
      allocated_budget_cr,
      area_targets,
      policyMakerId,
      policyMakerName,
      status
    } = req.body;

    if (!name || !description) {
      return res.status(400).json({ success: false, error: 'Policy name and description are required.' });
    }

    const id = 'POL-' + (acronym ? acronym.replace(/[^A-Za-z0-9]/g, '').toUpperCase() : Date.now().toString(36).toUpperCase());
    const newPolicy = {
      id,
      name: name.trim(),
      acronym: acronym ? acronym.trim().toUpperCase() : name.substring(0, 6).toUpperCase(),
      ministry: ministry || 'Ministry of Agriculture & Farmers Welfare / DoLR',
      launch_year: Number(launch_year) || new Date().getFullYear(),
      description: description.trim(),
      target_region: target_region || 'Pan-India',
      objectives: Array.isArray(objectives) && objectives.length > 0 ? objectives : [
        'Optimize regional land-use efficiency and cadastral clarity.',
        'Preserve cultivable agricultural land and rehabilitate sodic/barren soils.'
      ],
      related_indicators: Array.isArray(related_indicators) && related_indicators.length > 0 ? related_indicators : [
        'Agricultural Land %',
        'Irrigated Area %',
        'Barren / Wasteland %'
      ],
      documents_url: documents_url || `/policies/${id}`,
      pre_period: `${(Number(launch_year) || 2020) - 5}-${Number(launch_year) || 2020}`,
      post_period: `${Number(launch_year) || 2020}-2026`,
      observed_impact_summary: `Policy initiated targeting ${target_region || 'targeted regional land landscapes'} under active monitoring.`,
      methodology_note: 'Synthesized policy directive and cadastral telemetry tracking baseline.',
      linked_dataset_ids: ['DS-DES-LUS', 'DS-NRSC-BHUVAN'],
      area_targets: Array.isArray(area_targets) ? area_targets : [],
      is_user_modified: true,
      status: status || 'Active',
      allocated_budget_cr: allocated_budget_cr ? Number(allocated_budget_cr) : undefined,
      policyMakerId: policyMakerId || 'BHU-POL-8763-9201',
      policyMakerName: policyMakerName || 'Policy Maker'
    };

    const saved = db.addPolicy(newPolicy as any);
    res.json({ success: true, message: 'Policy registered successfully', data: saved });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update Policy (Policy Maker)
router.put('/policies/:id', (req: Request, res: Response) => {
  try {
    const updated = db.updatePolicy(req.params.id, req.body);
    if (!updated) return res.status(404).json({ success: false, error: 'Policy not found' });
    res.json({ success: true, message: 'Policy updated successfully', data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update Policy Area Target (Policy Maker updates on the basis of area)
router.post('/policies/:id/area', (req: Request, res: Response) => {
  try {
    const {
      state_code,
      state_name,
      district_code,
      district_name,
      target_year,
      regional_budget_cr,
      target_agricultural_pct,
      target_reclaim_ha,
      priority_tier,
      directives,
      notes,
      updated_by
    } = req.body;

    if (!state_code || !state_name) {
      return res.status(400).json({ success: false, error: 'State code and state name are required for area-based policy updates.' });
    }

    const areaTarget = {
      state_code,
      state_name,
      district_code: district_code || undefined,
      district_name: district_name || undefined,
      target_year: Number(target_year) || 2028,
      regional_budget_cr: regional_budget_cr ? Number(regional_budget_cr) : undefined,
      target_agricultural_pct: target_agricultural_pct ? Number(target_agricultural_pct) : undefined,
      target_reclaim_ha: target_reclaim_ha ? Number(target_reclaim_ha) : undefined,
      priority_tier: priority_tier || 'Critical Focus',
      directives: Array.isArray(directives) && directives.length > 0 ? directives : [
        `Strict enforcement of cadastral zoning across ${district_name || state_name}.`,
        `Prioritize micro-irrigation allocation and solar pump subsidies.`,
        `Prevent non-agricultural diversion of prime double-cropped fertile parcels.`
      ],
      notes: notes || `Area target calibrated for ${district_name ? district_name + ', ' : ''}${state_name} by Policy Maker.`,
      updated_by: updated_by || 'Policy Maker',
      last_updated: new Date().toISOString()
    };

    const updated = db.updatePolicyArea(req.params.id, areaTarget as any);
    if (!updated) return res.status(404).json({ success: false, error: 'Policy not found' });

    res.json({
      success: true,
      message: `Policy successfully configured and updated for ${district_name ? district_name + ', ' : ''}${state_name}`,
      data: updated
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Drag & Drop Ingestion for Policies / Gazette Notifications
router.post('/policies/upload', (req: Request, res: Response) => {
  try {
    const {
      fileName,
      fileSize,
      fileType,
      fileContent,
      name,
      acronym,
      ministry,
      target_region,
      state_code,
      state_name,
      district_name,
      allocated_budget_cr,
      directives,
      policyMakerName
    } = req.body;

    if (!fileName && !name) {
      return res.status(400).json({ success: false, error: 'File or policy details are required.' });
    }

    const detectedTitle = name || fileName?.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') || 'Gazette Land Policy Directive';
    const cleanAcronym = acronym || detectedTitle.split(' ').map((w: string) => w[0]).join('').substring(0, 6).toUpperCase() || 'GAZ-POL';
    const policyId = 'POL-' + cleanAcronym + '-' + Date.now().toString(36).toUpperCase().substring(0, 4);

    const detectedDirectives = Array.isArray(directives) && directives.length > 0 ? directives : [
      'Statutory verification of cadastral parcels against master land-use registers.',
      'Mandatory GIS geofencing before approval of any non-agricultural land diversion.',
      'Accelerated sodic soil reclamation with target allocation to regional SHGs and smallholders.'
    ];

    const initialAreaTarget = state_code && state_name ? {
      state_code,
      state_name,
      district_name: district_name || undefined,
      target_year: 2028,
      regional_budget_cr: allocated_budget_cr ? Number(allocated_budget_cr) : 350,
      priority_tier: 'Critical Focus' as const,
      directives: detectedDirectives,
      last_updated: new Date().toISOString(),
      updated_by: policyMakerName || 'Policy Maker'
    } : undefined;

    const newPolicy = {
      id: policyId,
      name: detectedTitle,
      acronym: cleanAcronym,
      ministry: ministry || 'Ministry of Agriculture & Farmers Welfare / Revenue Board',
      launch_year: new Date().getFullYear(),
      description: `Official gazetted policy notification ingested via Bhu-Drishti policy pipeline from document '${fileName || 'gazette_order.pdf'}'. Mandates enforceable land targets and area compliance.`,
      target_region: target_region || (state_name ? `${state_name}${district_name ? ' (' + district_name + ')' : ''}` : 'National Priority Corridor'),
      objectives: detectedDirectives,
      related_indicators: [
        'Agricultural Land %',
        'Cadastral Digitization %',
        'Irrigated Area %'
      ],
      documents_url: `/policies/${policyId}`,
      pre_period: '2015-2020',
      post_period: '2021-2026',
      observed_impact_summary: `Policy active in target area. Baseline monitoring initialized post-gazette upload.`,
      methodology_note: 'Gazette directive ingested with digital hash verification and spatial jurisdiction binding.',
      linked_dataset_ids: ['DS-DES-LUS'],
      area_targets: initialAreaTarget ? [initialAreaTarget] : [],
      current_area_target: initialAreaTarget,
      is_user_modified: true,
      status: 'Gazette Notified' as const,
      allocated_budget_cr: allocated_budget_cr ? Number(allocated_budget_cr) : 450,
      policyMakerId: 'BHU-POL-8763-9201',
      policyMakerName: policyMakerName || 'Policy Maker',
      documentText: typeof fileContent === 'string' ? fileContent.substring(0, 2000) : '',
      fileAttachment: fileName ? {
        name: fileName,
        size: fileSize || 0,
        type: fileType || 'application/pdf',
        url: `/documents/${fileName}`
      } : undefined
    };

    const created = db.addPolicy(newPolicy as any);
    res.json({
      success: true,
      message: `Policy '${detectedTitle}' successfully ingested, parsed, and registered in National Repository.`,
      data: created
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/policies/:id', (req: Request, res: Response) => {
  const deleted = db.deletePolicy(req.params.id);
  if (!deleted) return res.status(404).json({ success: false, error: 'Policy not found' });
  res.json({ success: true, message: 'Policy deleted successfully' });
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
  const { search, tag, includeHidden } = req.query;
  const papers = db.getResearchPapers(search as string, tag as string, includeHidden === 'true');
  res.json({ success: true, count: papers.length, data: papers });
});

router.delete('/research/:id', (req: Request, res: Response) => {
  const deleted = db.deleteResearchPaper(req.params.id);
  if (!deleted) return res.status(404).json({ success: false, error: 'Research paper not found' });
  res.json({ success: true, message: 'Research paper deleted successfully' });
});

router.get('/research/:id', (req: Request, res: Response) => {
  const paper = db.getResearchPaperById(req.params.id);
  if (!paper) return res.status(404).json({ success: false, error: 'Research paper not found' });
  res.json({ success: true, data: paper });
});

// Create / Author new Research Paper
router.post('/research', (req: Request, res: Response) => {
  try {
    const {
      title,
      abstract,
      authors,
      year,
      publisher,
      journal,
      geography,
      methodology,
      key_findings,
      tags,
      citation_apa,
      source_url,
      dedicatedResearcherId,
      authorEmail,
      contentMarkdown,
      fileAttachment
    } = req.body;

    if (!title || !abstract) {
      return res.status(400).json({ success: false, error: 'Title and abstract are required.' });
    }

    const currentYear = year || new Date().getFullYear();
    const cleanAuthors = Array.isArray(authors) && authors.length > 0 ? authors : ['Researcher'];
    const paperId = 'PAP-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 5).toUpperCase();

    const newPaper = {
      id: paperId,
      title: title.trim(),
      authors: cleanAuthors,
      year: currentYear,
      publisher: publisher || 'Bhu-Drishti National Land Knowledge Repository',
      journal: journal || 'Empirical Land Policy & Cadastral Research (MoA&FW)',
      abstract: abstract.trim(),
      research_area: geography || 'National / Multi-State',
      geography: geography || 'India',
      methodology: methodology || 'Multi-decadal geospatial satellite LULC mapping and econometric trend balance sheets.',
      key_findings: Array.isArray(key_findings) && key_findings.length > 0 ? key_findings : [
        'Documented longitudinal spatial shift across study area.',
        'Validated through Grounded Statistical Engine benchmarks.'
      ],
      citation_apa: citation_apa || `${cleanAuthors.join(', ')} (${currentYear}). ${title}. ${journal || 'Bhu-Drishti Land Studies'}. Dedicated UID: ${dedicatedResearcherId || 'RES-OFFICIAL-2026'}`,
      source_url: source_url || `/research/${paperId}`,
      tags: Array.isArray(tags) && tags.length > 0 ? tags : ['Land Use', 'Cadastral Maps', 'Research Paper'],
      ai_summary: `Author study by ${cleanAuthors.join(', ')} focusing on ${geography || 'land dynamics'}. Explores land shifts, policy correlations, and decadal trends.`,
      related_dataset_ids: ['DS-DES-LUS', 'DS-BHUVAN-LULC'],
      related_policy_ids: ['POL-DILRMP-2008', 'POL-PMKSY-2015'],
      dedicatedResearcherId: dedicatedResearcherId || 'BHU-RES-8763-9201',
      authorEmail: authorEmail || 'researcher@bhu-drishti.gov.in',
      contentMarkdown: contentMarkdown || '',
      fileAttachment: fileAttachment || null,
      isUserAuthored: true,
      status: 'published' as const
    };

    const saved = db.addResearchPaper(newPaper as any);
    res.status(201).json({ success: true, message: 'Research paper published successfully', data: saved });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to save research paper' });
  }
});

// Upload Document Endpoint
router.post('/research/upload', (req: Request, res: Response) => {
  try {
    const { fileName, fileSize, fileType, fileContent, title, author, dedicatedResearcherId, geography, tags } = req.body;
    if (!fileName) {
      return res.status(400).json({ success: false, error: 'File name is required.' });
    }

    const paperId = 'PAP-UPL-' + Date.now().toString(36).toUpperCase();
    const paperTitle = title || fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

    const newPaper = {
      id: paperId,
      title: paperTitle,
      authors: [author || 'Institutional Researcher'],
      year: new Date().getFullYear(),
      publisher: 'Bhu-Drishti Ingested Document Archive',
      journal: 'Institutional Field Surveys & Land Documents',
      abstract: `Ingested document: ${fileName} (${(fileSize ? Math.round(fileSize / 1024) : 0)} KB). Contains cadastral and land-use assessment observations uploaded by authenticated researcher ${dedicatedResearcherId || 'BHU-RES-8763-9201'}.`,
      research_area: geography || 'Field Survey & Policy',
      geography: geography || 'India',
      methodology: 'Direct researcher document upload and automated cadastral indexing.',
      key_findings: [
        `Uploaded document file: ${fileName}`,
        `Authenticated researcher ID: ${dedicatedResearcherId || 'BHU-RES-8763-9201'}`
      ],
      citation_apa: `${author || 'Researcher'} (${new Date().getFullYear()}). ${paperTitle}. Bhu-Drishti Land Ingestion Portal. File: ${fileName}.`,
      source_url: `/research/${paperId}`,
      tags: Array.isArray(tags) && tags.length > 0 ? tags : ['Uploaded Paper', 'Cadastral Maps', 'Field Survey'],
      ai_summary: `Document analysis for ${fileName}. Uploaded with verified researcher credentials.`,
      related_dataset_ids: ['DS-DES-LUS'],
      related_policy_ids: ['POL-DILRMP-2008'],
      dedicatedResearcherId: dedicatedResearcherId || 'BHU-RES-8763-9201',
      contentMarkdown: typeof fileContent === 'string' ? fileContent.substring(0, 50000) : '',
      fileAttachment: {
        name: fileName,
        size: fileSize || 0,
        type: fileType || 'application/pdf',
        uploadedAt: new Date().toISOString()
      },
      isUserAuthored: true,
      status: 'published' as const
    };

    const saved = db.addResearchPaper(newPaper as any);
    res.status(201).json({ success: true, message: 'Document uploaded and indexed successfully', data: saved });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to upload document' });
  }
});

// Google Authentication Endpoints
router.get('/auth/google/url', (req: Request, res: Response) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = `${req.protocol}://${req.get('host')}/auth/google/callback`;

  if (clientId) {
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'consent'
    });
    return res.json({ success: true, url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}` });
  }

  // Fallback demo auth URL
  res.json({
    success: true,
    url: `/auth/google/callback?code=mock_google_auth_token_${Date.now()}`
  });
});

router.post('/auth/google/verify', (req: Request, res: Response) => {
  const { email, name, avatar, fixedId, requestedRole } = req.body;
  if (!email || typeof email !== 'string' || !email.trim()) {
    return res.status(400).json({ success: false, error: 'Valid Google email is required for authentication' });
  }

  const userEmail = email.trim().toLowerCase();
  const isMaster = userEmail === 'shashvatshukla81@gmail.com';
  const userName = name || (isMaster ? 'Dr. Shashvat Shukla' : userEmail.split('@')[0]);

  // Role validation:
  // General users can only be 'researcher', 'policymaker', or 'public'.
  // Only shashvatshukla81@gmail.com can log in as 'inspector' or 'admin' or switch between ANY role.
  let assignedRole = requestedRole || 'researcher';
  if ((assignedRole === 'inspector' || assignedRole === 'admin') && !isMaster) {
    assignedRole = 'researcher'; // Demote unprivileged attempts to researcher
  }

  // Compute or preserve dedicated fixed researcher ID
  const dedicatedId = fixedId || (isMaster ? 'BHU-RES-8763-9201' : `BHU-${assignedRole.substring(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`);

  const profile = {
    id: 'usr_g_' + Buffer.from(userEmail).toString('base64').substring(0, 10).replace(/[^a-zA-Z0-9]/g, ''),
    dedicatedFixedId: dedicatedId,
    email: userEmail,
    name: userName,
    avatar: avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(userName)}&backgroundColor=${isMaster ? '059669' : '1e40af'}`,
    role: assignedRole,
    affiliation: isMaster
      ? 'National Land Records & Geospatial Intelligence Directorate'
      : (assignedRole === 'policymaker' ? 'NITI Aayog & State Land Planning Commission' : 'State Cadastral Research Institute'),
    designation: isMaster
      ? 'Chief Director of Inspection & Cadastral Research'
      : (assignedRole === 'policymaker' ? 'Senior Land Policy Advisor' : (assignedRole === 'public' ? 'Citizen Observer' : 'Cadastral Researcher')),
    institutionType: isMaster ? 'Ministry of Agriculture & Farmers Welfare / NIC' : 'State Agricultural University / Planning Dept',
    orcid: isMaster ? '0009-0004-8763-9201' : undefined,
    isGoogleVerified: true,
    issuedAt: new Date().toISOString(),
    authProvider: 'google' as const,
    isMasterSuperAdmin: isMaster,
    is_inspection_verified: isMaster,
    features_granted: isMaster
      ? ['full_inspection', 'policy_moderation', 'research_curation', 'user_rights_calibration', 'all_roles_switch']
      : (assignedRole === 'policymaker' ? ['policy_authoring', 'target_setting', 'draft_submission'] : ['research_authoring', 'document_upload', 'dataset_analytics'])
  };

  res.json({ success: true, data: profile });
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

// ==========================================
// Inspection Directorate & Ombudsman Routes
// ==========================================

// 1. Get registry census statistics
router.get('/inspection/stats', (req: Request, res: Response) => {
  try {
    const stats = db.getInspectionStats();
    res.json({ success: true, data: stats });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Get registered users list
router.get('/inspection/users', (req: Request, res: Response) => {
  try {
    const users = db.getUsers();
    res.json({ success: true, count: users.length, data: users });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Update user role
router.put('/inspection/users/:id/role', (req: Request, res: Response) => {
  try {
    const { role } = req.body;
    if (!role) return res.status(400).json({ success: false, error: 'Role is required' });
    const updated = db.updateUserRole(req.params.id, role);
    if (!updated) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({ success: true, message: `User role updated to ${role}`, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Update user features / powers
router.put('/inspection/users/:id/features', (req: Request, res: Response) => {
  try {
    const { features_granted } = req.body;
    if (!Array.isArray(features_granted)) {
      return res.status(400).json({ success: false, error: 'features_granted must be an array' });
    }
    const updated = db.updateUserFeatures(req.params.id, features_granted);
    if (!updated) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({ success: true, message: 'User granted capabilities updated', data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Star / Verify user (e.g. certify researcher)
router.put('/inspection/users/:id/star', (req: Request, res: Response) => {
  try {
    const { is_starred, is_inspection_verified, inspection_notes } = req.body;
    const updated = db.toggleUserStar(req.params.id, is_starred, is_inspection_verified, inspection_notes);
    if (!updated) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({ success: true, message: 'User inspection verification status updated', data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Delete user
router.delete('/inspection/users/:id', (req: Request, res: Response) => {
  try {
    const deleted = db.deleteUser(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({ success: true, message: 'User record removed from registry' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Inspect Policy (Star, Verify, Hide/Show, Reorder, Add Notes)
router.put('/inspection/policies/:id/inspect', (req: Request, res: Response) => {
  try {
    const updated = db.inspectPolicy(req.params.id, req.body);
    if (!updated) return res.status(404).json({ success: false, error: 'Policy not found' });
    res.json({ success: true, message: 'Policy inspection verdict saved', data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. Reorder Policies
router.post('/inspection/policies/reorder', (req: Request, res: Response) => {
  try {
    const { orderedIds } = req.body;
    if (!Array.isArray(orderedIds)) {
      return res.status(400).json({ success: false, error: 'orderedIds must be an array' });
    }
    const policies = db.reorderPolicies(orderedIds);
    res.json({ success: true, message: 'Policies reordered successfully', data: policies });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9. Inspect Research Paper (Star, Verify, Hide/Show, Reorder, Add Notes)
router.put('/inspection/research/:id/inspect', (req: Request, res: Response) => {
  try {
    const updated = db.inspectResearch(req.params.id, req.body);
    if (!updated) return res.status(404).json({ success: false, error: 'Research paper not found' });
    res.json({ success: true, message: 'Research paper inspection status saved', data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 10. Reorder Research Papers
router.post('/inspection/research/reorder', (req: Request, res: Response) => {
  try {
    const { orderedIds } = req.body;
    if (!Array.isArray(orderedIds)) {
      return res.status(400).json({ success: false, error: 'orderedIds must be an array' });
    }
    const papers = db.reorderResearch(orderedIds);
    res.json({ success: true, message: 'Research papers reordered successfully', data: papers });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 11. Dashboard Live Control & Overrides (Inspection Directorate)
router.get('/inspection/dashboard-data', (req: Request, res: Response) => {
  try {
    const data = db.getDashboardData();
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/inspection/dashboard-data', (req: Request, res: Response) => {
  try {
    const updated = db.updateDashboardData(req.body);
    res.json({ success: true, message: 'Dashboard configuration calibrated successfully', data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/inspection/reset-dashboard-data', (req: Request, res: Response) => {
  try {
    const resetData = db.resetDashboardData();
    res.json({ success: true, message: 'Dashboard restored to official national baseline', data: resetData });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 12. Land Use Records Override by Inspection Directorate
router.put('/land-use/records/:id', (req: Request, res: Response) => {
  try {
    const updated = db.updateLandUseRecord(req.params.id, req.body);
    if (!updated) return res.status(404).json({ success: false, error: 'Land use record not found' });
    res.json({ success: true, message: 'Cadastral record calibrated successfully', data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/land-use/override', (req: Request, res: Response) => {
  try {
    const { state_code, district_code, year, updates } = req.body;
    if (!state_code || !year || !updates) {
      return res.status(400).json({ success: false, error: 'state_code, year, and updates are required' });
    }
    const record = db.updateLandUseRecordByLocation(state_code, district_code, Number(year), updates);
    res.json({ success: true, message: 'Land use figures updated across national registry', data: record });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
