"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { createAsset, updateAsset } from "@/lib/actions/assets";
import {
  CONTENT_BUCKET_LABELS,
  ASSET_FORMAT_LABELS,
  SOURCE_STATION_LABELS,
  PLATFORM_OPTIONS,
} from "@/lib/types";
import type { Asset, Phase, Club, Athlete } from "@/lib/types";

interface AssetFormProps {
  projectId: string;
  phases: Phase[];
  clubs: Club[];
  athletes: Athlete[];
  asset?: Asset;
  assetClubIds?: string[];
  assetAthleteIds?: string[];
  rosterMap?: Record<number, { sport: string; league: string; team: string }>;
}

export function AssetForm({
  projectId,
  phases,
  clubs,
  athletes,
  asset,
  assetClubIds = [],
  assetAthleteIds = [],
  rosterMap = {},
}: AssetFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState(asset?.title || "");
  const [description, setDescription] = useState(asset?.description || "");
  const [phaseId, setPhaseId] = useState(asset?.phase_id || "");
  const [contentBucket, setContentBucket] = useState(asset?.content_bucket || "");
  const [format, setFormat] = useState(asset?.format || "");
  const [sourceStation, setSourceStation] = useState(asset?.source_station || "");
  const [externalUrl, setExternalUrl] = useState(asset?.external_url || "");
  const [thumbnailUrl, setThumbnailUrl] = useState(asset?.thumbnail_url || "");
  const [approvalDue, setApprovalDue] = useState(
    asset?.approval_due ? new Date(asset.approval_due).toISOString().slice(0, 16) : ""
  );
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(
    asset?.platforms || []
  );
  const [selectedClubs, setSelectedClubs] = useState<string[]>(assetClubIds);
  const [selectedAthletes, setSelectedAthletes] = useState<string[]>(assetAthleteIds);

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
  };

  const toggleClub = (clubId: string) => {
    setSelectedClubs((prev) =>
      prev.includes(clubId)
        ? prev.filter((c) => c !== clubId)
        : [...prev, clubId]
    );
  };

  const toggleAthlete = (athleteId: string) => {
    setSelectedAthletes((prev) =>
      prev.includes(athleteId)
        ? prev.filter((a) => a !== athleteId)
        : [...prev, athleteId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const formData = {
      title,
      description: description || undefined,
      phaseId,
      contentBucket: contentBucket as Parameters<typeof createAsset>[0]["contentBucket"],
      platforms: selectedPlatforms,
      format: format as Parameters<typeof createAsset>[0]["format"],
      sourceStation: sourceStation
        ? (sourceStation as Parameters<typeof createAsset>[0]["sourceStation"])
        : undefined,
      externalUrl,
      thumbnailUrl: thumbnailUrl || undefined,
      approvalDue: approvalDue ? new Date(approvalDue).toISOString() : undefined,
      athleteIds: selectedAthletes.length > 0 ? selectedAthletes : undefined,
      clubIds: selectedClubs.length > 0 ? selectedClubs : undefined,
    };

    let result;
    if (asset) {
      result = await updateAsset(asset.id, formData);
    } else {
      result = await createAsset({ ...formData, projectId });
    }

    setLoading(false);

    if ("error" in result && result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      toast({ title: asset ? "Asset updated" : "Asset created" });
      router.push("/content");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description / Caption</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label>Phase *</Label>
              <Select value={phaseId} onValueChange={setPhaseId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select phase" />
                </SelectTrigger>
                <SelectContent>
                  {phases.map((phase) => (
                    <SelectItem key={phase.id} value={phase.id}>
                      {phase.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Content Bucket *</Label>
              <Select value={contentBucket} onValueChange={setContentBucket} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select content bucket" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CONTENT_BUCKET_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Format *</Label>
              <Select value={format} onValueChange={setFormat} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ASSET_FORMAT_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Source Station</Label>
              <Select value={sourceStation} onValueChange={setSourceStation}>
                <SelectTrigger>
                  <SelectValue placeholder="Select source station" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SOURCE_STATION_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Media & Distribution */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Media & Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="externalUrl">External File Link *</Label>
                <Input
                  id="externalUrl"
                  type="url"
                  placeholder="https://dropbox.com/..."
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="thumbnailUrl">Thumbnail URL</Label>
                <Input
                  id="thumbnailUrl"
                  type="url"
                  placeholder="https://..."
                  value={thumbnailUrl}
                  onChange={(e) => setThumbnailUrl(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="approvalDue">Approval Due Date</Label>
                <Input
                  id="approvalDue"
                  type="datetime-local"
                  value={approvalDue}
                  onChange={(e) => setApprovalDue(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Platforms</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {PLATFORM_OPTIONS.map((platform) => (
                  <Button
                    key={platform}
                    type="button"
                    variant={selectedPlatforms.includes(platform) ? "default" : "outline"}
                    size="sm"
                    onClick={() => togglePlatform(platform)}
                  >
                    {platform}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {clubs.length > 0 && (
                <div className="space-y-2">
                  <Label>Clubs</Label>
                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                    {clubs.map((club) => (
                      <Button
                        key={club.id}
                        type="button"
                        variant={selectedClubs.includes(club.id) ? "default" : "outline"}
                        size="sm"
                        className="text-xs"
                        onClick={() => toggleClub(club.id)}
                      >
                        {club.name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              {athletes.length > 0 && (
                <div className="space-y-2">
                  <Label>Athletes</Label>
                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                    {athletes.map((athlete) => {
                      const roster = athlete.roster_athlete_id
                        ? rosterMap[athlete.roster_athlete_id]
                        : null;
                      return (
                        <Button
                          key={athlete.id}
                          type="button"
                          variant={selectedAthletes.includes(athlete.id) ? "default" : "outline"}
                          size="sm"
                          className="text-xs"
                          onClick={() => toggleAthlete(athlete.id)}
                        >
                          {athlete.full_name}
                          {roster && (
                            <span className="ml-1 opacity-60">
                              ({roster.league})
                            </span>
                          )}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading
            ? asset
              ? "Updating..."
              : "Creating..."
            : asset
              ? "Update Asset"
              : "Create Asset"}
        </Button>
      </div>
    </form>
  );
}
