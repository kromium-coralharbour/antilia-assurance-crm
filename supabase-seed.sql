-- ═══════════════════════════════════════════════════════════════════
-- ANTILLIA ASSURANCE GROUP — COMPREHENSIVE SEED DATA
-- Run AFTER supabase-schema.sql in the Supabase SQL editor
-- ═══════════════════════════════════════════════════════════════════

-- ── ADJUSTERS ──────────────────────────────────────────────────────

INSERT INTO adjusters (name, email, phone, island, specialization, active_claims, is_available) VALUES
  ('Marcus Alleyne', 'malleyne@antillia.bb', '+1-246-555-0101', 'barbados', ARRAY['residential','commercial']::coverage_type[], 3, true),
  ('Diane Hutchinson', 'dhutchinson@antillia.bb', '+1-246-555-0102', 'barbados', ARRAY['hospitality','real_estate']::coverage_type[], 2, true),
  ('Trevor Campbell', 'tcampbell@antillia.jm', '+1-876-555-0201', 'jamaica', ARRAY['residential','construction']::coverage_type[], 4, true),
  ('Sandra Morrison', 'smorrison@antillia.jm', '+1-876-555-0202', 'jamaica', ARRAY['commercial','yacht_marine']::coverage_type[], 1, true),
  ('Colin Ebanks', 'cebanks@antillia.ky', '+1-345-555-0301', 'cayman_islands', ARRAY['commercial','residential']::coverage_type[], 2, true),
  ('Priya Ramchandran', 'pramchandran@antillia.tt', '+1-868-555-0401', 'trinidad_tobago', ARRAY['commercial','construction']::coverage_type[], 3, false),
  ('James McIntosh', 'jmcintosh@antillia.bs', '+1-242-555-0501', 'bahamas', ARRAY['residential','hospitality']::coverage_type[], 5, true),
  ('Ketura Francis', 'kfrancis@antillia.ky', '+1-345-555-0302', 'cayman_islands', ARRAY['yacht_marine','real_estate']::coverage_type[], 2, true);

-- ── BROKERS ────────────────────────────────────────────────────────

INSERT INTO brokers (name, company, email, phone, island, license_number, status, commission_rate, ytd_premium_volume, ytd_commission_earned, currency, policy_count, client_count, notes) VALUES
  ('Alicia Browne', 'Caribbean Risk Partners', 'abrowne@caribrisk.bb', '+1-246-555-1001', 'barbados', 'BB-BRK-2019-0041', 'active', 12.50, 4820000, 602500, 'BBD', 28, 22, 'Top producer Barbados. Specialises in hospitality and HNW residential.'),
  ('Neville Grant', 'GrantShield Insurance Brokers', 'ngrant@grantshield.jm', '+1-876-555-2001', 'jamaica', 'JA-BRK-2017-0088', 'active', 11.00, 3640000, 400400, 'JMD', 21, 18, 'Strong commercial portfolio. Developer relationships in Montego Bay.'),
  ('Fiona Walters', 'Cayman Premier Brokers', 'fwalters@caymanpremier.ky', '+1-345-555-3001', 'cayman_islands', 'KY-BRK-2020-0012', 'active', 13.00, 5980000, 777400, 'KYD', 34, 27, 'Highest volume broker. Dominant in Cayman commercial and marine.'),
  ('Dion Persad', 'Trident Insurance Services', 'dpersad@tridentins.tt', '+1-868-555-4001', 'trinidad_tobago', 'TT-BRK-2018-0067', 'active', 10.50, 2180000, 228900, 'TTD', 16, 14, 'Construction sector specialist.'),
  ('Tamara Rolle', 'Bahamas Coverage Group', 'trolle@bahamascoverage.bs', '+1-242-555-5001', 'bahamas', 'BS-BRK-2016-0031', 'active', 12.00, 6440000, 772800, 'BSD', 38, 29, 'Largest Bahamas portfolio. Cat exposure focus.'),
  ('Michael Chen', 'Island Capital Insurance', 'mchen@islandcapital.ky', '+1-345-555-3002', 'cayman_islands', 'KY-BRK-2021-0019', 'active', 11.50, 3290000, 378350, 'KYD', 19, 16, 'HNW yacht and marine specialist.'),
  ('Yolanda Burke', 'Regional Assurance Brokers', 'yburke@regassurance.bb', '+1-246-555-1002', 'barbados', 'BB-BRK-2020-0055', 'active', 10.00, 1840000, 184000, 'BBD', 12, 10, 'Growing portfolio. Boutique resort niche.'),
  ('Conrad Ramsey', 'Ramsey & Partners', 'cramsey@ramseypartners.jm', '+1-876-555-2002', 'jamaica', 'JA-BRK-2022-0103', 'pending_approval', 10.00, 0, 0, 'JMD', 0, 0, 'New broker awaiting FSC approval.');

-- ── CLIENTS ────────────────────────────────────────────────────────

DO $$
DECLARE
  b_bbrowne UUID; b_ngrant UUID; b_fwalters UUID; b_dpersad UUID; b_trolle UUID; b_mchen UUID; b_yburke UUID;
