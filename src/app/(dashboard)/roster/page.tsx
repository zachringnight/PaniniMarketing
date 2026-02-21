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

  // Fetch all roster athletes
  const { data: athletesRaw } = await supabase
    .from("athletes")
    .select("*")
    .order("name");

  // Fetch content counts: hub_athletes linked to roster → hub_asset_athletes
  const { data: linkCounts } = await supabase
    .from("hub_athletes")
    .select("roster_athlete_id, hub_asset_athletes(count)")
    .not("roster_athlete_id", "is", null);

  // Build a map of roster_athlete_id → content count
  const countMap = new Map<number, number>();
  if (linkCounts) {
    for (const row of linkCounts as unknown as { roster_athlete_id: number; hub_asset_athletes: { count: number }[] }[]) {
      const count = row.hub_asset_athletes?.[0]?.count ?? 0;
      const existing = countMap.get(row.roster_athlete_id) || 0;
      countMap.set(row.roster_athlete_id, existing + count);
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
