-- ═══════════════════════════════════════════════════════════════════════════
-- ANTILLIA ASSURANCE GROUP — COMPREHENSIVE HISTORICAL SEED DATA
-- Represents ~10 years of operation (2015–2024) across 5 Caribbean islands
-- Hurricane seasons: Matthew 2016, Irma/Maria 2017, Dorian 2019, Beryl 2024
-- Run AFTER supabase-schema.sql in the Supabase SQL editor
-- ═══════════════════════════════════════════════════════════════════════════

-- ── ADJUSTERS (8 field adjusters across all islands) ─────────────────────

INSERT INTO adjusters (id, name, email, phone, island, specialization, license_number, daily_rate, currency, active_claims, is_available, notes) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Marcus Alleyne',     'malleyne@antillia.bb',     '+1-246-555-0101', 'barbados',        'catastrophe', 'BB-ADJ-2016-0041', 520, 'USD', 3, true,  'Senior CAT adjuster. Handled Irma surge 2017.'),
  ('a1000000-0000-0000-0000-000000000002', 'Diane Hutchinson',   'dhutchinson@antillia.bb',  '+1-246-555-0102', 'barbados',        'hospitality',  'BB-ADJ-2018-0077', 440, 'USD', 2, true,  'Hospitality & HNW residential specialist.'),
  ('a1000000-0000-0000-0000-000000000003', 'Trevor Campbell',    'tcampbell@antillia.jm',    '+1-876-555-0201', 'jamaica',         'commercial',  'JA-ADJ-2015-0033', 480, 'USD', 4, true,  'Commercial & construction. 9 years with Antillia.'),
  ('a1000000-0000-0000-0000-000000000004', 'Sandra Morrison',    'smorrison@antillia.jm',    '+1-876-555-0202', 'jamaica',         'marine',       'JA-ADJ-2019-0088', 460, 'USD', 1, true,  'Marine & yacht specialist.'),
  ('a1000000-0000-0000-0000-000000000005', 'Colin Ebanks',       'cebanks@antillia.ky',      '+1-345-555-0301', 'cayman_islands',  'commercial',  'KY-ADJ-2017-0022', 580, 'USD', 2, true,  'Cayman commercial portfolio lead.'),
  ('a1000000-0000-0000-0000-000000000006', 'Priya Ramchandran',  'pramchandran@antillia.tt', '+1-868-555-0401', 'trinidad_tobago', 'construction','TT-ADJ-2018-0055', 410, 'USD', 0, false, 'On medical leave until Jan 2025.'),
  ('a1000000-0000-0000-0000-000000000007', 'James McIntosh',     'jmcintosh@antillia.bs',    '+1-242-555-0501', 'bahamas',         'catastrophe', 'BS-ADJ-2016-0019', 510, 'USD', 5, true,  'Dorian 2019 lead adjuster. Highest claim volume.'),
  ('a1000000-0000-0000-0000-000000000008', 'Ketura Francis',     'kfrancis@antillia.ky',     '+1-345-555-0302', 'cayman_islands',  'marine',       'KY-ADJ-2020-0038', 490, 'USD', 2, true,  'Yacht & marine, HNW residential.')
ON CONFLICT (id) DO NOTHING;

-- ── BROKERS (8 brokers, longest running since 2015) ──────────────────────

INSERT INTO brokers (id, name, company, email, phone, island, license_number, status, commission_rate, ytd_premium_volume, ytd_commission_earned, currency, policy_count, client_count, notes) VALUES
  ('b1000000-0000-0000-0000-000000000001', 'Alicia Browne',   'Caribbean Risk Partners',      'abrowne@caribrisk.bb',      '+1-246-555-1001', 'barbados',        'BB-BRK-2015-0041', 'active',           12.50, 6820000, 852500, 'USD', 38, 28, 'Top Barbados producer since founding. Hospitality & HNW residential focus.'),
  ('b1000000-0000-0000-0000-000000000002', 'Neville Grant',   'GrantShield Insurance',        'ngrant@grantshield.jm',     '+1-876-555-2001', 'jamaica',         'JA-BRK-2016-0088', 'active',           11.00, 4640000, 510400, 'USD', 27, 21, 'Commercial portfolio. Developer relationships Montego Bay & Kingston.'),
  ('b1000000-0000-0000-0000-000000000003', 'Fiona Walters',   'Cayman Premier Brokers',       'fwalters@caymanpremier.ky', '+1-345-555-3001', 'cayman_islands',  'KY-BRK-2016-0012', 'active',           13.00, 8980000, 1167400,'USD', 46, 34, 'Highest volume broker group-wide. Cayman commercial & marine dominant.'),
  ('b1000000-0000-0000-0000-000000000004', 'Dion Persad',     'Trident Insurance Services',   'dpersad@tridentins.tt',     '+1-868-555-4001', 'trinidad_tobago', 'TT-BRK-2017-0067', 'active',           10.50, 3180000, 333900, 'USD', 22, 17, 'Construction & energy sector specialist. T&T and regional.'),
  ('b1000000-0000-0000-0000-000000000005', 'Tamara Rolle',    'Bahamas Coverage Group',       'trolle@bahamascoverage.bs', '+1-242-555-5001', 'bahamas',         'BS-BRK-2015-0031', 'active',           12.00, 9440000, 1132800,'USD', 51, 36, 'Largest Bahamas portfolio. Rebuilt book post-Dorian 2019.'),
  ('b1000000-0000-0000-0000-000000000006', 'Michael Chen',    'Island Capital Insurance',     'mchen@islandcapital.ky',    '+1-345-555-3002', 'cayman_islands',  'KY-BRK-2019-0019', 'active',           11.50, 4290000, 493350, 'USD', 25, 19, 'HNW yacht & marine specialist. Growing since 2019.'),
  ('b1000000-0000-0000-0000-000000000007', 'Yolanda Burke',   'Regional Assurance Brokers',   'yburke@regassurance.bb',    '+1-246-555-1002', 'barbados',        'BB-BRK-2018-0055', 'active',           10.00, 2840000, 284000, 'USD', 18, 13, 'Boutique resort niche. Growing steadily.'),
  ('b1000000-0000-0000-0000-000000000008', 'Conrad Ramsey',   'Ramsey & Partners',            'cramsey@ramseypartners.jm', '+1-876-555-2002', 'jamaica',         'JA-BRK-2022-0103', 'pending_approval', 10.00, 0,       0,      'USD',  0,  0, 'New broker awaiting FSC approval. Referred by Neville Grant.')
ON CONFLICT (id) DO NOTHING;

-- ── CLIENTS (24 clients spanning all segments and islands) ───────────────