BEGIN
  SELECT id INTO b_bbrowne FROM brokers WHERE email='abrowne@caribrisk.bb';
  SELECT id INTO b_ngrant FROM brokers WHERE email='ngrant@grantshield.jm';
  SELECT id INTO b_fwalters FROM brokers WHERE email='fwalters@caymanpremier.ky';
  SELECT id INTO b_dpersad FROM brokers WHERE email='dpersad@tridentins.tt';
  SELECT id INTO b_trolle FROM brokers WHERE email='trolle@bahamascoverage.bs';
  SELECT id INTO b_mchen FROM brokers WHERE email='mchen@islandcapital.ky';
  SELECT id INTO b_yburke FROM brokers WHERE email='yburke@regassurance.bb';

  INSERT INTO clients (first_name, last_name, company_name, email, phone, segment, island, address, preferred_currency, risk_score, total_insured_value, total_insured_value_currency, notes, broker_id, is_vip, tags) VALUES
    ('Reginald', 'St. Clair-Bowen', NULL, 'rstbowen@privmail.bb', '+1-246-555-7001', 'high_value_homeowner', 'barbados', '12 Plantation Ridge, Sandy Lane, St. James, Barbados', 'BBD', 38, 3800000, 'USD', 'HNW homeowner. Sandy Lane beachfront estate. Preferred VIP client.', b_bbrowne, true, ARRAY['vip','beachfront','hurricane-zone-a']),
    ('Moonrise', 'Beach Resort Ltd', 'Moonrise Beach Resort Ltd', 'admin@moonrisebeach.bb', '+1-246-555-7002', 'boutique_resort', 'barbados', '1 Moonrise Cove, Christ Church, Barbados', 'USD', 62, 8500000, 'USD', '18-room boutique resort. Full hurricane risk package.', b_bbrowne, false, ARRAY['hospitality','beachfront']),
    ('Claudette', 'Harewood-Prescott', NULL, 'charewood@hplaw.bb', '+1-246-555-7003', 'high_value_homeowner', 'barbados', '4 Briarcliffe Heights, St. Philip, Barbados', 'BBD', 45, 1950000, 'USD', 'Attorney. Residential property + contents coverage.', b_yburke, false, ARRAY['residential']),
    ('BuildRight', 'Caribbean Ltd', 'BuildRight Caribbean Ltd', 'contracts@buildright.bb', '+1-246-555-7004', 'construction_company', 'barbados', 'Lears Industrial Estate, St. Michael, Barbados', 'BBD', 71, 12400000, 'USD', 'Active on 3 construction projects. CAR + EAR policies.', b_bbrowne, false, ARRAY['construction','high-risk']),
    ('Derek', 'Alleyne-Hamilton', NULL, 'daleyne@daham.bb', '+1-246-555-7005', 'commercial_owner', 'barbados', '89 Roebuck Street, Bridgetown, St. Michael, Barbados', 'BBD', 54, 4200000, 'USD', 'Commercial plaza. Renewal due Q1 2025.', b_yburke, false, ARRAY['commercial']),
    ('MBD', 'Group Holdings Ltd', 'MBD Group Holdings Ltd', 'info@mbdgroup.jm', '+1-876-555-8001', 'real_estate_developer', 'jamaica', '22 Harbour Street, Montego Bay, St. James, Jamaica', 'JMD', 68, 18600000, 'USD', 'Active developer. 3 residential projects under construction.', b_ngrant, true, ARRAY['developer','vip','construction-linked']),
    ('Yvonne', 'Clarke-Whitfield', NULL, 'yclarke@privmail.jm', '+1-876-555-8002', 'high_value_homeowner', 'jamaica', '8 Clifton Heights Drive, Cherry Gardens, Kingston 8, Jamaica', 'JMD', 49, 2100000, 'USD', 'Residential estate. Claim under fraud review.', b_ngrant, false, ARRAY['residential','fraud-watch']),
    ('Port Antonio', 'Marina Holdings Ltd', 'Port Antonio Marina Holdings Ltd', 'marina@portantoniomarina.jm', '+1-876-555-8003', 'hnw_yacht_owner', 'jamaica', 'Marina Road, Port Antonio, Portland, Jamaica', 'USD', 55, 6800000, 'USD', 'Full marina facility + 12 yacht berths. Hurricane haul-out protocol.', b_ngrant, false, ARRAY['marine','yacht','marina']),
    ('Kingston', 'Commercial Properties', 'KCP Real Estate Ltd', 'kcp@kcpre.jm', '+1-876-555-8004', 'commercial_owner', 'jamaica', '45 New Kingston Drive, Kingston 5, Jamaica', 'JMD', 60, 7400000, 'USD', 'Office and retail portfolio across 4 Kingston locations.', b_ngrant, false, ARRAY['commercial','multi-property']),
    ('Seven Mile', 'Realty Group', 'SMRG International Ltd', 'smrg@sevenmilerealty.ky', '+1-345-555-9001', 'real_estate_developer', 'cayman_islands', 'Governors Square, 23 Lime Tree Bay Ave, Grand Cayman', 'KYD', 44, 24800000, 'USD', 'Top Cayman developer. Beachfront luxury portfolio.', b_fwalters, true, ARRAY['developer','vip','beachfront','luxury']),
    ('Oliver', 'Harrington-Clarke', NULL, 'oharrington@hcfamily.ky', '+1-345-555-9002', 'hnw_yacht_owner', 'cayman_islands', 'Yacht Club Dr, North Sound, Grand Cayman', 'KYD', 32, 4600000, 'USD', 'HNW yacht owner. 58ft sailing vessel + 36ft motor yacht.', b_mchen, true, ARRAY['yacht','marine','vip','hnw']),
    ('Grand Cayman', 'Boutique Hotels Ltd', 'Grand Cayman Boutique Hotels Ltd', 'gm@grandcaymanhotels.ky', '+1-345-555-9003', 'boutique_resort', 'cayman_islands', 'West Bay Road, Seven Mile Beach, Grand Cayman', 'KYD', 40, 11200000, 'USD', '32-room boutique hotel. Full cat coverage.', b_fwalters, false, ARRAY['hospitality','beachfront']),
    ('Marcus', 'Reynolds', 'Bayview Group Ltd', 'mreynolds@bayviewgroup.bb', '+1-246-555-7006', 'commercial_owner', 'barbados', '22 Bay Street, Bridgetown, Barbados', 'USD', 78, 3200000, 'USD', 'Subject of active fraud investigation. Multiple claims pattern.', b_bbrowne, false, ARRAY['commercial','fraud-flagged']),
    ('TCI', 'Construction Group', 'TCI Construction International Ltd', 'projects@tcigroup.tt', '+1-868-555-0601', 'construction_company', 'trinidad_tobago', 'Eastern Main Road, Arima, Trinidad', 'TTD', 66, 9800000, 'USD', 'Large construction company. Industrial-grade policy.', b_dpersad, false, ARRAY['construction','industrial']),
    ('Angeline', 'Mohammed-Ramlal', NULL, 'amramlal@privmail.tt', '+1-868-555-0602', 'high_value_homeowner', 'trinidad_tobago', '14 Maraval Road, St. Clair, Port of Spain, Trinidad', 'TTD', 35, 2400000, 'USD', 'Executive residential property. Low risk profile.', b_dpersad, false, ARRAY['residential']),
    ('Nassau Harbor', 'Developments Ltd', 'NHD Property Group Ltd', 'nhd@nassauharbor.bs', '+1-242-555-1101', 'real_estate_developer', 'bahamas', 'East Bay Street, Nassau, New Providence, Bahamas', 'BSD', 72, 28400000, 'USD', 'Largest Bahamas client. Mixed-use waterfront development.', b_trolle, true, ARRAY['developer','vip','waterfront','cat5-zone']),
    ('Cayman Crest', 'Resort Holdings Ltd', 'Cayman Crest Resort Holdings Ltd', 'admin@ccresort.bs', '+1-242-555-1102', 'boutique_resort', 'bahamas', 'Lyford Cay Road, Nassau, Bahamas', 'USD', 85, 6200000, 'USD', 'High-value resort. Confirmed fraud investigation on recent claim.', b_trolle, false, ARRAY['hospitality','fraud-confirmed']),
    ('Elizabeth', 'McIntosh-Williams', NULL, 'emcintosh@privmail.bs', '+1-242-555-1103', 'high_value_homeowner', 'bahamas', '7 Lyford Cay Drive, Nassau, New Providence, Bahamas', 'USD', 48, 3100000, 'USD', 'Lyford Cay estate. Renewal due March 2025.', b_trolle, false, ARRAY['residential','beachfront']);
