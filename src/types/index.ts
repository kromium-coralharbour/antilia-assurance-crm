// ── ENUMS ──────────────────────────────────────────────────────────────────

export type Island = 'barbados' | 'jamaica' | 'cayman_islands' | 'trinidad_tobago' | 'bahamas'
export type Currency = 'USD' | 'BBD' | 'JMD' | 'KYD' | 'TTD' | 'BSD' | 'GBP' | 'EUR'
export type RiskLevel = 'extreme' | 'high' | 'moderate' | 'low' | 'minimal'
export type PolicyStatus = 'active' | 'pending' | 'renewal_due' | 'lapsed' | 'cancelled' | 'quoted'
export type ClaimStatus = 'fnol_received' | 'under_review' | 'adjuster_assigned' | 'inspection_scheduled' | 'assessment_complete' | 'approved' | 'partial_approved' | 'settled' | 'rejected' | 'fraud_investigation'
export type CoverageType = 'residential' | 'commercial' | 'hospitality' | 'real_estate' | 'construction' | 'yacht_marine'
export type ClientSegment = 'high_value_homeowner' | 'commercial_owner' | 'real_estate_developer' | 'boutique_resort' | 'construction_company' | 'hnw_yacht_owner'
export type BrokerStatus = 'active' | 'inactive' | 'pending_approval'
export type FraudRisk = 'clear' | 'watch' | 'suspicious' | 'flagged' | 'confirmed_fraud'
export type CatastropheEvent = 'hurricane' | 'tropical_storm' | 'flood' | 'earthquake' | 'fire' | 'other'

// ── CLIENT ─────────────────────────────────────────────────────────────────

export interface Client {
  id: string
  created_at: string
  updated_at: string
  first_name: string
  last_name: string
  company_name?: string
  email: string
  phone?: string
  segment: ClientSegment
  island: Island
  address: string
  preferred_currency: Currency
  risk_score: number // 0–100
  total_insured_value: number
  total_insured_value_currency: Currency
  notes?: string
  broker_id?: string
  is_vip: boolean
  tags?: string[]
}

// ── POLICY ─────────────────────────────────────────────────────────────────

export interface Policy {
  id: string
  created_at: string
  updated_at: string
  policy_number: string
  client_id: string
  broker_id?: string
  coverage_type: CoverageType
  status: PolicyStatus
  island: Island
  insured_value: number
  currency: Currency
  annual_premium: number
  premium_currency: Currency
  start_date: string
  end_date: string
  renewal_date: string
  risk_score: number
  wind_zone?: string
  flood_zone?: string
  structural_compliance_rating?: number // 0–100
  construction_year?: number
  property_address?: string
  endorsements?: PolicyEndorsement[]
  reinsurance_treaty_id?: string
  notes?: string
  hurricane_deductible_pct?: number
}

export interface PolicyEndorsement {
  id: string
  policy_id: string
  type: string
  description: string
  additional_premium: number
  currency: Currency
  effective_date: string
}

// ── CLAIM ──────────────────────────────────────────────────────────────────

export interface Claim {
  id: string
  created_at: string
  updated_at: string
  claim_number: string
  policy_id: string
  client_id: string
  adjuster_id?: string
  status: ClaimStatus
  coverage_type: CoverageType
  catastrophe_event?: CatastropheEvent
  storm_name?: string
  incident_date: string
  fnol_date: string
  reported_loss: number
  assessed_loss?: number
  approved_amount?: number
  settlement_amount?: number
  currency: Currency
  fx_rate_usd?: number
  description: string
  property_address: string
  island: Island
  fraud_risk: FraudRisk
  fraud_flags?: string[]
  adjuster_notes?: string
  settlement_date?: string
  documents?: ClaimDocument[]
}

export interface ClaimDocument {
  id: string
  claim_id: string
  type: string
  url: string
  uploaded_at: string
}

// ── BROKER ─────────────────────────────────────────────────────────────────

export interface Broker {
  id: string
  created_at: string
  updated_at: string
  name: string
  company: string
  email: string
  phone?: string
  island: Island
  license_number: string
  status: BrokerStatus
  commission_rate: number // percentage
  ytd_premium_volume: number
  ytd_commission_earned: number
  currency: Currency
  policy_count: number
  client_count: number
  notes?: string
}

// ── REINSURANCE ────────────────────────────────────────────────────────────

export interface ReinsuranceTreaty {
  id: string
  created_at: string
  updated_at: string
  treaty_name: string
  reinsurer_name: string
  treaty_type: 'quota_share' | 'excess_of_loss' | 'catastrophe_xl' | 'facultative'
  coverage_type?: CoverageType
  islands_covered: Island[]
  inception_date: string
  expiry_date: string
  limit: number
  retention: number
  currency: Currency
  cession_rate?: number // for quota share
  attachment_point?: number // for XL
  premium_ceded: number
  exposure_ceded: number
  loss_recoverable: number
  status: 'active' | 'expired' | 'pending_renewal'
  notes?: string
}

// ── RISK INTELLIGENCE ──────────────────────────────────────────────────────

export interface HurricaneExposure {
  island: Island
  total_policies: number
  total_exposure: number
  currency: Currency
  cat_1_2_exposure: number
  cat_3_4_exposure: number
  cat_5_exposure: number
  extreme_wind_zone_policies: number
  flood_zone_policies: number
  avg_structural_compliance: number
  last_updated: string
}

export interface ExposureHeatmapCell {
  id: string
  island: Island
  zone: string
  risk_level: RiskLevel
  policy_count: number
  total_exposure: number
  coordinates?: { lat: number; lng: number }
}

// ── FRAUD ──────────────────────────────────────────────────────────────────

export interface FraudAlert {
  id: string
  created_at: string
  claim_id: string
  client_id: string
  alert_type: string
  risk_score: number
  flags: string[]
  status: 'open' | 'investigating' | 'cleared' | 'confirmed'
  assigned_to?: string
  resolution_notes?: string
}

// ── DASHBOARD KPIs ─────────────────────────────────────────────────────────

export interface DashboardKPIs {
  total_gwp: number
  gwp_currency: Currency
  gwp_change_pct: number
  active_policies: number
  policies_change: number
  open_claims: number
  claims_change: number
  combined_ratio: number
  loss_ratio: number
  expense_ratio: number
  cat_exposure: number
  cat_exposure_currency: Currency
  broker_count: number
  reinsurance_coverage: number
}

// ── FX RATES ───────────────────────────────────────────────────────────────

export interface FxRate {
  from: Currency
  to: Currency
  rate: number
  updated_at: string
}

export const ISLAND_CURRENCIES: Record<Island, Currency> = {
  barbados: 'BBD',
  jamaica: 'JMD',
  cayman_islands: 'KYD',
  trinidad_tobago: 'TTD',
  bahamas: 'BSD',
}

export const ISLAND_LABELS: Record<Island, string> = {
  barbados: 'Barbados',
  jamaica: 'Jamaica',
  cayman_islands: 'Cayman Islands',
  trinidad_tobago: 'Trinidad & Tobago',
  bahamas: 'The Bahamas',
}

export const COVERAGE_LABELS: Record<CoverageType, string> = {
  residential: 'Residential Property',
  commercial: 'Commercial Property',
  hospitality: 'Boutique Resort / Hotel',
  real_estate: 'Real Estate Development',
  construction: 'Construction Risk',
  yacht_marine: 'Yacht & Marine',
}

export const RISK_COLORS: Record<RiskLevel, string> = {
  extreme: '#c0392b',
  high: '#e67e22',
  moderate: '#f1c40f',
  low: '#27ae60',
  minimal: '#2e4060',
}
