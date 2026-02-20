import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ASSET_STATUS_LABELS } from "@/lib/types";
import type { AssetStatus } from "@/lib/types/database";

const statusColors: Record<AssetStatus, string> = {
  draft: "bg-slate-100 text-slate-700 border-slate-200",
  in_review: "bg-blue-100 text-blue-700 border-blue-200",
  approved: "bg-green-100 text-green-700 border-green-200",
  changes_requested: "bg-amber-100 text-amber-700 border-amber-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
  published: "bg-purple-100 text-purple-700 border-purple-200",
  archived: "bg-gray-100 text-gray-500 border-gray-200",
};

export function StatusBadge({ status }: { status: AssetStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn("text-xs font-medium", statusColors[status])}
    >
      {ASSET_STATUS_LABELS[status]}
    </Badge>
  );
}
