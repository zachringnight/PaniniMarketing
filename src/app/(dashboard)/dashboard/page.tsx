import { createServiceClient } from "@/lib/supabase/server";
import { StatsBar } from "@/components/dashboard/stats-bar";
import { Timeline } from "@/components/dashboard/timeline";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { PendingApprovals } from "@/components/dashboard/pending-approvals";
import type { Asset, Phase, ActivityLogEntry, User } from "@/lib/types";

export default async function DashboardPage() {
  const supabase = createServiceClient();

  // Get first project
  const { data: projectRow } = await supabase
    .from("projects")
    .select("*")
    .limit(1)
    .single();

  if (!projectRow) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">No project found.</p>
      </div>
    );
  }

  const project = projectRow as unknown as { id: string; name: string };
  const projectId = project.id;

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

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const pendingApprovals = allAssets.filter((a) => a.status === "in_review").length;
  const overdueItems = allAssets.filter(
    (a) => a.approval_due && new Date(a.approval_due) < now && a.status === "in_review"
  ).length;
  const publishedThisWeek = allAssets.filter(
    (a) => a.publish_date && new Date(a.publish_date) >= weekAgo && a.status === "published"
  ).length;

  const assetsByPhase: Record<string, Asset[]> = {};
  for (const asset of allAssets) {
    if (!assetsByPhase[asset.phase_id]) {
      assetsByPhase[asset.phase_id] = [];
    }
    assetsByPhase[asset.phase_id].push(asset);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          {project.name}
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
          <PendingApprovals assets={[]} />
          <ActivityFeed activities={activities} />
        </div>
      </div>
    </div>
  );
}
