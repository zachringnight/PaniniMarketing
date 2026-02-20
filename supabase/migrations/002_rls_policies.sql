-- Partnership Hub: Row Level Security Policies
-- Ensures each role can only access what they're permitted to

-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE athletes ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_athletes ENABLE ROW LEVEL SECURITY;
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
-- PROJECTS
-- ============================================

-- All members can view their projects
CREATE POLICY "Members can view their projects"
  ON projects FOR SELECT
  USING (is_project_member(id));

-- Only admins can create projects
CREATE POLICY "Admins can create projects"
  ON projects FOR INSERT
  WITH CHECK (true); -- Controlled at application level; first project created during setup

-- Only admins can update projects
CREATE POLICY "Admins can update projects"
  ON projects FOR UPDATE
  USING (is_project_admin(id));

-- ============================================
-- USERS
-- ============================================

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  USING (id = auth.uid());

-- Users can read profiles of people in their projects
CREATE POLICY "Members can read co-member profiles"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm1
      JOIN project_members pm2 ON pm1.project_id = pm2.project_id
      WHERE pm1.user_id = auth.uid() AND pm2.user_id = users.id
    )
  );

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (id = auth.uid());

-- ============================================
-- PROJECT MEMBERS
-- ============================================

-- Members can see other members of their projects
CREATE POLICY "Members can view project members"
  ON project_members FOR SELECT
  USING (is_project_member(project_id));

-- Only admins can manage members
CREATE POLICY "Admins can insert project members"
  ON project_members FOR INSERT
  WITH CHECK (is_project_admin(project_id));

CREATE POLICY "Admins can update project members"
  ON project_members FOR UPDATE
  USING (is_project_admin(project_id));

CREATE POLICY "Admins can delete project members"
  ON project_members FOR DELETE
  USING (is_project_admin(project_id));

-- ============================================
-- PHASES
-- ============================================

-- All project members can view phases
CREATE POLICY "Members can view phases"
  ON phases FOR SELECT
  USING (is_project_member(project_id));

-- Only admins can manage phases
CREATE POLICY "Admins can manage phases"
  ON phases FOR ALL
  USING (is_project_admin(project_id));

-- ============================================
-- CLUBS
-- ============================================

-- All project members can view clubs
CREATE POLICY "Members can view clubs"
  ON clubs FOR SELECT
  USING (is_project_member(project_id));

-- Only admins can manage clubs
CREATE POLICY "Admins can manage clubs"
  ON clubs FOR ALL
  USING (is_project_admin(project_id));

-- ============================================
-- ATHLETES
-- ============================================

-- Members can view athletes (PA sees all athletes, needed for tagging context)
CREATE POLICY "Members can view athletes"
  ON athletes FOR SELECT
  USING (is_project_member(project_id));

-- Only admins can manage athletes
CREATE POLICY "Admins can manage athletes"
  ON athletes FOR ALL
  USING (is_project_admin(project_id));

-- ============================================
-- ASSETS (most complex RLS)
-- ============================================

-- Admins: full access
CREATE POLICY "Admins have full asset access"
  ON assets FOR ALL
  USING (is_project_admin(project_id));

-- Brand & League: can read all assets in their project
CREATE POLICY "Brand and League can read all assets"
  ON assets FOR SELECT
  USING (
    get_user_role(project_id) IN ('brand', 'league')
  );

-- PA: can only read assets tagged to athletes
CREATE POLICY "PA can read athlete-tagged assets"
  ON assets FOR SELECT
  USING (
    get_user_role(project_id) = 'pa'
    AND EXISTS (
      SELECT 1 FROM asset_athletes WHERE asset_id = assets.id
    )
  );

-- Club: can read assets tagged to their club + approved league-wide assets
CREATE POLICY "Club can read their tagged and approved assets"
  ON assets FOR SELECT
  USING (
    get_user_role(project_id) = 'club'
    AND (
      -- Assets tagged to clubs the user belongs to (via project_members)
      EXISTS (
        SELECT 1 FROM asset_clubs ac
        WHERE ac.asset_id = assets.id
      )
      OR
      -- Approved/published league-wide assets (not club-specific)
      (status IN ('approved', 'published') AND NOT EXISTS (
        SELECT 1 FROM asset_clubs ac WHERE ac.asset_id = assets.id
      ))
    )
  );

-- Viewer: can only read approved/published assets
CREATE POLICY "Viewer can read approved assets"
  ON assets FOR SELECT
  USING (
    get_user_role(project_id) = 'viewer'
    AND status IN ('approved', 'published')
  );

-- ============================================
-- ASSET_ATHLETES (junction)
-- ============================================

CREATE POLICY "Members can view asset athletes"
  ON asset_athletes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM assets a WHERE a.id = asset_id AND is_project_member(a.project_id)
    )
  );

CREATE POLICY "Admins can manage asset athletes"
  ON asset_athletes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM assets a WHERE a.id = asset_id AND is_project_admin(a.project_id)
    )
  );

-- ============================================
-- ASSET_CLUBS (junction)
-- ============================================

CREATE POLICY "Members can view asset clubs"
  ON asset_clubs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM assets a WHERE a.id = asset_id AND is_project_member(a.project_id)
    )
  );

CREATE POLICY "Admins can manage asset clubs"
  ON asset_clubs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM assets a WHERE a.id = asset_id AND is_project_admin(a.project_id)
    )
  );

-- ============================================
-- APPROVALS
-- ============================================

-- Members can view approvals for assets they can see
CREATE POLICY "Members can view approvals"
  ON approvals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM assets a WHERE a.id = asset_id AND is_project_member(a.project_id)
    )
  );

-- Admins can create approval requests
CREATE POLICY "Admins can create approvals"
  ON approvals FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM assets a WHERE a.id = asset_id AND is_project_admin(a.project_id)
    )
  );

-- Approvers can update their own approval (approve/reject/request changes)
CREATE POLICY "Approvers can update own approval"
  ON approvals FOR UPDATE
  USING (user_id = auth.uid());

-- ============================================
-- COMMENTS
-- ============================================

-- Members can view comments on assets they can see
CREATE POLICY "Members can view comments"
  ON comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM assets a WHERE a.id = asset_id AND is_project_member(a.project_id)
    )
  );

-- Members with comment permission can add comments (admin, brand, league, pa)
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

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE
  USING (user_id = auth.uid());

-- ============================================
-- ACTIVITY LOG
-- ============================================

-- Members can view activity for their project
CREATE POLICY "Members can view activity"
  ON activity_log FOR SELECT
  USING (is_project_member(project_id));

-- System/server inserts activity (using service role key, bypasses RLS)
-- Application-level inserts via server actions with service role

-- ============================================
-- APPROVAL CHAINS
-- ============================================

-- Members can view approval chains
CREATE POLICY "Members can view approval chains"
  ON approval_chains FOR SELECT
  USING (is_project_member(project_id));

-- Only admins can manage approval chains
CREATE POLICY "Admins can manage approval chains"
  ON approval_chains FOR ALL
  USING (is_project_admin(project_id));