INSERT INTO clients (id, first_name, last_name, company_name, email, phone, segment, island, address, preferred_currency, risk_score, total_insured_value, total_insured_value_currency, notes, broker_id, is_vip) VALUES
  -- Barbados
  ('c1000000-0000-0000-0000-000000000001', 'Eleanor',  'St. John-Harewood', NULL,                          'estjohn@harewoodestates.bb', '+1-246-555-2001', 'high_value_homeowner', 'barbados',       'Sandy Lane Estate, St. James, Barbados',         'BBD', 38, 4200000,  'USD', 'VIP. Sandy Lane villa portfolio. Client since 2015.',  'b1000000-0000-0000-0000-000000000001', true),
  ('c1000000-0000-0000-0000-000000000002', 'Bayview',  'Group',             'Bayview Commercial Group',    'admin@bayviewgroup.bb',      '+1-246-555-2002', 'commercial_owner',     'barbados',       'Warrens Business Park, St. Michael, Barbados',   'BBD', 52, 8700000,  'USD', 'Commercial property portfolio. 3 office parks.',        'b1000000-0000-0000-0000-000000000001', false),
  ('c1000000-0000-0000-0000-000000000003', 'Coral',    'Bay',               'Coral Bay Resort & Spa',      'gm@coralbayresort.bb',       '+1-246-555-2003', 'boutique_resort',      'barbados',       'Mullins Bay, St. Peter, Barbados',                'BBD', 61, 12400000, 'USD', 'Boutique resort. Hurricane Matthew damage 2016.',       'b1000000-0000-0000-0000-000000000001', true),
  ('c1000000-0000-0000-0000-000000000004', 'Bridgetown', 'Builders',        'Bridgetown Builders Ltd',     'contracts@bbl.bb',           '+1-246-555-2004', 'construction_company', 'barbados',       'Wildey Industrial Park, St. Michael, Barbados',   'BBD', 68, 5600000,  'USD', 'Active construction. 4 sites currently insured.',      'b1000000-0000-0000-0000-000000000007', false),
  -- Jamaica
  ('c1000000-0000-0000-0000-000000000005', 'Marcus',   'Reynolds',          NULL,                          'mreynolds@privmail.jm',      '+1-876-555-3001', 'high_value_homeowner', 'jamaica',        'Cherry Gardens, Kingston 8, Jamaica',             'USD', 44, 3800000,  'USD', 'HNW homeowner. Multiple claims history — review.',      'b1000000-0000-0000-0000-000000000002', false),
  ('c1000000-0000-0000-0000-000000000006', 'Yvonne',   'Clarke-Whitfield',  NULL,                          'yclarke@privmail.jm',        '+1-876-555-3002', 'high_value_homeowner', 'jamaica',        'Norbrook Heights, Kingston, Jamaica',             'USD', 41, 2900000,  'USD', 'VIP. Referred by Neville Grant 2019.',                  'b1000000-0000-0000-0000-000000000002', true),
  ('c1000000-0000-0000-0000-000000000007', 'Montego',  'Bay',               'Montego Bay Developers Ltd',  'admin@mbdevelopers.jm',      '+1-876-555-3003', 'real_estate_developer','jamaica',        'Rose Hall, St. James, Jamaica',                   'USD', 57, 14200000, 'USD', 'Largest Jamaica client. 6 residential developments.',  'b1000000-0000-0000-0000-000000000002', true),
  ('c1000000-0000-0000-0000-000000000008', 'Kingston', 'Construction',      'Kingston Construction Co.',   'ops@kingstonconstruction.jm','+1-876-555-3004', 'construction_company', 'jamaica',        'Spanish Town Road, Kingston, Jamaica',            'USD', 74, 6800000,  'USD', 'Heavy construction. High risk score — wind zone 4.',    'b1000000-0000-0000-0000-000000000002', false),
  -- Cayman Islands
  ('c1000000-0000-0000-0000-000000000009', 'Dominic',  'Farquhar',          NULL,                          'dfarquhar@cayman.ky',        '+1-345-555-4001', 'high_value_homeowner', 'cayman_islands', 'Seven Mile Beach, Grand Cayman',                  'KYD', 35, 6100000,  'USD', 'VIP. Beachfront villa. Client since 2016.',             'b1000000-0000-0000-0000-000000000003', true),
  ('c1000000-0000-0000-0000-000000000010', 'Cayman',   'Crest',             'Cayman Crest Holdings Ltd',   'admin@ccresort.ky',          '+1-345-555-4002', 'boutique_resort',      'cayman_islands', 'Rum Point, North Side, Grand Cayman',             'KYD', 66, 18500000, 'USD', 'Premium resort. High cat exposure. VIP.',               'b1000000-0000-0000-0000-000000000003', true),
  ('c1000000-0000-0000-0000-000000000011', 'James',    'Whitmore-Banks',    NULL,                          'jwhitmore@cayman.ky',        '+1-345-555-4003', 'hnw_yacht_owner',      'cayman_islands', 'Yacht Club, George Town, Grand Cayman',            'KYD', 42, 3400000,  'USD', 'HNW. 78ft Sunseeker + 42ft tender. Since 2020.',        'b1000000-0000-0000-0000-000000000006', true),
  ('c1000000-0000-0000-0000-000000000012', 'Cayman',   'Capital',           'Cayman Capital Real Estate',  'enquiries@caymancapital.ky', '+1-345-555-4004', 'real_estate_developer','cayman_islands', 'Camana Bay, Grand Cayman',                        'KYD', 49, 22800000, 'USD', 'Premium developer. Camana Bay district portfolio.',     'b1000000-0000-0000-0000-000000000003', false),
  -- Trinidad & Tobago
  ('c1000000-0000-0000-0000-000000000013', 'Rajiv',    'Maharaj',           'Maharaj Commercial Properties','rmaharaj@maharajgroup.tt',  '+1-868-555-5001', 'commercial_owner',     'trinidad_tobago','Independence Square, Port of Spain, T&T',         'TTD', 55, 9200000,  'USD', 'Large commercial portfolio. Port of Spain CBD.',       'b1000000-0000-0000-0000-000000000004', false),
  ('c1000000-0000-0000-0000-000000000014', 'Caribbean','Pipeline',          'Caribbean Pipeline Ltd',       'risk@caribpipeline.tt',      '+1-868-555-5002', 'construction_company', 'trinidad_tobago','Chaguaramas Industrial Estate, T&T',              'TTD', 79, 7400000,  'USD', 'Energy sector. Highest risk score in portfolio.',       'b1000000-0000-0000-0000-000000000004', false),
  ('c1000000-0000-0000-0000-000000000015', 'Sandra',   'de Freitas',        NULL,                          'sdefreitas@privmail.tt',     '+1-868-555-5003', 'high_value_homeowner', 'trinidad_tobago','Maraval, Port of Spain, T&T',                     'TTD', 40, 2100000,  'USD', 'HNW homeowner. Maraval district villa.',                'b1000000-0000-0000-0000-000000000004', false),
  -- Bahamas
  ('c1000000-0000-0000-0000-000000000016', 'Nassau',   'Sands',             'Nassau Sands Resort Group',   'gm@nassausands.bs',          '+1-242-555-6001', 'boutique_resort',      'bahamas',        'Cable Beach, Nassau, Bahamas',                    'BSD', 72, 24600000, 'USD', 'Flagship resort client. Cat 5 exposure. VIP since 2015.','b1000000-0000-0000-0000-000000000005', true),
  ('c1000000-0000-0000-0000-000000000017', 'William',  'Pindling-Fraser',   NULL,                          'wpindling@pindlinglaw.bs',   '+1-242-555-6002', 'high_value_homeowner', 'bahamas',        'Lyford Cay, Nassau, Bahamas',                     'BSD', 36, 5800000,  'USD', 'Lyford Cay estate. Lawyer. Client since 2016.',         'b1000000-0000-0000-0000-000000000005', true),
  ('c1000000-0000-0000-0000-000000000018', 'Bahamas',  'Realty',            'Bahamas Realty & Development', 'dev@bahamasrealty.bs',       '+1-242-555-6003', 'real_estate_developer','bahamas',        'Paradise Island, Nassau, Bahamas',                'BSD', 63, 31200000, 'USD', 'Largest total exposure in portfolio. Paradise Island dev.','b1000000-0000-0000-0000-000000000005', true),
  ('c1000000-0000-0000-0000-000000000019', 'Exuma',    'Marine',            'Exuma Marine Holdings Ltd',   'ops@exumamarine.bs',         '+1-242-555-6004', 'hnw_yacht_owner',      'bahamas',        'Exuma, Great Exuma, Bahamas',                     'BSD', 48, 4200000,  'USD', 'Charter yacht fleet. 3 vessels. Dorian total loss 1.',  'b1000000-0000-0000-0000-000000000005', false),
  ('c1000000-0000-0000-0000-000000000020', 'Straw',    'Market',            'Straw Market Commercial Ltd',  'admin@strawmarket.bs',       '+1-242-555-6005', 'commercial_owner',     'bahamas',        'Bay Street, Nassau, Bahamas',                     'BSD', 58, 6400000,  'USD', 'Nassau CBD commercial property. High foot traffic.',    'b1000000-0000-0000-0000-000000000005', false),
  -- Additional cross-island
  ('c1000000-0000-0000-0000-000000000021', 'Rodrigo',  'Esteban-Vidal',     NULL,                          'resteban@privmail.ky',       '+1-345-555-4005', 'hnw_yacht_owner',      'cayman_islands', 'North Sound, Grand Cayman',                       'USD', 39, 5600000,  'USD', 'VIP. 95ft Ferretti superyacht. Navigation: Full Caribbean.','b1000000-0000-0000-0000-000000000006', true),
  ('c1000000-0000-0000-0000-000000000022', 'Blue',     'Horizon',           'Blue Horizon Hotels Group',   'insurance@bluehorizon.bb',   '+1-246-555-2005', 'boutique_resort',      'barbados',       'Paynes Bay, St. James, Barbados',                 'BBD', 54, 9800000,  'USD', 'Multi-property resort group. Barbados + Jamaica.',      'b1000000-0000-0000-0000-000000000001', false),
  ('c1000000-0000-0000-0000-000000000023', 'Port',     'Authority',         'Cayman Port Authority',        'risk@caymanport.ky',         '+1-345-555-4006', 'commercial_owner',     'cayman_islands', 'George Town Harbour, Grand Cayman',               'KYD', 60, 11200000, 'USD', 'Institutional client. George Town port infrastructure.','b1000000-0000-0000-0000-000000000003', false),
  ('c1000000-0000-0000-0000-000000000024', 'Atlantis', 'Construction',      'Atlantis Construction Corp',   'contracts@atlantiscc.bs',    '+1-242-555-6006', 'construction_company', 'bahamas',        'Freeport, Grand Bahama, Bahamas',                 'BSD', 71, 8900000,  'USD', 'Grand Bahama development. Post-Dorian rebuild contracts.','b1000000-0000-0000-0000-000000000005', false)
