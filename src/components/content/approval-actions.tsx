"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { submitApprovalDecision } from "@/lib/actions/approvals";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface ApprovalActionsProps {
  approvalId: string;
  assetId: string;
}

export function ApprovalActions({ approvalId, assetId }: ApprovalActionsProps) {
  const { toast } = useToast();
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [showComment, setShowComment] = useState(false);

  const handleAction = async (status: "approved" | "changes_requested" | "rejected") => {
    if (status !== "approved" && !comment.trim()) {
      setShowComment(true);
      return;
    }

    setLoading(true);
    const result = await submitApprovalDecision({
      approvalId,
      assetId,
      status,
      comment: comment.trim() || undefined,
    });
    setLoading(false);

    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      toast({ title: `Asset ${status.replace("_", " ")}` });
    }
  };

  return (
    <div className="space-y-3">
      {showComment && (
        <Textarea
          placeholder="Add feedback or notes..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
        />
      )}
      <div className="flex gap-2">
        <Button
          size="sm"
          className="bg-green-600 hover:bg-green-700"
          onClick={() => handleAction("approved")}
          disabled={loading}
        >
          <CheckCircle className="mr-1.5 h-4 w-4" />
          Approve
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="text-amber-600 border-amber-300 hover:bg-amber-50"
          onClick={() => {
            setShowComment(true);
            if (comment.trim()) handleAction("changes_requested");
          }}
          disabled={loading}
        >
          <AlertCircle className="mr-1.5 h-4 w-4" />
          Request Changes
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="text-red-600 border-red-300 hover:bg-red-50"
          onClick={() => {
            setShowComment(true);
            if (comment.trim()) handleAction("rejected");
          }}
          disabled={loading}
        >
          <XCircle className="mr-1.5 h-4 w-4" />
          Reject
        </Button>
      </div>
    </div>
  );
}