END $$;

-- ── POLICIES ───────────────────────────────────────────────────────

DO $$
DECLARE
  c_stclair UUID; c_moonrise UUID; c_harewood UUID; c_buildright UUID; c_alleyne UUID;
  c_mbd UUID; c_clarke UUID; c_marina UUID; c_kcp UUID;
  c_smrg UUID; c_harrington UUID; c_gchotels UUID; c_reynolds UUID;
  c_tci UUID; c_mohammed UUID;
  c_nhd UUID; c_ccresort UUID; c_emcintosh UUID;
  b_bbrowne UUID; b_ngrant UUID; b_fwalters UUID; b_dpersad UUID; b_trolle UUID; b_mchen UUID; b_yburke UUID;
BEGIN
  SELECT id INTO c_stclair FROM clients WHERE email='rstbowen@privmail.bb';
  SELECT id INTO c_moonrise FROM clients WHERE email='admin@moonrisebeach.bb';
  SELECT id INTO c_harewood FROM clients WHERE email='charewood@hplaw.bb';
  SELECT id INTO c_buildright FROM clients WHERE email='contracts@buildright.bb';
  SELECT id INTO c_alleyne FROM clients WHERE email='daleyne@daham.bb';
  SELECT id INTO c_mbd FROM clients WHERE email='info@mbdgroup.jm';
  SELECT id INTO c_clarke FROM clients WHERE email='yclarke@privmail.jm';
  SELECT id INTO c_marina FROM clients WHERE email='marina@portantoniomarina.jm';
  SELECT id INTO c_kcp FROM clients WHERE email='kcp@kcpre.jm';
  SELECT id INTO c_smrg FROM clients WHERE email='smrg@sevenmilerealty.ky';
  SELECT id INTO c_harrington FROM clients WHERE email='oharrington@hcfamily.ky';
  SELECT id INTO c_gchotels FROM clients WHERE email='gm@grandcaymanhotels.ky';
  SELECT id INTO c_reynolds FROM clients WHERE email='mreynolds@bayviewgroup.bb';
  SELECT id INTO c_tci FROM clients WHERE email='projects@tcigroup.tt';
  SELECT id INTO c_mohammed FROM clients WHERE email='amramlal@privmail.tt';
  SELECT id INTO c_nhd FROM clients WHERE email='nhd@nassauharbor.bs';
  SELECT id INTO c_ccresort FROM clients WHERE email='admin@ccresort.bs';
  SELECT id INTO c_emcintosh FROM clients WHERE email='emcintosh@privmail.bs';
  SELECT id INTO b_bbrowne FROM brokers WHERE email='abrowne@caribrisk.bb';
  SELECT id INTO b_ngrant FROM brokers WHERE email='ngrant@grantshield.jm';
  SELECT id INTO b_fwalters FROM brokers WHERE email='fwalters@caymanpremier.ky';
  SELECT id INTO b_dpersad FROM brokers WHERE email='dpersad@tridentins.tt';
  SELECT id INTO b_trolle FROM brokers WHERE email='trolle@bahamascoverage.bs';
  SELECT id INTO b_mchen FROM brokers WHERE email='mchen@islandcapital.ky';
  SELECT id INTO b_yburke FROM brokers WHERE email='yburke@regassurance.bb';

  INSERT INTO policies (policy_number, client_id, broker_id, coverage_type, status, island, insured_value, currency, annual_premium, premium_currency, start_date, end_date, renewal_date, risk_score, wind_zone, flood_zone, structural_compliance_rating, construction_year, property_address, notes, hurricane_deductible_pct) VALUES
    ('AAG-2024-010001', c_stclair, b_bbrowne, 'residential', 'active', 'barbados', 3800000, 'USD', 52000, 'USD', '2024-01-15', '2025-01-15', '2025-01-15', 38, 'Zone A', 'FZ-AE', 84, 1998, '12 Plantation Ridge, Sandy Lane, St. James, Barbados', 'HNW beachfront estate. Hurricane deductible applies.', 5.0),
    ('AAG-2024-010002', c_moonrise, b_bbrowne, 'hospitality', 'active', 'barbados', 8500000, 'USD', 148750, 'USD', '2024-02-01', '2025-02-01', '2025-02-01', 62, 'Zone A', 'FZ-AE', 78, 2006, '1 Moonrise Cove, Christ Church, Barbados', 'Full business interruption included.', 5.0),
    ('AAG-2024-010003', c_harewood, b_yburke, 'residential', 'active', 'barbados', 1950000, 'USD', 24375, 'USD', '2024-03-15', '2025-03-15', '2025-03-15', 45, 'Zone B', 'FZ-X', 79, 2003, '4 Briarcliffe Heights, St. Philip, Barbados', NULL, 4.0),
    ('AAG-2024-010004', c_buildright, b_bbrowne, 'construction', 'active', 'barbados', 12400000, 'USD', 248000, 'USD', '2024-04-01', '2025-04-01', '2025-04-01', 71, 'Zone A', 'FZ-AE', 62, NULL, 'Lears Industrial Estate, St. Michael, Barbados', 'CAR + EAR. Three concurrent projects.', 6.0),
    ('AAG-2024-010005', c_alleyne, b_yburke, 'commercial', 'renewal_due', 'barbados', 4200000, 'USD', 58800, 'USD', '2024-01-01', '2025-01-01', '2025-01-01', 54, 'Zone B', 'FZ-X', 74, 1989, '89 Roebuck Street, Bridgetown, St. Michael, Barbados', NULL, 4.5),
    ('AAG-2024-010006', c_reynolds, b_bbrowne, 'commercial', 'active', 'barbados', 3200000, 'USD', 44800, 'USD', '2024-06-15', '2025-06-15', '2025-06-15', 78, 'Zone A', 'FZ-AE', 58, 1994, '22 Bay Street, Bridgetown, Barbados', 'Subject of fraud investigation. Flag for renewal.', 5.0),
    ('AAG-2024-010007', c_mbd, b_ngrant, 'real_estate', 'active', 'jamaica', 18600000, 'USD', 279000, 'USD', '2024-01-20', '2025-01-20', '2025-01-20', 68, 'Zone B', 'FZ-AE', 71, NULL, '22 Harbour Street, Montego Bay, St. James, Jamaica', 'Developer portfolio. 3 active projects.', 5.5),
    ('AAG-2024-010008', c_clarke, b_ngrant, 'residential', 'active', 'jamaica', 2100000, 'USD', 29400, 'USD', '2024-08-01', '2025-08-01', '2025-08-01', 49, 'Zone B', 'FZ-X', 77, 2001, '8 Clifton Heights Drive, Cherry Gardens, Kingston 8, Jamaica', 'Fraud investigation open on claim CLM-2024-050007.', 4.5),
    ('AAG-2024-010009', c_marina, b_ngrant, 'yacht_marine', 'active', 'jamaica', 6800000, 'USD', 119000, 'USD', '2024-02-15', '2025-02-15', '2025-02-15', 55, 'Zone A', 'FZ-AE', 68, 1998, 'Marina Road, Port Antonio, Portland, Jamaica', 'Full marina + 12 berths. Hurricane haul-out clause.', 5.0),
    ('AAG-2024-010010', c_kcp, b_ngrant, 'commercial', 'active', 'jamaica', 7400000, 'USD', 103600, 'USD', '2024-03-01', '2025-03-01', '2025-03-01', 60, 'Zone B', 'FZ-X', 72, 2008, '45 New Kingston Drive, Kingston 5, Jamaica', NULL, 4.5),
    ('AAG-2024-010011', c_smrg, b_fwalters, 'real_estate', 'active', 'cayman_islands', 24800000, 'USD', 396800, 'USD', '2024-01-10', '2025-01-10', '2025-01-10', 44, 'Zone A', 'FZ-AE', 88, NULL, 'Governors Square, 23 Lime Tree Bay Ave, Grand Cayman', 'Premier Cayman developer. Facultative reinsurance attached.', 5.0),
    ('AAG-2024-010012', c_harrington, b_mchen, 'yacht_marine', 'active', 'cayman_islands', 4600000, 'USD', 80500, 'USD', '2024-03-15', '2025-03-15', '2025-03-15', 32, 'Zone A', 'FZ-AE', 91, 2018, 'Yacht Club Dr, North Sound, Grand Cayman', '58ft sailing + 36ft motor yacht. Caribbean navigation limits.', 4.0),
    ('AAG-2024-010013', c_gchotels, b_fwalters, 'hospitality', 'active', 'cayman_islands', 11200000, 'USD', 179200, 'USD', '2024-02-01', '2025-02-01', '2025-02-01', 40, 'Zone A', 'FZ-AE', 85, 2011, 'West Bay Road, Seven Mile Beach, Grand Cayman', NULL, 5.0),
    ('AAG-2024-010014', c_tci, b_dpersad, 'construction', 'active', 'trinidad_tobago', 9800000, 'USD', 176400, 'USD', '2024-05-01', '2025-05-01', '2025-05-01', 66, 'Zone C', 'FZ-X', 65, NULL, 'Eastern Main Road, Arima, Trinidad', 'Industrial-grade construction policy.', 5.0),
    ('AAG-2024-010015', c_mohammed, b_dpersad, 'residential', 'active', 'trinidad_tobago', 2400000, 'USD', 30000, 'USD', '2024-04-15', '2025-04-15', '2025-04-15', 35, 'Zone C', 'FZ-X', 81, 2009, '14 Maraval Road, St. Clair, Port of Spain, Trinidad', NULL, 3.5),
    ('AAG-2024-010016', c_nhd, b_trolle, 'real_estate', 'active', 'bahamas', 28400000, 'USD', 497000, 'USD', '2024-01-05', '2025-01-05', '2025-01-05', 72, 'Zone A', 'FZ-AE', 76, NULL, 'East Bay Street, Nassau, New Providence, Bahamas', 'Largest single policy in portfolio.', 5.5),
    ('AAG-2024-010017', c_ccresort, b_trolle, 'hospitality', 'active', 'bahamas', 6200000, 'USD', 108500, 'USD', '2024-03-01', '2025-03-01', '2025-03-01', 85, 'Zone A', 'FZ-AE', 69, 2000, 'Lyford Cay Road, Nassau, Bahamas', 'Confirmed fraud on CLM-2024-050009. Renewal under review.', 6.0),
    ('AAG-2024-010018', c_emcintosh, b_trolle, 'residential', 'renewal_due', 'bahamas', 3100000, 'USD', 43400, 'USD', '2024-03-15', '2025-03-15', '2025-03-15', 48, 'Zone A', 'FZ-AE', 80, 2004, '7 Lyford Cay Drive, Nassau, New Providence, Bahamas', NULL, 4.5);
