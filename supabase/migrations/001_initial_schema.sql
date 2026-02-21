-- Partnership Hub: Initial Database Schema
-- Idempotent — safe to run multiple times on a shared Supabase instance.
-- Run this against your Supabase project's SQL editor.

-- ============================================
-- ENUMS (idempotent via DO blocks)
-- ============================================

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'brand', 'league', 'pa', 'club', 'viewer');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE asset_status AS ENUM ('draft', 'in_review', 'approved', 'changes_requested', 'rejected', 'published', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE content_bucket AS ENUM ('partnership', 'product', 'collecting', 'spotlight', 'hype', 'pr', 'trust');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE asset_format AS ENUM ('static', 'carousel', 'short_video', 'long_video', 'story', 'document');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE source_station AS ENUM ('field', 'pack_rips', 'social', 'vnr', 'signing', 'na');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'changes_requested', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE chain_type AS ENUM ('parallel', 'sequential');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- CORE TABLES
-- ============================================

-- Projects
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  start_date date NOT NULL,
  end_date date,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- User profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  full_name text NOT NULL,
  organization text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Project membership with role
CREATE TABLE IF NOT EXISTS project_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(project_id, user_id)
);

-- Phases within a project
CREATE TABLE IF NOT EXISTS phases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  start_date date,
  end_date date,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Clubs
CREATE TABLE IF NOT EXISTS clubs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  market text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Athletes (named hub_athletes to avoid conflict with existing athletes table)
CREATE TABLE IF NOT EXISTS hub_athletes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  club_id uuid REFERENCES clubs(id) ON DELETE SET NULL,
  headshot_url text,
  embargo_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Assets (central content table)
CREATE TABLE IF NOT EXISTS assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  phase_id uuid NOT NULL REFERENCES phases(id) ON DELETE RESTRICT,
  title text NOT NULL,
  description text,
  content_bucket content_bucket NOT NULL,
  platforms text[] NOT NULL DEFAULT '{}',
  format asset_format NOT NULL,
  source_station source_station,
  external_url text NOT NULL,
  thumbnail_url text,
  version integer NOT NULL DEFAULT 1,
  status asset_status NOT NULL DEFAULT 'draft',
  approval_due timestamptz,
  publish_date timestamptz,
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Junction: assets <-> athletes
CREATE TABLE IF NOT EXISTS hub_asset_athletes (
  asset_id uuid NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  athlete_id uuid NOT NULL REFERENCES hub_athletes(id) ON DELETE CASCADE,
  PRIMARY KEY (asset_id, athlete_id)
);

-- Junction: assets <-> clubs
CREATE TABLE IF NOT EXISTS asset_clubs (
  asset_id uuid NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  club_id uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  PRIMARY KEY (asset_id, club_id)
);

-- Approvals
CREATE TABLE IF NOT EXISTS approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id),
  status approval_status NOT NULL DEFAULT 'pending',
  comment text,
  version_reviewed integer NOT NULL DEFAULT 1,
  responded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Comments (threaded)
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id),
  body text NOT NULL,
  parent_id uuid REFERENCES comments(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Activity log
CREATE TABLE IF NOT EXISTS activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id),
  asset_id uuid REFERENCES assets(id) ON DELETE SET NULL,
  action text NOT NULL,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Approval chains (configurable per project/content bucket)
CREATE TABLE IF NOT EXISTS approval_chains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  content_bucket content_bucket NOT NULL,
  required_roles text[] NOT NULL DEFAULT '{}',
  chain_type chain_type NOT NULL DEFAULT 'parallel',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(project_id, content_bucket)
);

-- ============================================
-- INDEXES (IF NOT EXISTS)
-- ============================================

CREATE INDEX IF NOT EXISTS idx_project_members_project ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user ON project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_phases_project ON phases(project_id);
CREATE INDEX IF NOT EXISTS idx_clubs_project ON clubs(project_id);
CREATE INDEX IF NOT EXISTS idx_hub_athletes_project ON hub_athletes(project_id);
CREATE INDEX IF NOT EXISTS idx_hub_athletes_club ON hub_athletes(club_id);
CREATE INDEX IF NOT EXISTS idx_assets_project ON assets(project_id);
CREATE INDEX IF NOT EXISTS idx_assets_phase ON assets(phase_id);
CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);
CREATE INDEX IF NOT EXISTS idx_assets_content_bucket ON assets(content_bucket);
CREATE INDEX IF NOT EXISTS idx_assets_created_by ON assets(created_by);
CREATE INDEX IF NOT EXISTS idx_hub_asset_athletes_asset ON hub_asset_athletes(asset_id);
CREATE INDEX IF NOT EXISTS idx_hub_asset_athletes_athlete ON hub_asset_athletes(athlete_id);
CREATE INDEX IF NOT EXISTS idx_asset_clubs_asset ON asset_clubs(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_clubs_club ON asset_clubs(club_id);
CREATE INDEX IF NOT EXISTS idx_approvals_asset ON approvals(asset_id);
CREATE INDEX IF NOT EXISTS idx_approvals_user ON approvals(user_id);
CREATE INDEX IF NOT EXISTS idx_approvals_status ON approvals(status);
CREATE INDEX IF NOT EXISTS idx_comments_asset ON comments(asset_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_project ON activity_log(project_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_user ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_asset ON activity_log(asset_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created ON activity_log(created_at DESC);

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at on assets
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER assets_updated_at
    BEFORE UPDATE ON assets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Auto-create user profile on auth signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$ BEGIN
  CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
