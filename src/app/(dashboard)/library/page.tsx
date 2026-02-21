import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
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

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Please sign in to view the library.</p>
      </div>
    );
  }

  const { data: membershipRow } = await supabase
    .from("project_members")
    .select("*")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  const membership = membershipRow as { project_id: string; role: string; user_id: string; id: string } | null;
  if (!membership) redirect("/dashboard");

  const projectId = membership.project_id;

  // Phases for filters
  const { data: phases } = await supabase
    .from("phases")
    .select("*")
    .eq("project_id", projectId)
    .order("sort_order");

  // Query approved/published/archived assets (the library)
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
