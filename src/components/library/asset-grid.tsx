import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Image as ImageIcon } from "lucide-react";
import { StatusBadge } from "@/components/content/status-badge";
import { CONTENT_BUCKET_LABELS } from "@/lib/types";
import type { Asset } from "@/lib/types";

interface AssetGridProps {
  assets: Asset[];
}

export function AssetGrid({ assets }: AssetGridProps) {
  if (assets.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">No assets found.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {assets.map((asset) => (
        <Link key={asset.id} href={`/content/${asset.id}`}>
          <Card className="hover:bg-accent/50 transition-colors cursor-pointer overflow-hidden">
            <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden relative">
              {asset.thumbnail_url ? (
                <Image
                  src={asset.thumbnail_url}
                  alt={asset.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <ImageIcon className="h-12 w-12 text-muted-foreground" />
              )}
            </div>
            <CardContent className="p-3 space-y-1.5">
              <h3 className="text-sm font-medium truncate">{asset.title}</h3>
              <p className="text-xs text-muted-foreground truncate">
                {CONTENT_BUCKET_LABELS[asset.content_bucket]}
              </p>
              <div className="flex items-center gap-2">
                <StatusBadge status={asset.status} />
                {asset.platforms.length > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {asset.platforms[0]}
                    {asset.platforms.length > 1 && ` +${asset.platforms.length - 1}`}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