END $$;

-- ── REINSURANCE TREATIES ───────────────────────────────────────────

INSERT INTO reinsurance_treaties (treaty_name, reinsurer_name, treaty_type, islands_covered, inception_date, expiry_date, limit_amount, retention, currency, cession_rate, attachment_point, premium_ceded, exposure_ceded, loss_recoverable, status, notes) VALUES
  ('Caribbean Cat XL Layer 1 2024', 'Hannover Re', 'catastrophe_xl', ARRAY['barbados','jamaica','cayman_islands','trinidad_tobago','bahamas']::island[], '2024-01-01', '2024-12-31', 5000000, 5000000, 'USD', NULL, 5000000, 1240000, 18600000, 420000, 'active', 'First layer cat XL. Attachment $5M xs $5M. Beryl losses attaching.'),
  ('Caribbean Cat XL Layer 2 2024', 'Swiss Re', 'catastrophe_xl', ARRAY['barbados','jamaica','cayman_islands','trinidad_tobago','bahamas']::island[], '2024-01-01', '2024-12-31', 10000000, 15000000, 'USD', NULL, 15000000, 2180000, 28400000, 0, 'active', 'Second layer. $10M xs $15M. No losses attaching yet.'),
  ('Caribbean Cat XL Layer 3 2024', 'Munich Re', 'catastrophe_xl', ARRAY['barbados','jamaica','cayman_islands','bahamas']::island[], '2024-01-01', '2024-12-31', 25000000, 25000000, 'USD', NULL, 25000000, 4250000, 52000000, 0, 'active', 'Top layer protection. Excludes T&T.'),
  ('Portfolio Quota Share 2024', 'Lloyd''s Syndicate 2623', 'quota_share', ARRAY['barbados','jamaica','cayman_islands','trinidad_tobago','bahamas']::island[], '2024-01-01', '2024-12-31', 0, 0, 'USD', 30.00, NULL, 9570000, 25599000, 2840000, 'active', '30% quota share across all perils and lines.'),
  ('T&T Excess of Loss 2024', 'General Re', 'excess_of_loss', ARRAY['trinidad_tobago']::island[], '2024-01-01', '2024-12-31', 8000000, 2000000, 'USD', NULL, 2000000, 410000, 12200000, 0, 'active', 'T&T-specific XL. $8M xs $2M per risk.'),
  ('Cayman Facultative — SMRG', 'Swiss Re', 'facultative', ARRAY['cayman_islands']::island[], '2024-01-10', '2025-01-10', 15000000, 9800000, 'USD', NULL, 9800000, 1240000, 24800000, 0, 'active', 'Facultative cover for Seven Mile Realty Group.');

