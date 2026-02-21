import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ExternalLink,
  ArrowLeft,
  Image as ImageIcon,
  Pencil,
} from "lucide-react";
import { StatusBadge } from "@/components/content/status-badge";
import { ApprovalPanel } from "@/components/content/approval-panel";
import { ApprovalActions } from "@/components/content/approval-actions";
import { CommentThread } from "@/components/content/comment-thread";
import { AssetStatusActions } from "@/components/content/asset-status-actions";
import {
  CONTENT_BUCKET_LABELS,
  ASSET_FORMAT_LABELS,
  SOURCE_STATION_LABELS,
  ROLE_PERMISSIONS,
} from "@/lib/types";
import type { ApprovalWithUser, CommentWithUser } from "@/lib/types";

export default async function AssetDetailPage({
  params,
}: {
  params: { id: string };
}) {
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

  const membership = membershipRow as { project_id: string; role: string; user_id: string; id: string } | null;
  if (!membership) redirect("/dashboard");

  // Fetch asset with relations
  const { data: assetData } = await supabase
    .from("assets")
    .select("*, phase:phases(*), created_by_user:users!assets_created_by_fkey(*)")
    .eq("id", params.id)
    .single();

  if (!assetData) notFound();
  const asset = assetData as unknown as import("@/lib/types").Asset & {
    phase: { name: string } | null;
    created_by_user: { full_name: string } | null;
  };

  // Fetch related data
  const { data: approvalsRaw } = await supabase
    .from("approvals")
    .select("*, user:users(*)")
    .eq("asset_id", params.id)
    .order("created_at");

  const { data: commentsRaw } = await supabase
    .from("comments")
    .select("*, user:users(*)")
    .eq("asset_id", params.id)
    .order("created_at");

  const { data: assetAthletesRaw } = await supabase
    .from("hub_asset_athletes")
    .select("*, athlete:hub_athletes(*)")
    .eq("asset_id", params.id);

  const { data: assetClubsRaw } = await supabase
    .from("asset_clubs")
    .select("*, club:clubs(*)")
    .eq("asset_id", params.id);

  const approvals = (approvalsRaw || []) as unknown as ApprovalWithUser[];
  const commentsData = (commentsRaw || []) as unknown as CommentWithUser[];
  const assetAthletes = (assetAthletesRaw || []) as unknown as { athlete: { id: string; full_name: string; roster_athlete_id: number | null } }[];
  const assetClubs = (assetClubsRaw || []) as unknown as { club: { id: string; name: string } }[];

  // Fetch roster metadata for linked athletes
  const rosterIds = assetAthletes
    .map((aa) => aa.athlete?.roster_athlete_id)
    .filter((id): id is number => id != null);
  const rosterMap: Record<number, { sport: string; league: string; team: string }> = {};
  if (rosterIds.length > 0) {
    const { data: rosterData } = await supabase
      .from("athletes")
      .select("id, sport, league, team")
      .in("id", rosterIds);
    if (rosterData) {
      for (const r of rosterData as unknown as { id: number; sport: string; league: string; team: string }[]) {
        rosterMap[r.id] = { sport: r.sport, league: r.league, team: r.team };
      }
    }
  }

  const role = membership.role as import("@/lib/types/database").UserRole;
  const permissions = ROLE_PERMISSIONS[role];

  // Check if current user has a pending approval
  const userPendingApproval = approvals.find(
    (a) => a.user_id === user.id && a.status === "pending"
  );

  const phase = asset.phase;
  const createdByUser = asset.created_by_user;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/content">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{asset.title}</h1>
            <StatusBadge status={asset.status} />
            {asset.version > 1 && (
              <Badge variant="secondary">v{asset.version}</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Created by {createdByUser?.full_name || "Unknown"} &middot;{" "}
            {new Date(asset.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {role === "admin" && (
            <Link href={`/content/${params.id}/edit`}>
              <Button variant="outline" size="sm">
                <Pencil className="mr-1.5 h-4 w-4" />
                Edit
              </Button>
            </Link>
          )}
          <a href={asset.external_url} target="_blank" rel="noopener noreferrer">
            <Button size="sm">
              <ExternalLink className="mr-1.5 h-4 w-4" />
              Open File
            </Button>
          </a>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Preview & Description */}
          <Card>
            <CardContent className="p-6">
              <div className="flex gap-6">
                <div className="h-48 w-48 shrink-0 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                  {asset.thumbnail_url ? (
                    <img
                      src={asset.thumbnail_url}
                      alt={asset.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="h-12 w-12 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 space-y-3">
                  {asset.description && (
                    <div>
                      <h3 className="text-sm font-medium mb-1">Description / Caption</h3>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {asset.description}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Content Bucket</span>
                  <p className="font-medium">
                    {CONTENT_BUCKET_LABELS[asset.content_bucket]}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Format</span>
                  <p className="font-medium">
                    {ASSET_FORMAT_LABELS[asset.format]}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Phase</span>
                  <p className="font-medium">{phase?.name || "—"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Source Station</span>
                  <p className="font-medium">
                    {asset.source_station
                      ? SOURCE_STATION_LABELS[asset.source_station]
                      : "—"}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Platforms</span>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {asset.platforms.map((p) => (
                      <Badge key={p} variant="outline" className="text-xs">
                        {p}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Approval Due</span>
                  <p className="font-medium">
                    {asset.approval_due
                      ? new Date(asset.approval_due).toLocaleDateString()
                      : "—"}
                  </p>
                </div>
              </div>

              {/* Tags */}
              {(assetAthletes?.length || assetClubs?.length) ? (
                <>
                  <Separator className="my-4" />
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {assetClubs && assetClubs.length > 0 && (
                      <div>
                        <span className="text-muted-foreground">Clubs</span>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {assetClubs.map((ac: { club: { id: string; name: string } }) => (
                            <Badge key={ac.club.id} variant="secondary" className="text-xs">
                              {ac.club.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {assetAthletes && assetAthletes.length > 0 && (
                      <div>
                        <span className="text-muted-foreground">Athletes</span>
                        <div className="flex flex-wrap gap-1.5 mt-0.5">
                          {assetAthletes.map((aa) => {
                            const roster = aa.athlete?.roster_athlete_id
                              ? rosterMap[aa.athlete.roster_athlete_id]
                              : null;
                            return (
                              <Badge key={aa.athlete.id} variant="secondary" className="text-xs">
                                {aa.athlete.full_name}
                                {roster && (
                                  <span className="ml-1 text-muted-foreground font-normal">
                                    {roster.league} &middot; {roster.team}
                                  </span>
                                )}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </CardContent>
          </Card>

          {/* Comments */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Comments</CardTitle>
            </CardHeader>
            <CardContent>
              <CommentThread
                comments={commentsData}
                assetId={params.id}
                canComment={permissions.canComment}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Admin status controls */}
          {role === "admin" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Status Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <AssetStatusActions assetId={params.id} currentStatus={asset.status} />
              </CardContent>
            </Card>
          )}

          {/* Approval Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Approvals</CardTitle>
            </CardHeader>
            <CardContent>
              <ApprovalPanel
                approvals={approvals}
              />
              {userPendingApproval && (
                <>
                  <Separator className="my-4" />
                  <h4 className="text-sm font-medium mb-2">Your Review</h4>
                  <ApprovalActions
                    approvalId={userPendingApproval.id}
                    assetId={params.id}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