ON CONFLICT (id) DO NOTHING;

-- ── REINSURANCE TREATIES (6 active + 2 historical expired) ──────────────

INSERT INTO reinsurance_treaties (id, treaty_name, reinsurer_name, treaty_type, islands_covered, inception_date, expiry_date, limit_amount, retention, currency, cession_rate, attachment_point, premium_ceded, exposure_ceded, loss_recoverable, status, notes) VALUES
  ('r1000000-0000-0000-0000-000000000001', 'Caribbean Cat XL Layer 1 2024',  'Hannover Re',           'catastrophe_xl', ARRAY['barbados','jamaica','cayman_islands','trinidad_tobago','bahamas']::island[], '2024-01-01', '2024-12-31', 25000000,  5000000,  'USD', NULL, 5000000,  3200000,  18400000, 1200000,  'active',  'Primary cat layer. Covers all 5 islands. 4th consecutive year with Hannover.'),
  ('r1000000-0000-0000-0000-000000000002', 'Caribbean Cat XL Layer 2 2024',  'Swiss Re',              'catastrophe_xl', ARRAY['barbados','jamaica','cayman_islands','trinidad_tobago','bahamas']::island[], '2024-01-01', '2024-12-31', 50000000,  30000000, 'USD', NULL, 30000000, 2800000,  12600000, 0,        'active',  'Second layer. Attachment $30M xs $30M. Pricing improved 8% YoY.'),
  ('r1000000-0000-0000-0000-000000000003', 'Cayman & Bahamas QS 2024',       'Munich Re',             'quota_share',    ARRAY['cayman_islands','bahamas']::island[],                                       '2024-01-01', '2024-12-31', 30000000,  0,        'USD', 30.00, NULL,     4100000,  24800000, 0,        'active',  '30% quota share. Cayman + Bahamas highest cat exposure islands.'),
  ('r1000000-0000-0000-0000-000000000004', 'Marine & Yacht Facultative 2024','Lloyd''s Syndicate 2623','facultative',   ARRAY['cayman_islands','bahamas','barbados']::island[],                            '2024-01-01', '2024-12-31', 12000000,  2000000,  'USD', NULL, 2000000,  980000,   6200000,  420000,   'active',  'Facultative cover for yacht & marine portfolio. 3-island scope.'),
  ('r1000000-0000-0000-0000-000000000005', 'T&T Construction XL 2024',       'Scor SE',               'excess_of_loss', ARRAY['trinidad_tobago']::island[],                                                '2024-01-01', '2024-12-31', 8000000,   1500000,  'USD', NULL, 1500000,  620000,   3800000,  0,        'active',  'Specialist construction XL for T&T energy & industrial exposure.'),
  ('r1000000-0000-0000-0000-000000000006', 'Jamaica Commercial XL 2024',     'Everest Re',            'excess_of_loss', ARRAY['jamaica']::island[],                                                        '2024-01-01', '2024-12-31', 15000000,  3000000,  'USD', NULL, 3000000,  1480000,  8200000,  0,        'active',  'Jamaica commercial property XL. Covers Kingston and resort corridor.'),
  ('r1000000-0000-0000-0000-000000000007', 'Caribbean Cat XL 2019',          'Hannover Re',           'catastrophe_xl', ARRAY['barbados','jamaica','cayman_islands','trinidad_tobago','bahamas']::island[], '2019-01-01', '2019-12-31', 20000000,  4000000,  'USD', NULL, 4000000,  2900000,  17200000, 8400000,  'active',  'HISTORICAL 2019. Dorian triggered $8.4M recovery. Treaty closed.'),
  ('r1000000-0000-0000-0000-000000000008', 'Caribbean Cat XL 2017',          'Munich Re',             'catastrophe_xl', ARRAY['barbados','jamaica','cayman_islands','trinidad_tobago','bahamas']::island[], '2017-01-01', '2017-12-31', 18000000,  3500000,  'USD', NULL, 3500000,  2600000,  15800000, 11200000, 'active',  'HISTORICAL 2017. Hurricane Irma/Maria triggered $11.2M recovery.')
ON CONFLICT (id) DO NOTHING;

-- ── POLICIES (30 policies across all statuses and years) ─────────────────

