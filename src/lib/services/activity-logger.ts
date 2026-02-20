import { createServiceClient } from "@/lib/supabase/server";

export async function logActivity({
  projectId,
  userId,
  assetId,
  action,
  metadata,
}: {
  projectId: string;
  userId: string;
  assetId?: string;
  action: string;
  metadata?: Record<string, unknown>;
}) {
  const supabase = createServiceClient();
  await supabase.from("activity_log").insert({
    project_id: projectId,
    user_id: userId,
    asset_id: assetId,
    action,
    metadata,
  } as never);
}
