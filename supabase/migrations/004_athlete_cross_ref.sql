-- Partnership Hub: Cross-reference hub_athletes with the master athletes roster
-- Idempotent — safe to run multiple times.

-- Add optional link from hub_athletes to the master roster
ALTER TABLE hub_athletes
  ADD COLUMN IF NOT EXISTS roster_athlete_id integer REFERENCES athletes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_hub_athletes_roster ON hub_athletes(roster_athlete_id);

-- View joining hub athletes with roster metadata
CREATE OR REPLACE VIEW hub_athletes_with_roster AS
SELECT
  ha.*,
  a.name   AS roster_name,
  a.sport  AS roster_sport,
  a.league AS roster_league,
  a.team   AS roster_team
FROM hub_athletes ha
LEFT JOIN athletes a ON ha.roster_athlete_id = a.id;
