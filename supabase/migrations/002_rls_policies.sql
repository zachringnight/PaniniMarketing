-- Partnership Hub: Row Level Security Policies
-- Idempotent — safe to run multiple times on a shared Supabase instance.
-- Ensures each role can only access what they're permitted to.

-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE hub_athletes ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE hub_asset_athletes ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_chains ENABLE ROW LEVEL SECURITY;

-- ============================================
-- HELPER FUNCTION: Get user's role in a project
-- ============================================

CREATE OR REPLACE FUNCTION get_user_role(p_project_id uuid)
RETURNS user_role AS $$
  SELECT role FROM project_members
  WHERE project_id = p_project_id AND user_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: Check if user is a member of a project
CREATE OR REPLACE FUNCTION is_project_member(p_project_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM project_members
    WHERE project_id = p_project_id AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: Check if user is admin of a project
CREATE OR REPLACE FUNCTION is_project_admin(p_project_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM project_members
    WHERE project_id = p_project_id AND user_id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================
-- POLICIES (DROP IF EXISTS + CREATE for idempotency)
-- ============================================

-- PROJECTS
DROP POLICY IF EXISTS "Members can view their projects" ON projects;
CREATE POLICY "Members can view their projects"
  ON projects FOR SELECT
  USING (is_project_member(id));

DROP POLICY IF EXISTS "Admins can create projects" ON projects;
CREATE POLICY "Admins can create projects"
  ON projects FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can update projects" ON projects;
CREATE POLICY "Admins can update projects"
  ON projects FOR UPDATE
  USING (is_project_admin(id));

-- USERS
DROP POLICY IF EXISTS "Users can read own profile" ON users;
CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  USING (id = auth.uid());

DROP POLICY IF EXISTS "Members can read co-member profiles" ON users;
CREATE POLICY "Members can read co-member profiles"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm1
      JOIN project_members pm2 ON pm1.project_id = pm2.project_id
      WHERE pm1.user_id = auth.uid() AND pm2.user_id = users.id
    )
  );

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (id = auth.uid());

-- PROJECT MEMBERS
DROP POLICY IF EXISTS "Members can view project members" ON project_members;
CREATE POLICY "Members can view project members"
  ON project_members FOR SELECT
  USING (is_project_member(project_id));

DROP POLICY IF EXISTS "Admins can insert project members" ON project_members;
CREATE POLICY "Admins can insert project members"
  ON project_members FOR INSERT
  WITH CHECK (is_project_admin(project_id));

DROP POLICY IF EXISTS "Admins can update project members" ON project_members;
CREATE POLICY "Admins can update project members"
  ON project_members FOR UPDATE
  USING (is_project_admin(project_id));

DROP POLICY IF EXISTS "Admins can delete project members" ON project_members;
CREATE POLICY "Admins can delete project members"
  ON project_members FOR DELETE
  USING (is_project_admin(project_id));

-- PHASES
DROP POLICY IF EXISTS "Members can view phases" ON phases;
CREATE POLICY "Members can view phases"
  ON phases FOR SELECT
  USING (is_project_member(project_id));

DROP POLICY IF EXISTS "Admins can manage phases" ON phases;
CREATE POLICY "Admins can manage phases"
  ON phases FOR ALL
  USING (is_project_admin(project_id));

-- CLUBS
DROP POLICY IF EXISTS "Members can view clubs" ON clubs;
CREATE POLICY "Members can view clubs"
  ON clubs FOR SELECT
  USING (is_project_member(project_id));

DROP POLICY IF EXISTS "Admins can manage clubs" ON clubs;
CREATE POLICY "Admins can manage clubs"
  ON clubs FOR ALL
  USING (is_project_admin(project_id));

-- HUB ATHLETES
DROP POLICY IF EXISTS "Members can view hub athletes" ON hub_athletes;
CREATE POLICY "Members can view hub athletes"
  ON hub_athletes FOR SELECT
  USING (is_project_member(project_id));

DROP POLICY IF EXISTS "Admins can manage hub athletes" ON hub_athletes;
CREATE POLICY "Admins can manage hub athletes"
  ON hub_athletes FOR ALL
  USING (is_project_admin(project_id));

-- ASSETS
DROP POLICY IF EXISTS "Admins have full asset access" ON assets;
CREATE POLICY "Admins have full asset access"
  ON assets FOR ALL
  USING (is_project_admin(project_id));

DROP POLICY IF EXISTS "Brand and League can read all assets" ON assets;
CREATE POLICY "Brand and League can read all assets"
  ON assets FOR SELECT
  USING (
    get_user_role(project_id) IN ('brand', 'league')
  );

