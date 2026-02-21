import { createClient } from "@/lib/supabase/server";
import { Suspense } from "react";
import { AssetFilters } from "@/components/content/asset-filters";
import { AssetGrid } from "@/components/library/asset-grid";
import { AssetList } from "@/components/content/asset-list";
import { ViewToggle } from "@/components/library/view-toggle";

export default async function AssetLibraryPage({
  searchParams,
}: {
  searchParams: {
    q?: string;
    status?: string;
    bucket?: string;
    phase?: string;
    view?: string;
  };
}) {
  const supabase = createClient();

  const { data: projectRow } = await supabase
    .from("projects")
    .select("id")
    .limit(1)
    .single();

  if (!projectRow) {
    return <p className="text-muted-foreground p-6">No project found.</p>;
  }

  const projectId = (projectRow as unknown as { id: string }).id;

  const { data: phases } = await supabase
    .from("phases")
    .select("*")
    .eq("project_id", projectId)
    .order("sort_order");

  let query = supabase
    .from("assets")
    .select("*, phase:phases(*)")
    .eq("project_id", projectId)
    .in("status", ["approved", "published", "archived"])
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

  const { data: assetsRaw } = await query;
  const assets = (assetsRaw || []) as unknown as import("@/lib/types").Asset[];

  const view = searchParams.view || "grid";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Asset Library</h1>
          <p className="text-muted-foreground">
            Browse approved and published content.
          </p>
        </div>
        <Suspense fallback={null}>
          <ViewToggle />
        </Suspense>
      </div>

      <Suspense fallback={null}>
        <AssetFilters phases={(phases || []) as unknown as import("@/lib/types").Phase[]} />
      </Suspense>

      {view === "grid" ? (
        <AssetGrid assets={assets} />
      ) : (
        <AssetList assets={assets} groupBy="none" />
      )}
    </div>
  );
}
