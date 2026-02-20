"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { updateAssetStatus } from "@/lib/actions/assets";
import { submitForReview } from "@/lib/actions/approvals";
import type { AssetStatus } from "@/lib/types/database";
import {
  Send,
  CheckCircle,
  Archive,
  RotateCcw,
} from "lucide-react";

interface AssetStatusActionsProps {
  assetId: string;
  currentStatus: AssetStatus;
}

export function AssetStatusActions({ assetId, currentStatus }: AssetStatusActionsProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleStatusChange = async (status: AssetStatus) => {
    setLoading(true);
    const result = await updateAssetStatus(assetId, status);
    setLoading(false);

    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      toast({ title: `Asset status updated to ${status.replace("_", " ")}` });
    }
  };

  const handleSubmitForReview = async () => {
    setLoading(true);
    const result = await submitForReview(assetId);
    setLoading(false);

    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Submitted for review" });
    }
  };

  return (
    <div className="space-y-2">
      {currentStatus === "draft" && (
        <Button
          size="sm"
          className="w-full"
          onClick={handleSubmitForReview}
          disabled={loading}
        >
          <Send className="mr-1.5 h-4 w-4" />
          Submit for Review
        </Button>
      )}

      {currentStatus === "changes_requested" && (
        <Button
          size="sm"
          className="w-full"
          onClick={handleSubmitForReview}
          disabled={loading}
        >
          <Send className="mr-1.5 h-4 w-4" />
          Resubmit for Review
        </Button>
      )}

      {currentStatus === "approved" && (
        <Button
          size="sm"
          className="w-full bg-purple-600 hover:bg-purple-700"
          onClick={() => handleStatusChange("published")}
          disabled={loading}
        >
          <CheckCircle className="mr-1.5 h-4 w-4" />
          Mark as Published
        </Button>
      )}

      {(currentStatus === "published" || currentStatus === "approved") && (
        <Button
          size="sm"
          variant="outline"
          className="w-full"
          onClick={() => handleStatusChange("archived")}
          disabled={loading}
        >
          <Archive className="mr-1.5 h-4 w-4" />
          Archive
        </Button>
      )}

      {currentStatus === "archived" && (
        <Button
          size="sm"
          variant="outline"
          className="w-full"
          onClick={() => handleStatusChange("draft")}
          disabled={loading}
        >
          <RotateCcw className="mr-1.5 h-4 w-4" />
          Restore to Draft
        </Button>
      )}
    </div>
  );
}
