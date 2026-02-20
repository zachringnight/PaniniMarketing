import { createServiceClient } from "@/lib/supabase/server";
import type { ContentBucket } from "@/lib/types/database";
import type { ApprovalChain, ProjectMember, Asset, Approval } from "@/lib/types";

/**
 * Get the approval chain configuration for a content bucket in a project.
 * Returns the required roles and chain type (parallel/sequential).
 */
export async function getApprovalChain(projectId: string, contentBucket: ContentBucket) {
  const supabase = createServiceClient();

  const { data: chainRow } = await supabase
    .from("approval_chains")
    .select("*")
    .eq("project_id", projectId)
    .eq("content_bucket", contentBucket)
    .single();

  return chainRow as unknown as ApprovalChain | null;
}

/**
 * Create approval records for an asset based on its content bucket's approval chain.
 * Finds project members with the required roles and creates pending approvals.
 */
export async function createApprovalRecords(assetId: string, projectId: string, contentBucket: ContentBucket, version: number) {
  const supabase = createServiceClient();

  const chain = await getApprovalChain(projectId, contentBucket);
  if (!chain) return { error: "No approval chain configured for this content bucket" };

  // Find one approver per required role
  const { data: membersRaw } = await supabase
    .from("project_members")
    .select("*")
    .eq("project_id", projectId)
    .in("role", chain.required_roles);

  const members = (membersRaw || []) as unknown as ProjectMember[];

  if (members.length === 0) {
    return { error: "No approvers found for the required roles" };
  }

  // Create one approval per unique approver
  const seen = new Set<string>();
  const approvals = members
    .filter((m) => {
      if (seen.has(m.user_id)) return false;
      seen.add(m.user_id);
      return true;
    })
    .map((member) => ({
      asset_id: assetId,
      user_id: member.user_id,
      status: "pending" as const,
      version_reviewed: version,
    }));

  const { error } = await supabase.from("approvals").insert(approvals as never);
  if (error) return { error: error.message };

  return { data: approvals };
}

/**
 * Check if all required approvals have been collected for an asset.
 * If so, auto-update the asset status to 'approved'.
 * If any are rejected, update to 'rejected'.
 * If any request changes, update to 'changes_requested'.
 */
export async function recalculateAssetStatus(assetId: string) {
  const supabase = createServiceClient();

  const { data: assetRow } = await supabase
    .from("assets")
    .select("*")
    .eq("id", assetId)
    .single();

  const asset = assetRow as unknown as Asset | null;
  if (!asset) return;

  const { data: approvalsRaw } = await supabase
    .from("approvals")
    .select("*")
    .eq("asset_id", assetId)
    .eq("version_reviewed", asset.version);

  const approvals = (approvalsRaw || []) as unknown as Approval[];
  if (approvals.length === 0) return;

  // Check for rejections first
  const rejected = approvals.some((a) => a.status === "rejected");
  if (rejected) {
    await supabase.from("assets").update({ status: "rejected" } as never).eq("id", assetId);
    return;
  }

  // Check for change requests
  const changesRequested = approvals.some((a) => a.status === "changes_requested");
  if (changesRequested) {
    await supabase.from("assets").update({ status: "changes_requested" } as never).eq("id", assetId);
    return;
  }

  // Check if all approved
  const allApproved = approvals.every((a) => a.status === "approved");
  if (allApproved) {
    await supabase.from("assets").update({ status: "approved" } as never).eq("id", assetId);
    return;
  }

  // Still pending (some approved, some pending)
}
