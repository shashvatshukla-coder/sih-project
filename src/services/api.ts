import {
  State,
  District,
  LandUseRecord,
  Dataset,
  DataSource,
  Policy,
  ResearchPaper,
  Anomaly,
  AIQueryResponse
} from '../types';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '');

export const api = {
  async getStates(): Promise<State[]> {
    const res = await fetch(`${API_BASE}/states`);
    const json = await res.json();
    return json.data;
  },

  async getState(stateCode: string): Promise<State> {
    const res = await fetch(`${API_BASE}/states/${stateCode}`);
    const json = await res.json();
    return json.data;
  },

  async getDistricts(stateCode?: string): Promise<District[]> {
    const url = stateCode && stateCode !== 'IN-ALL' ? `${API_BASE}/districts?stateCode=${stateCode}` : `${API_BASE}/districts`;
    const res = await fetch(url);
    const json = await res.json();
    return json.data;
  },

  async getLandUseRecords(filters: { state_code?: string; district_code?: string; year?: number; category?: string }): Promise<LandUseRecord[]> {
    const params = new URLSearchParams();
    if (filters.state_code) params.append('state_code', filters.state_code);
    if (filters.district_code) params.append('district_code', filters.district_code);
    if (filters.year) params.append('year', String(filters.year));
    if (filters.category) params.append('category', filters.category);

    const res = await fetch(`${API_BASE}/land-use/records?${params.toString()}`);
    const json = await res.json();
    return json.data;
  },

  async getTrendAnalysis(state: string = 'IN-ALL', district?: string, category: string = 'agricultural') {
    const params = new URLSearchParams({ state, category });
    if (district && district !== 'ALL') params.append('district', district);
    const res = await fetch(`${API_BASE}/land-use/trends?${params.toString()}`);
    return await res.json();
  },

  async getComparison(geo1: string, geo2: string, year: number = 2025) {
    const res = await fetch(`${API_BASE}/land-use/compare?geo1=${geo1}&geo2=${geo2}&year=${year}`);
    return await res.json();
  },

  async getDatasets(search?: string, category?: string): Promise<Dataset[]> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (category && category !== 'All') params.append('category', category);
    const res = await fetch(`${API_BASE}/datasets?${params.toString()}`);
    const json = await res.json();
    return json.data;
  },

  async getDatasetById(id: string): Promise<Dataset> {
    const res = await fetch(`${API_BASE}/datasets/${id}`);
    const json = await res.json();
    return json.data;
  },

  async getDataSources(): Promise<DataSource[]> {
    const res = await fetch(`${API_BASE}/data-sources`);
    const json = await res.json();
    return json.data;
  },

  async syncDataSource(id: string): Promise<DataSource> {
    const res = await fetch(`${API_BASE}/data-sources/${id}/sync`, { method: 'POST' });
    const json = await res.json();
    return json.data;
  },

  async getPolicies(): Promise<Policy[]> {
    const res = await fetch(`${API_BASE}/policies`);
    const json = await res.json();
    return json.data;
  },

  async getPolicyImpact(policyId: string, stateCode: string = 'IN-UP') {
    const res = await fetch(`${API_BASE}/policies/${policyId}/impact?state=${stateCode}`);
    const json = await res.json();
    return json.data;
  },

  async getResearchPapers(search?: string, tag?: string): Promise<ResearchPaper[]> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (tag && tag !== 'All') params.append('tag', tag);
    const res = await fetch(`${API_BASE}/research?${params.toString()}`);
    const json = await res.json();
    return json.data;
  },

  async getAnomalies(stateCode?: string): Promise<Anomaly[]> {
    const url = stateCode && stateCode !== 'IN-ALL' ? `${API_BASE}/anomalies?state=${stateCode}` : `${API_BASE}/anomalies`;
    const res = await fetch(url);
    const json = await res.json();
    return json.data;
  },

  async queryAI(query: string): Promise<AIQueryResponse> {
    const res = await fetch(`${API_BASE}/ai/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });
    const json = await res.json();
    return json.data;
  },

  async uploadCustomDataset(payload: { rawRows: any[]; columnMapping: Record<string, string>; metadata: any }) {
    const res = await fetch(`${API_BASE}/admin/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await res.json();
  },

  async getAuditLogs() {
    const res = await fetch(`${API_BASE}/admin/audit-logs`);
    const json = await res.json();
    return json.data;
  }
};
