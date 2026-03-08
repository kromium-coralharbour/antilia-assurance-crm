-- ═══════════════════════════════════════════════════════════════════
-- ANTILLIA ASSURANCE GROUP — SUPABASE SCHEMA
-- Run this in the Supabase SQL editor
-- ═══════════════════════════════════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── ENUMS ──────────────────────────────────────────────────────────

CREATE TYPE island AS ENUM (
  'barbados', 'jamaica', 'cayman_islands', 'trinidad_tobago', 'bahamas'
);

CREATE TYPE currency AS ENUM (
  'USD', 'BBD', 'JMD', 'KYD', 'TTD', 'BSD', 'GBP', 'EUR'
);

CREATE TYPE risk_level AS ENUM (
  'extreme', 'high', 'moderate', 'low', 'minimal'
);

CREATE TYPE policy_status AS ENUM (
  'active', 'pending', 'renewal_due', 'lapsed', 'cancelled', 'quoted'
);

CREATE TYPE claim_status AS ENUM (
  'fnol_received', 'under_review', 'adjuster_assigned', 'inspection_scheduled',
  'assessment_complete', 'approved', 'partial_approved', 'settled', 'rejected',
  'fraud_investigation'
);

CREATE TYPE coverage_type AS ENUM (
  'residential', 'commercial', 'hospitality', 'real_estate', 'construction', 'yacht_marine'
);

CREATE TYPE client_segment AS ENUM (
  'high_value_homeowner', 'commercial_owner', 'real_estate_developer',
  'boutique_resort', 'construction_company', 'hnw_yacht_owner'
);

CREATE TYPE broker_status AS ENUM ('active', 'inactive', 'pending_approval');

CREATE TYPE fraud_risk AS ENUM (
  'clear', 'watch', 'suspicious', 'flagged', 'confirmed_fraud'
);

CREATE TYPE catastrophe_event AS ENUM (
  'hurricane', 'tropical_storm', 'flood', 'earthquake', 'fire', 'other'
);

CREATE TYPE treaty_type AS ENUM (
  'quota_share', 'excess_of_loss', 'catastrophe_xl', 'facultative'
);

-- ── BROKERS ────────────────────────────────────────────────────────

CREATE TABLE brokers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  company TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  island island NOT NULL,
  license_number TEXT UNIQUE NOT NULL,
  status broker_status DEFAULT 'active',
  commission_rate NUMERIC(5,2) DEFAULT 10.00,
  ytd_premium_volume NUMERIC(15,2) DEFAULT 0,
  ytd_commission_earned NUMERIC(15,2) DEFAULT 0,
  currency currency DEFAULT 'USD',
  policy_count INTEGER DEFAULT 0,
  client_count INTEGER DEFAULT 0,
  notes TEXT
);

-- ── CLIENTS ────────────────────────────────────────────────────────

CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  company_name TEXT,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  segment client_segment NOT NULL,
  island island NOT NULL,
  address TEXT NOT NULL,
  preferred_currency currency DEFAULT 'USD',
  risk_score NUMERIC(5,2) DEFAULT 50,
  total_insured_value NUMERIC(15,2) DEFAULT 0,
  total_insured_value_currency currency DEFAULT 'USD',
  notes TEXT,
  broker_id UUID REFERENCES brokers(id) ON DELETE SET NULL,
  is_vip BOOLEAN DEFAULT FALSE,
  tags TEXT[]
);

-- ── POLICIES ───────────────────────────────────────────────────────

CREATE TABLE policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  policy_number TEXT UNIQUE NOT NULL,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  broker_id UUID REFERENCES brokers(id) ON DELETE SET NULL,
  coverage_type coverage_type NOT NULL,
  status policy_status DEFAULT 'pending',
  island island NOT NULL,
  insured_value NUMERIC(15,2) NOT NULL,
  currency currency DEFAULT 'USD',
  annual_premium NUMERIC(12,2) NOT NULL,
  premium_currency currency DEFAULT 'USD',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  renewal_date DATE NOT NULL,
  risk_score NUMERIC(5,2) DEFAULT 50,
  wind_zone TEXT,
  flood_zone TEXT,
  structural_compliance_rating NUMERIC(5,2),
  construction_year INTEGER,
  property_address TEXT,
  reinsurance_treaty_id UUID,
  notes TEXT,
  hurricane_deductible_pct NUMERIC(5,2) DEFAULT 5.0
);

-- ── POLICY ENDORSEMENTS ────────────────────────────────────────────

CREATE TABLE policy_endorsements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  policy_id UUID NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  additional_premium NUMERIC(12,2) DEFAULT 0,
  currency currency DEFAULT 'USD',
  effective_date DATE NOT NULL
);

-- ── CLAIMS ─────────────────────────────────────────────────────────

CREATE TABLE claims (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  claim_number TEXT UNIQUE NOT NULL,
  policy_id UUID NOT NULL REFERENCES policies(id) ON DELETE RESTRICT,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  adjuster_id UUID,
  status claim_status DEFAULT 'fnol_received',
  coverage_type coverage_type NOT NULL,
  catastrophe_event catastrophe_event,
  storm_name TEXT,
  incident_date DATE NOT NULL,
  fnol_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reported_loss NUMERIC(15,2) NOT NULL,
  assessed_loss NUMERIC(15,2),
  approved_amount NUMERIC(15,2),
  settlement_amount NUMERIC(15,2),
  currency currency DEFAULT 'USD',
  fx_rate_usd NUMERIC(10,6) DEFAULT 1.0,
  description TEXT NOT NULL,
  property_address TEXT NOT NULL,
  island island NOT NULL,
  fraud_risk fraud_risk DEFAULT 'clear',
  fraud_flags TEXT[],
  adjuster_notes TEXT,
  settlement_date DATE
);

