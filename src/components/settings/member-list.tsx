"use client";

import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { updateMemberRole, removeMember } from "@/lib/actions/members";
import { ROLE_LABELS } from "@/lib/types";
import type { ProjectMemberWithUser } from "@/lib/types";
import type { UserRole } from "@/lib/types/database";
import { Trash2 } from "lucide-react";

interface MemberListProps {
  members: ProjectMemberWithUser[];
  projectId: string;
  currentUserId: string;
}

export function MemberList({ members, projectId, currentUserId }: MemberListProps) {
  const { toast } = useToast();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleRoleChange = async (memberId: string, role: UserRole) => {
    setLoadingId(memberId);
    const result = await updateMemberRole({ memberId, role, projectId });
    setLoadingId(null);
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
  };

  const handleRemove = async (memberId: string) => {
    setLoadingId(memberId);
    const result = await removeMember({ memberId, projectId });
    setLoadingId(null);
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-3">
      {members.map((member) => {
        const isSelf = member.user_id === currentUserId;
        return (
          <div
            key={member.id}
            className="flex items-center gap-4 rounded-lg border p-4"
          >
            <Avatar className="h-10 w-10">
              <AvatarFallback>
                {member.user.full_name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">
                {member.user.full_name}
                {isSelf && (
                  <span className="text-muted-foreground ml-1">(you)</span>
                )}
              </p>
              <p className="text-xs text-muted-foreground">{member.user.email}</p>
              {member.user.organization && (
                <Badge variant="outline" className="text-xs mt-1">
                  {member.user.organization}
                </Badge>
              )}
            </div>
            <Select
              value={member.role}
              onValueChange={(v) => handleRoleChange(member.id, v as UserRole)}
              disabled={isSelf || loadingId === member.id}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ROLE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!isSelf && (
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive"
                onClick={() => handleRemove(member.id)}
                disabled={loadingId === member.id}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}
