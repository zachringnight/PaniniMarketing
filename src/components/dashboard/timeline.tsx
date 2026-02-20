"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Phase, Asset } from "@/lib/types";
import { StatusBadge } from "@/components/content/status-badge";

interface TimelineProps {
  phases: Phase[];
  assetsByPhase: Record<string, Asset[]>;
}

function getPhaseProgress(assets: Asset[]) {
  if (assets.length === 0) return { label: "Not Started", color: "bg-slate-200" };
  const published = assets.filter((a) => a.status === "published").length;
  const approved = assets.filter((a) => a.status === "approved").length;
  if (published === assets.length) return { label: "Complete", color: "bg-green-500" };
  if (approved + published === assets.length) return { label: "Approved", color: "bg-green-400" };
  const inReview = assets.some((a) => a.status === "in_review");
  if (inReview) return { label: "In Review", color: "bg-blue-400" };
  return { label: "In Progress", color: "bg-amber-400" };
}

function formatDate(date: string | null) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function Timeline({ phases, assetsByPhase }: TimelineProps) {
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());

  const togglePhase = (phaseId: string) => {
    setExpandedPhases((prev) => {
      const next = new Set(prev);
      if (next.has(phaseId)) {
        next.delete(phaseId);
      } else {
        next.add(phaseId);
      }
      return next;
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calendar className="h-5 w-5" />
          Rollout Timeline
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {phases.map((phase) => {
          const assets = assetsByPhase[phase.id] || [];
          const progress = getPhaseProgress(assets);
          const isExpanded = expandedPhases.has(phase.id);

          return (
            <div key={phase.id} className="border rounded-lg">
              <button
                onClick={() => togglePhase(phase.id)}
                className="flex w-full items-center gap-3 p-3 text-left hover:bg-accent/50 transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                <div className={cn("h-3 w-3 rounded-full shrink-0", progress.color)} />
                <span className="font-medium text-sm flex-1">{phase.name}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDate(phase.start_date)} - {formatDate(phase.end_date)}
                </span>
                <Badge variant="secondary" className="text-xs">
                  {assets.length} assets
                </Badge>
              </button>

              {isExpanded && (
                <div className="border-t px-3 py-2 space-y-2">
                  {assets.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-2 px-8">
                      No assets yet for this phase.
                    </p>
                  ) : (
                    assets.map((asset) => (
                      <div
                        key={asset.id}
                        className="flex items-center gap-3 py-1.5 px-8 text-sm"
                      >
                        <span className="flex-1 truncate">{asset.title}</span>
                        <StatusBadge status={asset.status} />
                        {asset.approval_due && (
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            Due: {formatDate(asset.approval_due)}
                          </span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
