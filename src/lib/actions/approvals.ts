"use server";

import { createClient } from "@/lib/supabase/server";
import { createApprovalRecords, recalculateAssetStatus } from "@/lib/services/approval-engine";
import { logActivity } from "@/lib/services/activity-logger";
import { revalidatePath } from "next/cache";
import type { ApprovalStatus } from "@/lib/types/database";
import type { Asset } from "@/lib/types";

/**
 * Submit an asset for review. Creates approval records based on the approval chain
 * and updates asset status to 'in_review'.
 */
export async function submitForReview(assetId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Get asset details
  const { data: assetRow } = await supabase
    .from("assets")
    .select("*")
    .eq("id", assetId)
    .single();

  const asset = assetRow as unknown as Asset | null;
  if (!asset) return { error: "Asset not found" };

  // If resubmitting, increment version
  const newVersion = asset.status === "changes_requested" ? asset.version + 1 : asset.version;

  // Update asset status
  const { error: updateError } = await supabase
    .from("assets")
    .update({
      status: "in_review",
      version: newVersion,
    } as never)
    .eq("id", assetId);

  if (updateError) return { error: updateError.message };

  // Delete old pending approvals for previous version
  await supabase
    .from("approvals")
    .delete()
    .eq("asset_id", assetId)
    .eq("status", "pending");

  // Create new approval records
  const result = await createApprovalRecords(
    assetId,
    asset.project_id,
    asset.content_bucket,
    newVersion
  );

  if (result.error) return { error: result.error };

  await logActivity({
    projectId: asset.project_id,
    userId: user.id,
    assetId,
    action: "submitted_for_review",
    metadata: { asset_title: asset.title, version: newVersion },
  });

  revalidatePath("/content");
  revalidatePath(`/content/${assetId}`);
  revalidatePath("/dashboard");
  return { success: true };
}

/**
 * Submit an approval decision (approve, request changes, or reject).
 */
export async function submitApprovalDecision({
  approvalId,
  assetId,
  status,
  comment,
}: {
  approvalId: string;
  assetId: string;
  status: ApprovalStatus;
  comment?: string;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Update the approval record
  const { error } = await supabase
    .from("approvals")
    .update({
      status,
      comment,
      responded_at: new Date().toISOString(),
    } as never)
    .eq("id", approvalId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  // Recalculate asset status based on all approvals
  await recalculateAssetStatus(assetId);

  // Log the activity
  const { data: assetRow } = await supabase
    .from("assets")
    .select("*")
    .eq("id", assetId)
    .single();

  const asset = assetRow as unknown as Asset | null;
  if (asset) {
    await logActivity({
      projectId: asset.project_id,
      userId: user.id,
      assetId,
      action: status === "approved" ? "approved" : status === "changes_requested" ? "changes_requested" : "rejected",
      metadata: { asset_title: asset.title, comment },
    });
  }

  revalidatePath("/content");
  revalidatePath(`/content/${assetId}`);
  revalidatePath("/dashboard");
  return { success: true };
}