INSERT INTO policies (id, policy_number, client_id, broker_id, coverage_type, status, island, insured_value, currency, annual_premium, premium_currency, start_date, end_date, renewal_date, risk_score, wind_zone, flood_zone, structural_compliance_rating, construction_year, property_address, notes, hurricane_deductible_pct, reinsurance_treaty_id) VALUES
  -- Active Barbados policies
  ('p1000000-0000-0000-0000-000000000001','AAG-2024-010001','c1000000-0000-0000-0000-000000000001','b1000000-0000-0000-0000-000000000001','residential',    'active',       'barbados',       4200000, 'USD','42000','USD','2024-01-15','2025-01-14','2025-01-15', 38,'Zone 2 – Moderate','Zone X – Minimal Flood', 88, 2008,'Sandy Lane Estate, Lot 14, St. James, Barbados',          'VIP. Reinforced concrete. Pool house included.',5.0, 'r1000000-0000-0000-0000-000000000001'),
  ('p1000000-0000-0000-0000-000000000002','AAG-2024-010002','c1000000-0000-0000-0000-000000000002','b1000000-0000-0000-0000-000000000001','commercial',     'active',       'barbados',       8700000, 'USD','104400','USD','2024-03-01','2025-02-28','2025-03-01', 52,'Zone 2 – Moderate','Zone X – Minimal Flood', 76, 2012,'Warrens Business Park Units 1-3, St. Michael, Barbados',  '3 commercial units. Warrens industrial corridor.',5.0, 'r1000000-0000-0000-0000-000000000001'),
  ('p1000000-0000-0000-0000-000000000003','AAG-2024-010003','c1000000-0000-0000-0000-000000000003','b1000000-0000-0000-0000-000000000001','hospitality',    'active',       'barbados',       12400000,'USD','186000','USD','2024-02-01','2025-01-31','2025-02-01', 61,'Zone 3 – High',    'Zone AE – Base Flood',   79, 1998,'Coral Bay Resort, Mullins Bay, St. Peter, Barbados',       'Beachfront. Cat deductible 7.5%. Post-Matthew upgrade.',7.5,'r1000000-0000-0000-0000-000000000001'),
  ('p1000000-0000-0000-0000-000000000004','AAG-2024-010004','c1000000-0000-0000-0000-000000000004','b1000000-0000-0000-0000-000000000007','construction',   'active',       'barbados',       5600000, 'USD','84000','USD','2024-05-01','2025-04-30','2025-05-01', 68,'Zone 2 – Moderate','Zone X – Minimal Flood', 65, 2024,'Wildey Industrial Park Site B, St. Michael, Barbados',    'Active construction site. Monthly value declarations.',8.0,'r1000000-0000-0000-0000-000000000001'),
  ('p1000000-0000-0000-0000-000000000005','AAG-2024-010005','c1000000-0000-0000-0000-000000000022','b1000000-0000-0000-0000-000000000001','hospitality',    'active',       'barbados',       9800000, 'USD','147000','USD','2024-01-01','2024-12-31','2025-01-01', 54,'Zone 3 – High',    'Zone AE – Base Flood',   81, 2006,'Blue Horizon Hotel, Paynes Bay, St. James, Barbados',      'Beachfront resort. Storm surge exposure noted.',7.0,'r1000000-0000-0000-0000-000000000001'),
  -- Jamaica policies
  ('p1000000-0000-0000-0000-000000000006','AAG-2023-020001','c1000000-0000-0000-0000-000000000005','b1000000-0000-0000-0000-000000000002','residential',    'active',       'jamaica',        3800000, 'USD','41800','USD','2023-06-01','2024-05-31','2024-06-01', 44,'Zone 2 – Moderate','Zone X – Minimal Flood', 72, 2015,'Cherry Gardens, Plot 22, Kingston 8, Jamaica',            'Fraud flag on prior claim. Under enhanced monitoring.',5.0,'r1000000-0000-0000-0000-000000000006'),
  ('p1000000-0000-0000-0000-000000000007','AAG-2024-020002','c1000000-0000-0000-0000-000000000006','b1000000-0000-0000-0000-000000000002','residential',    'active',       'jamaica',        2900000, 'USD','31900','USD','2024-04-01','2025-03-31','2025-04-01', 41,'Zone 2 – Moderate','Zone X – Minimal Flood', 84, 2019,'Norbrook Heights, Kingston, Jamaica',                      'VIP. Modern construction. Low risk profile.',5.0,'r1000000-0000-0000-0000-000000000006'),
  ('p1000000-0000-0000-0000-000000000008','AAG-2024-020003','c1000000-0000-0000-0000-000000000007','b1000000-0000-0000-0000-000000000002','real_estate',    'active',       'jamaica',        14200000,'USD','184600','USD','2024-01-01','2024-12-31','2025-01-01', 57,'Zone 3 – High',    'Zone A – 100-Year Floodplain',62,2021,'Rose Hall Development Zone, St. James, Jamaica',          'Active phase 2 development. 220 residential units.',6.0,'r1000000-0000-0000-0000-000000000006'),
  ('p1000000-0000-0000-0000-000000000009','AAG-2024-020004','c1000000-0000-0000-0000-000000000008','b1000000-0000-0000-0000-000000000002','construction',   'active',       'jamaica',        6800000, 'USD','102000','USD','2024-02-15','2025-02-14','2025-02-15', 74,'Zone 4 – Very High','Zone A – 100-Year Floodplain',54,2024,'Spanish Town Road, Industrial Zone, Kingston, Jamaica',    'High risk. Zone 4 wind. Structural issues flagged.',8.0,'r1000000-0000-0000-0000-000000000006'),
  -- Cayman policies
  ('p1000000-0000-0000-0000-000000000010','AAG-2024-030001','c1000000-0000-0000-0000-000000000009','b1000000-0000-0000-0000-000000000003','residential',    'active',       'cayman_islands', 6100000, 'USD','79300','USD','2024-01-01','2024-12-31','2025-01-01', 35,'Zone 2 – Moderate','Zone AE – Base Flood',    91, 2020,'Seven Mile Beach Villa, West Bay, Grand Cayman',          'VIP. Post-Ivan 2004 rebuild. Best structural rating.',5.0,'r1000000-0000-0000-0000-000000000003'),
  ('p1000000-0000-0000-0000-000000000011','AAG-2024-030002','c1000000-0000-0000-0000-000000000010','b1000000-0000-0000-0000-000000000003','hospitality',    'active',       'cayman_islands', 18500000,'USD','277500','USD','2024-01-01','2024-12-31','2025-01-01', 66,'Zone 4 – Very High','Zone AE – Base Flood',    78, 2014,'Rum Point Club, North Side, Grand Cayman',                'High value resort. Faces North Sound. Cat 5 zone.',7.5,'r1000000-0000-0000-0000-000000000003'),
  ('p1000000-0000-0000-0000-000000000012','AAG-2024-030003','c1000000-0000-0000-0000-000000000011','b1000000-0000-0000-0000-000000000006','yacht_marine',   'active',       'cayman_islands', 3400000, 'USD','51000','USD','2024-03-01','2025-02-28','2025-03-01', 42,'Zone 2 – Moderate','Zone X – Minimal Flood',  NULL,2021,'Cayman Yacht Club Marina, George Town, Grand Cayman',     '78ft Sunseeker Predator + 42ft tender. Full Caribbean nav.',5.0,'r1000000-0000-0000-0000-000000000004'),
  ('p1000000-0000-0000-0000-000000000013','AAG-2024-030004','c1000000-0000-0000-0000-000000000021','b1000000-0000-0000-0000-000000000006','yacht_marine',   'active',       'cayman_islands', 5600000, 'USD','84000','USD','2024-02-01','2025-01-31','2025-02-01', 39,'Zone 2 – Moderate','Zone X – Minimal Flood',  NULL,2022,'North Sound, Grand Cayman',                               'VIP. 95ft Ferretti. Full Caribbean nav area.',5.0,'r1000000-0000-0000-0000-000000000004'),
  ('p1000000-0000-0000-0000-000000000014','AAG-2024-030005','c1000000-0000-0000-0000-000000000012','b1000000-0000-0000-0000-000000000003','real_estate',    'active',       'cayman_islands', 22800000,'USD','319200','USD','2024-01-01','2024-12-31','2025-01-01', 49,'Zone 3 – High',    'Zone AE – Base Flood',    85, 2022,'Camana Bay Phase 4, Grand Cayman',                        'Premium mixed-use development. Excellent compliance.',6.0,'r1000000-0000-0000-0000-000000000003'),
  ('p1000000-0000-0000-0000-000000000015','AAG-2024-030006','c1000000-0000-0000-0000-000000000023','b1000000-0000-0000-0000-000000000003','commercial',     'active',       'cayman_islands', 11200000,'USD','145600','USD','2024-01-01','2024-12-31','2025-01-01', 60,'Zone 3 – High',    'Zone AE – Base Flood',    74, 2008,'George Town Harbour Warehouse Complex, Grand Cayman',     'Port infrastructure. Storm surge risk.',6.0,'r1000000-0000-0000-0000-000000000003'),
  -- Trinidad & Tobago
  ('p1000000-0000-0000-0000-000000000016','AAG-2024-040001','c1000000-0000-0000-0000-000000000013','b1000000-0000-0000-0000-000000000004','commercial',     'active',       'trinidad_tobago',9200000, 'USD','96600','USD','2024-01-01','2024-12-31','2025-01-01', 55,'Zone 2 – Moderate','Zone X – Minimal Flood',  70, 2010,'Independence Square Office Tower, Port of Spain, T&T',    'CBD commercial. 12 floors. Good compliance rating.',5.0,'r1000000-0000-0000-0000-000000000005'),
  ('p1000000-0000-0000-0000-000000000017','AAG-2024-040002','c1000000-0000-0000-0000-000000000014','b1000000-0000-0000-0000-000000000004','construction',   'active',       'trinidad_tobago',7400000, 'USD','111000','USD','2024-03-15','2025-03-14','2025-03-15', 79,'Zone 3 – High',    'Zone A – 100-Year Floodplain',45,2024,'Chaguaramas Industrial Estate Site C, T&T',               'Energy sector. Highest risk in portfolio. Zone 3.',10.0,'r1000000-0000-0000-0000-000000000005'),
  ('p1000000-0000-0000-0000-000000000018','AAG-2024-040003','c1000000-0000-0000-0000-000000000015','b1000000-0000-0000-0000-000000000004','residential',    'active',       'trinidad_tobago',2100000, 'USD','21000','USD','2024-06-01','2025-05-31','2025-06-01', 40,'Zone 1 – Low',     'Zone X – Minimal Flood',  82, 2016,'Maraval Valley, Port of Spain, T&T',                      'Low risk residential. Hill location, minimal flood.',5.0,NULL),
  -- Bahamas
  ('p1000000-0000-0000-0000-000000000019','AAG-2024-050001','c1000000-0000-0000-0000-000000000016','b1000000-0000-0000-0000-000000000005','hospitality',    'active',       'bahamas',        24600000,'USD','393600','USD','2024-01-01','2024-12-31','2025-01-01', 72,'Zone 5 – Extreme', 'Zone AE – Base Flood',    77, 2002,'Cable Beach Resort Complex, Nassau, Bahamas',             'VIP flagship. Cat 5 direct hit exposure. Post-Dorian rebuild.', 10.0,'r1000000-0000-0000-0000-000000000003'),
  ('p1000000-0000-0000-0000-000000000020','AAG-2024-050002','c1000000-0000-0000-0000-000000000017','b1000000-0000-0000-0000-000000000005','residential',    'active',       'bahamas',        5800000, 'USD','75400','USD','2024-01-01','2024-12-31','2025-01-01', 36,'Zone 2 – Moderate','Zone X – Minimal Flood',  88, 2018,'Lyford Cay Estate, Nassau, Bahamas',                      'VIP. Gated community. Excellent structural compliance.',5.0,'r1000000-0000-0000-0000-000000000003'),
  ('p1000000-0000-0000-0000-000000000021','AAG-2024-050003','c1000000-0000-0000-0000-000000000018','b1000000-0000-0000-0000-000000000005','real_estate',    'active',       'bahamas',        31200000,'USD','468000','USD','2024-01-01','2024-12-31','2025-01-01', 63,'Zone 4 – Very High','Zone AE – Base Flood',    69, 2023,'Paradise Island Phase 2, Nassau, Bahamas',               'Largest single policy. Phase 2 of Paradise Island dev.',8.0,'r1000000-0000-0000-0000-000000000003'),
  ('p1000000-0000-0000-0000-000000000022','AAG-2024-050004','c1000000-0000-0000-0000-000000000019','b1000000-0000-0000-0000-000000000005','yacht_marine',   'active',       'bahamas',        4200000, 'USD','63000','USD','2024-02-01','2025-01-31','2025-02-01', 48,'Zone 3 – High',    'Zone X – Minimal Flood',  NULL,2019,'Exuma Harbour, Great Exuma, Bahamas',                     'Charter fleet. 3 vessels post-Dorian. 1 total loss settled.',5.0,'r1000000-0000-0000-0000-000000000004'),
  ('p1000000-0000-0000-0000-000000000023','AAG-2024-050005','c1000000-0000-0000-0000-000000000020','b1000000-0000-0000-0000-000000000005','commercial',     'active',       'bahamas',        6400000, 'USD','83200','USD','2024-01-01','2024-12-31','2025-01-01', 58,'Zone 3 – High',    'Zone AE – Base Flood',    73, 2005,'Bay Street Commercial Block, Nassau, Bahamas',            'Nassau CBD. High pedestrian exposure. Cat deductible 8%.',8.0,'r1000000-0000-0000-0000-000000000003'),
  ('p1000000-0000-0000-0000-000000000024','AAG-2024-050006','c1000000-0000-0000-0000-000000000024','b1000000-0000-0000-0000-000000000005','construction',   'active',       'bahamas',        8900000, 'USD','133500','USD','2024-04-01','2025-03-31','2025-04-01', 71,'Zone 4 – Very High','Zone A – 100-Year Floodplain',51,2024,'Freeport Development Zone, Grand Bahama, Bahamas',       'Post-Dorian rebuild contract. High cat exposure.',10.0,'r1000000-0000-0000-0000-000000000003'),
  -- Historical / non-active
  ('p1000000-0000-0000-0000-000000000025','AAG-2022-010001','c1000000-0000-0000-0000-000000000003','b1000000-0000-0000-0000-000000000001','hospitality',    'lapsed',       'barbados',       11000000,'USD','165000','USD','2022-02-01','2023-01-31','2023-02-01', 61,'Zone 3 – High',    'Zone AE – Base Flood',    74, 1998,'Coral Bay Resort, Mullins Bay, St. Peter, Barbados',       'Lapsed 2023. Renewed as AAG-2024-010003.',7.5, NULL),
  ('p1000000-0000-0000-0000-000000000026','AAG-2021-050001','c1000000-0000-0000-0000-000000000016','b1000000-0000-0000-0000-000000000005','hospitality',    'renewal_due',  'bahamas',        22000000,'USD','352000','USD','2023-12-01','2024-11-30','2024-12-01', 72,'Zone 5 – Extreme', 'Zone AE – Base Flood',    77, 2002,'Cable Beach Resort Complex, Nassau, Bahamas',             'Renewal due. Premium increase 12% due to Beryl losses.',10.0,'r1000000-0000-0000-0000-000000000003'),
  ('p1000000-0000-0000-0000-000000000027','AAG-2019-050001','c1000000-0000-0000-0000-000000000019','b1000000-0000-0000-0000-000000000005','yacht_marine',   'cancelled',    'bahamas',        1800000, 'USD','27000','USD','2019-01-01','2019-12-31','2020-01-01', 48,'Zone 3 – High',    'Zone X – Minimal Flood',  NULL,2016,'Exuma Harbour, Great Exuma, Bahamas',                     'CANCELLED. Vessel total loss Hurricane Dorian Sep 2019.',5.0,NULL),
  ('p1000000-0000-0000-0000-000000000028','AAG-2017-030001','c1000000-0000-0000-0000-000000000009','b1000000-0000-0000-0000-000000000003','residential',    'cancelled',    'cayman_islands', 4800000, 'USD','57600','USD','2017-01-01','2017-12-31','2018-01-01', 35,'Zone 2 – Moderate','Zone AE – Base Flood',    87, 2014,'Seven Mile Beach Villa, West Bay, Grand Cayman',          'CANCELLED. Client upgraded property. New policy 2020.',5.0,NULL),
  ('p1000000-0000-0000-0000-000000000029','AAG-2024-010006','c1000000-0000-0000-0000-000000000001','b1000000-0000-0000-0000-000000000001','residential',    'quoted',       'barbados',       1800000, 'USD','18000','USD','2024-11-01','2025-10-31','2025-11-01', 33,'Zone 1 – Low',     'Zone X – Minimal Flood',  92, 2023,'Pool House, Sandy Lane Estate, St. James, Barbados',     'Additional structure quote. Awaiting client sign-off.',5.0,NULL),
  ('p1000000-0000-0000-0000-000000000030','AAG-2024-020005','c1000000-0000-0000-0000-000000000007','b1000000-0000-0000-0000-000000000002','real_estate',    'pending',      'jamaica',        8600000, 'USD','111800','USD','2025-01-01','2025-12-31','2026-01-01', 55,'Zone 3 – High',    'Zone A – 100-Year Floodplain',68,2025,'Rose Hall Phase 3, St. James, Jamaica',                   'Pending underwriting sign-off. Phase 3 of Rose Hall.',6.0,NULL)
