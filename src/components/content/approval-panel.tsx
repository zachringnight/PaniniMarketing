"use client";

import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CheckCircle, XCircle, AlertCircle, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { ApprovalWithUser } from "@/lib/types";
import type { ApprovalStatus } from "@/lib/types/database";

interface ApprovalPanelProps {
  approvals: ApprovalWithUser[];
}

const statusIcons: Record<ApprovalStatus, typeof CheckCircle> = {
  pending: Clock,
  approved: CheckCircle,
  changes_requested: AlertCircle,
  rejected: XCircle,
};

const statusColors: Record<ApprovalStatus, string> = {
  pending: "text-muted-foreground",
  approved: "text-green-600",
  changes_requested: "text-amber-600",
  rejected: "text-red-600",
};

const statusLabels: Record<ApprovalStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  changes_requested: "Changes Requested",
  rejected: "Rejected",
};

export function ApprovalPanel({ approvals }: ApprovalPanelProps) {
  if (approvals.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No approvals requested yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {approvals.map((approval) => {
        const Icon = statusIcons[approval.status];
        return (
          <div key={approval.id} className="flex items-start gap-3 rounded-lg border p-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">
                {approval.user.full_name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{approval.user.full_name}</span>
                <Badge variant="outline" className="text-xs">
                  {approval.user.organization || "—"}
                </Badge>
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <Icon className={`h-4 w-4 ${statusColors[approval.status]}`} />
                <span className={`text-xs font-medium ${statusColors[approval.status]}`}>
                  {statusLabels[approval.status]}
                </span>
                {approval.responded_at && (
                  <span className="text-xs text-muted-foreground">
                    &middot;{" "}
                    {formatDistanceToNow(new Date(approval.responded_at), {
                      addSuffix: true,
                    })}
                  </span>
                )}
              </div>
              {approval.comment && (
                <p className="text-sm text-muted-foreground mt-1.5">
                  {approval.comment}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
