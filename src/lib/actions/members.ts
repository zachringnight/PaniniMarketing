"use server";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/services/activity-logger";
import { revalidatePath } from "next/cache";
import type { UserRole } from "@/lib/types/database";

async function verifyAdmin(supabase: ReturnType<typeof createClient>, userId: string, projectId: string) {
  const { data: memberRow } = await supabase
    .from("project_members")
    .select("role")
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .single();

  const member = memberRow as unknown as { role: string } | null;
  return member?.role === "admin";
}

export async function inviteMember({
  projectId,
  email,
  role,
  fullName,
}: {
  projectId: string;
  email: string;
  role: UserRole;
  fullName: string;
}) {
  const supabase = createClient();
  const serviceClient = createServiceClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Verify caller is admin on this project
  if (!(await verifyAdmin(supabase, user.id, projectId))) {
    return { error: "Not authorized" };
  }

  // Check if user already exists
  const { data: existingUserRow } = await serviceClient
    .from("users")
    .select("*")
    .eq("email", email)
    .single();

  const existingUser = existingUserRow as unknown as { id: string; email: string } | null;

  if (existingUser) {
    // User exists — check if already a member
    const { data: existingMemberRow } = await serviceClient
      .from("project_members")
      .select("*")
      .eq("project_id", projectId)
      .eq("user_id", existingUser.id)
      .single();

    const existingMember = existingMemberRow as unknown as { id: string } | null;

    if (existingMember) {
      return { error: "User is already a member of this project" };
    }

    // Add to project
    const { error } = await serviceClient.from("project_members").insert({
      project_id: projectId,
      user_id: existingUser.id,
      role,
    } as never);

    if (error) return { error: error.message };
  } else {
    // Invite new user via Supabase Auth
    const { data: inviteData, error: inviteError } = await serviceClient.auth.admin.inviteUserByEmail(email, {
      data: { full_name: fullName },
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    });

    if (inviteError) return { error: inviteError.message };

    if (inviteData.user) {
      // Create user profile
      await serviceClient.from("users").upsert({
        id: inviteData.user.id,
        email,
        full_name: fullName,
      } as never);

      // Add to project
      await serviceClient.from("project_members").insert({
        project_id: projectId,
        user_id: inviteData.user.id,
        role,
      } as never);
    }
  }

  await logActivity({
    projectId,
    userId: user.id,
    action: "user_invited",
    metadata: { invited_email: email, role },
  });

  revalidatePath("/settings");
  return { success: true };
}

export async function updateMemberRole({
  memberId,
  role,
  projectId,
}: {
  memberId: string;
  role: UserRole;
  projectId: string;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  if (!(await verifyAdmin(supabase, user.id, projectId))) {
    return { error: "Not authorized" };
  }

  const { error } = await supabase
    .from("project_members")
    .update({ role } as never)
    .eq("id", memberId)
    .eq("project_id", projectId);

  if (error) return { error: error.message };

  await logActivity({
    projectId,
    userId: user.id,
    action: "role_changed",
    metadata: { member_id: memberId, new_role: role },
  });

  revalidatePath("/settings");
  return { success: true };
}

export async function removeMember({
  memberId,
  projectId,
}: {
  memberId: string;
  projectId: string;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  if (!(await verifyAdmin(supabase, user.id, projectId))) {
    return { error: "Not authorized" };
  }

  const { error } = await supabase
    .from("project_members")
    .delete()
    .eq("id", memberId)
    .eq("project_id", projectId);

  if (error) return { error: error.message };

  revalidatePath("/settings");
  return { success: true };
}
