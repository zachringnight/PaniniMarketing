import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AssetForm } from "@/components/content/asset-form";
import type { Phase, Club, Athlete } from "@/lib/types";

export default async function NewAssetPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membershipRow } = await supabase
    .from("project_members")
    .select("*")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  const membership = membershipRow as { project_id: string; role: string } | null;
  if (!membership || membership.role !== "admin") redirect("/content");

  const projectId = membership.project_id;

  const { data: phasesRaw } = await supabase.from("phases").select("*").eq("project_id", projectId).order("sort_order");
  const { data: clubsRaw } = await supabase.from("clubs").select("*").eq("project_id", projectId).order("name");
  const { data: athletesRaw } = await supabase.from("hub_athletes").select("*").eq("project_id", projectId).order("full_name");

  const phases = (phasesRaw || []) as unknown as Phase[];
  const clubs = (clubsRaw || []) as unknown as Club[];
  const athletes = (athletesRaw || []) as unknown as Athlete[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">New Asset</h1>
        <p className="text-muted-foreground">
          Create a new content asset and add it to the approval queue.
        </p>
      </div>
      <AssetForm
        projectId={projectId}
        phases={phases}
        clubs={clubs}
        athletes={athletes}
      />
    </div>
  );
}