-- ── CLAIM DOCUMENTS ────────────────────────────────────────────────

CREATE TABLE claim_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  claim_id UUID NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  url TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── ADJUSTERS ──────────────────────────────────────────────────────

CREATE TABLE adjusters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  island island NOT NULL,
  specialization coverage_type[],
  active_claims INTEGER DEFAULT 0,
  is_available BOOLEAN DEFAULT TRUE
);

-- ── REINSURANCE TREATIES ───────────────────────────────────────────

CREATE TABLE reinsurance_treaties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  treaty_name TEXT NOT NULL,
  reinsurer_name TEXT NOT NULL,
  treaty_type treaty_type NOT NULL,
  coverage_type coverage_type,
  islands_covered island[] NOT NULL,
  inception_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  limit_amount NUMERIC(15,2) NOT NULL,
  retention NUMERIC(15,2) NOT NULL,
  currency currency DEFAULT 'USD',
  cession_rate NUMERIC(5,2),
  attachment_point NUMERIC(15,2),
  premium_ceded NUMERIC(15,2) DEFAULT 0,
  exposure_ceded NUMERIC(15,2) DEFAULT 0,
  loss_recoverable NUMERIC(15,2) DEFAULT 0,
  status TEXT DEFAULT 'active',
  notes TEXT
);

-- ── FX RATES ───────────────────────────────────────────────────────

CREATE TABLE fx_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  from_currency currency NOT NULL,
  to_currency currency NOT NULL,
  rate NUMERIC(12,6) NOT NULL,
  UNIQUE(from_currency, to_currency)
);

-- ── FRAUD ALERTS ───────────────────────────────────────────────────

CREATE TABLE fraud_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  claim_id UUID NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,
  risk_score NUMERIC(5,2) NOT NULL,
  flags TEXT[] NOT NULL,
  status TEXT DEFAULT 'open',
  assigned_to TEXT,
  resolution_notes TEXT
);

-- ── HURRICANE EXPOSURE CACHE ───────────────────────────────────────

CREATE TABLE hurricane_exposure_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  island island NOT NULL UNIQUE,
  total_policies INTEGER DEFAULT 0,
  total_exposure NUMERIC(15,2) DEFAULT 0,
  currency currency DEFAULT 'USD',
  cat_1_2_exposure NUMERIC(15,2) DEFAULT 0,
  cat_3_4_exposure NUMERIC(15,2) DEFAULT 0,
  cat_5_exposure NUMERIC(15,2) DEFAULT 0,
  extreme_wind_zone_policies INTEGER DEFAULT 0,
  flood_zone_policies INTEGER DEFAULT 0,
  avg_structural_compliance NUMERIC(5,2) DEFAULT 0
);

-- ── AUDIT LOG ──────────────────────────────────────────────────────

CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID,
  user_email TEXT,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT
);

-- ── UPDATED_AT TRIGGER ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_policies_updated_at BEFORE UPDATE ON policies FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_claims_updated_at BEFORE UPDATE ON claims FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_brokers_updated_at BEFORE UPDATE ON brokers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_treaties_updated_at BEFORE UPDATE ON reinsurance_treaties FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── GENERATE POLICY NUMBER ─────────────────────────────────────────

CREATE SEQUENCE policy_seq START 10000;
CREATE SEQUENCE claim_seq START 50000;

CREATE OR REPLACE FUNCTION generate_policy_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'AAG-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('policy_seq')::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_claim_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'CLM-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('claim_seq')::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- ── ROW LEVEL SECURITY ─────────────────────────────────────────────

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE brokers ENABLE ROW LEVEL SECURITY;
ALTER TABLE reinsurance_treaties ENABLE ROW LEVEL SECURITY;
ALTER TABLE fraud_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE adjusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE fx_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE hurricane_exposure_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_endorsements ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_documents ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users full access (customize per role in production)
CREATE POLICY "auth_all" ON clients FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON policies FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON claims FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON brokers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON reinsurance_treaties FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON fraud_alerts FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON adjusters FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON fx_rates FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON hurricane_exposure_cache FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON audit_log FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON policy_endorsements FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON claim_documents FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── SEED FX RATES ──────────────────────────────────────────────────

INSERT INTO fx_rates (from_currency, to_currency, rate) VALUES
  ('USD', 'BBD', 2.0000),
  ('USD', 'JMD', 156.5000),
  ('USD', 'KYD', 0.8200),
  ('USD', 'TTD', 6.7900),
  ('USD', 'BSD', 1.0000),
  ('USD', 'GBP', 0.7900),
  ('USD', 'EUR', 0.9200),
  ('BBD', 'USD', 0.5000),
  ('JMD', 'USD', 0.0064),
  ('KYD', 'USD', 1.2195),
  ('TTD', 'USD', 0.1473),
  ('BSD', 'USD', 1.0000);

-- ── SEED HURRICANE EXPOSURE CACHE ──────────────────────────────────

INSERT INTO hurricane_exposure_cache (island, total_policies, total_exposure, currency, cat_1_2_exposure, cat_3_4_exposure, cat_5_exposure, extreme_wind_zone_policies, flood_zone_policies, avg_structural_compliance) VALUES
  ('barbados', 0, 0, 'USD', 0, 0, 0, 0, 0, 0),
  ('jamaica', 0, 0, 'USD', 0, 0, 0, 0, 0, 0),
  ('cayman_islands', 0, 0, 'USD', 0, 0, 0, 0, 0, 0),
  ('trinidad_tobago', 0, 0, 'USD', 0, 0, 0, 0, 0, 0),
  ('bahamas', 0, 0, 'USD', 0, 0, 0, 0, 0, 0);
