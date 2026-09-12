-- ==============================================================================
-- Bhu-Drishti Land Intelligence Platform
-- Supabase / PostgreSQL Production Schema Definition
-- Run this in your Supabase SQL Editor: https://app.supabase.com/project/_/sql
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. States Table
CREATE TABLE IF NOT EXISTS states (
  state_code TEXT PRIMARY KEY,
  state_name TEXT NOT NULL,
  capital TEXT NOT NULL,
  total_area_sqkm DOUBLE PRECISION NOT NULL,
  region TEXT NOT NULL,
  center_lat DOUBLE PRECISION NOT NULL,
  center_lng DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Districts Table
CREATE TABLE IF NOT EXISTS districts (
  district_code TEXT PRIMARY KEY,
  district_name TEXT NOT NULL,
  state_code TEXT NOT NULL REFERENCES states(state_code) ON DELETE CASCADE,
  state_name TEXT NOT NULL,
  total_area_sqkm DOUBLE PRECISION NOT NULL,
  center_lat DOUBLE PRECISION NOT NULL,
  center_lng DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Land Use Records Table
CREATE TABLE IF NOT EXISTS land_use_records (
  id TEXT PRIMARY KEY,
  state_code TEXT NOT NULL REFERENCES states(state_code) ON DELETE CASCADE,
  state_name TEXT NOT NULL,
  district_code TEXT REFERENCES districts(district_code) ON DELETE SET NULL,
  district_name TEXT,
  year INTEGER NOT NULL,
  total_area_ha DOUBLE PRECISION NOT NULL,
  agricultural_area_ha DOUBLE PRECISION NOT NULL,
  agricultural_pct DOUBLE PRECISION NOT NULL,
  forest_area_ha DOUBLE PRECISION NOT NULL,
  forest_pct DOUBLE PRECISION NOT NULL,
  builtup_area_ha DOUBLE PRECISION NOT NULL,
  builtup_pct DOUBLE PRECISION NOT NULL,
  waterbodies_area_ha DOUBLE PRECISION NOT NULL,
  waterbodies_pct DOUBLE PRECISION NOT NULL,
  barren_area_ha DOUBLE PRECISION NOT NULL,
  barren_pct DOUBLE PRECISION NOT NULL,
  other_area_ha DOUBLE PRECISION NOT NULL,
  other_pct DOUBLE PRECISION NOT NULL,
  irrigated_pct DOUBLE PRECISION NOT NULL,
  degraded_pct DOUBLE PRECISION NOT NULL,
  source_id TEXT NOT NULL,
  dataset_name TEXT NOT NULL,
  source_url TEXT NOT NULL,
  confidence_score DOUBLE PRECISION DEFAULT 95.0,
  is_demo BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_records_state_year ON land_use_records(state_code, year);
CREATE INDEX IF NOT EXISTS idx_records_district_year ON land_use_records(district_code, year);
CREATE INDEX IF NOT EXISTS idx_records_year ON land_use_records(year);

-- 4. Datasets Table
CREATE TABLE IF NOT EXISTS datasets (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  publisher TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  coverage TEXT NOT NULL,
  date_range TEXT NOT NULL,
  last_updated TEXT NOT NULL,
  format TEXT NOT NULL,
  update_frequency TEXT NOT NULL,
  source_url TEXT NOT NULL,
  license TEXT NOT NULL,
  data_quality JSONB,
  sample_rows JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Data Sources Table
CREATE TABLE IF NOT EXISTS data_sources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT DEFAULT 'Connected',
  last_synced TEXT NOT NULL,
  datasets_count INTEGER DEFAULT 0,
  records_imported INTEGER DEFAULT 0,
  error_status TEXT,
  endpoint_url TEXT NOT NULL,
  adapter_type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Policies Table
CREATE TABLE IF NOT EXISTS policies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  acronym TEXT NOT NULL,
  ministry TEXT NOT NULL,
  launch_year INTEGER NOT NULL,
  description TEXT NOT NULL,
  target_region TEXT NOT NULL,
  objectives JSONB,
  related_indicators JSONB,
  documents_url TEXT NOT NULL,
  pre_period TEXT NOT NULL,
  post_period TEXT NOT NULL,
  observed_impact_summary TEXT NOT NULL,
  methodology_note TEXT NOT NULL,
  linked_dataset_ids JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Research Papers Table
CREATE TABLE IF NOT EXISTS research_papers (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  authors JSONB,
  journal TEXT NOT NULL,
  year INTEGER NOT NULL,
  doi_url TEXT NOT NULL,
  abstract TEXT NOT NULL,
  key_findings JSONB,
  geographic_focus TEXT NOT NULL,
  tags JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Anomalies Table
CREATE TABLE IF NOT EXISTS anomalies (
  id TEXT PRIMARY KEY,
  district_code TEXT NOT NULL,
  district_name TEXT NOT NULL,
  state_code TEXT NOT NULL,
  year INTEGER NOT NULL,
  anomaly_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  description TEXT NOT NULL,
  detected_value DOUBLE PRECISION NOT NULL,
  expected_value DOUBLE PRECISION NOT NULL,
  confidence_score DOUBLE PRECISION NOT NULL,
  recommended_action TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
  action TEXT NOT NULL,
  performed_by TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  details JSONB
);

-- RLS Configuration
ALTER TABLE states ENABLE ROW LEVEL SECURITY;
ALTER TABLE districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE land_use_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE anomalies ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Anonymous and Authenticated Read Policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read states') THEN
    CREATE POLICY "Allow public read states" ON states FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read districts') THEN
    CREATE POLICY "Allow public read districts" ON districts FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read records') THEN
    CREATE POLICY "Allow public read records" ON land_use_records FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read datasets') THEN
    CREATE POLICY "Allow public read datasets" ON datasets FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read data_sources') THEN
    CREATE POLICY "Allow public read data_sources" ON data_sources FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read policies') THEN
    CREATE POLICY "Allow public read policies" ON policies FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read research_papers') THEN
    CREATE POLICY "Allow public read research_papers" ON research_papers FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read anomalies') THEN
    CREATE POLICY "Allow public read anomalies" ON anomalies FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read audit_logs') THEN
    CREATE POLICY "Allow public read audit_logs" ON audit_logs FOR SELECT USING (true);
  END IF;
END $$;
