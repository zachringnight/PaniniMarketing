"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import type { RosterAthleteWithContentCount } from "@/lib/types";

interface RosterTableProps {
  athletes: RosterAthleteWithContentCount[];
}

export function RosterTable({ athletes }: RosterTableProps) {
  const [search, setSearch] = useState("");
  const [sportFilter, setSportFilter] = useState("all");
  const [leagueFilter, setLeagueFilter] = useState("all");

  const sports = useMemo(
    () => Array.from(new Set(athletes.map((a) => a.sport))).sort(),
    [athletes]
  );

  const leagues = useMemo(
    () => Array.from(new Set(athletes.map((a) => a.league))).sort(),
    [athletes]
  );

  const filtered = useMemo(() => {
    return athletes.filter((a) => {
      if (search && !a.name.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      if (sportFilter !== "all" && a.sport !== sportFilter) return false;
      if (leagueFilter !== "all" && a.league !== leagueFilter) return false;
      return true;
    });
  }, [athletes, search, sportFilter, leagueFilter]);

  const hasFilters = search || sportFilter !== "all" || leagueFilter !== "all";

  const clearFilters = () => {
    setSearch("");
    setSportFilter("all");
    setLeagueFilter("all");
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search athletes..."
          className="w-64"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select value={sportFilter} onValueChange={setSportFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Sport" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sports</SelectItem>
            {sports.map((sport) => (
              <SelectItem key={sport} value={sport}>
                {sport}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={leagueFilter} onValueChange={setLeagueFilter}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="League" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Leagues</SelectItem>
            {leagues.map((league) => (
              <SelectItem key={league} value={league}>
                {league}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="mr-1 h-4 w-4" />
            Clear
          </Button>
        )}
        <span className="text-sm text-muted-foreground ml-auto">
          {filtered.length} athlete{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">Name</th>
              <th className="px-4 py-3 text-left font-medium">Sport</th>
              <th className="px-4 py-3 text-left font-medium">League</th>
              <th className="px-4 py-3 text-left font-medium">Team</th>
              <th className="px-4 py-3 text-right font-medium">Content</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No athletes found.
                </td>
              </tr>
            ) : (
              filtered.map((athlete) => (
                <tr key={athlete.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium">{athlete.name}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="text-xs">
                      {athlete.sport}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{athlete.league}</td>
                  <td className="px-4 py-3 text-muted-foreground">{athlete.team}</td>
                  <td className="px-4 py-3 text-right">
                    {athlete.content_count > 0 ? (
                      <Badge variant="secondary" className="text-xs">
                        {athlete.content_count} asset{athlete.content_count !== 1 ? "s" : ""}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">--</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
