import { Card, CardContent } from "@/components/ui/card";
import { FileStack, Clock, AlertTriangle, CheckCircle } from "lucide-react";

interface StatsBarProps {
  totalAssets: number;
  pendingApprovals: number;
  overdueItems: number;
  publishedThisWeek: number;
}

const stats = [
  { key: "totalAssets" as const, label: "Total Assets", icon: FileStack, color: "text-blue-600" },
  { key: "pendingApprovals" as const, label: "Pending Approvals", icon: Clock, color: "text-amber-600" },
  { key: "overdueItems" as const, label: "Overdue", icon: AlertTriangle, color: "text-red-600" },
  { key: "publishedThisWeek" as const, label: "Published This Week", icon: CheckCircle, color: "text-green-600" },
];

export function StatsBar({ totalAssets, pendingApprovals, overdueItems, publishedThisWeek }: StatsBarProps) {
  const values = { totalAssets, pendingApprovals, overdueItems, publishedThisWeek };

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.key}>
          <CardContent className="flex items-center gap-4 p-4">
            <div className={stat.color}>
              <stat.icon className="h-8 w-8" />
            </div>
            <div>
              <p className="text-2xl font-bold">{values[stat.key]}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