ON CONFLICT (id) DO NOTHING;

-- ── CLAIMS (18 claims spanning 2016–2024 including major cat events) ─────

INSERT INTO claims (id, claim_number, policy_id, client_id, adjuster_id, status, coverage_type, catastrophe_event, storm_name, incident_date, fnol_date, reported_loss, assessed_loss, approved_amount, settlement_amount, currency, fx_rate_usd, description, property_address, island, fraud_risk, fraud_flags, adjuster_notes, settlement_date) VALUES

  -- Active / open claims (2024)
  ('cl000000-0000-0000-0000-000000000001','CLM-2024-010001','p1000000-0000-0000-0000-000000000003','c1000000-0000-0000-0000-000000000003','a1000000-0000-0000-0000-000000000001',
   'adjuster_assigned','hospitality','hurricane','Hurricane Beryl','2024-07-01','2024-07-02',
   2400000,NULL,NULL,NULL,'USD',1.0,
   'Significant roof damage and flooding to main pool terrace and beachfront bar area. Hurricane Beryl direct impact.',
   'Coral Bay Resort, Mullins Bay, St. Peter, Barbados','barbados','clear',NULL,
   'Structural assessment scheduled. Roof contractor engaged. Timeline 6-8 weeks.', NULL),

  ('cl000000-0000-0000-0000-000000000002','CLM-2024-020001','p1000000-0000-0000-0000-000000000008','c1000000-0000-0000-0000-000000000007','a1000000-0000-0000-0000-000000000003',
   'under_review','real_estate','hurricane','Hurricane Beryl','2024-07-02','2024-07-04',
   1850000,NULL,NULL,NULL,'USD',1.0,
   'Partial collapse of Phase 2 construction scaffolding. Wind damage to partially completed structures. Beryl CAT 4 at landfall Jamaica.',
   'Rose Hall Development Zone, St. James, Jamaica','jamaica','clear',NULL,
   'Engineering report commissioned. Contractor liability under review.',NULL),

  ('cl000000-0000-0000-0000-000000000003','CLM-2024-050001','p1000000-0000-0000-0000-000000000019','c1000000-0000-0000-0000-000000000016','a1000000-0000-0000-0000-000000000007',
   'inspection_scheduled','hospitality','hurricane','Hurricane Beryl','2024-07-01','2024-07-01',
   4800000,NULL,NULL,NULL,'USD',1.0,
   'Extensive damage to beach facilities, pool deck, and north wing guest rooms. Nassau Sands Resort suffered direct Beryl impact.',
   'Cable Beach Resort Complex, Nassau, Bahamas','bahamas','clear',NULL,
   'Largest Beryl claim in portfolio. Site inspection Day 3. Quantum specialists engaged.',NULL),

  ('cl000000-0000-0000-0000-000000000004','CLM-2024-050002','p1000000-0000-0000-0000-000000000023','c1000000-0000-0000-0000-000000000020','a1000000-0000-0000-0000-000000000007',
   'fnol_received','commercial','hurricane','Hurricane Beryl','2024-07-01','2024-07-03',
   580000,NULL,NULL,NULL,'USD',1.0,
   'Bay Street shopfronts damaged. Storm surge inundated ground floor. 4 tenants affected.',
   'Bay Street Commercial Block, Nassau, Bahamas','bahamas','watch',
   ARRAY['3rd claim filed in 6 years','Previous claim same perils 2019'],
   'Surveillance footage requested from Bay Street cameras.',NULL),

  ('cl000000-0000-0000-0000-000000000005','CLM-2024-030001','p1000000-0000-0000-0000-000000000011','c1000000-0000-0000-0000-000000000010','a1000000-0000-0000-0000-000000000005',
   'assessment_complete','hospitality',NULL,NULL,'2024-03-15','2024-03-16',
   320000,290000,NULL,NULL,'USD',1.0,
   'Fire damage to kitchen and adjacent dining area. Electrical fault. Non-cat event.',
   'Rum Point Club, North Side, Grand Cayman','cayman_islands','clear',NULL,
   'Assessment complete. Fire marshal report received. Electrical fault confirmed. Recommending approval.',NULL),

  -- Under fraud investigation
  ('cl000000-0000-0000-0000-000000000006','CLM-2024-020002','p1000000-0000-0000-0000-000000000006','c1000000-0000-0000-0000-000000000005','a1000000-0000-0000-0000-000000000003',
   'fraud_investigation','residential',NULL,NULL,'2024-05-22','2024-05-23',
   580000,NULL,NULL,NULL,'USD',1.0,
   'Reported water damage and structural cracking. Third claim by this client in 14 months. Loss inconsistency with property age.',
   'Cherry Gardens, Plot 22, Kingston 8, Jamaica','jamaica','flagged',
   ARRAY['3rd claim in 14 months','Same contractor used all 3 times','No independent inspection allowed','Reported loss 2.8x comparable market rates'],
   'SIU referral initiated 2024-06-01. Contractor records subpoenaed.',NULL),

  -- Settled claims
  ('cl000000-0000-0000-0000-000000000007','CLM-2023-010001','p1000000-0000-0000-0000-000000000025','c1000000-0000-0000-0000-000000000003','a1000000-0000-0000-0000-000000000002',
   'settled','hospitality',NULL,NULL,'2023-09-18','2023-09-19',
   285000,260000,260000,255000,'USD',1.0,
   'Tropical storm rain intrusion through roof membrane. Non-cat seasonal damage.',
   'Coral Bay Resort, Mullins Bay, St. Peter, Barbados','barbados','clear',NULL,
   'Settled within 45 days. Contractor approved. Client satisfied.','2023-11-15'),

  ('cl000000-0000-0000-0000-000000000008','CLM-2022-020001','p1000000-0000-0000-0000-000000000009','c1000000-0000-0000-0000-000000000008','a1000000-0000-0000-0000-000000000003',
   'settled','construction',NULL,NULL,'2022-04-10','2022-04-11',
   145000,130000,130000,128000,'USD',1.0,
   'Crane collapse during site operations. Equipment damage. No injuries.',
   'Spanish Town Road, Industrial Zone, Kingston, Jamaica','jamaica','clear',NULL,
   'Equipment liability assessed. Crane rental company partial liability established.','2022-07-20'),

  ('cl000000-0000-0000-0000-000000000009','CLM-2021-030001','p1000000-0000-0000-0000-000000000012','c1000000-0000-0000-0000-000000000011','a1000000-0000-0000-0000-000000000008',
   'settled','yacht_marine',NULL,NULL,'2021-08-05','2021-08-06',
   420000,380000,380000,375000,'USD',1.0,
   'Sunseeker tender sustained hull damage after mooring line failure during tropical swell. Dry dock repair.',
   'Cayman Yacht Club Marina, George Town, Grand Cayman','cayman_islands','clear',NULL,
   'Surveyor report confirmed mooring failure. Settled 42 days from FNOL.','2021-10-01'),

  -- Historical Hurricane Dorian 2019 claims (Bahamas)
  ('cl000000-0000-0000-0000-000000000010','CLM-2019-050001','p1000000-0000-0000-0000-000000000027','c1000000-0000-0000-0000-000000000019','a1000000-0000-0000-0000-000000000007',
   'settled','yacht_marine','hurricane','Hurricane Dorian','2019-09-01','2019-09-03',
   1800000,1800000,1800000,1800000,'USD',1.0,
   'Total loss. 54ft sailing yacht sank at mooring during Dorian storm surge. Grand Bahama.',
   'Exuma Harbour, Great Exuma, Bahamas','bahamas','clear',NULL,
   'Total loss declared. Salvage rights assigned. Reinsurance recovery triggered.','2019-12-20'),

  ('cl000000-0000-0000-0000-000000000011','CLM-2019-050002','p1000000-0000-0000-0000-000000000026','c1000000-0000-0000-0000-000000000016','a1000000-0000-0000-0000-000000000007',
   'settled','hospitality','hurricane','Hurricane Dorian','2019-09-01','2019-09-02',
   8200000,7600000,7600000,7450000,'USD',1.0,
   'Catastrophic damage to resort. Roof structure partially collapsed. Guest wing uninhabitable. 8-month restoration.',
   'Cable Beach Resort Complex, Nassau, Bahamas','bahamas','clear',NULL,
   'Largest single claim in company history at time. Reinsurance treaty triggered. Hannover Re recovery $5.1M.','2020-06-15'),

  -- Historical Hurricane Irma/Maria 2017 claims
  ('cl000000-0000-0000-0000-000000000012','CLM-2017-030001','p1000000-0000-0000-0000-000000000028','c1000000-0000-0000-0000-000000000009','a1000000-0000-0000-0000-000000000005',
   'settled','residential','hurricane','Hurricane Irma','2017-09-08','2017-09-10',
   980000,870000,870000,860000,'USD',1.0,
   'Significant wind damage to roof and pool house. Irma passed directly over Cayman. Category 5 at closest approach.',
   'Seven Mile Beach Villa, West Bay, Grand Cayman','cayman_islands','clear',NULL,
   'Settled within 90 days. Engineering assessment confirmed wind-only loss. No storm surge.','2017-12-20'),

  ('cl000000-0000-0000-0000-000000000013','CLM-2017-010001','p1000000-0000-0000-0000-000000000025','c1000000-0000-0000-0000-000000000003','a1000000-0000-0000-0000-000000000001',
   'settled','hospitality','hurricane','Hurricane Irma','2017-09-07','2017-09-08',
   2100000,1950000,1950000,1920000,'USD',1.0,
   'Beachfront damage. Pool deck destroyed. Beach bar roof failure. Coral Bay Resort Irma impact.',
   'Coral Bay Resort, Mullins Bay, St. Peter, Barbados','barbados','clear',NULL,
   'Reinsurance recovery $1.4M from Munich Re 2017 treaty. Rebuilding complete by Feb 2018.','2018-03-10'),

  -- Hurricane Matthew 2016
  ('cl000000-0000-0000-0000-000000000014','CLM-2016-010001','p1000000-0000-0000-0000-000000000025','c1000000-0000-0000-0000-000000000003','a1000000-0000-0000-0000-000000000001',
   'settled','hospitality','hurricane','Hurricane Matthew','2016-10-01','2016-10-02',
   1400000,1280000,1280000,1250000,'USD',1.0,
   'Hurricane Matthew. Roof damage, flooding of ground floor. First major claim for Coral Bay Resort.',
   'Coral Bay Resort, Mullins Bay, St. Peter, Barbados','barbados','clear',NULL,
   'First major cat event for this client. Settled in 75 days.','2016-12-20'),

  -- Rejected and partial approval examples
  ('cl000000-0000-0000-0000-000000000015','CLM-2023-050001','p1000000-0000-0000-0000-000000000021','c1000000-0000-0000-0000-000000000018','a1000000-0000-0000-0000-000000000007',
   'rejected','real_estate',NULL,NULL,'2023-06-15','2023-06-16',
   380000,210000,0,0,'USD',1.0,
   'Claimed structural cracking due to storm. Investigation showed pre-existing foundation issues not covered under policy.',
   'Paradise Island Phase 1, Nassau, Bahamas','bahamas','suspicious',
   ARRAY['Loss pre-dated storm by estimated 6-18 months','Contractor not on approved panel','Claim filed 45 days post-storm'],
   'Rejected per policy exclusion: pre-existing damage. Client notified.','2023-10-01'),

  ('cl000000-0000-0000-0000-000000000016','CLM-2022-050001','p1000000-0000-0000-0000-000000000020','c1000000-0000-0000-0000-000000000017','a1000000-0000-0000-0000-000000000007',
   'partial_approved','residential',NULL,NULL,'2022-08-20','2022-08-21',
   290000,180000,180000,NULL,'USD',1.0,
   'Reported wind damage to guest house and landscaping. Assessment confirmed partial wind damage only.',
   'Lyford Cay Estate, Nassau, Bahamas','bahamas','watch',
   ARRAY['Reported loss significantly overstated vs assessment'],
   'Partial approval $180K. Client queried reduction. Negotiation ongoing.', NULL),

  -- T&T construction claim
  ('cl000000-0000-0000-0000-000000000017','CLM-2023-040001','p1000000-0000-0000-0000-000000000017','c1000000-0000-0000-0000-000000000014','a1000000-0000-0000-0000-000000000006',
   'settled','construction',NULL,NULL,'2023-11-12','2023-11-13',
   620000,580000,580000,570000,'TTD',0.1473,
   'Industrial pipeline section failure during pressure testing. Equipment damage and site cleanup.',
   'Chaguaramas Industrial Estate Site C, T&T','trinidad_tobago','clear',NULL,
   'Settled in TTD. FX converted at 6.79 rate. Engineering liability confirmed.','2024-02-28'),

  -- Approved pending settlement
  ('cl000000-0000-0000-0000-000000000018','CLM-2024-040001','p1000000-0000-0000-0000-000000000016','c1000000-0000-0000-0000-000000000013','a1000000-0000-0000-0000-000000000006',
   'approved','commercial',NULL,NULL,'2024-02-08','2024-02-09',
   145000,128000,128000,NULL,'USD',1.0,
   'Burst pipe flooding of 3rd floor office suites. Water damage to tenant improvements.',
   'Independence Square Office Tower, Port of Spain, T&T','trinidad_tobago','clear',NULL,
   'Approved. Awaiting final contractor invoice before settlement payment.',NULL)