-- ── CLAIMS ─────────────────────────────────────────────────────────

DO $$
DECLARE
  p_moonrise UUID; p_mbd UUID; p_clarke UUID; p_nhd UUID; p_buildright UUID;
  p_ccresort UUID; p_reynolds UUID; p_marina UUID; p_smrg UUID; p_gchotels UUID;
  c_moonrise UUID; c_mbd UUID; c_clarke UUID; c_nhd UUID; c_buildright UUID;
  c_ccresort UUID; c_reynolds UUID; c_marina UUID; c_smrg UUID; c_gchotels UUID;
  adj_hutchinson UUID; adj_alleyne UUID; adj_campbell UUID; adj_morrison UUID; adj_ebanks UUID; adj_mcintosh UUID;
BEGIN
  SELECT id INTO p_moonrise FROM policies WHERE policy_number='AAG-2024-010002';
  SELECT id INTO p_mbd FROM policies WHERE policy_number='AAG-2024-010007';
  SELECT id INTO p_clarke FROM policies WHERE policy_number='AAG-2024-010008';
  SELECT id INTO p_nhd FROM policies WHERE policy_number='AAG-2024-010016';
  SELECT id INTO p_buildright FROM policies WHERE policy_number='AAG-2024-010004';
  SELECT id INTO p_ccresort FROM policies WHERE policy_number='AAG-2024-010017';
  SELECT id INTO p_reynolds FROM policies WHERE policy_number='AAG-2024-010006';
  SELECT id INTO p_marina FROM policies WHERE policy_number='AAG-2024-010009';
  SELECT id INTO p_smrg FROM policies WHERE policy_number='AAG-2024-010011';
  SELECT id INTO p_gchotels FROM policies WHERE policy_number='AAG-2024-010013';
  SELECT id INTO c_moonrise FROM clients WHERE email='admin@moonrisebeach.bb';
  SELECT id INTO c_mbd FROM clients WHERE email='info@mbdgroup.jm';
  SELECT id INTO c_clarke FROM clients WHERE email='yclarke@privmail.jm';
  SELECT id INTO c_nhd FROM clients WHERE email='nhd@nassauharbor.bs';
  SELECT id INTO c_buildright FROM clients WHERE email='contracts@buildright.bb';
  SELECT id INTO c_ccresort FROM clients WHERE email='admin@ccresort.bs';
  SELECT id INTO c_reynolds FROM clients WHERE email='mreynolds@bayviewgroup.bb';
  SELECT id INTO c_marina FROM clients WHERE email='marina@portantoniomarina.jm';
  SELECT id INTO c_smrg FROM clients WHERE email='smrg@sevenmilerealty.ky';
  SELECT id INTO c_gchotels FROM clients WHERE email='gm@grandcaymanhotels.ky';
  SELECT id INTO adj_hutchinson FROM adjusters WHERE email='dhutchinson@antillia.bb';
  SELECT id INTO adj_alleyne FROM adjusters WHERE email='malleyne@antillia.bb';
  SELECT id INTO adj_campbell FROM adjusters WHERE email='tcampbell@antillia.jm';
  SELECT id INTO adj_morrison FROM adjusters WHERE email='smorrison@antillia.jm';
  SELECT id INTO adj_ebanks FROM adjusters WHERE email='cebanks@antillia.ky';
  SELECT id INTO adj_mcintosh FROM adjusters WHERE email='jmcintosh@antillia.bs';

  INSERT INTO claims (claim_number, policy_id, client_id, adjuster_id, status, coverage_type, catastrophe_event, storm_name, incident_date, fnol_date, reported_loss, assessed_loss, approved_amount, settlement_amount, currency, fx_rate_usd, description, property_address, island, fraud_risk, fraud_flags, adjuster_notes, settlement_date) VALUES
    ('CLM-2024-050001', p_moonrise, c_moonrise, adj_hutchinson, 'settled', 'hospitality', 'hurricane', 'Beryl', '2024-07-01', '2024-07-03', 185000, 168000, 168000, 165000, 'USD', 1.0, 'Hurricane Beryl caused significant damage to the east wing roof, pool area, and landscaping. Two guest villas required full interior remediation.', '1 Moonrise Cove, Christ Church, Barbados', 'barbados', 'clear', NULL, 'Damage consistent with storm report. Contractor estimates verified.', '2024-09-15'),
    ('CLM-2024-050002', p_buildright, c_buildright, adj_alleyne, 'approved', 'construction', 'hurricane', 'Beryl', '2024-07-02', '2024-07-04', 440000, 390000, 390000, NULL, 'USD', 1.0, 'Scaffolding collapse and structural damage to north elevation of Phase 2 building at Lears Industrial site due to Category 3 wind conditions.', 'Lears Industrial Estate, St. Michael, Barbados', 'barbados', 'clear', NULL, 'Site inspection confirmed. CAR policy applies. Awaiting contractor commencement.', NULL),
    ('CLM-2024-050003', p_reynolds, c_reynolds, adj_alleyne, 'fraud_investigation', 'commercial', 'hurricane', 'Beryl', '2024-07-01', '2024-07-05', 580000, NULL, NULL, NULL, 'USD', 1.0, 'Policyholder claims total destruction of ground floor retail units and inventory following Hurricane Beryl. CCTV footage shows property was vacant prior to storm.', '22 Bay Street, Bridgetown, Barbados', 'barbados', 'flagged', ARRAY['3rd claim in 14 months','Pre-storm vacancy confirmed by CCTV','Contractor not on approved panel','Invoice appears post-dated'], 'SIU referral recommended. Do not approve.', NULL),
    ('CLM-2024-050004', p_mbd, c_mbd, adj_campbell, 'assessment_complete', 'real_estate', 'hurricane', 'Beryl', '2024-07-02', '2024-07-06', 1240000, 980000, NULL, NULL, 'USD', 1.0, 'Flood damage to basement parking and ground floor units of MBD Phase 1 residential building in Montego Bay due to storm surge.', '22 Harbour Street, Montego Bay, St. James, Jamaica', 'jamaica', 'clear', NULL, 'Flood damage confirmed. Hydrology report requested. Assessed at $980K.', NULL),
    ('CLM-2024-050005', p_nhd, c_nhd, adj_mcintosh, 'settled', 'real_estate', 'hurricane', 'Beryl', '2024-07-01', '2024-07-02', 2800000, 2650000, 2650000, 2580000, 'USD', 1.0, 'Major structural damage across Nassau Harbor Development site. Hurricane Beryl made near-direct landfall causing complete loss of two partially-constructed buildings.', 'East Bay Street, Nassau, New Providence, Bahamas', 'bahamas', 'clear', NULL, 'Catastrophe claim. Total direct hit. Cat XL Layer 1 partially attaches.', '2024-10-20'),
    ('CLM-2024-050006', p_marina, c_marina, adj_morrison, 'adjuster_assigned', 'yacht_marine', 'hurricane', 'Beryl', '2024-07-02', '2024-07-07', 380000, NULL, NULL, NULL, 'USD', 1.0, 'Three yachts sustained significant damage during haul-out procedures. Marina dock partial structural damage.', 'Marina Road, Port Antonio, Portland, Jamaica', 'jamaica', 'clear', NULL, NULL, NULL),
    ('CLM-2024-050007', p_clarke, c_clarke, adj_campbell, 'under_review', 'residential', NULL, NULL, '2024-08-15', '2024-08-17', 1250000, NULL, NULL, NULL, 'USD', 1.0, 'Policyholder claims total interior loss from burst pipe. Amount appears inconsistent with property age and insured value.', '8 Clifton Heights Drive, Cherry Gardens, Kingston 8, Jamaica', 'jamaica', 'suspicious', ARRAY['Claim filed 44 days after inception','Loss disproportionate to insured value','No inspection photos from contractor'], NULL, NULL),
    ('CLM-2024-050008', p_smrg, c_smrg, adj_ebanks, 'inspection_scheduled', 'real_estate', 'hurricane', 'Beryl', '2024-07-03', '2024-07-08', 650000, NULL, NULL, NULL, 'USD', 1.0, 'Foundation cracking and site drainage damage at Seven Mile beach development plot. Storm surge caused sub-surface damage.', 'Governors Square, 23 Lime Tree Bay Ave, Grand Cayman', 'cayman_islands', 'clear', NULL, NULL, NULL),
    ('CLM-2024-050009', p_ccresort, c_ccresort, adj_mcintosh, 'fraud_investigation', 'hospitality', 'hurricane', 'Beryl', '2024-07-01', '2024-07-03', 2800000, 880000, NULL, NULL, 'USD', 1.0, 'Policyholder claims total loss of spa wing, 8 guest rooms, and all FF&E. Independent adjuster assessed actual damage at approximately $880K.', 'Lyford Cay Road, Nassau, Bahamas', 'bahamas', 'confirmed_fraud', ARRAY['Reported loss 3.2x independently assessed value','Prior claim same property 2022','Owner-related contractor entity','Guest records contradict BI claim'], 'Confirmed fraud. RBPF referral submitted 2024-10-05.', NULL),
    ('CLM-2024-050010', p_gchotels, c_gchotels, adj_ebanks, 'fnol_received', 'hospitality', 'hurricane', 'Beryl', '2024-07-04', '2024-07-09', 480000, NULL, NULL, NULL, 'USD', 1.0, 'Pool deck collapse and damage to outdoor restaurant area. Initial photos submitted via broker.', 'West Bay Road, Seven Mile Beach, Grand Cayman', 'cayman_islands', 'clear', NULL, NULL, NULL);
