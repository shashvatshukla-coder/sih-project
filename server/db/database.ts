import { State, District, LandUseRecord, Dataset, DataSource, Policy, AreaTarget, ResearchPaper, Anomaly, UserRegistryRecord, InspectionStats } from './schema.ts';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import pg from 'pg';
const { Pool } = pg;
import { getPrismaClient, isDbConnected } from './prismaClient.ts';

function getDirname(): string {
  if (typeof __dirname !== 'undefined') return __dirname;
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any).url) {
      return path.dirname(fileURLToPath((import.meta as any).url));
    }
  } catch {}
  return path.join(process.cwd(), 'server', 'db');
}

function loadJson<T>(filename: string): T {
  const baseDir = getDirname();
  const candidatePaths = [
    path.join(baseDir, filename),
    path.join(process.cwd(), 'server', 'db', filename),
    path.join(process.cwd(), 'dist', 'server', 'db', filename)
  ];
  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      const data = fs.readFileSync(p, 'utf-8');
      return JSON.parse(data) as T;
    }
  }
  throw new Error(`JSON seed file not found: ${filename} (searched: ${candidatePaths.join(', ')})`);
}

class Database {
  private states: State[] = [];
  private districts: District[] = [];
  private records: LandUseRecord[] = [];
  private datasets: Dataset[] = [];
  private dataSources: DataSource[] = [];
  private policies: Policy[] = [];
  private research: ResearchPaper[] = [];
  private users: UserRegistryRecord[] = [];
  private anomalies: Anomaly[] = [];
  private aiQueries: any[] = [];
  private auditLogs: any[] = [];
  private prisma: any = null;
  private isPostgresActive: boolean = false;
  private supabase: SupabaseClient | null = null;
  private supabaseConnected: boolean = false;
  private supabaseNeedsSeeding: boolean = false;
  private pgPool: pg.Pool | null = null;
  private pgPoolConnected: boolean = false;
  private lastSyncTime: string | null = null;

  constructor() {
    this.init();
  }

