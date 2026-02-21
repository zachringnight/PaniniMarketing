import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { StatusBadge } from "@/components/content/status-badge";
import { CONTENT_BUCKET_LABELS } from "@/lib/types";
import type { Asset } from "@/lib/types";

interface PendingApprovalsProps {
  assets: Asset[];
}

export function PendingApprovals({ assets }: PendingApprovalsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="h-5 w-5" />
          Pending Your Review
        </CardTitle>
      </CardHeader>
      <CardContent>
        {assets.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No items waiting for your review.
          </p>
        ) : (
          <div className="space-y-3">
            {assets.map((asset) => (
              <Link
                key={asset.id}
                href={`/content/${asset.id}`}
                className="flex items-center gap-3 rounded-lg border p-3 text-sm hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{asset.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {CONTENT_BUCKET_LABELS[asset.content_bucket]}
                  </p>
                </div>
                <StatusBadge status={asset.status} />
                {asset.approval_due && (
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    Due:{" "}
                    {new Date(asset.approval_due).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
