import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { RosterTable } from "@/components/roster/roster-table";
import type { RosterAthleteWithContentCount } from "@/lib/types";

export default async function RosterPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Get membership to scope queries to current project
  const { data: membershipRow } = await supabase
    .from("project_members")
    .select("*")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  const membership = membershipRow as { project_id: string; role: string; user_id: string; id: string } | null;
  if (!membership) redirect("/dashboard");

  const projectId = membership.project_id;

  // Fetch all roster athletes
  const { data: athletesRaw } = await supabase
    .from("athletes")
    .select("*")
    .order("name");

  // Fetch all asset links joined to hub_athletes so we can count distinct assets per roster_athlete
  const { data: assetLinks } = await supabase
    .from("hub_asset_athletes")
    .select("asset_id, hub_athletes!inner(roster_athlete_id, project_id)")
    .eq("hub_athletes.project_id", projectId)
    .not("hub_athletes.roster_athlete_id", "is", null);

  // Build a map of roster_athlete_id → distinct content (asset) count
  const countMap = new Map<number, number>();
  if (assetLinks) {
    const assetSetMap = new Map<number, Set<number>>();

    for (const row of assetLinks as unknown as { asset_id: string; hub_athletes: { roster_athlete_id: number } }[]) {
      const rosterId = row.hub_athletes?.roster_athlete_id;
      const assetId = row.asset_id;

      if (rosterId == null || assetId == null) continue;

      let assetSet = assetSetMap.get(rosterId);
      if (!assetSet) {
        assetSet = new Set<string>();
        assetSetMap.set(rosterId, assetSet);
      }
      assetSet.add(assetId);
    }

    for (const [rosterId, assetSet] of assetSetMap.entries()) {
      countMap.set(rosterId, assetSet.size);
    }
  }

  const athletes: RosterAthleteWithContentCount[] = ((athletesRaw || []) as unknown as RosterAthleteWithContentCount[]).map(
    (a) => ({
      ...a,
      content_count: countMap.get(a.id) || 0,
    })
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Athlete Roster</h1>
        <p className="text-muted-foreground">
          Master roster of Panini athlete partnerships. {athletes.length} athletes total.
        </p>
      </div>
      <RosterTable athletes={athletes} />
    </div>
  );
}
