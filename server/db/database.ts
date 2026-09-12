import { State, District, LandUseRecord, Dataset, DataSource, Policy, ResearchPaper, Anomaly } from './schema.ts';
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
      this.lastSyncTime = new Date().toISOString();
      console.log(`[Database] In-memory seed initialized (${this.states.length} states, ${this.districts.length} districts, ${this.records.length} records, ${this.datasets.length} datasets).`);
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

  public getPolicies(): Policy[] {
    return this.policies;
  }

  public getPolicyById(id: string): Policy | undefined {
    return this.policies.find(p => p.id.toLowerCase() === id.toLowerCase() || p.acronym.toLowerCase() === id.toLowerCase());
  }

  public getResearchPapers(search?: string, tag?: string): ResearchPaper[] {
    let result = [...this.research];
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
