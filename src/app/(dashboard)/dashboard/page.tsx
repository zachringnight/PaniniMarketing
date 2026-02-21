import { createClient } from "@/lib/supabase/server";
import { StatsBar } from "@/components/dashboard/stats-bar";
import { Timeline } from "@/components/dashboard/timeline";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { PendingApprovals } from "@/components/dashboard/pending-approvals";
import { redirect } from "next/navigation";
import type { Asset, Phase, ActivityLogEntry, User } from "@/lib/types";

export default async function DashboardPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Get user's project membership
  const { data: membershipRow } = await supabase
    .from("project_members")
    .select("*, projects(*)")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  const membership = membershipRow as { project_id: string; role: string; projects: { name: string } } | null;

  if (!membership) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">
          You are not assigned to any project yet. Contact your admin for access.
        </p>
      </div>
    );
  }

  const projectId = membership.project_id;

  // Fetch data (separate queries to avoid Promise.all type issues)
  const { data: phasesRaw } = await supabase
    .from("phases")
    .select("*")
    .eq("project_id", projectId)
    .order("sort_order");

  const { data: assetsRaw } = await supabase
    .from("assets")
    .select("*")
    .eq("project_id", projectId);

  const { data: activitiesRaw } = await supabase
    .from("activity_log")
    .select("*, user:users(*)")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(20);

  const { count: totalAssets } = await supabase
    .from("assets")
    .select("*", { count: "exact", head: true })
    .eq("project_id", projectId);

  const allAssets = (assetsRaw || []) as unknown as Asset[];
  const allPhases = (phasesRaw || []) as unknown as Phase[];
  const activities = (activitiesRaw || []) as unknown as (ActivityLogEntry & { user: User })[];

  // Calculate stats
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const pendingApprovals = allAssets.filter((a) => a.status === "in_review").length;
  const overdueItems = allAssets.filter(
    (a) => a.approval_due && new Date(a.approval_due) < now && a.status === "in_review"
  ).length;
  const publishedThisWeek = allAssets.filter(
    (a) => a.publish_date && new Date(a.publish_date) >= weekAgo && a.status === "published"
  ).length;

  // Group assets by phase
  const assetsByPhase: Record<string, Asset[]> = {};
  for (const asset of allAssets) {
    if (!assetsByPhase[asset.phase_id]) {
      assetsByPhase[asset.phase_id] = [];
    }
    assetsByPhase[asset.phase_id].push(asset);
  }

  // Get pending items for current user's review
  const { data: pendingRaw } = await supabase
    .from("approvals")
    .select("asset_id")
    .eq("user_id", user.id)
    .eq("status", "pending");

  const pendingForUser = (pendingRaw || []) as unknown as { asset_id: string }[];
  const pendingAssetIds = new Set(pendingForUser.map((a) => a.asset_id));
  const pendingAssets = allAssets.filter((a) => pendingAssetIds.has(a.id));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          {membership.projects.name}
        </p>
      </div>

      <StatsBar
        totalAssets={totalAssets || 0}
        pendingApprovals={pendingApprovals}
        overdueItems={overdueItems}
        publishedThisWeek={publishedThisWeek}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Timeline phases={allPhases} assetsByPhase={assetsByPhase} />
        </div>
        <div className="space-y-6">
          <PendingApprovals assets={pendingAssets} />
          <ActivityFeed activities={activities} />
        </div>
      </div>
    </div>
  );
}
