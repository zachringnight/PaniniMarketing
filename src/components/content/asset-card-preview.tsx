import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Image as ImageIcon } from "lucide-react";
import { StatusBadge } from "./status-badge";
import { CONTENT_BUCKET_LABELS, ASSET_FORMAT_LABELS } from "@/lib/types";
import type { Asset, Phase } from "@/lib/types";

interface AssetCardPreviewProps {
  asset: Asset & { phase?: Phase };
}

export function AssetCardPreview({ asset }: AssetCardPreviewProps) {
  return (
    <Link href={`/content/${asset.id}`}>
      <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            {/* Thumbnail */}
            <div className="h-16 w-16 shrink-0 rounded-md bg-muted flex items-center justify-center overflow-hidden">
              {asset.thumbnail_url ? (
                <Image
                  src={asset.thumbnail_url}
                  alt={asset.title}
                  width={64}
                  height={64}
                  className="h-full w-full object-cover"
                />
              ) : (
                <ImageIcon className="h-6 w-6 text-muted-foreground" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-sm truncate">{asset.title}</h3>
                <StatusBadge status={asset.status} />
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {CONTENT_BUCKET_LABELS[asset.content_bucket]} &middot;{" "}
                {ASSET_FORMAT_LABELS[asset.format]}
                {asset.phase && ` &middot; ${asset.phase.name}`}
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                {asset.platforms.map((p) => (
                  <Badge key={p} variant="outline" className="text-xs">
                    {p}
                  </Badge>
                ))}
                {asset.version > 1 && (
                  <Badge variant="secondary" className="text-xs">
                    v{asset.version}
                  </Badge>
                )}
              </div>
            </div>

            {/* Meta */}
            <div className="shrink-0 text-right space-y-1">
              {asset.approval_due && (
                <p className="text-xs text-muted-foreground">
                  Due:{" "}
                  {new Date(asset.approval_due).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              )}
              <ExternalLink className="h-3 w-3 text-muted-foreground ml-auto" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
