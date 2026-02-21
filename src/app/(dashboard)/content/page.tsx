import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { AssetFilters } from "@/components/content/asset-filters";
import { AssetList } from "@/components/content/asset-list";
import { Suspense } from "react";

export default async function ContentQueuePage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string; bucket?: string; phase?: string; athlete?: string };
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Get membership
  const { data: membershipRow } = await supabase
    .from("project_members")
    .select("*")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  const membership = membershipRow as { project_id: string; role: string; user_id: string; id: string } | null;
  if (!membership) redirect("/dashboard");

  const projectId = membership.project_id;

  // Fetch phases for filters
  const { data: phases } = await supabase
    .from("phases")
    .select("*")
    .eq("project_id", projectId)
    .order("sort_order");

  // Fetch roster athletes for filter dropdown
  const { data: rosterAthletes } = await supabase
    .from("athletes")
    .select("id, name")
    .order("name");

  // If athlete filter is set, find matching asset IDs
  let athleteAssetIds: string[] | null = null;
  if (searchParams.athlete) {
    const rosterId = parseInt(searchParams.athlete, 10);
    if (!isNaN(rosterId)) {
      // Find hub_athletes linked to this roster athlete within the current project
      const { data: hubAthletes } = await supabase
        .from("hub_athletes")
        .select("id")
        .eq("roster_athlete_id", rosterId)
        .eq("project_id", projectId);

      if (hubAthletes && hubAthletes.length > 0) {
        const hubIds = (hubAthletes as unknown as { id: string }[]).map((h) => h.id);
        const { data: assetLinks } = await supabase
          .from("hub_asset_athletes")
          .select("asset_id")
          .in("athlete_id", hubIds);
        athleteAssetIds = (assetLinks || []).map((l: { asset_id: string }) => l.asset_id);
      } else {
        athleteAssetIds = [];
      }
    }
  }

  // Build asset query with filters
  let query = supabase
    .from("assets")
    .select("*, phase:phases(*)")
    .eq("project_id", projectId)
    .order("updated_at", { ascending: false });

  if (searchParams.status) {
    query = query.eq("status", searchParams.status);
  }
  if (searchParams.bucket) {
    query = query.eq("content_bucket", searchParams.bucket);
  }
  if (searchParams.phase) {
    query = query.eq("phase_id", searchParams.phase);
  }
  if (searchParams.q) {
    query = query.ilike("title", `%${searchParams.q}%`);
  }
  if (athleteAssetIds !== null) {
    if (athleteAssetIds.length === 0) {
      // No matching assets - return empty
      query = query.in("id", ["__none__"]);
    } else {
      query = query.in("id", athleteAssetIds);
    }
  }

  const { data: assetsRaw } = await query;
  const assets = (assetsRaw || []) as unknown as (import("@/lib/types").Asset & { phase?: import("@/lib/types").Phase })[];

  const isAdmin = membership.role === "admin";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Content Queue</h1>
          <p className="text-muted-foreground">
            Manage and track content through the approval pipeline.
          </p>
        </div>
        {isAdmin && (
          <Link href="/content/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Asset
            </Button>
          </Link>
        )}
      </div>

      <Suspense fallback={null}>
        <AssetFilters
          phases={(phases || []) as unknown as import("@/lib/types").Phase[]}
          rosterAthletes={(rosterAthletes || []) as unknown as { id: number; name: string }[]}
        />
      </Suspense>

      <AssetList assets={assets} />
    </div>
  );
}
