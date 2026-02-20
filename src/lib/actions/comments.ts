"use server";

import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/services/activity-logger";
import { revalidatePath } from "next/cache";
import type { Asset } from "@/lib/types";

export async function addComment({
  assetId,
  body,
  parentId,
}: {
  assetId: string;
  body: string;
  parentId?: string;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: comment, error } = await supabase
    .from("comments")
    .insert({
      asset_id: assetId,
      user_id: user.id,
      body,
      parent_id: parentId,
    } as never)
    .select()
    .single();

  if (error) return { error: error.message };

  // Get asset for activity log
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
      action: "commented",
      metadata: { asset_title: asset.title },
    });
  }

  revalidatePath(`/content/${assetId}`);
  return { data: comment };
}

export async function deleteComment(commentId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("comments").delete().eq("id", commentId);
  if (error) return { error: error.message };
  return { success: true };
}