ON CONFLICT (id) DO NOTHING;

-- ── FRAUD ALERTS ─────────────────────────────────────────────────────────

INSERT INTO fraud_alerts (id, claim_id, client_id, alert_type, risk_score, flags, status, assigned_to, resolution_notes) VALUES
  ('f1000000-0000-0000-0000-000000000001',
   'cl000000-0000-0000-0000-000000000006',
   'c1000000-0000-0000-0000-000000000005',
   'Multiple Claims Pattern',82,
   ARRAY['3rd claim in 14 months','Identical contractor all 3 claims','Loss quantum 2.8× market comparables','No police report filed','Refused independent site access Day 1'],
   'escalated','Senior Adjuster — Marcus Alleyne','SIU engaged. Contractor financial relationship under review.'),
  ('f1000000-0000-0000-0000-000000000002',
   'cl000000-0000-0000-0000-000000000004',
   'c1000000-0000-0000-0000-000000000020',
   'Repeat Cat Event Claim',58,
   ARRAY['3rd claim in 6 years for same peril','Previous settlement $420K (2019)','Loss inconsistency with neighbouring properties'],
   'under_review','Adjuster — James McIntosh',NULL),
  ('f1000000-0000-0000-0000-000000000003',
   'cl000000-0000-0000-0000-000000000015',
   'c1000000-0000-0000-0000-000000000018',
   'Pre-Existing Damage',71,
   ARRAY['Loss pre-dated storm by 6-18 months','Contractor not on approved panel','Claim filed 45 days post-storm','Foundation damage inconsistent with wind event'],
   'cleared','Adjuster — James McIntosh','Claim rejected. Fraud confirmed pre-existing. File closed.')
