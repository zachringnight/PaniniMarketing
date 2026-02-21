"use server";

import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/services/activity-logger";
import { revalidatePath } from "next/cache";
import type { ContentBucket, AssetFormat, SourceStation, AssetStatus } from "@/lib/types/database";
import type { Asset } from "@/lib/types";

interface CreateAssetInput {
  projectId: string;
  phaseId: string;
  title: string;
  description?: string;
  contentBucket: ContentBucket;
  platforms: string[];
  format: AssetFormat;
  sourceStation?: SourceStation;
  externalUrl: string;
  thumbnailUrl?: string;
  approvalDue?: string;
  athleteIds?: string[];
  clubIds?: string[];
}

export async function createAsset(input: CreateAssetInput) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: assetRow, error } = await supabase
    .from("assets")
    .insert({
      project_id: input.projectId,
      phase_id: input.phaseId,
      title: input.title,
      description: input.description,
      content_bucket: input.contentBucket,
      platforms: input.platforms,
      format: input.format,
      source_station: input.sourceStation,
      external_url: input.externalUrl,
      thumbnail_url: input.thumbnailUrl,
      approval_due: input.approvalDue,
      created_by: user.id,
    } as never)
    .select()
    .single();

  if (error) return { error: error.message };

  const asset = assetRow as unknown as Asset;

  // Add athlete tags
  if (input.athleteIds?.length) {
    await supabase.from("hub_asset_athletes").insert(
      input.athleteIds.map((athleteId) => ({
        asset_id: asset.id,
        athlete_id: athleteId,
      })) as never
    );
  }

  // Add club tags
  if (input.clubIds?.length) {
    await supabase.from("asset_clubs").insert(
      input.clubIds.map((clubId) => ({
        asset_id: asset.id,
        club_id: clubId,
      })) as never
    );
  }

  await logActivity({
    projectId: input.projectId,
    userId: user.id,
    assetId: asset.id,
    action: "uploaded",
    metadata: { asset_title: input.title },
  });

  revalidatePath("/content");
  revalidatePath("/dashboard");
  return { data: asset };
}

export async function updateAsset(
  assetId: string,
  updates: {
    title?: string;
    description?: string;
    phaseId?: string;
    contentBucket?: ContentBucket;
    platforms?: string[];
    format?: AssetFormat;
    sourceStation?: SourceStation;
    externalUrl?: string;
    thumbnailUrl?: string;
    approvalDue?: string;
    athleteIds?: string[];
    clubIds?: string[];
  }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const dbUpdates: Record<string, unknown> = {};
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.phaseId !== undefined) dbUpdates.phase_id = updates.phaseId;
  if (updates.contentBucket !== undefined) dbUpdates.content_bucket = updates.contentBucket;
  if (updates.platforms !== undefined) dbUpdates.platforms = updates.platforms;
  if (updates.format !== undefined) dbUpdates.format = updates.format;
  if (updates.sourceStation !== undefined) dbUpdates.source_station = updates.sourceStation;
  if (updates.externalUrl !== undefined) dbUpdates.external_url = updates.externalUrl;
  if (updates.thumbnailUrl !== undefined) dbUpdates.thumbnail_url = updates.thumbnailUrl;
  if (updates.approvalDue !== undefined) dbUpdates.approval_due = updates.approvalDue;

  const { error } = await supabase
    .from("assets")
    .update(dbUpdates as never)
    .eq("id", assetId);

  if (error) return { error: error.message };

  // Update junction tables if provided
  if (updates.athleteIds !== undefined) {
    await supabase.from("hub_asset_athletes").delete().eq("asset_id", assetId);
    if (updates.athleteIds.length) {
      await supabase.from("hub_asset_athletes").insert(
        updates.athleteIds.map((athleteId) => ({
          asset_id: assetId,
          athlete_id: athleteId,
        })) as never
      );
    }
  }

  if (updates.clubIds !== undefined) {
    await supabase.from("asset_clubs").delete().eq("asset_id", assetId);
    if (updates.clubIds.length) {
      await supabase.from("asset_clubs").insert(
        updates.clubIds.map((clubId) => ({
          asset_id: assetId,
          club_id: clubId,
        })) as never
      );
    }
  }

  revalidatePath("/content");
  revalidatePath(`/content/${assetId}`);
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateAssetStatus(assetId: string, status: AssetStatus) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const updates: Record<string, unknown> = { status };
  if (status === "published") {
    updates.publish_date = new Date().toISOString();
  }

  const { data: assetRow, error } = await supabase
    .from("assets")
    .update(updates as never)
    .eq("id", assetId)
    .select()
    .single();

  if (error) return { error: error.message };

  const asset = assetRow as unknown as Asset;

  await logActivity({
    projectId: asset.project_id,
    userId: user.id,
    assetId: asset.id,
    action: status === "published" ? "published" : `status_changed_to_${status}`,
    metadata: { asset_title: asset.title, new_status: status },
  });

  revalidatePath("/content");
  revalidatePath(`/content/${assetId}`);
  revalidatePath("/dashboard");
  revalidatePath("/library");
  return { data: asset };
}

export async function deleteAsset(assetId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Verify user is admin on the project that owns this asset
  const { data: assetRow } = await supabase
    .from("assets")
    .select("project_id")
    .eq("id", assetId)
    .single();

  if (!assetRow) return { error: "Asset not found" };
  const asset = assetRow as unknown as { project_id: string };

  const { data: memberRow } = await supabase
    .from("project_members")
    .select("role")
    .eq("project_id", asset.project_id)
    .eq("user_id", user.id)
    .single();

  const member = memberRow as unknown as { role: string } | null;
  if (!member || member.role !== "admin") return { error: "Not authorized" };

  const { error } = await supabase.from("assets").delete().eq("id", assetId);
  if (error) return { error: error.message };

  revalidatePath("/content");
  revalidatePath("/dashboard");
  return { success: true };
}
