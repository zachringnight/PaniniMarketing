import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { ActivityLogEntry, User } from "@/lib/types";

interface ActivityFeedProps {
  activities: (ActivityLogEntry & { user: User })[];
}

const actionLabels: Record<string, string> = {
  uploaded: "uploaded an asset",
  submitted_for_review: "submitted for review",
  approved: "approved",
  changes_requested: "requested changes on",
  rejected: "rejected",
  commented: "commented on",
  published: "published",
  archived: "archived",
  user_invited: "invited a user",
  role_changed: "changed a role",
};

export function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="h-5 w-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No recent activity.
          </p>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 text-sm">
                <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p>
                    <span className="font-medium">{activity.user.full_name}</span>{" "}
                    {actionLabels[activity.action] || activity.action}
                    {activity.metadata &&
                      typeof activity.metadata === "object" &&
                      "asset_title" in activity.metadata && (
                        <span className="font-medium">
                          {" "}
                          {String(activity.metadata.asset_title)}
                        </span>
                      )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.created_at), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