END $$;

-- ── FRAUD ALERTS ───────────────────────────────────────────────────

DO $$
DECLARE
  clm_reynolds UUID; clm_clarke UUID; clm_ccresort UUID;
  c_reynolds UUID; c_clarke UUID; c_ccresort UUID;
BEGIN
  SELECT id INTO clm_reynolds FROM claims WHERE claim_number='CLM-2024-050003';
  SELECT id INTO clm_clarke FROM claims WHERE claim_number='CLM-2024-050007';
  SELECT id INTO clm_ccresort FROM claims WHERE claim_number='CLM-2024-050009';
  SELECT id INTO c_reynolds FROM clients WHERE email='mreynolds@bayviewgroup.bb';
  SELECT id INTO c_clarke FROM clients WHERE email='yclarke@privmail.jm';
  SELECT id INTO c_ccresort FROM clients WHERE email='admin@ccresort.bs';

  INSERT INTO fraud_alerts (claim_id, client_id, alert_type, risk_score, flags, status, assigned_to, resolution_notes) VALUES
    (clm_reynolds, c_reynolds, 'Multiple Claims Pattern', 82, ARRAY['3rd claim in 14 months','Vacancy confirmed by CCTV','Unapproved contractor','Post-dated invoice'], 'escalated', 'Marcus Alleyne', 'Referred to SIU. Police inquiry pending.'),
    (clm_clarke, c_clarke, 'Early Claim Filing & Value Inflation', 64, ARRAY['Claim filed 44 days after inception','Loss disproportionate to insured value','No inspection photos'], 'under_review', 'Trevor Campbell', NULL),
    (clm_ccresort, c_ccresort, 'Gross Value Inflation — Confirmed', 91, ARRAY['Reported loss 3.2x assessed value','Prior claim same property','Owner-related contractor entity','Guest records contradict BI claim'], 'escalated', 'James McIntosh', 'Confirmed fraud. RBPF referral 2024-10-05.');
