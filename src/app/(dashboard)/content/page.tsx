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
  searchParams: { q?: string; status?: string; bucket?: string; phase?: string };
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
        <AssetFilters phases={(phases || []) as unknown as import("@/lib/types").Phase[]} />
      </Suspense>

      <AssetList assets={assets} />
    </div>
  );
}
