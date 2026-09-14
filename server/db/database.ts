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

const obsoleteIdentityFields = [
  ['dedicated', 'Fixed', 'Id'].join(''),
  ['dedicated', 'Researcher', 'Id'].join(''),
  ['policy', 'Maker', 'Id'].join('')
];

function stripObsoleteIdentityFields<T>(value: T): T {
  if (!value || typeof value !== 'object') return value;
  const cleaned = { ...(value as Record<string, unknown>) };
  obsoleteIdentityFields.forEach(field => delete cleaned[field]);
  return cleaned as T;
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
  private contentStoreReady: boolean = false;
  private fileStoreReady: boolean = false;
  private seedRecordIds = new Set<string>();
  private seedDatasetIds = new Set<string>();
  private seedPolicyIds = new Set<string>();
  private seedResearchIds = new Set<string>();
  private dashboardBannerSlides: any[] | undefined;
  private lastSyncTime: string | null = null;
  private ready: Promise<void>;

  constructor() {
    this.ready = this.init();
  }

  public async waitUntilReady(): Promise<void> {
    await this.ready;
  }

  private async init() {
    // 1. Always load verified JSON seed data for instant zero-latency boot & offline reliability
    try {
      this.states = loadJson<State[]>('states.json');
      this.districts = loadJson<District[]>('districts.json');
      this.records = loadJson<LandUseRecord[]>('records.json');
      this.datasets = loadJson<Dataset[]>('datasets.json');
      this.dataSources = loadJson<DataSource[]>('datasources.json');
      this.policies = loadJson<Policy[]>('policies.json').map(stripObsoleteIdentityFields);
      this.research = loadJson<ResearchPaper[]>('research.json').map(stripObsoleteIdentityFields);
      this.anomalies = loadJson<Anomaly[]>('anomalies.json');

      // Bundled JSON is useful for prototype pages, but it must never be presented
      // as live dashboard evidence. Track it explicitly so dashboard metrics include
      // only data added through the connected production database.
      this.seedRecordIds = new Set(this.records.map(record => record.id));
      this.seedDatasetIds = new Set(this.datasets.map(dataset => dataset.id));
      this.seedPolicyIds = new Set(this.policies.map(policy => policy.id));
      this.seedResearchIds = new Set(this.research.map(paper => paper.id));
      this.records = this.records.map(record => ({ ...record, is_demo: true }));

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

    // Prisma/reference-table synchronization must never be allowed to overwrite
    // user-uploaded policies and research loaded from the durable content store.
    await this.refreshPersistentContent();
  }

  private async syncFromSupabase() {
    if (!this.supabase) return;
    try {
      const [
        { data: sStates, error: errStates },
        { data: sDistricts, error: errDistricts },
        { data: sRecords, error: errRecords },
        { data: sDatasets, error: errDatasets },
        { data: sContent, error: errContent }
      ] = await Promise.all([
        this.supabase.from('states').select('*'),
        this.supabase.from('districts').select('*'),
        this.supabase.from('land_use_records').select('*').limit(2000),
        this.supabase.from('datasets').select('*'),
        this.supabase.from('bhu_content_store').select('content_type, content_id, payload, deleted')
      ]);

      this.supabaseConnected = true;
      this.supabaseNeedsSeeding = Boolean(errStates || errDistricts || errRecords || errDatasets);

      if (errStates) console.warn('[Database] Supabase states sync warning:', errStates.message);
      if (errDistricts) console.warn('[Database] Supabase districts sync warning:', errDistricts.message);
      if (errRecords) console.warn('[Database] Supabase land records sync warning:', errRecords.message);
      if (errDatasets) console.warn('[Database] Supabase datasets sync warning:', errDatasets.message);

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
          is_demo: this.seedRecordIds.has(r.id) || Boolean(r.is_demo)
        }));
      }

      if (sDatasets && sDatasets.length > 0) {
        this.datasets = sDatasets;
      }

      if (!errContent && sContent) {
        this.mergePersistentContent(sContent);
        this.contentStoreReady = true;
      } else if (errContent) {
        console.warn('[Database] Supabase persistent content sync warning:', errContent.message);
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
        await this.ensureContentStore(client);
        await this.ensureFileStore(client);
        const resContent = await client.query(
          'SELECT content_type, content_id, payload, deleted FROM bhu_content_store ORDER BY updated_at ASC'
        );
        this.mergePersistentContent(resContent.rows);
        this.pgPoolConnected = true;

        const [resStates, resDistricts, resRecords] = await Promise.all([
          client.query('SELECT * FROM states LIMIT 100').catch((error: any) => {
            console.warn('[Database] PostgreSQL states sync warning:', error?.message || error);
            return { rows: [] };
          }),
          client.query('SELECT * FROM districts LIMIT 1000').catch((error: any) => {
            console.warn('[Database] PostgreSQL districts sync warning:', error?.message || error);
            return { rows: [] };
          }),
          client.query('SELECT * FROM land_use_records LIMIT 3000').catch((error: any) => {
            console.warn('[Database] PostgreSQL land records sync warning:', error?.message || error);
            return { rows: [] };
          })
        ]);

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
            is_demo: this.seedRecordIds.has(r.id) || Boolean(r.is_demo)
          }));
        }
        this.lastSyncTime = new Date().toISOString();
        console.log(`[Database] Live PostgreSQL pooler sync complete (${this.states.length} states, ${this.records.length} records).`);
      } finally {
        client.release();
      }
    } catch (err: any) {
      console.warn('[Database] PostgreSQL Pool sync notice:', err?.message || err);
    }
  }

  private async ensureContentStore(queryable: any = this.pgPool): Promise<void> {
    if (!queryable) {
      throw new Error('PostgreSQL is not configured.');
    }

    await queryable.query(`
      CREATE TABLE IF NOT EXISTS bhu_content_store (
        content_type TEXT NOT NULL,
        content_id TEXT NOT NULL,
        payload JSONB NOT NULL DEFAULT '{}'::jsonb,
        deleted BOOLEAN NOT NULL DEFAULT FALSE,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (content_type, content_id)
      )
    `);
    await queryable.query(`
      ALTER TABLE bhu_content_store
      DROP CONSTRAINT IF EXISTS bhu_content_store_content_type_check
    `);
    await queryable.query(`
      ALTER TABLE bhu_content_store
      ADD CONSTRAINT bhu_content_store_content_type_check
      CHECK (content_type IN ('policy', 'research', 'user'))
    `);
    this.contentStoreReady = true;
  }

  private async ensureFileStore(queryable: any = this.pgPool): Promise<void> {
    if (!queryable) {
      throw new Error('PostgreSQL is not configured.');
    }

    await queryable.query(`
      CREATE TABLE IF NOT EXISTS bhu_file_store (
        owner_type TEXT NOT NULL CHECK (owner_type IN ('policy', 'research')),
        owner_id TEXT NOT NULL,
        file_name TEXT NOT NULL,
        mime_type TEXT NOT NULL DEFAULT 'application/octet-stream',
        file_size BIGINT NOT NULL DEFAULT 0,
        file_data TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (owner_type, owner_id)
      )
    `);
    this.fileStoreReady = true;
  }

  private mergePersistentContent(rows: any[]): void {
    for (const row of rows) {
      if (row.content_type !== 'policy' && row.content_type !== 'research' && row.content_type !== 'user') continue;

      const collection: any[] = row.content_type === 'policy'
        ? this.policies
        : row.content_type === 'research'
          ? this.research
          : this.users;
      const index = collection.findIndex(item => item.id === row.content_id);

      if (row.deleted) {
        if (index >= 0) collection.splice(index, 1);
        continue;
      }

      let payload = row.payload;
      if (typeof payload === 'string') {
        try {
          payload = JSON.parse(payload);
        } catch {
          continue;
        }
      }
      if (!payload || typeof payload !== 'object') continue;

      const persistedItem = stripObsoleteIdentityFields({ ...payload, id: payload.id || row.content_id });
      if (index >= 0) {
        collection[index] = persistedItem;
      } else {
        collection.unshift(persistedItem);
      }
    }
  }

  public async refreshPersistentContent(): Promise<void> {
    if (this.pgPool) {
      try {
        if (!this.contentStoreReady) await this.ensureContentStore();
        const result = await this.pgPool.query(
          'SELECT content_type, content_id, payload, deleted FROM bhu_content_store ORDER BY updated_at ASC'
        );
        this.mergePersistentContent(result.rows);
        this.pgPoolConnected = true;
        this.lastSyncTime = new Date().toISOString();
        return;
      } catch (error: any) {
        console.warn('[Database] PostgreSQL persistent content refresh warning:', error?.message || error);
      }
    }

    if (this.supabase && this.supabaseConnected) {
      try {
        const { data, error } = await this.supabase
          .from('bhu_content_store')
          .select('content_type, content_id, payload, deleted')
          .order('updated_at', { ascending: true });
        if (error) throw error;
        this.mergePersistentContent(data || []);
        this.contentStoreReady = true;
        this.lastSyncTime = new Date().toISOString();
      } catch (error: any) {
        console.warn('[Database] Supabase persistent content refresh warning:', error?.message || error);
      }
    }
  }

  private async persistContent(
    contentType: 'policy' | 'research' | 'user',
    contentId: string,
    payload: Policy | ResearchPaper | UserRegistryRecord,
    deleted: boolean = false
  ): Promise<void> {
    await this.ready;
    const cleanPayload = stripObsoleteIdentityFields(payload);

    if (this.pgPool) {
      if (!this.contentStoreReady) await this.ensureContentStore();
      await this.pgPool.query(
        `INSERT INTO bhu_content_store (content_type, content_id, payload, deleted, updated_at)
         VALUES ($1, $2, $3::jsonb, $4, NOW())
         ON CONFLICT (content_type, content_id)
         DO UPDATE SET payload = EXCLUDED.payload, deleted = EXCLUDED.deleted, updated_at = NOW()`,
        [contentType, contentId, JSON.stringify(cleanPayload), deleted]
      );
      this.pgPoolConnected = true;
      this.lastSyncTime = new Date().toISOString();
      return;
    }

    if (this.supabase && this.supabaseConnected) {
      const { error } = await this.supabase.from('bhu_content_store').upsert({
        content_type: contentType,
        content_id: contentId,
        payload: cleanPayload,
        deleted,
        updated_at: new Date().toISOString()
      }, { onConflict: 'content_type,content_id' });
      if (error) throw new Error(`Persistent content save failed: ${error.message}`);
      this.contentStoreReady = true;
      this.lastSyncTime = new Date().toISOString();
      return;
    }

    throw new Error('Persistent database is unavailable. Your change was not saved.');
  }

  public async saveFileAttachment(
    ownerType: 'policy' | 'research',
    ownerId: string,
    file: { name: string; type: string; size: number; dataBase64: string }
  ): Promise<void> {
    await this.ready;

    const row = {
      owner_type: ownerType,
      owner_id: ownerId,
      file_name: file.name,
      mime_type: file.type || 'application/octet-stream',
      file_size: file.size,
      file_data: file.dataBase64,
      updated_at: new Date().toISOString()
    };

    if (this.pgPool) {
      if (!this.fileStoreReady) await this.ensureFileStore();
      await this.pgPool.query(
        `INSERT INTO bhu_file_store
          (owner_type, owner_id, file_name, mime_type, file_size, file_data, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         ON CONFLICT (owner_type, owner_id)
         DO UPDATE SET
           file_name = EXCLUDED.file_name,
           mime_type = EXCLUDED.mime_type,
           file_size = EXCLUDED.file_size,
           file_data = EXCLUDED.file_data,
           updated_at = NOW()`,
        [ownerType, ownerId, file.name, row.mime_type, file.size, file.dataBase64]
      );
      this.fileStoreReady = true;
      return;
    }

    if (this.supabase && this.supabaseConnected) {
      const { error } = await this.supabase
        .from('bhu_file_store')
        .upsert(row, { onConflict: 'owner_type,owner_id' });
      if (error) throw new Error(`File save failed: ${error.message}`);
      this.fileStoreReady = true;
      return;
    }

    throw new Error('Persistent file storage is unavailable. The document was not saved.');
  }

  public async getFileAttachment(
    ownerType: 'policy' | 'research',
    ownerId: string
  ): Promise<{ name: string; type: string; size: number; dataBase64: string } | null> {
    await this.ready;

    if (this.pgPool) {
      if (!this.fileStoreReady) await this.ensureFileStore();
      const result = await this.pgPool.query(
        `SELECT file_name, mime_type, file_size, file_data
         FROM bhu_file_store
         WHERE owner_type = $1 AND owner_id = $2
         LIMIT 1`,
        [ownerType, ownerId]
      );
      const row = result.rows[0];
      if (!row) return null;
      return {
        name: row.file_name,
        type: row.mime_type,
        size: Number(row.file_size),
        dataBase64: row.file_data
      };
    }

    if (this.supabase && this.supabaseConnected) {
      const { data, error } = await this.supabase
        .from('bhu_file_store')
        .select('file_name, mime_type, file_size, file_data')
        .eq('owner_type', ownerType)
        .eq('owner_id', ownerId)
        .maybeSingle();
      if (error) throw new Error(`File lookup failed: ${error.message}`);
      if (!data) return null;
      return {
        name: data.file_name,
        type: data.mime_type,
        size: Number(data.file_size),
        dataBase64: data.file_data
      };
    }

    return null;
  }

  public async deleteFileAttachment(ownerType: 'policy' | 'research', ownerId: string): Promise<void> {
    await this.ready;

    if (this.pgPool) {
      if (!this.fileStoreReady) await this.ensureFileStore();
      await this.pgPool.query(
        'DELETE FROM bhu_file_store WHERE owner_type = $1 AND owner_id = $2',
        [ownerType, ownerId]
      );
      return;
    }

    if (this.supabase && this.supabaseConnected) {
      const { error } = await this.supabase
        .from('bhu_file_store')
        .delete()
        .eq('owner_type', ownerType)
        .eq('owner_id', ownerId);
      if (error) throw new Error(`File deletion failed: ${error.message}`);
    }
  }

  private async syncFromPostgres() {
    if (!this.prisma) return;
    try {
      const [dbStates, dbDistricts, dbRecords, dbDatasets, dbDataSources, dbPolicies, dbResearch, dbAnomalies] = await Promise.all([
        this.prisma.state.findMany().catch(() => []),
        this.prisma.district.findMany().catch(() => []),
        this.prisma.landUseRecord.findMany().catch(() => []),
        this.prisma.dataset.findMany().catch(() => []),
        this.prisma.dataSource.findMany().catch(() => []),
        this.prisma.policy.findMany().catch(() => []),
        this.prisma.researchPaper.findMany().catch(() => []),
        this.prisma.anomaly.findMany().catch(() => [])
      ]);

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
          is_demo: this.seedRecordIds.has(r.id) || Boolean(r.is_demo)
        }));
      }

      if (dbDatasets.length > 0) {
        this.datasets = dbDatasets;
      }

      if (dbDataSources.length > 0) {
        this.dataSources = dbDataSources;
      }

      if (dbPolicies.length > 0) {
        this.policies = dbPolicies.map(stripObsoleteIdentityFields);
      }

      if (dbResearch.length > 0) {
        this.research = dbResearch.map(stripObsoleteIdentityFields);
      }

      if (dbAnomalies.length > 0) {
        this.anomalies = dbAnomalies;
      }

      this.lastSyncTime = new Date().toISOString();
      console.log(`[Database] Successfully synced live state from PostgreSQL (${this.states.length} states, ${this.districts.length} districts, ${this.records.length} records, ${this.datasets.length} datasets).`);
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
      content_store_connected: this.contentStoreReady,
      file_store_connected: this.fileStoreReady,
      last_sync: this.lastSyncTime,
      total_states: this.states.length,
      total_districts: this.districts.length,
      total_records: this.records.length,
      total_datasets: this.datasets.length,
      total_policies: this.policies.length,
      total_research: this.research.length,
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

  public updateLandUseRecord(id: string, updates: Partial<LandUseRecord>): LandUseRecord | undefined {
    const record = this.records.find(r => r.id === id);
    if (!record) return undefined;
    Object.assign(record, updates);
    this.logAudit('OVERRIDE_LAND_USE_RECORD', 'Inspection Directorate', { record_id: id, updates });
    return record;
  }

  public updateLandUseRecordByLocation(
    stateCode: string,
    districtCode: string | undefined,
    year: number,
    updates: Partial<LandUseRecord>
  ): LandUseRecord {
    const normDist = districtCode && districtCode !== 'ALL' ? districtCode.toLowerCase() : undefined;
    let record = this.records.find(r =>
      r.state_code.toLowerCase() === stateCode.toLowerCase() &&
      (normDist ? (r.district_code?.toLowerCase() === normDist) : (!r.district_code || r.district_code === 'ALL')) &&
      r.year === year
    );

    if (!record) {
      const template = this.records.find(r => r.state_code.toLowerCase() === stateCode.toLowerCase()) || this.records[0];
      record = {
        ...template,
        id: `REC-${stateCode}-${normDist || 'STATE'}-${year}-${Date.now()}`,
        state_code: stateCode,
        district_code: normDist,
        year,
        ...updates
      };
      this.records.unshift(record);
    } else {
      Object.assign(record, updates);
    }

    this.logAudit('OVERRIDE_LAND_USE_DATA', 'Inspection Directorate', { stateCode, districtCode, year, updates });
    return record;
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
        const stateTargets = (p.area_targets || [])
          .filter(at => at.state_code.toLowerCase() === sc)
          .sort((a, b) => new Date(b.last_updated || 0).getTime() - new Date(a.last_updated || 0).getTime());

        const requestedDistrict = districtCode && districtCode !== 'ALL'
          ? districtCode.toLowerCase()
          : null;
        const areaTarget = requestedDistrict
          ? stateTargets.find(at => at.district_code?.toLowerCase() === requestedDistrict) ||
            stateTargets.find(at => !at.district_code)
          : stateTargets[0];
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

  public async addPolicy(policy: Policy): Promise<Policy> {
    const cleanPolicy = stripObsoleteIdentityFields(policy);
    await this.persistContent('policy', cleanPolicy.id, cleanPolicy);
    const existingIndex = this.policies.findIndex(p => p.id === cleanPolicy.id);
    if (existingIndex >= 0) {
      this.policies[existingIndex] = { ...this.policies[existingIndex], ...cleanPolicy };
    } else {
      this.policies.unshift(cleanPolicy);
    }
    this.logAudit('ADD_POLICY', cleanPolicy.policyMakerName || 'PolicyMaker', {
      id: cleanPolicy.id,
      name: cleanPolicy.name,
      acronym: cleanPolicy.acronym
    });

    return cleanPolicy;
  }

  public async updatePolicy(id: string, updates: Partial<Policy>): Promise<Policy | undefined> {
    const policy = this.getPolicyById(id);
    if (!policy) return undefined;
    const cleanUpdates = stripObsoleteIdentityFields(updates);
    const updatedPolicy = { ...policy, ...cleanUpdates, is_user_modified: true };
    await this.persistContent('policy', policy.id, updatedPolicy);
    Object.assign(policy, updatedPolicy);

    this.logAudit('UPDATE_POLICY', cleanUpdates.policyMakerName || 'PolicyMaker', {
      id: policy.id,
      updated_fields: Object.keys(cleanUpdates)
    });

    return policy;
  }

  public async updatePolicyArea(id: string, areaTarget: AreaTarget): Promise<Policy | undefined> {
    const policy = this.getPolicyById(id);
    if (!policy) return undefined;

    const areaTargets = [...(policy.area_targets || [])];

    const existingIdx = areaTargets.findIndex(
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
      areaTargets[existingIdx] = cleanTarget;
    } else {
      areaTargets.push(cleanTarget);
    }

    const updatedPolicy: Policy = {
      ...policy,
      area_targets: areaTargets,
      current_area_target: cleanTarget,
      is_user_modified: true,
      status: 'Under Revision'
    };
    await this.persistContent('policy', policy.id, updatedPolicy);
    Object.assign(policy, updatedPolicy);

    this.logAudit('UPDATE_POLICY_AREA', areaTarget.updated_by || 'PolicyMaker', {
      policy_id: policy.id,
      state: areaTarget.state_name,
      district: areaTarget.district_name || 'All Districts',
      budget: areaTarget.regional_budget_cr
    });

    return policy;
  }

  public async deletePolicy(id: string): Promise<boolean> {
    const idx = this.policies.findIndex(p => p.id === id);
    if (idx >= 0) {
      const removed = this.policies[idx];
      await this.persistContent('policy', removed.id, removed, true);
      await this.deleteFileAttachment('policy', removed.id).catch((error: any) => {
        console.warn('[Database] Policy file cleanup warning:', error?.message || error);
      });
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

  public async addResearchPaper(paper: ResearchPaper): Promise<ResearchPaper> {
    const cleanPaper = stripObsoleteIdentityFields(paper);
    await this.persistContent('research', cleanPaper.id, cleanPaper);
    const existingIndex = this.research.findIndex(p => p.id === cleanPaper.id);
    if (existingIndex >= 0) {
      this.research[existingIndex] = cleanPaper;
    } else {
      this.research.unshift(cleanPaper);
    }
    this.logAudit('ADD_RESEARCH_PAPER', cleanPaper.authors[0] || 'Researcher', {
      id: cleanPaper.id,
      title: cleanPaper.title
    });

    return cleanPaper;
  }

  // === Inspection & Ombudsman Directorate Methods ===

  public getUsers(): UserRegistryRecord[] {
    return this.users;
  }

  public getUserById(id: string): UserRegistryRecord | undefined {
    return this.users.find(u => u.id === id || u.email.toLowerCase() === id.toLowerCase());
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

  public async updateUserRole(id: string, newRole: 'public' | 'researcher' | 'policymaker' | 'admin' | 'inspector'): Promise<UserRegistryRecord | undefined> {
    const user = this.getUserById(id);
    if (!user) return undefined;
    const prevRole = user.role;
    const updatedUser = {
      ...user,
      role: newRole,
      lastActiveAt: new Date().toISOString()
    };
    await this.persistContent('user', user.id, updatedUser);
    Object.assign(user, updatedUser);
    this.logAudit('CHANGE_USER_ROLE', 'ChiefInspector', { id, prevRole, newRole });
    return user;
  }

  public async updateUserFeatures(id: string, features_granted: string[]): Promise<UserRegistryRecord | undefined> {
    const user = this.getUserById(id);
    if (!user) return undefined;
    const updatedUser = {
      ...user,
      features_granted,
      lastActiveAt: new Date().toISOString()
    };
    await this.persistContent('user', user.id, updatedUser);
    Object.assign(user, updatedUser);
    this.logAudit('UPDATE_USER_FEATURES', 'ChiefInspector', { id, features_granted });
    return user;
  }

  public async toggleUserStar(id: string, is_starred?: boolean, is_inspection_verified?: boolean, inspection_notes?: string): Promise<UserRegistryRecord | undefined> {
    const user = this.getUserById(id);
    if (!user) return undefined;
    const updatedUser = {
      ...user,
      ...(typeof is_starred === 'boolean' ? { is_starred } : {}),
      ...(typeof is_inspection_verified === 'boolean' ? { is_inspection_verified } : {}),
      ...(inspection_notes !== undefined ? { inspection_notes } : {}),
      lastActiveAt: new Date().toISOString()
    };
    await this.persistContent('user', user.id, updatedUser);
    Object.assign(user, updatedUser);
    this.logAudit('STAR_VERIFY_USER', 'ChiefInspector', {
      id,
      is_starred: user.is_starred,
      is_inspection_verified: user.is_inspection_verified
    });
    return user;
  }

  public async deleteUser(id: string): Promise<boolean> {
    const idx = this.users.findIndex(u => u.id === id);
    if (idx >= 0) {
      const removed = this.users[idx];
      await this.persistContent('user', removed.id, removed, true);
      this.users.splice(idx, 1);
      this.logAudit('DELETE_USER', 'ChiefInspector', { id: removed.id, email: removed.email });
      return true;
    }
    return false;
  }

  public async inspectPolicy(id: string, updates: {
    is_starred?: boolean;
    is_inspection_verified?: boolean;
    is_hidden?: boolean;
    priority_order?: number;
    inspection_notes?: string;
    inspected_by?: string;
  }): Promise<Policy | undefined> {
    const policy = this.getPolicyById(id);
    if (!policy) return undefined;
    const inspectedPolicy = { ...policy };
    if (typeof updates.is_starred === 'boolean') inspectedPolicy.is_starred = updates.is_starred;
    if (typeof updates.is_inspection_verified === 'boolean') inspectedPolicy.is_inspection_verified = updates.is_inspection_verified;
    if (typeof updates.is_hidden === 'boolean') inspectedPolicy.is_hidden = updates.is_hidden;
    if (typeof updates.priority_order === 'number') inspectedPolicy.priority_order = updates.priority_order;
    if (updates.inspection_notes !== undefined) inspectedPolicy.inspection_notes = updates.inspection_notes;
    inspectedPolicy.inspected_by = updates.inspected_by || 'Chief Inspector';
    inspectedPolicy.inspected_at = new Date().toISOString();
    await this.persistContent('policy', policy.id, inspectedPolicy);
    Object.assign(policy, inspectedPolicy);

    this.logAudit('INSPECT_POLICY', policy.inspected_by, {
      id: policy.id,
      is_starred: policy.is_starred,
      is_inspection_verified: policy.is_inspection_verified,
      is_hidden: policy.is_hidden,
      priority_order: policy.priority_order
    });
    return policy;
  }

  public async reorderPolicies(orderedIds: string[]): Promise<Policy[]> {
    const reordered = this.policies.map(policy => {
      const index = orderedIds.findIndex(id => id === policy.id || id.toLowerCase() === policy.acronym.toLowerCase());
      return index >= 0 ? { ...policy, priority_order: index + 1 } : { ...policy };
    });
    await Promise.all(reordered.map(policy => this.persistContent('policy', policy.id, policy)));
    this.policies = reordered.sort((a, b) => (a.priority_order || 999) - (b.priority_order || 999));
    this.logAudit('REORDER_POLICIES', 'ChiefInspector', { order: orderedIds });
    return this.policies;
  }

  public async inspectResearch(id: string, updates: {
    is_starred?: boolean;
    is_inspection_verified?: boolean;
    is_hidden?: boolean;
    priority_order?: number;
    inspection_notes?: string;
    inspected_by?: string;
  }): Promise<ResearchPaper | undefined> {
    const paper = this.getResearchPaperById(id);
    if (!paper) return undefined;
    const inspectedPaper = { ...paper };
    if (typeof updates.is_starred === 'boolean') inspectedPaper.is_starred = updates.is_starred;
    if (typeof updates.is_inspection_verified === 'boolean') inspectedPaper.is_inspection_verified = updates.is_inspection_verified;
    if (typeof updates.is_hidden === 'boolean') inspectedPaper.is_hidden = updates.is_hidden;
    if (typeof updates.priority_order === 'number') inspectedPaper.priority_order = updates.priority_order;
    if (updates.inspection_notes !== undefined) inspectedPaper.inspection_notes = updates.inspection_notes;
    inspectedPaper.inspected_by = updates.inspected_by || 'Chief Inspector';
    inspectedPaper.inspected_at = new Date().toISOString();
    await this.persistContent('research', paper.id, inspectedPaper);
    Object.assign(paper, inspectedPaper);

    this.logAudit('INSPECT_RESEARCH', paper.inspected_by, {
      id: paper.id,
      is_starred: paper.is_starred,
      is_inspection_verified: paper.is_inspection_verified,
      is_hidden: paper.is_hidden,
      priority_order: paper.priority_order
    });
    return paper;
  }

  public async reorderResearch(orderedIds: string[]): Promise<ResearchPaper[]> {
    const reordered = this.research.map(paper => {
      const index = orderedIds.indexOf(paper.id);
      return index >= 0 ? { ...paper, priority_order: index + 1 } : { ...paper };
    });
    await Promise.all(reordered.map(paper => this.persistContent('research', paper.id, paper)));
    this.research = reordered.sort((a, b) => (a.priority_order || 999) - (b.priority_order || 999));
    this.logAudit('REORDER_RESEARCH', 'ChiefInspector', { order: orderedIds });
    return this.research;
  }

  public async deleteResearchPaper(id: string): Promise<boolean> {
    const idx = this.research.findIndex(r => r.id === id);
    if (idx >= 0) {
      const removed = this.research[idx];
      await this.persistContent('research', removed.id, removed, true);
      await this.deleteFileAttachment('research', removed.id).catch((error: any) => {
        console.warn('[Database] Research file cleanup warning:', error?.message || error);
      });
      this.research.splice(idx, 1);
      this.logAudit('DELETE_RESEARCH', 'ChiefInspector', { id: removed.id, title: removed.title });
      return true;
    }
    return false;
  }

  public getAnomalies(stateCode?: string): Anomaly[] {
    if (!stateCode || stateCode === 'IN-ALL') return this.anomalies;
    return this.anomalies.filter(a => a.state_code.toLowerCase() === stateCode.toLowerCase());
  }

  public async addUploadedDataset(dataset: Dataset, records: LandUseRecord[]): Promise<void> {
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
      try {
        await this.prisma.dataset.create({
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
        });

        if (records.length > 0) {
          await this.prisma.landUseRecord.createMany({
            data: records.map(r => ({
              id: r.id,
              state_code: r.state_code,
              state_name: r.state_name,
              district_code: r.district_code || null,
              district_name: r.district_name || null,
              year: Number(r.year),
              total_area_ha: Number(r.total_area_ha || 0),
              agricultural_area_ha: Number(r.agricultural_area_ha || 0),
              agricultural_pct: Number(r.agricultural_pct || 0),
              forest_area_ha: Number(r.forest_area_ha || 0),
              forest_pct: Number(r.forest_pct || 0),
              builtup_area_ha: Number(r.builtup_area_ha || 0),
              builtup_pct: Number(r.builtup_pct || 0),
              waterbodies_area_ha: Number(r.waterbodies_area_ha || 0),
              waterbodies_pct: Number(r.waterbodies_pct || 0),
              barren_area_ha: Number(r.barren_area_ha || 0),
              barren_pct: Number(r.barren_pct || 0),
              other_area_ha: Number(r.other_area_ha || 0),
              other_pct: Number(r.other_pct || 0),
              irrigated_pct: Number(r.irrigated_pct || 0),
              degraded_pct: Number(r.degraded_pct || 0),
              source_id: r.source_id || 'DS-UPLOAD',
              dataset_name: r.dataset_name || dataset.title,
              source_url: r.source_url || 'https://desagri.gov.in',
              confidence_score: Number(r.confidence_score || 95),
              is_demo: false,
              notes: r.notes || null
            })),
            skipDuplicates: true
          });
        }
      } catch (e) {
        console.warn('[Prisma] Async Dataset/Records upload persist warning:', e);
      }
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

  public getDashboardData(): any {
    const datasets = this.datasets.filter(dataset => !this.seedDatasetIds.has(dataset.id));
    const research = this.research.filter(paper => !this.seedResearchIds.has(paper.id));
    const policies = this.policies.filter(policy => !this.seedPolicyIds.has(policy.id));
    const records = this.records.filter(record => !record.is_demo && !this.seedRecordIds.has(record.id));
    const sourceCount = new Set(records.map(record => record.source_id).filter(Boolean)).size;
    const geographyCount = new Set(
      records.map(record => record.district_name || record.state_name).filter(Boolean)
    ).size;
    const latestYear = records.length > 0 ? Math.max(...records.map(record => record.year)) : null;

    const keyInsights: any[] = [];
    if (records.length > 0) {
      keyInsights.push({
        id: 'live-records',
        metric: records.length.toLocaleString('en-IN'),
        description: 'Validated non-demo land-use records available for analysis',
        icon: 'Database'
      });
      keyInsights.push({
        id: 'live-coverage',
        metric: geographyCount.toLocaleString('en-IN'),
        description: 'Geographies represented by validated uploaded records',
        icon: 'MapPin'
      });
      if (latestYear !== null) {
        keyInsights.push({
          id: 'live-year',
          metric: String(latestYear),
          description: 'Latest reporting year in the validated record store',
          icon: 'Calendar'
        });
      }
    }

    return {
      kpiCards: {
        datasets: {
          label: 'Uploaded Datasets',
          count: datasets.length.toLocaleString('en-IN'),
          subtitle: 'Production database entries'
        },
        research: {
          label: 'Submitted Research',
          count: research.length.toLocaleString('en-IN'),
          subtitle: 'Uploaded or authored papers'
        },
        policies: {
          label: 'Submitted Policies',
          count: policies.length.toLocaleString('en-IN'),
          subtitle: 'Non-demo repository entries'
        },
        layers: {
          label: 'Validated Sources',
          count: sourceCount.toLocaleString('en-IN'),
          subtitle: `${records.length.toLocaleString('en-IN')} non-demo records`
        },
        users: {
          label: 'Registered Users',
          count: '0',
          subtitle: 'Persistent user registry not connected'
        }
      },
      keyInsights,
      recentPublications: research
        .slice()
        .sort((a, b) => b.year - a.year)
        .slice(0, 5)
        .map(paper => ({
          id: paper.id,
          title: paper.title,
          author: paper.authors?.[0] || 'Author not provided',
          year: String(paper.year)
        })),
      policyExperiments: policies.slice(0, 5).map(policy => ({
        id: policy.id,
        title: policy.name,
        state: policy.target_region,
        duration: `Added ${policy.launch_year}`,
        status: policy.status || 'Registered'
      })),
      upcomingEvents: [],
      bannerSlides: this.dashboardBannerSlides
    };
  }

  public updateDashboardData(updates: any): any {
    if (Array.isArray(updates?.bannerSlides)) {
      this.dashboardBannerSlides = updates.bannerSlides;
      this.logAudit('UPDATE_DASHBOARD_PRESENTATION', 'Inspection Directorate', {
        bannerSlides: updates.bannerSlides.length
      });
    }
    return this.getDashboardData();
  }

  public resetDashboardData(): any {
    this.dashboardBannerSlides = undefined;
    this.logAudit('RESET_DASHBOARD_DATA', 'Inspection Directorate', {});
    return this.getDashboardData();
  }
}

export const db = new Database();
