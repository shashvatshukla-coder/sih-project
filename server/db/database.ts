import { State, District, LandUseRecord, Dataset, DataSource, Policy, ResearchPaper, Anomaly } from './schema.ts';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getPrismaClient, isDbConnected } from './prismaClient.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadJson<T>(filename: string): T {
  const filePath = path.join(__dirname, filename);
  const data = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(data) as T;
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
      console.log(`[Database] In-memory seed initialized (${this.states.length} states, ${this.districts.length} districts, ${this.records.length} records, ${this.datasets.length} datasets).`);
    } catch (err) {
      console.error('[Database] Failed to load JSON seed data:', err);
    }

    // 2. Attempt PostgreSQL Connection via Prisma if DATABASE_URL is configured
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

      console.log(`[Database] Successfully synced live state from PostgreSQL (${this.states.length} states, ${this.records.length} records).`);
    } catch (err) {
      console.warn('[Database] PostgreSQL sync warning:', err);
    }
  }

  public getDatabaseStatus() {
    return {
      type: this.isPostgresActive ? 'PostgreSQL (Prisma ORM)' : 'In-Memory High-Speed Cache',
      postgres_connected: isDbConnected(),
      total_states: this.states.length,
      total_districts: this.districts.length,
      total_records: this.records.length,
      total_datasets: this.datasets.length
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

  public getAnomalies(stateCode?: string): Anomaly[] {
    if (!stateCode || stateCode === 'IN-ALL') return this.anomalies;
    return this.anomalies.filter(a => a.state_code.toLowerCase() === stateCode.toLowerCase());
  }

  public addUploadedDataset(dataset: Dataset, records: LandUseRecord[]): void {
    this.datasets.unshift(dataset);
    this.records.push(...records);
    this.logAudit('UPLOAD_DATASET', 'Admin', { dataset_id: dataset.id, records_count: records.length });

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
