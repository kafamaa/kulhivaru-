"use client";

import { useMemo, useState } from "react";

import type { PublicPlayerProfile } from "@/src/features/players/queries/get-public-player-profile";
import type { PublicPlayerPerformance } from "@/src/features/players/queries/get-public-player-performance";
import type { PublicPlayerRankings } from "@/src/features/players/queries/get-public-player-rankings";
import type { PublicPlayerRecentMatch } from "@/src/features/players/queries/get-public-player-recent-matches";
import type { PublicPlayerEventTimelineItem } from "@/src/features/players/queries/get-public-player-event-timeline";

import { GlassTabs } from "@/src/components/public/shared/glass-tabs";
import { PlayerOverviewPanel } from "@/src/components/public/player-detail/player-overview-panel";
import { PlayerMatchesPanel } from "@/src/components/public/player-detail/player-matches-panel";
import { PlayerStatsPanel } from "@/src/components/public/player-detail/player-stats-panel";
import { PlayerActivityPanel } from "@/src/components/public/player-detail/player-activity-panel";

type PlayerTabId = "overview" | "matches" | "stats" | "activity";

export function PlayerTabs({
  profile,
  performance,
  recentMatches,
  eventTimeline,
  rankings,
}: {
  profile: PublicPlayerProfile;
  performance: PublicPlayerPerformance;
  recentMatches: PublicPlayerRecentMatch[];
  eventTimeline: PublicPlayerEventTimelineItem[];
  rankings: PublicPlayerRankings;
}) {
  const [activeTab, setActiveTab] = useState<PlayerTabId>("overview");

  const tabs = useMemo(
    () => [
      { id: "overview" as const, label: "Overview" },
      { id: "matches" as const, label: "Matches" },
      { id: "stats" as const, label: "Stats" },
      { id: "activity" as const, label: "Activity" },
    ],
    []
  );

  return (
    <div className="pt-2">
      <GlassTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {activeTab === "overview" ? (
        <PlayerOverviewPanel
          profile={profile}
          performance={performance}
          recentMatches={recentMatches}
          rankings={rankings}
        />
      ) : null}

      {activeTab === "matches" ? (
        <PlayerMatchesPanel matches={recentMatches} />
      ) : null}

      {activeTab === "stats" ? (
        <PlayerStatsPanel profile={profile} performance={performance} />
      ) : null}

      {activeTab === "activity" ? (
        <PlayerActivityPanel items={eventTimeline} />
      ) : null}
    </div>
  );
}