END $$;

-- ── POLICY ENDORSEMENTS ────────────────────────────────────────────

DO $$
DECLARE p_moonrise UUID; p_nhd UUID; p_smrg UUID;
BEGIN
  SELECT id INTO p_moonrise FROM policies WHERE policy_number='AAG-2024-010002';
  SELECT id INTO p_nhd FROM policies WHERE policy_number='AAG-2024-010016';
  SELECT id INTO p_smrg FROM policies WHERE policy_number='AAG-2024-010011';

  INSERT INTO policy_endorsements (policy_id, type, description, additional_premium, currency, effective_date) VALUES
    (p_moonrise, 'Business Interruption Extension', 'Extended BI cover for 12 months income loss following named storm event.', 18500, 'USD', '2024-02-01'),
    (p_moonrise, 'Event Cancellation', 'Coverage for weddings and events cancelled due to hurricane warning.', 4200, 'USD', '2024-03-01'),
    (p_nhd, 'Expediting Expenses', 'Additional coverage for overtime costs to accelerate post-storm rebuild.', 28000, 'USD', '2024-01-05'),
    (p_nhd, 'Delay In Start-Up', 'DSU coverage for 6-month delay following catastrophe event.', 42000, 'USD', '2024-01-05'),
    (p_smrg, 'Coastal Erosion Extension', 'Covers gradual coastal erosion damage to beachfront structures.', 12400, 'USD', '2024-02-01');
