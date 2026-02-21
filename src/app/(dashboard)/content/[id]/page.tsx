import { createServiceClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import {
  ExternalLink,
  ArrowLeft,
  Image as ImageIcon,
  Pencil,
} from "lucide-react";
import { StatusBadge } from "@/components/content/status-badge";
import { ApprovalPanel } from "@/components/content/approval-panel";
import { CommentThread } from "@/components/content/comment-thread";
import { AssetStatusActions } from "@/components/content/asset-status-actions";
import {
  CONTENT_BUCKET_LABELS,
  ASSET_FORMAT_LABELS,
  SOURCE_STATION_LABELS,
} from "@/lib/types";
import type { ApprovalWithUser, CommentWithUser } from "@/lib/types";

export default async function AssetDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createServiceClient();

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
  const assetAthletes = (assetAthletesRaw || []) as unknown as { athlete: { id: string; full_name: string } }[];
  const assetClubs = (assetClubsRaw || []) as unknown as { club: { id: string; name: string } }[];

  const phase = asset.phase;
  const createdByUser = asset.created_by_user;

  return (
    <div className="space-y-6">
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
          <Link href={`/content/${params.id}/edit`}>
            <Button variant="outline" size="sm">
              <Pencil className="mr-1.5 h-4 w-4" />
              Edit
            </Button>
          </Link>
          <a href={asset.external_url} target="_blank" rel="noopener noreferrer">
            <Button size="sm">
              <ExternalLink className="mr-1.5 h-4 w-4" />
              Open File
            </Button>
          </a>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex gap-6">
                <div className="h-48 w-48 shrink-0 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                  {asset.thumbnail_url ? (
                    <Image
                      src={asset.thumbnail_url}
                      alt={asset.title}
                      width={192}
                      height={192}
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
                  <p className="font-medium">{phase?.name || "\u2014"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Source Station</span>
                  <p className="font-medium">
                    {asset.source_station
                      ? SOURCE_STATION_LABELS[asset.source_station]
                      : "\u2014"}
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
                      : "\u2014"}
                  </p>
                </div>
              </div>

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
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {assetAthletes.map((aa: { athlete: { id: string; full_name: string } }) => (
                            <Badge key={aa.athlete.id} variant="secondary" className="text-xs">
                              {aa.athlete.full_name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Comments</CardTitle>
            </CardHeader>
            <CardContent>
              <CommentThread
                comments={commentsData}
                assetId={params.id}
                canComment={true}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Status Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <AssetStatusActions assetId={params.id} currentStatus={asset.status} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Approvals</CardTitle>
            </CardHeader>
            <CardContent>
              <ApprovalPanel approvals={approvals} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
