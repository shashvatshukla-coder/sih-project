import { State, District, LandUseRecord, Dataset, DataSource, Policy, ResearchPaper, Anomaly } from './schema.ts';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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

  constructor() {
    this.init();
  }

  private init() {
    try {
      this.states = loadJson<State[]>('states.json');
      this.districts = loadJson<District[]>('districts.json');
      this.records = loadJson<LandUseRecord[]>('records.json');
      this.datasets = loadJson<Dataset[]>('datasets.json');
      this.dataSources = loadJson<DataSource[]>('datasources.json');
      this.policies = loadJson<Policy[]>('policies.json');
      this.research = loadJson<ResearchPaper[]>('research.json');
      this.anomalies = loadJson<Anomaly[]>('anomalies.json');
      console.log(`[Database] Initialized with ${this.states.length} states, ${this.districts.length} districts, ${this.records.length} records, ${this.datasets.length} datasets, ${this.policies.length} policies.`);
    } catch (err) {
      console.error('[Database] Failed to load JSON seed data:', err);
    }
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
      src.records_imported += Math.floor(Math.random() * 500) + 50;
      this.logAudit('SYNC_DATA_SOURCE', 'Admin', { source_id: id, records_now: src.records_imported });
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
  }

  public logAIQuery(query: string, intent: any, response: any): void {
    this.aiQueries.unshift({
      id: 'QRY-' + Date.now(),
      query,
      intent,
      responseSummary: response.summary,
      timestamp: new Date().toISOString()
    });
    if (this.aiQueries.length > 50) this.aiQueries.pop();
  }

  public getRecentAIQueries(): any[] {
    return this.aiQueries;
  }

  public logAudit(action: string, actor: string, details: any): void {
    this.auditLogs.unshift({
      id: 'AUD-' + Date.now(),
      action,
      actor,
      timestamp: new Date().toISOString(),
      details
    });
  }

  public getAuditLogs(): any[] {
    return this.auditLogs;
  }
}

export const db = new Database();
