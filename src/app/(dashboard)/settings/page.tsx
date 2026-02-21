import { createServiceClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { MemberList } from "@/components/settings/member-list";
import { InviteMemberDialog } from "@/components/settings/invite-member-dialog";
import { ApprovalChainEditor } from "@/components/settings/approval-chain-editor";
import type { ProjectMemberWithUser } from "@/lib/types";

export default async function SettingsPage() {
  const supabase = createServiceClient();

  const { data: projectRow } = await supabase
    .from("projects")
    .select("*")
    .limit(1)
    .single();

  if (!projectRow) {
    return <p className="text-muted-foreground p-6">No project found.</p>;
  }

  const project = projectRow as unknown as import("@/lib/types").Project;
  const projectId = project.id;

  const { data: membersRaw } = await supabase
    .from("project_members")
    .select("*, user:users(*)")
    .eq("project_id", projectId)
    .order("created_at");
  const { data: chainsRaw } = await supabase
    .from("approval_chains")
    .select("*")
    .eq("project_id", projectId)
    .order("sort_order");

  const members = (membersRaw || []) as unknown as ProjectMemberWithUser[];
  const chains = (chainsRaw || []) as unknown as import("@/lib/types").ApprovalChain[];

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your project, team, and approval workflows.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Project Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div>
            <span className="text-muted-foreground">Name:</span>{" "}
            <span className="font-medium">{project.name}</span>
          </div>
          {project.description && (
            <div>
              <span className="text-muted-foreground">Description:</span>{" "}
              <span>{project.description}</span>
            </div>
          )}
          <div>
            <span className="text-muted-foreground">Duration:</span>{" "}
            <span>
              {new Date(project.start_date).toLocaleDateString()} {" "}
              {project.end_date ? new Date(project.end_date).toLocaleDateString() : "Ongoing"}
            </span>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Team Members</h2>
            <p className="text-sm text-muted-foreground">
              Manage who has access to this project and their roles.
            </p>
          </div>
          <InviteMemberDialog projectId={projectId} />
        </div>
        <MemberList
          members={members}
          projectId={projectId}
          currentUserId=""
        />
      </div>

      <Separator />

      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Approval Chains</h2>
          <p className="text-sm text-muted-foreground">
            Configure which roles must approve each content type.
          </p>
        </div>
        <ApprovalChainEditor chains={chains || []} projectId={projectId} />
      </div>
    </div>
  );
}
