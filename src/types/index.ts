export type LandCategory = 'agricultural' | 'forest' | 'builtup' | 'waterbodies' | 'barren' | 'other' | 'irrigated' | 'degraded';

export type UserRole = 'public' | 'researcher' | 'policymaker' | 'admin';

export type PageId =
  | 'home'
  | 'dashboard'
  | 'statistics'
  | 'map'
  | 'datasets'
  | 'trends'
  | 'ai-query'
  | 'anomalies'
  | 'change'
  | 'policy'
  | 'decision-support'
  | 'research'
  | 'integration'
  | 'reports'
  | 'comparison'
  | 'workspace'
  | 'admin'
  | 'case-studies'
  | 'collaboration'
  | 'news-events';

export interface State {
  state_code: string;
  state_name: string;
  capital: string;
  total_area_sqkm: number;
  region: 'North' | 'South' | 'East' | 'West' | 'Central' | 'Northeast';
  center_coords: [number, number];
}

export interface District {
  district_code: string;
  district_name: string;
  state_code: string;
  state_name: string;
  total_area_sqkm: number;
  center_coords: [number, number];
}

export interface LandUseRecord {
  id: string;
  state_code: string;
  state_name: string;
  district_code?: string;
  district_name?: string;
  year: number;
  total_area_ha: number;
  agricultural_area_ha: number;
  agricultural_pct: number;
  forest_area_ha: number;
  forest_pct: number;
  builtup_area_ha: number;
  builtup_pct: number;
  waterbodies_area_ha: number;
  waterbodies_pct: number;
  barren_area_ha: number;
  barren_pct: number;
  other_area_ha: number;
  other_pct: number;
  irrigated_pct: number;
  degraded_pct: number;
  source_id: string;
  dataset_name: string;
  source_url: string;
  confidence_score: number;
  is_demo: boolean;
  notes?: string;
}

export interface Dataset {
  id: string;
  title: string;
  publisher: string;
  description: string;
  category: 'Land Use' | 'Agriculture' | 'Forestry' | 'Satellite / Remote Sensing' | 'Urbanization' | 'Water Resources';
  coverage: string;
  date_range: string;
  last_updated: string;
  format: 'CSV' | 'JSON' | 'GeoJSON' | 'XLSX' | 'API';
  update_frequency: 'Annual' | 'Quarterly' | 'Decennial' | 'Biannual';
  source_url: string;
  license: string;
  data_quality: {
    completeness: number;
    freshness: string;
    geographic_coverage_count: number;
    missing_values_pct: number;
    reliability_tier: 'Tier 1 (Official MoA/NRSC)' | 'Tier 2 (Survey Reports)' | 'Synthesized Research Benchmark';
  };
  sample_rows: any[];
}

export interface DataSource {
  id: string;
  name: string;
  category: string;
  status: 'Connected' | 'Syncing' | 'Pending Configuration' | 'Error';
  last_synced: string;
  datasets_count: number;
  records_imported: number;
  error_status?: string;
  endpoint_url: string;
  adapter_type: string;
}

export interface Policy {
  id: string;
  name: string;
  acronym: string;
  ministry: string;
  launch_year: number;
  description: string;
  target_region: string;
  objectives: string[];
  related_indicators: string[];
  documents_url: string;
  pre_period: string;
  post_period: string;
  observed_impact_summary: string;
  methodology_note: string;
  linked_dataset_ids: string[];
}

export interface ResearchPaper {
  id: string;
  title: string;
  authors: string[];
  year: number;
  publisher: string;
  journal?: string;
  abstract: string;
  research_area: string;
  geography: string;
  methodology: string;
  key_findings: string[];
  citation_apa: string;
  source_url: string;
  tags: string[];
  ai_summary: string;
  related_dataset_ids: string[];
  related_policy_ids: string[];
}

export interface Anomaly {
  id: string;
  geography_type: 'state' | 'district';
  geography_name: string;
  state_code: string;
  district_code?: string;
  indicator: string;
  year_range: string;
  observed_value: string;
  expected_range: string;
  deviation_zscore: number;
  severity: 'Critical' | 'Warning' | 'Informational';
  possible_factors: string[];
  confidence: number;
  methodology: string;
}

export interface AIQueryResponse {
  query: string;
  intent: {
    type: 'trend_analysis' | 'comparison' | 'anomaly_check' | 'policy_evaluation' | 'general_stat';
    geographyType?: 'national' | 'state' | 'district';
    geographyName?: string;
    stateCode?: string;
    districtCode?: string;
    secondaryGeographyName?: string;
    secondaryStateCode?: string;
    indicator?: string;
    period?: { from: number; to: number };
  };
  metrics: {
    startYear?: number;
    startValue?: number;
    endYear?: number;
    endValue?: number;
    absoluteChange?: number;
    percentageChange?: number;
    cagr?: number;
    direction?: 'increasing' | 'decreasing' | 'stable' | 'volatile';
  };
  chartData: Array<{
    year: number;
    value?: number;
    agricultural?: number;
    forest?: number;
    builtup?: number;
    water?: number;
    barren?: number;
    [key: string]: any;
  }>;
  summary: string;
  potentialDrivers: string[];
  notableDistrictsOrStates?: Array<{ name: string; value: number; changePct: number }>;
  anomaliesDetected?: string[];
  sources: Array<{ name: string; year: string; url: string; datasetId?: string }>;
  confidence: number;
  aiModel?: string;
  calculationBreakdown: {
    formula: string;
    rawValues: string;
    stepExplanation: string;
  };
}

export interface FilterState {
  stateCode: string;
  districtCode: string;
  year: number;
  category: LandCategory;
}