ON CONFLICT (id) DO NOTHING;

-- ── POLICY ENDORSEMENTS (real mid-term changes) ──────────────────────────

INSERT INTO policy_endorsements (policy_id, endorsement_number, type, description, effective_date, additional_premium, currency, issued_by, status) VALUES
  ('p1000000-0000-0000-0000-000000000003','END-AAG-2024-010003-001','coverage_extension',
   'Post-Beryl endorsement: Temporary accommodation cover added for displaced guests. Limit $150,000 for 90 days.',
   '2024-07-05',4500,'USD','Senior Underwriter — D. Hutchinson','active'),
  ('p1000000-0000-0000-0000-000000000019','END-AAG-2024-050001-001','deductible_change',
   'Hurricane deductible increased from 7.5% to 10% following 2024 Beryl loss. Effective at renewal.',
   '2024-08-01',0,'USD','Chief Underwriter — Antillia AG','active'),
  ('p1000000-0000-0000-0000-000000000011','END-AAG-2024-030002-001','coverage_extension',
   'Business interruption cover extended from 6 months to 12 months following fire claim review.',
   '2024-04-01',8200,'USD','Senior Underwriter — D. Hutchinson','active'),
  ('p1000000-0000-0000-0000-000000000014','END-AAG-2024-030005-001','premium_adjustment',
   'Mid-term premium adjustment. Additional floor added to Camana Bay Phase 4 tower. Insured value increase $2.1M.',
   '2024-06-15',31500,'USD','Senior Underwriter — C. Ebanks','active'),
  ('p1000000-0000-0000-0000-000000000013','END-AAG-2024-030004-001','coverage_extension',
   'Navigation area extended to include Gulf of Mexico waters for charter season Nov-Apr.',
   '2024-11-01',6800,'USD','Marine Underwriter — K. Francis','active')