END $$;

-- ── UPDATE HURRICANE EXPOSURE CACHE ───────────────────────────────

UPDATE hurricane_exposure_cache SET
  total_policies=6, total_exposure=34050000, cat_1_2_exposure=7900000, cat_3_4_exposure=5100000, cat_5_exposure=3500000, extreme_wind_zone_policies=4, flood_zone_policies=3, avg_structural_compliance=72.5
WHERE island='barbados';

UPDATE hurricane_exposure_cache SET
  total_policies=4, total_exposure=34900000, cat_1_2_exposure=6700000, cat_3_4_exposure=4800000, cat_5_exposure=3000000, extreme_wind_zone_policies=3, flood_zone_policies=2, avg_structural_compliance=72.0
WHERE island='jamaica';

UPDATE hurricane_exposure_cache SET
  total_policies=3, total_exposure=40600000, cat_1_2_exposure=10200000, cat_3_4_exposure=7600000, cat_5_exposure=4500000, extreme_wind_zone_policies=3, flood_zone_policies=3, avg_structural_compliance=88.0
WHERE island='cayman_islands';

UPDATE hurricane_exposure_cache SET
  total_policies=2, total_exposure=12200000, cat_1_2_exposure=2900000, cat_3_4_exposure=2100000, cat_5_exposure=1300000, extreme_wind_zone_policies=1, flood_zone_policies=1, avg_structural_compliance=73.0
WHERE island='trinidad_tobago';

UPDATE hurricane_exposure_cache SET
  total_policies=3, total_exposure=37700000, cat_1_2_exposure=10700000, cat_3_4_exposure=8900000, cat_5_exposure=4800000, extreme_wind_zone_policies=3, flood_zone_policies=2, avg_structural_compliance=75.0
WHERE island='bahamas';