  private async init() {
    // 1. Always load verified JSON seed data for instant zero-latency boot & offline reliability
    try {
      this.states = loadJson<State[]>('states.json');
      this.districts = loadJson<District[]>('districts.json');
      this.records = loadJson<LandUseRecord[]>('records.json');
      this.datasets = loadJson<Dataset[]>('datasets.json');
      this.dataSources = loadJson<DataSource[]>('datasources.json');
      this.policies = loadJson<Policy[]>('policies.json');
      this.research = loadJson<ResearchPaper[]>('research.json');
      this.anomalies = loadJson<Anomaly[]>('anomalies.json');

      // Initialize default inspection order & star status on existing seed
      this.policies.forEach((p, idx) => {
        if (p.priority_order === undefined) p.priority_order = idx + 1;
        if (p.is_starred === undefined) p.is_starred = idx < 2;
        if (p.is_inspection_verified === undefined) p.is_inspection_verified = true;
      });

      this.research.forEach((r, idx) => {
        if (r.priority_order === undefined) r.priority_order = idx + 1;
        if (r.is_starred === undefined) r.is_starred = idx < 2;
        if (r.is_inspection_verified === undefined) r.is_inspection_verified = true;
      });

      this.users = [
        {
          id: 'usr-pol-01',
          dedicatedFixedId: 'BHU-POL-8763-9201',
          email: 'rajesh.verma.ias@nic.in',
          name: 'Shri Rajesh Verma, IAS',
          avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Rajesh%20Verma&backgroundColor=d97706',
          role: 'policymaker',
          affiliation: 'Ministry of Agriculture & Farmers Welfare, GoI',
          designation: 'Joint Secretary (Natural Resource & Land Policy)',
          institutionType: 'Central Government Department',
          isGoogleVerified: true,
          is_starred: true,
          is_inspection_verified: true,
          inspection_notes: 'Accredited Policy Maker for Central Scheme Interventions.',
          features_granted: ['publish_policy', 'upload_gazette', 'calibrate_area', 'export_raw', 'ai_grounding'],
          status: 'active',
          registeredAt: '2025-11-10T10:00:00Z',
          lastActiveAt: '2026-03-12T04:20:00Z'
        },
        {
          id: 'usr-pol-02',
          dedicatedFixedId: 'BHU-POL-4412-1092',
          email: 'ananya.sen@niti.gov.in',
          name: 'Dr. Ananya Sen',
          avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Ananya%20Sen&backgroundColor=b45309',
          role: 'policymaker',
          affiliation: 'NITI Aayog (Agriculture & Land Vertical)',
          designation: 'Senior Lead Policy Economist',
          institutionType: 'National Policy Think Tank',
          isGoogleVerified: true,
          is_starred: true,
          is_inspection_verified: true,
          inspection_notes: 'Verified policy researcher with Cabinet note clearance.',
          features_granted: ['publish_policy', 'upload_gazette', 'calibrate_area', 'author_research', 'ai_grounding'],
          status: 'active',
          registeredAt: '2026-01-05T08:30:00Z',
          lastActiveAt: '2026-03-11T16:40:00Z'
        },
        {
          id: 'usr-pol-03',
          dedicatedFixedId: 'BHU-POL-7719-2041',
          email: 'sudhir.kumar@up.gov.in',
          name: 'Shri Sudhir Kumar',
          avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Sudhir%20Kumar&backgroundColor=ca8a04',
          role: 'policymaker',
          affiliation: 'Board of Revenue, Government of Uttar Pradesh',
          designation: 'Commissioner of Land Records & Surveys',
          institutionType: 'State Revenue Department',
          isGoogleVerified: false,
          is_starred: false,
          is_inspection_verified: true,
          inspection_notes: 'State cadre land governance official.',
          features_granted: ['publish_policy', 'upload_gazette', 'calibrate_area'],
          status: 'active',
          registeredAt: '2026-01-20T11:15:00Z',
          lastActiveAt: '2026-03-10T12:00:00Z'
        },
        {
          id: 'usr-adm-01',
          dedicatedFixedId: 'BHU-ADM-0012-9912',
          email: 'vikram.malhotra@nic.in',
          name: 'Vikram Malhotra',
          avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Vikram%20Malhotra&backgroundColor=2563eb',
          role: 'admin',
          affiliation: 'National Informatics Centre (NIC) Geospatial Data Center',
          designation: 'Senior Technical Director & DB Administrator',
          institutionType: 'Government Informatics',
          isGoogleVerified: true,
          is_starred: true,
          is_inspection_verified: true,
          inspection_notes: 'System Root & Supabase/PostgreSQL Data Pipeline Controller.',
          features_granted: ['publish_policy', 'upload_gazette', 'calibrate_area', 'author_research', 'ingest_data', 'export_raw', 'delete_content', 'ai_grounding'],
          status: 'active',
          registeredAt: '2025-09-01T09:00:00Z',
          lastActiveAt: '2026-03-12T06:10:00Z'
        },
        {
          id: 'usr-adm-02',
          dedicatedFixedId: 'BHU-ADM-5531-8840',
          email: 'priya.sharma@nrsc.gov.in',
          name: 'Priya Sharma',
          avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Priya%20Sharma&backgroundColor=1d4ed8',
          role: 'admin',
          affiliation: 'National Remote Sensing Centre (NRSC / ISRO)',
          designation: 'Lead Cadastral Telemetry Engineer',
          institutionType: 'Space & Remote Sensing Agency',
          isGoogleVerified: true,
          is_starred: false,
          is_inspection_verified: true,
          inspection_notes: 'Bhuvan LULC spatial layer ingestion admin.',
          features_granted: ['ingest_data', 'export_raw', 'ai_grounding'],
          status: 'active',
          registeredAt: '2025-10-14T14:20:00Z',
          lastActiveAt: '2026-03-09T18:00:00Z'
        },
        {
          id: 'usr-res-01',
          dedicatedFixedId: 'BHU-RES-8763-9201',
          email: 'shashvatshukla81@gmail.com',
          name: 'Dr. Shashvat Shukla',
          avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Shashvat%20Shukla&backgroundColor=059669',
          role: 'researcher',
          affiliation: 'National Land Records & Geospatial Intelligence Directorate',
          designation: 'Senior Cadastral Research Scientist',
          institutionType: 'ICAR / Indian Council of Agricultural Research & NIC',
          orcid: '0009-0004-8763-9201',
          isGoogleVerified: true,
          is_starred: true,
          is_inspection_verified: true,
          inspection_notes: '⭐ Certified Research Fellow by Cadastral Inspection Directorate. Highest clearance for multi-decadal LULC synthesis.',
          features_granted: ['author_research', 'upload_paper', 'export_raw', 'ai_grounding', 'calibrate_area'],
          status: 'active',
          registeredAt: '2026-01-15T09:00:00Z',
          lastActiveAt: '2026-03-12T07:15:00Z'
        },
        {
          id: 'usr-res-02',
          dedicatedFixedId: 'BHU-RES-3391-7721',
          email: 'arvind.swaminathan@icar.gov.in',
          name: 'Dr. Arvind Swaminathan',
          avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Arvind%20Swaminathan&backgroundColor=15803d',
          role: 'researcher',
          affiliation: 'Indian Agricultural Research Institute (IARI), New Delhi',
          designation: 'Principal Scientist (Soil Health & Agronomy)',
          institutionType: 'National Agricultural Research System',
          orcid: '0000-0002-3391-7721',
          isGoogleVerified: true,
          is_starred: true,
          is_inspection_verified: true,
          inspection_notes: 'Verified field survey investigator for Gangetic alluvial soils.',
          features_granted: ['author_research', 'upload_paper', 'export_raw'],
          status: 'active',
          registeredAt: '2025-12-01T10:00:00Z',
          lastActiveAt: '2026-03-11T11:20:00Z'
        },
        {
          id: 'usr-res-03',
          dedicatedFixedId: 'BHU-RES-6624-5109',
          email: 'kavita.deshmukh@iirs.gov.in',
          name: 'Dr. Kavita Deshmukh',
          avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Kavita%20Deshmukh&backgroundColor=166534',
          role: 'researcher',
          affiliation: 'Indian Institute of Remote Sensing (IIRS / ISRO)',
          designation: 'Scientist / Engineer-SF (Photogrammetry)',
          institutionType: 'ISRO Research Institute',
          orcid: '0000-0003-6624-5109',
          isGoogleVerified: false,
          is_starred: false,
          is_inspection_verified: true,
          inspection_notes: 'Satellite spectral change detection researcher.',
          features_granted: ['author_research', 'upload_paper'],
          status: 'active',
          registeredAt: '2026-02-10T15:30:00Z',
          lastActiveAt: '2026-03-08T09:45:00Z'
        },
        {
          id: 'usr-res-04',
          dedicatedFixedId: 'BHU-RES-9182-3401',
          email: 'tanvi.rao@jnu.ac.in',
          name: 'Prof. Tanvi Rao',
          avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Tanvi%20Rao&backgroundColor=047857',
          role: 'researcher',
          affiliation: 'Centre for the Study of Regional Development, JNU',
          designation: 'Professor of Rural Land Economics',
          institutionType: 'Central University',
          orcid: '0000-0001-9182-3401',
          isGoogleVerified: true,
          is_starred: false,
          is_inspection_verified: true,
          inspection_notes: 'Longitudinal agricultural census researcher.',
          features_granted: ['author_research', 'upload_paper', 'export_raw'],
          status: 'active',
          registeredAt: '2026-01-28T13:00:00Z',
          lastActiveAt: '2026-03-07T14:10:00Z'
        },
        {
          id: 'usr-pub-01',
          dedicatedFixedId: 'BHU-PUB-1029-4481',
          email: 'ramesh.patel.fpo@gmail.com',
          name: 'Ramesh Patel',
          avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Ramesh%20Patel&backgroundColor=64748b',
          role: 'public',
          affiliation: 'Gauriganj Farmer Producer Organization (FPO)',
          designation: 'Secretary & Lead Smallholder Representative',
          institutionType: 'Civil Society / Agritech Cooperative',
          isGoogleVerified: true,
          is_starred: false,
          is_inspection_verified: true,
          inspection_notes: 'Verified grassroot agricultural stakeholder.',
          features_granted: ['view_public_data', 'export_summary'],
          status: 'active',
          registeredAt: '2026-02-01T08:00:00Z',
          lastActiveAt: '2026-03-12T02:30:00Z'
        },
        {
          id: 'usr-pub-02',
          dedicatedFixedId: 'BHU-PUB-5541-7712',
          email: 'meera.krishnan@civicdatalab.in',
          name: 'Meera Krishnan',
          avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Meera%20Krishnan&backgroundColor=475569',
          role: 'public',
          affiliation: 'Open Land Governance Initiative',
          designation: 'Community Data Analyst',
          institutionType: 'Civic Tech Foundation',
          isGoogleVerified: false,
          is_starred: false,
          is_inspection_verified: false,
          inspection_notes: 'Public open-data explorer.',
          features_granted: ['view_public_data'],
          status: 'active',
          registeredAt: '2026-02-18T10:45:00Z',
          lastActiveAt: '2026-03-05T17:00:00Z'
        },
        {
          id: 'usr-pub-03',
          dedicatedFixedId: 'BHU-PUB-8812-9901',
          email: 'alok.ranjan@gramsevak.org',
          name: 'Alok Ranjan',
          avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Alok%20Ranjan&backgroundColor=334155',
          role: 'public',
          affiliation: 'Gram Swaraj Panchayat Council',
          designation: 'Village Land Resource Monitor',
          institutionType: 'Rural Local Body',
          isGoogleVerified: true,
          is_starred: false,
          is_inspection_verified: true,
          inspection_notes: 'Gram Panchayat citizen observer.',
          features_granted: ['view_public_data', 'export_summary'],
          status: 'active',
          registeredAt: '2026-02-25T14:10:00Z',
          lastActiveAt: '2026-03-11T09:15:00Z'
        },
        {
          id: 'usr-ins-01',
          dedicatedFixedId: 'BHU-INS-0001-9999',
          email: 'devendra.jha@bhu-drishti.gov.in',
          name: 'Shri Devendra Nath Jha',
          avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Devendra%20Jha&backgroundColor=dc2626',
          role: 'inspector',
          affiliation: 'National Cadastral Inspection Directorate & Ombudsman',
          designation: 'Chief Inspector General of Land Records & Policy Governance',
          institutionType: 'Statutory Ombudsman & Inspectorate',
          isGoogleVerified: true,
          is_starred: true,
          is_inspection_verified: true,
          inspection_notes: 'Chief Cadastral Inspector with plenipotentiary oversight over all platform content, policies, research certifications, and role authorizations.',
          features_granted: ['all_access', 'publish_policy', 'upload_gazette', 'calibrate_area', 'author_research', 'ingest_data', 'export_raw', 'delete_content', 'ai_grounding', 'inspect_users', 'star_verify', 'reorder_content'],
          status: 'active',
          registeredAt: '2025-08-15T00:00:00Z',
          lastActiveAt: '2026-03-12T07:20:00Z'
        },
        {
          id: 'usr-ins-02',
          dedicatedFixedId: 'BHU-INS-0002-8888',
          email: 'sunita.rao@bhu-drishti.gov.in',
          name: 'Smt. Sunita Rao',
          avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Sunita%20Rao&backgroundColor=b91c1c',
          role: 'inspector',
          affiliation: 'National Cadastral Inspection Directorate & Ombudsman',
          designation: 'Joint Inspector of Geospatial Provenance',
          institutionType: 'Statutory Ombudsman & Inspectorate',
          isGoogleVerified: true,
          is_starred: true,
          is_inspection_verified: true,
          inspection_notes: 'Joint Inspector certifying cadastral research rigor and gazette parity.',
          features_granted: ['all_access', 'publish_policy', 'upload_gazette', 'calibrate_area', 'author_research', 'ingest_data', 'export_raw', 'delete_content', 'ai_grounding', 'inspect_users', 'star_verify', 'reorder_content'],
          status: 'active',
          registeredAt: '2025-09-01T00:00:00Z',
          lastActiveAt: '2026-03-12T05:50:00Z'
        }
      ];

      this.lastSyncTime = new Date().toISOString();
      console.log(`[Database] In-memory seed initialized (${this.states.length} states, ${this.districts.length} districts, ${this.records.length} records, ${this.datasets.length} datasets, ${this.users.length} registered users).`);
    } catch (err) {
      console.error('[Database] Failed to load JSON seed data:', err);
    }

    // 2. Initialize Supabase REST Client if credentials exist
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      try {
        console.log(`[Database] Initializing Supabase client for: ${supabaseUrl}`);
        this.supabase = createClient(supabaseUrl, supabaseKey, {
          auth: { persistSession: false }
        });
        await this.syncFromSupabase();
      } catch (err) {
        console.warn('[Database] Supabase client initialization error:', err);
      }
    }

