"use client";

import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { addComment } from "@/lib/actions/comments";
import { formatDistanceToNow } from "date-fns";
import type { CommentWithUser } from "@/lib/types";

interface CommentThreadProps {
  comments: CommentWithUser[];
  assetId: string;
  canComment: boolean;
}

function CommentItem({ comment }: { comment: CommentWithUser }) {
  return (
    <div className="flex gap-3">
      <Avatar className="h-7 w-7 shrink-0">
        <AvatarFallback className="text-xs">
          {comment.user.full_name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium">{comment.user.full_name}</span>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
          </span>
        </div>
        <p className="text-sm mt-0.5">{comment.body}</p>
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-3 ml-4 space-y-3 border-l pl-4">
            {comment.replies.map((reply) => (
              <CommentItem key={reply.id} comment={reply} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function CommentThread({ comments, assetId, canComment }: CommentThreadProps) {
  const { toast } = useToast();
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;

    setLoading(true);
    const result = await addComment({ assetId, body: body.trim() });
    setLoading(false);

    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      setBody("");
    }
  };

  // Build threaded structure
  const topLevel = comments.filter((c) => !c.parent_id);
  const replies = comments.filter((c) => c.parent_id);
  const threaded = topLevel.map((c) => ({
    ...c,
    replies: replies.filter((r) => r.parent_id === c.id),
  }));

  return (
    <div className="space-y-4">
      {threaded.length === 0 ? (
        <p className="text-sm text-muted-foreground">No comments yet.</p>
      ) : (
        <div className="space-y-4">
          {threaded.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
        </div>
      )}

      {canComment && (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Textarea
            placeholder="Add a comment..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={2}
            className="flex-1"
          />
          <Button type="submit" size="sm" disabled={loading || !body.trim()}>
            {loading ? "..." : "Send"}
          </Button>
        </form>
      )}
    </div>
  );
}
