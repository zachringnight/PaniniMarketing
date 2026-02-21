-- Partnership Hub: Cross-reference hub_athletes with the master athletes roster
-- Idempotent — safe to run multiple times.
--
-- NOTE:
--   - The `athletes` table represents the master roster and is expected to be
--     provisioned outside of this migration set (e.g., by an upstream schema).
--   - This migration will only create the cross-reference and view if the
--     `athletes` table exists. If it does not, the migration will no-op and
--     emit a NOTICE instead of failing.
--   - Row Level Security (RLS) for the `athletes` table is assumed to be
--     managed where the table is defined. Ensure that existing RLS policies
--     permit the application role(s) to read from `athletes` if the
--     hub_athletes_with_roster view is to be used.

DO $$
BEGIN
  -- Only create the cross-reference and view if the external master roster
  -- table `athletes` exists. This keeps the migration idempotent and avoids
  -- hard failures when the external schema has not yet been applied.
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name   = 'athletes'
  ) THEN

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

  ELSE
    RAISE NOTICE 'Skipping hub_athletes roster cross-reference: table "athletes" not found. Ensure the external master roster schema is applied before this migration if the cross-reference is required.';
  END IF;
END
$$;
