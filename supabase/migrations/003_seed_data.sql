-- Partnership Hub: Seed Data
-- Idempotent — uses ON CONFLICT DO NOTHING to avoid duplicates.
-- Panini x NWSL x NWSLPA 2026 Season Partnership

-- ============================================
-- PROJECT
-- ============================================

INSERT INTO projects (id, name, description, start_date, end_date) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Panini x NWSL x NWSLPA 2026 Season Partnership',
  'Full-season partnership spanning TSX Times Square launch, weekly social content, club activations (Panini Night), Golden Ticket program across 16 markets, and championship finish.',
  '2026-03-01',
  '2026-11-30'
) ON CONFLICT (id) DO NOTHING;

-- ============================================
-- PHASES
-- ============================================

INSERT INTO phases (id, project_id, name, start_date, end_date, sort_order) VALUES
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000001', 'TSX Launch', '2026-03-01', '2026-03-07', 1),
  ('00000000-0000-0000-0001-000000000002', '00000000-0000-0000-0000-000000000001', 'Launch Week', '2026-03-08', '2026-03-14', 2),
  ('00000000-0000-0000-0001-000000000003', '00000000-0000-0000-0000-000000000001', 'Product Launch', '2026-03-15', '2026-04-15', 3),
  ('00000000-0000-0000-0001-000000000004', '00000000-0000-0000-0000-000000000001', 'In-Season', '2026-04-16', '2026-08-31', 4),
  ('00000000-0000-0000-0001-000000000005', '00000000-0000-0000-0000-000000000001', 'Panini Night', '2026-05-01', '2026-09-30', 5),
  ('00000000-0000-0000-0001-000000000006', '00000000-0000-0000-0000-000000000001', 'Golden Ticket', '2026-06-01', '2026-10-31', 6),
  ('00000000-0000-0000-0001-000000000007', '00000000-0000-0000-0000-000000000001', 'Playoffs', '2026-10-01', '2026-11-15', 7),
  ('00000000-0000-0000-0001-000000000008', '00000000-0000-0000-0000-000000000001', 'Championship', '2026-11-16', '2026-11-30', 8),
  ('00000000-0000-0000-0001-000000000009', '00000000-0000-0000-0000-000000000001', 'Evergreen', '2026-03-01', '2026-11-30', 9)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- CLUBS (All 16 NWSL clubs)
-- ============================================

INSERT INTO clubs (id, project_id, name, market) VALUES
  ('00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0000-000000000001', 'Angel City FC', 'Los Angeles'),
  ('00000000-0000-0000-0002-000000000002', '00000000-0000-0000-0000-000000000001', 'Bay FC', 'San Francisco Bay Area'),
  ('00000000-0000-0000-0002-000000000003', '00000000-0000-0000-0000-000000000001', 'Chicago Stars FC', 'Chicago'),
  ('00000000-0000-0000-0002-000000000004', '00000000-0000-0000-0000-000000000001', 'Houston Dash', 'Houston'),
  ('00000000-0000-0000-0002-000000000005', '00000000-0000-0000-0000-000000000001', 'Kansas City Current', 'Kansas City'),
  ('00000000-0000-0000-0002-000000000006', '00000000-0000-0000-0000-000000000001', 'NJ/NY Gotham FC', 'New York/New Jersey'),
  ('00000000-0000-0000-0002-000000000007', '00000000-0000-0000-0000-000000000001', 'North Carolina Courage', 'Raleigh-Durham'),
  ('00000000-0000-0000-0002-000000000008', '00000000-0000-0000-0000-000000000001', 'Orlando Pride', 'Orlando'),
  ('00000000-0000-0000-0002-000000000009', '00000000-0000-0000-0000-000000000001', 'Portland Thorns FC', 'Portland'),
  ('00000000-0000-0000-0002-000000000010', '00000000-0000-0000-0000-000000000001', 'Racing Louisville FC', 'Louisville'),
  ('00000000-0000-0000-0002-000000000011', '00000000-0000-0000-0000-000000000001', 'San Diego Wave FC', 'San Diego'),
  ('00000000-0000-0000-0002-000000000012', '00000000-0000-0000-0000-000000000001', 'Seattle Reign FC', 'Seattle'),
  ('00000000-0000-0000-0002-000000000013', '00000000-0000-0000-0000-000000000001', 'Utah Royals FC', 'Salt Lake City'),
  ('00000000-0000-0000-0002-000000000014', '00000000-0000-0000-0000-000000000001', 'Washington Spirit', 'Washington DC'),
  ('00000000-0000-0000-0002-000000000015', '00000000-0000-0000-0000-000000000001', 'Boston Unity FC', 'Boston'),
  ('00000000-0000-0000-0002-000000000016', '00000000-0000-0000-0000-000000000001', 'Brooklyn FC', 'Brooklyn')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- DEFAULT APPROVAL CHAINS
-- ============================================

-- Most content types require Brand + League approval (parallel)
INSERT INTO approval_chains (project_id, content_bucket, required_roles, chain_type, sort_order) VALUES
  ('00000000-0000-0000-0000-000000000001', 'partnership', ARRAY['brand', 'league'], 'parallel', 1),
  ('00000000-0000-0000-0000-000000000001', 'product', ARRAY['brand', 'league'], 'parallel', 2),
  ('00000000-0000-0000-0000-000000000001', 'collecting', ARRAY['brand', 'league'], 'parallel', 3),
  ('00000000-0000-0000-0000-000000000001', 'hype', ARRAY['brand', 'league'], 'parallel', 4),
  ('00000000-0000-0000-0000-000000000001', 'pr', ARRAY['brand', 'league'], 'parallel', 5),
  ('00000000-0000-0000-0000-000000000001', 'trust', ARRAY['brand', 'league'], 'parallel', 6),
  -- Athlete Spotlight requires Brand + League + PA approval
  ('00000000-0000-0000-0000-000000000001', 'spotlight', ARRAY['brand', 'league', 'pa'], 'parallel', 7)
ON CONFLICT (project_id, content_bucket) DO NOTHING;
