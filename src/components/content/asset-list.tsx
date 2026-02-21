"use client";

import { AssetCardPreview } from "./asset-card-preview";
import type { Asset, Phase } from "@/lib/types";
import type { AssetStatus } from "@/lib/types/database";
import { ASSET_STATUS_LABELS } from "@/lib/types";

interface AssetListProps {
  assets: (Asset & { phase?: Phase })[];
  groupBy?: "status" | "none";
}

const statusOrder: AssetStatus[] = [
  "in_review",
  "changes_requested",
  "draft",
  "approved",
  "published",
  "rejected",
  "archived",
];

export function AssetList({ assets, groupBy = "status" }: AssetListProps) {
  if (assets.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">No assets found.</p>
      </div>
    );
  }

  if (groupBy === "none") {
    return (
      <div className="space-y-2">
        {assets.map((asset) => (
          <AssetCardPreview key={asset.id} asset={asset} />
        ))}
      </div>
    );
  }

  // Group by status
  const grouped = new Map<AssetStatus, typeof assets>();
  for (const asset of assets) {
    const group = grouped.get(asset.status) || [];
    group.push(asset);
    grouped.set(asset.status, group);
  }

  return (
    <div className="space-y-6">
      {statusOrder.map((status) => {
        const group = grouped.get(status);
        if (!group || group.length === 0) return null;
        return (
          <div key={status}>
            <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
              {ASSET_STATUS_LABELS[status]}
              <span className="text-xs font-normal">({group.length})</span>
            </h3>
            <div className="space-y-2">
              {group.map((asset) => (
                <AssetCardPreview key={asset.id} asset={asset} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