DROP POLICY IF EXISTS "PA can read athlete-tagged assets" ON assets;
CREATE POLICY "PA can read athlete-tagged assets"
  ON assets FOR SELECT
  USING (
    get_user_role(project_id) = 'pa'
    AND EXISTS (
      SELECT 1 FROM hub_asset_athletes WHERE asset_id = assets.id
    )
  );

DROP POLICY IF EXISTS "Club can read their tagged and approved assets" ON assets;
CREATE POLICY "Club can read their tagged and approved assets"
  ON assets FOR SELECT
  USING (
    get_user_role(project_id) = 'club'
    AND (
      EXISTS (
        SELECT 1 FROM asset_clubs ac
        WHERE ac.asset_id = assets.id
      )
      OR
      (status IN ('approved', 'published') AND NOT EXISTS (
        SELECT 1 FROM asset_clubs ac WHERE ac.asset_id = assets.id
      ))
    )
  );

DROP POLICY IF EXISTS "Viewer can read approved assets" ON assets;
CREATE POLICY "Viewer can read approved assets"
  ON assets FOR SELECT
  USING (
    get_user_role(project_id) = 'viewer'
    AND status IN ('approved', 'published')
  );

-- HUB ASSET_ATHLETES
DROP POLICY IF EXISTS "Members can view hub asset athletes" ON hub_asset_athletes;
CREATE POLICY "Members can view hub asset athletes"
  ON hub_asset_athletes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM assets a WHERE a.id = asset_id AND is_project_member(a.project_id)
    )
  );

DROP POLICY IF EXISTS "Admins can manage hub asset athletes" ON hub_asset_athletes;
CREATE POLICY "Admins can manage hub asset athletes"
  ON hub_asset_athletes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM assets a WHERE a.id = asset_id AND is_project_admin(a.project_id)
    )
  );

-- ASSET_CLUBS
DROP POLICY IF EXISTS "Members can view asset clubs" ON asset_clubs;
CREATE POLICY "Members can view asset clubs"
  ON asset_clubs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM assets a WHERE a.id = asset_id AND is_project_member(a.project_id)
    )
  );

DROP POLICY IF EXISTS "Admins can manage asset clubs" ON asset_clubs;
CREATE POLICY "Admins can manage asset clubs"
  ON asset_clubs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM assets a WHERE a.id = asset_id AND is_project_admin(a.project_id)
    )
  );

-- APPROVALS
DROP POLICY IF EXISTS "Members can view approvals" ON approvals;
CREATE POLICY "Members can view approvals"
  ON approvals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM assets a WHERE a.id = asset_id AND is_project_member(a.project_id)
    )
  );

DROP POLICY IF EXISTS "Admins can create approvals" ON approvals;
CREATE POLICY "Admins can create approvals"
  ON approvals FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM assets a WHERE a.id = asset_id AND is_project_admin(a.project_id)
    )
  );

DROP POLICY IF EXISTS "Approvers can update own approval" ON approvals;
CREATE POLICY "Approvers can update own approval"
  ON approvals FOR UPDATE
  USING (user_id = auth.uid());

-- COMMENTS
DROP POLICY IF EXISTS "Members can view comments" ON comments;
CREATE POLICY "Members can view comments"
  ON comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM assets a WHERE a.id = asset_id AND is_project_member(a.project_id)
    )
  );

DROP POLICY IF EXISTS "Authorized members can add comments" ON comments;
CREATE POLICY "Authorized members can add comments"
  ON comments FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM assets a
      JOIN project_members pm ON pm.project_id = a.project_id
      WHERE a.id = asset_id
        AND pm.user_id = auth.uid()
        AND pm.role IN ('admin', 'brand', 'league', 'pa')
    )
  );

DROP POLICY IF EXISTS "Users can delete own comments" ON comments;
CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE
  USING (user_id = auth.uid());

-- ACTIVITY LOG
DROP POLICY IF EXISTS "Members can view activity" ON activity_log;
CREATE POLICY "Members can view activity"
  ON activity_log FOR SELECT
  USING (is_project_member(project_id));

-- APPROVAL CHAINS
DROP POLICY IF EXISTS "Members can view approval chains" ON approval_chains;
CREATE POLICY "Members can view approval chains"
  ON approval_chains FOR SELECT
  USING (is_project_member(project_id));

DROP POLICY IF EXISTS "Admins can manage approval chains" ON approval_chains;
CREATE POLICY "Admins can manage approval chains"
  ON approval_chains FOR ALL
  USING (is_project_admin(project_id));