    // 3. Initialize PostgreSQL Connection Pool if DATABASE_URL or DIRECT_URL is configured
    const dbUrl = process.env.DATABASE_URL || process.env.DIRECT_URL;
    if (dbUrl) {
      try {
        this.pgPool = new Pool({
          connectionString: dbUrl,
          ssl: dbUrl.includes('supabase') || dbUrl.includes('pooler') || process.env.NODE_ENV === 'production'
            ? { rejectUnauthorized: false }
            : undefined,
          connectionTimeoutMillis: 5000
        });
        await this.syncFromPostgresPool();
      } catch (err) {
        console.warn('[Database] PostgreSQL Pool connection notice:', err);
      }
    }

    // 4. Attempt Prisma fallback if configured
    try {
      this.prisma = await getPrismaClient();
      if (this.prisma) {
        this.isPostgresActive = true;
        await this.syncFromPostgres();
      }
    } catch (err) {
      console.warn('[Database] Prisma initialization error, continuing with in-memory store:', err);
    }
  }

  private async syncFromSupabase() {
    if (!this.supabase) return;
    try {
      const [
        { data: sStates, error: errStates },
        { data: sDistricts, error: errDistricts },
        { data: sRecords, error: errRecords },
        { data: sDatasets }
      ] = await Promise.all([
        this.supabase.from('states').select('*'),
        this.supabase.from('districts').select('*'),
        this.supabase.from('land_use_records').select('*').limit(2000),
        this.supabase.from('datasets').select('*')
      ]);

      if (errStates) {
        console.log('[Database] Supabase reachable. Tables need initialization or seeding:', errStates.message);
        this.supabaseConnected = true;
        this.supabaseNeedsSeeding = true;
        return;
      }

      this.supabaseConnected = true;
      this.supabaseNeedsSeeding = false;

      if (sStates && sStates.length > 0) {
        this.states = sStates.map((s: any) => ({
          state_code: s.state_code,
          state_name: s.state_name,
          capital: s.capital,
          total_area_sqkm: Number(s.total_area_sqkm),
          region: s.region,
          center_coords: [Number(s.center_lat || 0), Number(s.center_lng || 0)]
        }));
      }

      if (sDistricts && sDistricts.length > 0) {
        this.districts = sDistricts.map((d: any) => ({
          district_code: d.district_code,
          district_name: d.district_name,
          state_code: d.state_code,
          state_name: d.state_name,
          total_area_sqkm: Number(d.total_area_sqkm),
          center_coords: [Number(d.center_lat || 0), Number(d.center_lng || 0)]
        }));
      }

      if (sRecords && sRecords.length > 0) {
        this.records = sRecords.map((r: any) => ({
          ...r,
          year: Number(r.year),
          total_area_ha: Number(r.total_area_ha),
          agricultural_pct: Number(r.agricultural_pct),
          forest_pct: Number(r.forest_pct),
          builtup_pct: Number(r.builtup_pct),
          waterbodies_pct: Number(r.waterbodies_pct),
          barren_pct: Number(r.barren_pct),
          irrigated_pct: Number(r.irrigated_pct),
          degraded_pct: Number(r.degraded_pct),
          is_demo: Boolean(r.is_demo)
        }));
      }

      if (sDatasets && sDatasets.length > 0) {
        this.datasets = sDatasets;
      }

      this.lastSyncTime = new Date().toISOString();
      console.log(`[Database] Live Supabase cloud sync complete (${this.states.length} states, ${this.districts.length} districts, ${this.records.length} records).`);
    } catch (err: any) {
      console.warn('[Database] Supabase sync warning:', err?.message || err);
    }
  }

  private async syncFromPostgresPool() {
    if (!this.pgPool) return;
    try {
      const client = await this.pgPool.connect();
      try {
        const resStates = await client.query('SELECT * FROM states LIMIT 100');
        const resDistricts = await client.query('SELECT * FROM districts LIMIT 1000');
        const resRecords = await client.query('SELECT * FROM land_use_records LIMIT 3000');

        if (resStates.rows.length > 0) {
          this.states = resStates.rows.map((s: any) => ({
            state_code: s.state_code,
            state_name: s.state_name,
            capital: s.capital,
            total_area_sqkm: Number(s.total_area_sqkm),
            region: s.region,
            center_coords: [Number(s.center_lat || 0), Number(s.center_lng || 0)]
          }));
        }
        if (resDistricts.rows.length > 0) {
          this.districts = resDistricts.rows.map((d: any) => ({
            district_code: d.district_code,
            district_name: d.district_name,
            state_code: d.state_code,
            state_name: d.state_name,
            total_area_sqkm: Number(d.total_area_sqkm),
            center_coords: [Number(d.center_lat || 0), Number(d.center_lng || 0)]
          }));
        }
        if (resRecords.rows.length > 0) {
          this.records = resRecords.rows.map((r: any) => ({
            ...r,
            year: Number(r.year),
            total_area_ha: Number(r.total_area_ha),
            agricultural_pct: Number(r.agricultural_pct),
            forest_pct: Number(r.forest_pct),
            builtup_pct: Number(r.builtup_pct),
            waterbodies_pct: Number(r.waterbodies_pct),
            barren_pct: Number(r.barren_pct),
            irrigated_pct: Number(r.irrigated_pct),
            degraded_pct: Number(r.degraded_pct),
            is_demo: Boolean(r.is_demo)
          }));
        }
        this.pgPoolConnected = true;
        this.lastSyncTime = new Date().toISOString();
        console.log(`[Database] Live PostgreSQL pooler sync complete (${this.states.length} states, ${this.records.length} records).`);
      } finally {
        client.release();
      }
    } catch (err: any) {
      console.warn('[Database] PostgreSQL Pool sync notice:', err?.message || err);
    }
  }

  private async syncFromPostgres() {
    if (!this.prisma) return;
    try {
      const dbStates = await this.prisma.state.findMany();
      const dbDistricts = await this.prisma.district.findMany();
      const dbRecords = await this.prisma.landUseRecord.findMany();

      if (dbStates.length > 0) {
        this.states = dbStates.map((s: any) => ({
          state_code: s.state_code,
          state_name: s.state_name,
          capital: s.capital,
          total_area_sqkm: s.total_area_sqkm,
          region: s.region,
          center_coords: [s.center_lat, s.center_lng]
        }));
      }

      if (dbDistricts.length > 0) {
        this.districts = dbDistricts.map((d: any) => ({
          district_code: d.district_code,
          district_name: d.district_name,
          state_code: d.state_code,
          state_name: d.state_name,
          total_area_sqkm: d.total_area_sqkm,
          center_coords: [d.center_lat, d.center_lng]
        }));
      }

      if (dbRecords.length > 0) {
        this.records = dbRecords.map((r: any) => ({
          ...r,
          is_demo: Boolean(r.is_demo)
        }));
      }

      this.lastSyncTime = new Date().toISOString();
      console.log(`[Database] Successfully synced live state from PostgreSQL (${this.states.length} states, ${this.records.length} records).`);
    } catch (err) {
      console.warn('[Database] PostgreSQL sync warning:', err);
    }
  }

  public async seedSupabase(): Promise<{ success: boolean; message: string; details?: any }> {
    if (!this.supabase && !this.pgPool) {
      return {
        success: false,
        message: 'No Supabase or PostgreSQL credentials configured in environment variables (SUPABASE_URL or DATABASE_URL).'
      };
    }

    if (this.supabase) {
      try {
        console.log('[Database] Seeding Supabase cloud tables with official MoA&FW datasets...');
        
        // 1. States
        const statesToUpsert = this.states.map(s => ({
          state_code: s.state_code,
          state_name: s.state_name,
          capital: s.capital,
          total_area_sqkm: s.total_area_sqkm,
          region: s.region,
          center_lat: s.center_coords[0],
          center_lng: s.center_coords[1]
        }));
        await this.supabase.from('states').upsert(statesToUpsert, { onConflict: 'state_code' });

        // 2. Districts
        const districtsToUpsert = this.districts.map(d => ({
          district_code: d.district_code,
          district_name: d.district_name,
          state_code: d.state_code,
          state_name: d.state_name,
          total_area_sqkm: d.total_area_sqkm,
          center_lat: d.center_coords[0],
          center_lng: d.center_coords[1]
        }));
        await this.supabase.from('districts').upsert(districtsToUpsert, { onConflict: 'district_code' });

        // 3. Records in batches of 200
        for (let i = 0; i < this.records.length; i += 200) {
          const batch = this.records.slice(i, i + 200);
          await this.supabase.from('land_use_records').upsert(batch, { onConflict: 'id' });
        }

        // 4. Datasets
        if (this.datasets.length > 0) {
          await this.supabase.from('datasets').upsert(this.datasets, { onConflict: 'id' });
        }

        // 5. Policies
        if (this.policies.length > 0) {
          await this.supabase.from('policies').upsert(this.policies, { onConflict: 'id' });
        }

        // 6. Anomalies
        if (this.anomalies.length > 0) {
          await this.supabase.from('anomalies').upsert(this.anomalies, { onConflict: 'id' });
        }

        this.supabaseConnected = true;
        this.supabaseNeedsSeeding = false;
        this.lastSyncTime = new Date().toISOString();

        return {
          success: true,
          message: `Successfully seeded Supabase with ${this.states.length} states, ${this.districts.length} districts, and ${this.records.length} land-use records.`,
          details: {
            states: this.states.length,
            districts: this.districts.length,
            records: this.records.length,
            datasets: this.datasets.length
          }
        };
      } catch (err: any) {
        return {
          success: false,
          message: `Supabase seeding error: ${err.message}. If tables don't exist yet, run the SQL schema migration in Supabase SQL Editor.`
        };
      }
    }

    return {
      success: true,
      message: 'PostgreSQL connection active.'
    };
  }

  public getDatabaseStatus() {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const dbUrl = process.env.DATABASE_URL || process.env.DIRECT_URL;

    let provider = 'In-Memory High-Speed Cache';
    let isConnected = true;

    if (this.supabase && this.supabaseConnected) {
      provider = 'Supabase Cloud (REST & Realtime)';
    } else if (this.pgPoolConnected) {
      provider = 'Supabase / PostgreSQL Pooler (Direct)';
    } else if (this.isPostgresActive && isDbConnected()) {
      provider = 'PostgreSQL (Prisma ORM)';
    }

    return {
      type: provider,
      provider: this.supabaseConnected ? 'Supabase' : (this.pgPoolConnected || this.isPostgresActive ? 'PostgreSQL' : 'Local Seed Cache'),
      connected: isConnected,
      supabase_configured: Boolean(supabaseUrl),
      supabase_connected: this.supabaseConnected,
      supabase_needs_seeding: this.supabaseNeedsSeeding,
      supabase_url: supabaseUrl ? supabaseUrl.replace(/https?:\/\//, '').split('.')[0] + '.supabase.co' : null,
      postgres_configured: Boolean(dbUrl),
      postgres_connected: this.pgPoolConnected || isDbConnected(),
      last_sync: this.lastSyncTime,
      total_states: this.states.length,
      total_districts: this.districts.length,
      total_records: this.records.length,
      total_datasets: this.datasets.length,
      total_policies: this.policies.length,
      total_anomalies: this.anomalies.length
    };
  }

  public getStates(): State[] {
    return this.states;
  }

  public getStateByCode(code: string): State | undefined {
    return this.states.find(s => s.state_code.toLowerCase() === code.toLowerCase());
  }

  public getDistricts(stateCode?: string): District[] {
    if (!stateCode || stateCode === 'IN-ALL') return this.districts;
    return this.districts.filter(d => d.state_code.toLowerCase() === stateCode.toLowerCase());
  }

  public getDistrictByCode(code: string): District | undefined {
    return this.districts.find(d => d.district_code.toLowerCase() === code.toLowerCase());
  }

  public getLandUseRecords(filters: {
    state_code?: string;
    district_code?: string;
    year?: number;
    category?: string;
  } = {}): LandUseRecord[] {
    let result = [...this.records];
    if (filters.state_code && filters.state_code !== 'IN-ALL') {
      result = result.filter(r => r.state_code.toLowerCase() === filters.state_code!.toLowerCase());
    }
    if (filters.district_code && filters.district_code !== 'ALL') {
      result = result.filter(r => r.district_code && r.district_code.toLowerCase() === filters.district_code!.toLowerCase());
    }
    if (filters.year) {
      result = result.filter(r => r.year === Number(filters.year));
    }
    return result;
  }

  public getDatasets(search?: string, category?: string): Dataset[] {
    let result = [...this.datasets];
    if (category && category !== 'All') {
      result = result.filter(d => d.category.toLowerCase() === category.toLowerCase());
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(d =>
        d.title.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q) ||
        d.publisher.toLowerCase().includes(q) ||
        d.coverage.toLowerCase().includes(q)
      );
    }
    return result;
  }

  public getDatasetById(id: string): Dataset | undefined {
    return this.datasets.find(d => d.id.toLowerCase() === id.toLowerCase());
  }

  public getDataSources(): DataSource[] {
    return this.dataSources;
  }

  public syncDataSource(id: string): DataSource | undefined {
    const src = this.dataSources.find(s => s.id === id);
    if (src) {
      src.status = 'Connected';
      src.last_synced = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' IST';
      this.logAudit('SYNC_DATA_SOURCE', 'Admin', { source_id: id, records_now: src.records_imported });

      if (this.prisma) {
        this.prisma.dataSource.update({
          where: { id },
          data: {
            status: src.status,
            last_synced: src.last_synced,
            records_imported: src.records_imported
          }
        }).catch((e: any) => console.warn('[Prisma] Async DataSource update warning:', e));
      }
    }
    return src;
  }

  public getPolicies(stateCode?: string, districtCode?: string, includeHidden: boolean = false): Policy[] {
    let list = [...this.policies];
    if (!includeHidden) {
      list = list.filter(p => !p.is_hidden);
    }
    if (stateCode && stateCode !== 'IN-ALL') {
      const sc = stateCode.toLowerCase();
      list = list.map(p => {
        const areaTarget = p.area_targets?.find(at => at.state_code.toLowerCase() === sc && (!districtCode || districtCode === 'ALL' || at.district_code?.toLowerCase() === districtCode.toLowerCase()));
        return areaTarget ? { ...p, current_area_target: areaTarget } : p;
      });
    }

    // Sort by priority order, then starred
    list.sort((a, b) => {
      const orderA = a.priority_order !== undefined ? a.priority_order : 999;
      const orderB = b.priority_order !== undefined ? b.priority_order : 999;
      if (orderA !== orderB) return orderA - orderB;
      return (b.is_starred ? 1 : 0) - (a.is_starred ? 1 : 0);
    });

    return list;
  }

  public getPolicyById(id: string): Policy | undefined {
    return this.policies.find(p => p.id.toLowerCase() === id.toLowerCase() || p.acronym.toLowerCase() === id.toLowerCase());
  }

  public addPolicy(policy: Policy): Policy {
    const existingIndex = this.policies.findIndex(p => p.id === policy.id);
    if (existingIndex >= 0) {
      this.policies[existingIndex] = { ...this.policies[existingIndex], ...policy };
    } else {
      this.policies.unshift(policy);
    }
    this.logAudit('ADD_POLICY', policy.policyMakerName || 'PolicyMaker', {
      id: policy.id,
      name: policy.name,
      acronym: policy.acronym
    });

    if (this.supabase) {
      this.supabase.from('policies').upsert([policy], { onConflict: 'id' }).then(({ error }) => {
        if (error) console.warn('[Supabase] Policy save warning:', error.message);
      });
    }
    return policy;
  }

  public updatePolicy(id: string, updates: Partial<Policy>): Policy | undefined {
    const policy = this.getPolicyById(id);
    if (!policy) return undefined;
    Object.assign(policy, updates, { is_user_modified: true });

    this.logAudit('UPDATE_POLICY', updates.policyMakerName || 'PolicyMaker', {
      id: policy.id,
      updated_fields: Object.keys(updates)
    });

    if (this.supabase) {
      this.supabase.from('policies').update(updates).eq('id', policy.id).then(({ error }) => {
        if (error) console.warn('[Supabase] Policy update warning:', error.message);
      });
    }
    return policy;
  }

  public updatePolicyArea(id: string, areaTarget: AreaTarget): Policy | undefined {
    const policy = this.getPolicyById(id);
    if (!policy) return undefined;

    if (!policy.area_targets) {
      policy.area_targets = [];
    }

    const existingIdx = policy.area_targets.findIndex(
      at => at.state_code.toLowerCase() === areaTarget.state_code.toLowerCase() &&
            (at.district_code || '').toLowerCase() === (areaTarget.district_code || '').toLowerCase()
    );

    const now = new Date().toISOString();
    const cleanTarget: AreaTarget = {
      ...areaTarget,
      id: areaTarget.id || `AREA-${Date.now().toString(36).toUpperCase()}`,
      last_updated: now,
      updated_by: areaTarget.updated_by || 'Policy Maker'
    };

    if (existingIdx >= 0) {
      policy.area_targets[existingIdx] = cleanTarget;
    } else {
      policy.area_targets.push(cleanTarget);
    }

    policy.current_area_target = cleanTarget;
    policy.is_user_modified = true;
    policy.status = 'Under Revision';

    this.logAudit('UPDATE_POLICY_AREA', areaTarget.updated_by || 'PolicyMaker', {
      policy_id: policy.id,
      state: areaTarget.state_name,
      district: areaTarget.district_name || 'All Districts',
      budget: areaTarget.regional_budget_cr
    });

    if (this.supabase) {
      this.supabase.from('policies').update({
        area_targets: policy.area_targets,
        is_user_modified: true,
        status: policy.status
      }).eq('id', policy.id).then(({ error }) => {
        if (error) console.warn('[Supabase] Policy area target update warning:', error.message);
      });
    }

    return policy;
  }

  public deletePolicy(id: string): boolean {
    const idx = this.policies.findIndex(p => p.id === id);
    if (idx >= 0) {
      this.policies.splice(idx, 1);
      this.logAudit('DELETE_POLICY', 'PolicyMaker', { id });
      return true;
    }
    return false;
  }

  public getResearchPapers(search?: string, tag?: string, includeHidden: boolean = false): ResearchPaper[] {
    let result = [...this.research];
    if (!includeHidden) {
      result = result.filter(p => !p.is_hidden);
    }
    if (tag && tag !== 'All') {
      result = result.filter(p => p.tags.some(t => t.toLowerCase() === tag.toLowerCase()));
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.abstract.toLowerCase().includes(q) ||
        p.authors.some(a => a.toLowerCase().includes(q)) ||
        p.geography.toLowerCase().includes(q)
      );
    }

    // Sort by priority order, then starred
    result.sort((a, b) => {
      const orderA = a.priority_order !== undefined ? a.priority_order : 999;
      const orderB = b.priority_order !== undefined ? b.priority_order : 999;
      if (orderA !== orderB) return orderA - orderB;
      return (b.is_starred ? 1 : 0) - (a.is_starred ? 1 : 0);
    });

    return result;
  }

  public getResearchPaperById(id: string): ResearchPaper | undefined {
    return this.research.find(p => p.id.toLowerCase() === id.toLowerCase());
  }

  public addResearchPaper(paper: ResearchPaper): ResearchPaper {
    const existingIndex = this.research.findIndex(p => p.id === paper.id);
    if (existingIndex >= 0) {
      this.research[existingIndex] = paper;
    } else {
      this.research.unshift(paper);
    }
    this.logAudit('ADD_RESEARCH_PAPER', paper.authors[0] || 'Researcher', {
      id: paper.id,
      title: paper.title,
      dedicatedResearcherId: paper.dedicatedResearcherId
    });

    if (this.supabase) {
      this.supabase.from('research').upsert([paper], { onConflict: 'id' }).then(({ error }) => {
        if (error) console.warn('[Supabase] Research paper save warning:', error.message);
      });
    }

    return paper;
  }

  // === Inspection & Ombudsman Directorate Methods ===

  public getUsers(): UserRegistryRecord[] {
    return this.users;
  }

  public getUserById(id: string): UserRegistryRecord | undefined {
    return this.users.find(u => u.id === id || u.dedicatedFixedId === id || u.email.toLowerCase() === id.toLowerCase());
  }

  public getInspectionStats(): InspectionStats {
    const total_registered = this.users.length;
    const policymaker_count = this.users.filter(u => u.role === 'policymaker').length;
    const administrator_count = this.users.filter(u => u.role === 'admin').length;
    const public_count = this.users.filter(u => u.role === 'public').length;
    const researcher_count = this.users.filter(u => u.role === 'researcher').length;
    const inspector_count = this.users.filter(u => u.role === 'inspector').length;

    const total_policies = this.policies.length;
    const verified_policies_count = this.policies.filter(p => p.is_inspection_verified).length;
    const starred_policies_count = this.policies.filter(p => p.is_starred).length;

    const total_research = this.research.length;
    const verified_research_count = this.research.filter(r => r.is_inspection_verified).length;
    const starred_research_count = this.research.filter(r => r.is_starred).length;

    const verified_researchers_count = this.users.filter(u => u.role === 'researcher' && u.is_inspection_verified).length;

    return {
      total_registered,
      policymaker_count,
      administrator_count,
      public_count,
      researcher_count,
      inspector_count,
      total_policies,
      verified_policies_count,
      starred_policies_count,
      total_research,
      verified_research_count,
      starred_research_count,
      verified_researchers_count
    };
  }

  public updateUserRole(id: string, newRole: 'public' | 'researcher' | 'policymaker' | 'admin' | 'inspector'): UserRegistryRecord | undefined {
    const user = this.getUserById(id);
    if (!user) return undefined;
    const prevRole = user.role;
    user.role = newRole;
    user.lastActiveAt = new Date().toISOString();
    this.logAudit('CHANGE_USER_ROLE', 'ChiefInspector', { id, prevRole, newRole });
    return user;
  }

  public updateUserFeatures(id: string, features_granted: string[]): UserRegistryRecord | undefined {
    const user = this.getUserById(id);
    if (!user) return undefined;
    user.features_granted = features_granted;
    user.lastActiveAt = new Date().toISOString();
    this.logAudit('UPDATE_USER_FEATURES', 'ChiefInspector', { id, features_granted });
    return user;
  }

  public toggleUserStar(id: string, is_starred?: boolean, is_inspection_verified?: boolean, inspection_notes?: string): UserRegistryRecord | undefined {
    const user = this.getUserById(id);
    if (!user) return undefined;
    if (typeof is_starred === 'boolean') user.is_starred = is_starred;
    if (typeof is_inspection_verified === 'boolean') user.is_inspection_verified = is_inspection_verified;
    if (inspection_notes !== undefined) user.inspection_notes = inspection_notes;
    user.lastActiveAt = new Date().toISOString();
    this.logAudit('STAR_VERIFY_USER', 'ChiefInspector', {
      id,
      is_starred: user.is_starred,
      is_inspection_verified: user.is_inspection_verified
    });
    return user;
  }

  public deleteUser(id: string): boolean {
    const idx = this.users.findIndex(u => u.id === id || u.dedicatedFixedId === id);
    if (idx >= 0) {
      const removed = this.users.splice(idx, 1)[0];
      this.logAudit('DELETE_USER', 'ChiefInspector', { id: removed.id, email: removed.email });
      return true;
    }
    return false;
  }

  public inspectPolicy(id: string, updates: {
    is_starred?: boolean;
    is_inspection_verified?: boolean;
    is_hidden?: boolean;
    priority_order?: number;
    inspection_notes?: string;
    inspected_by?: string;
  }): Policy | undefined {
    const policy = this.getPolicyById(id);
    if (!policy) return undefined;
    if (typeof updates.is_starred === 'boolean') policy.is_starred = updates.is_starred;
    if (typeof updates.is_inspection_verified === 'boolean') policy.is_inspection_verified = updates.is_inspection_verified;
    if (typeof updates.is_hidden === 'boolean') policy.is_hidden = updates.is_hidden;
    if (typeof updates.priority_order === 'number') policy.priority_order = updates.priority_order;
    if (updates.inspection_notes !== undefined) policy.inspection_notes = updates.inspection_notes;
    policy.inspected_by = updates.inspected_by || 'Chief Inspector';
    policy.inspected_at = new Date().toISOString();

    this.logAudit('INSPECT_POLICY', policy.inspected_by, {
      id: policy.id,
      is_starred: policy.is_starred,
      is_inspection_verified: policy.is_inspection_verified,
      is_hidden: policy.is_hidden,
      priority_order: policy.priority_order
    });
    return policy;
  }

  public reorderPolicies(orderedIds: string[]): Policy[] {
    orderedIds.forEach((id, index) => {
      const policy = this.getPolicyById(id);
      if (policy) {
        policy.priority_order = index + 1;
      }
    });
    this.policies.sort((a, b) => (a.priority_order || 999) - (b.priority_order || 999));
    this.logAudit('REORDER_POLICIES', 'ChiefInspector', { order: orderedIds });
    return this.policies;
  }

  public inspectResearch(id: string, updates: {
    is_starred?: boolean;
    is_inspection_verified?: boolean;
    is_hidden?: boolean;
    priority_order?: number;
    inspection_notes?: string;
    inspected_by?: string;
  }): ResearchPaper | undefined {
    const paper = this.getResearchPaperById(id);
    if (!paper) return undefined;
    if (typeof updates.is_starred === 'boolean') paper.is_starred = updates.is_starred;
    if (typeof updates.is_inspection_verified === 'boolean') paper.is_inspection_verified = updates.is_inspection_verified;
    if (typeof updates.is_hidden === 'boolean') paper.is_hidden = updates.is_hidden;
    if (typeof updates.priority_order === 'number') paper.priority_order = updates.priority_order;
    if (updates.inspection_notes !== undefined) paper.inspection_notes = updates.inspection_notes;
    paper.inspected_by = updates.inspected_by || 'Chief Inspector';
    paper.inspected_at = new Date().toISOString();

    this.logAudit('INSPECT_RESEARCH', paper.inspected_by, {
      id: paper.id,
      is_starred: paper.is_starred,
      is_inspection_verified: paper.is_inspection_verified,
      is_hidden: paper.is_hidden,
      priority_order: paper.priority_order
    });
    return paper;
  }

  public reorderResearch(orderedIds: string[]): ResearchPaper[] {
    orderedIds.forEach((id, index) => {
      const paper = this.getResearchPaperById(id);
      if (paper) {
        paper.priority_order = index + 1;
      }
    });
    this.research.sort((a, b) => (a.priority_order || 999) - (b.priority_order || 999));
    this.logAudit('REORDER_RESEARCH', 'ChiefInspector', { order: orderedIds });
    return this.research;
  }

  public deleteResearchPaper(id: string): boolean {
    const idx = this.research.findIndex(r => r.id === id);
    if (idx >= 0) {
      const removed = this.research.splice(idx, 1)[0];
      this.logAudit('DELETE_RESEARCH', 'ChiefInspector', { id: removed.id, title: removed.title });
      return true;
    }
    return false;
  }

  public getAnomalies(stateCode?: string): Anomaly[] {
    if (!stateCode || stateCode === 'IN-ALL') return this.anomalies;
    return this.anomalies.filter(a => a.state_code.toLowerCase() === stateCode.toLowerCase());
  }

  public addUploadedDataset(dataset: Dataset, records: LandUseRecord[]): void {
    this.datasets.unshift(dataset);
    this.records.push(...records);
    this.logAudit('UPLOAD_DATASET', 'Admin', { dataset_id: dataset.id, records_count: records.length });

    // Persist to Supabase if connected
    if (this.supabase) {
      this.supabase.from('datasets').insert([dataset]).then(({ error }) => {
        if (error) console.warn('[Supabase] Dataset persist warning:', error.message);
      });
      for (let i = 0; i < records.length; i += 200) {
        const batch = records.slice(i, i + 200);
        this.supabase.from('land_use_records').insert(batch).then(({ error }) => {
          if (error) console.warn('[Supabase] Records persist warning:', error.message);
        });
      }
    }

    if (this.prisma) {
      this.prisma.dataset.create({
        data: {
          id: dataset.id,
          title: dataset.title,
          publisher: dataset.publisher,
          description: dataset.description,
          category: dataset.category,
          coverage: dataset.coverage,
          date_range: dataset.date_range,
          last_updated: dataset.last_updated,
          format: dataset.format,
          update_frequency: dataset.update_frequency,
          source_url: dataset.source_url,
          license: dataset.license,
          data_quality: dataset.data_quality as any,
          sample_rows: dataset.sample_rows as any
        }
      }).catch((e: any) => console.warn('[Prisma] Async Dataset upload persist warning:', e));
    }
  }

  public logAIQuery(query: string, intent: any, response: any): void {
    const entry = {
      id: 'QRY-' + Date.now(),
      query,
      intent,
      responseSummary: response.summary,
      timestamp: new Date().toISOString()
    };
    this.aiQueries.unshift(entry);
    if (this.aiQueries.length > 50) this.aiQueries.pop();
  }

  public getRecentAIQueries(): any[] {
    return this.aiQueries;
  }

  public logAudit(action: string, actor: string, details: any): void {
    const entry = {
      id: 'AUD-' + Date.now(),
      action,
      actor,
      timestamp: new Date().toISOString(),
      details
    };
    this.auditLogs.unshift(entry);
  }

  public getAuditLogs(): any[] {
    return this.auditLogs;
  }
}

export const db = new Database();