ON CONFLICT DO NOTHING;

-- ── UPDATE HURRICANE EXPOSURE CACHE ──────────────────────────────────────

INSERT INTO hurricane_exposure_cache (island, total_policies, total_exposure, currency, cat_1_2_exposure, cat_3_4_exposure, cat_5_exposure, extreme_wind_zone_policies, flood_zone_policies, avg_structural_compliance)
VALUES
  ('barbados',        5,  40700000, 'USD', 7900000,  5100000,  3500000,  0, 2, 79.6),
  ('jamaica',         5,  35700000, 'USD', 6700000,  4800000,  3000000,  1, 2, 67.0),
  ('cayman_islands',  6,  67600000, 'USD', 10200000, 7600000,  4500000,  1, 4, 82.6),
  ('trinidad_tobago', 3,  18700000, 'USD', 2900000,  2100000,  1300000,  0, 1, 62.3),
  ('bahamas',         6,  81100000, 'USD', 10700000, 8900000,  4800000,  2, 4, 71.6)
ON CONFLICT (island) DO UPDATE SET
  total_policies = EXCLUDED.total_policies,
  total_exposure = EXCLUDED.total_exposure,
  cat_1_2_exposure = EXCLUDED.cat_1_2_exposure,
  cat_3_4_exposure = EXCLUDED.cat_3_4_exposure,
  cat_5_exposure = EXCLUDED.cat_5_exposure,
  extreme_wind_zone_policies = EXCLUDED.extreme_wind_zone_policies,
  flood_zone_policies = EXCLUDED.flood_zone_policies,
  avg_structural_compliance = EXCLUDED.avg_structural_compliance,
  updated_at = NOW();

-- ── CAT SURGE EVENTS (historical) ────────────────────────────────────────

INSERT INTO cat_surge_events (name, event_type, status, islands, notes, expected_claims, activated_by) VALUES
  ('Hurricane Beryl 2024',      'hurricane',       'active',     ARRAY['jamaica','barbados','bahamas','trinidad_tobago'], 'Category 4 at Jamaica landfall. Highest storm activity since Dorian. 18 claims opened.', 45, 'Chief Claims Officer'),
  ('Hurricane Dorian 2019',     'hurricane',       'closed',     ARRAY['bahamas'],               'Category 5. Worst storm in Bahamas history. Triggered reinsurance recovery $8.4M.', 38, 'Chief Claims Officer'),
  ('Hurricane Irma 2017',       'hurricane',       'closed',     ARRAY['cayman_islands','barbados','jamaica'], 'Category 5. Multi-island impact. Reinsurance treaty triggered $11.2M recovery.', 62, 'Claims Director'),
  ('Hurricane Matthew 2016',    'hurricane',       'closed',     ARRAY['barbados','jamaica'],     'Category 4. First major cat event for Antillia. Stress-tested surge procedures.', 24, 'Claims Director'),
  ('Tropical Storm Kirk 2023',  'tropical_storm',  'closed',     ARRAY['barbados','trinidad_tobago'], 'Tropical storm. Minor claims. 8 FNOLs filed. No reinsurance trigger.', 12, 'Senior Adjuster')
ON CONFLICT DO NOTHING;

