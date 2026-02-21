"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CONTENT_BUCKET_LABELS, ROLE_LABELS } from "@/lib/types";
import type { ApprovalChain } from "@/lib/types";
import type { ChainType } from "@/lib/types/database";
import { createClient } from "@/lib/supabase/client";

interface ApprovalChainEditorProps {
  chains: ApprovalChain[];
  projectId: string;
}

export function ApprovalChainEditor({ chains, projectId }: ApprovalChainEditorProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);

  const handleChainTypeChange = async (chainId: string, chainType: ChainType) => {
    setLoading(chainId);
    const supabase = createClient();
    const { error } = await supabase
      .from("approval_chains")
      .update({ chain_type: chainType } as never)
      .eq("id", chainId);
    setLoading(null);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Approval chain updated" });
    }
  };

  return (
    <div className="space-y-4">
      {chains.map((chain) => (
        <Card key={chain.id}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              {CONTENT_BUCKET_LABELS[chain.content_bucket]}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground">Required approvals:</span>
              {chain.required_roles.map((role) => (
                <Badge key={role} variant="secondary" className="text-xs">
                  {ROLE_LABELS[role] || role}
                </Badge>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Chain type:</span>
              <Select
                value={chain.chain_type}
                onValueChange={(v) => handleChainTypeChange(chain.id, v as ChainType)}
                disabled={loading === chain.id}
              >
                <SelectTrigger className="w-36 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="parallel">Parallel</SelectItem>
                  <SelectItem value="sequential">Sequential</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
