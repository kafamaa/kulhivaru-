"use client";

import type { ReactNode } from "react";
import { StepSectionCard } from "./step-section-card";
import { InlineHelp } from "./inline-help";

interface ScheduleRulesCardProps {
  children: ReactNode;
  matchDurationMinutes: number;
  breakDurationMinutes: number;
  onMatchDurationChange: (v: number) => void;
  onBreakDurationChange: (v: number) => void;
  preferredStartTime?: string;
  preferredEndTime?: string;
  onPreferredStartTimeChange?: (v: string) => void;
  onPreferredEndTimeChange?: (v: string) => void;
  maxMatchesPerDayPerTeam?: number;
  minRestMinutesBetweenMatches?: number;
  onMaxMatchesPerDayChange?: (v: number) => void;
  onMinRestChange?: (v: number) => void;
}

export function ScheduleRulesCard({
  children,
  matchDurationMinutes,
  breakDurationMinutes,
  onMatchDurationChange,
  onBreakDurationChange,
  preferredStartTime = "09:00",
  preferredEndTime = "18:00",
  onPreferredStartTimeChange,
  onPreferredEndTimeChange,
  maxMatchesPerDayPerTeam = 1,
  minRestMinutesBetweenMatches = 0,
  onMaxMatchesPerDayChange,
  onMinRestChange,
}: ScheduleRulesCardProps) {
  return (
    <StepSectionCard
      title="Schedule rules"
      description="Defaults for match length and daily limits"
    >
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-slate-200">
              Match duration (min)
            </label>
            <input
              type="number"
              value={matchDurationMinutes}
              onChange={(e) => onMatchDurationChange(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
              min={5}
              max={180}
            />
            <InlineHelp>Used when generating fixtures.</InlineHelp>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-200">
              Break between matches (min)
            </label>
            <input
              type="number"
              value={breakDurationMinutes}
              onChange={(e) => onBreakDurationChange(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
              min={0}
              max={60}
            />
          </div>
        </div>
        {(onPreferredStartTimeChange || onPreferredEndTimeChange) && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-200">
                Preferred start time
              </label>
              <input
                type="time"
                value={preferredStartTime}
                onChange={(e) => onPreferredStartTimeChange?.(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-200">
                Preferred end time
              </label>
              <input
                type="time"
                value={preferredEndTime}
                onChange={(e) => onPreferredEndTimeChange?.(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
              />
            </div>
          </div>
        )}
        {(onMaxMatchesPerDayChange || onMinRestChange) && (
          <div className="grid gap-4 sm:grid-cols-2">
            {onMaxMatchesPerDayChange && (
              <div>
                <label className="text-sm font-medium text-slate-200">
                  Max matches per team per day
                </label>
                <input
                  type="number"
                  value={maxMatchesPerDayPerTeam}
                  onChange={(e) =>
                    onMaxMatchesPerDayChange(Number(e.target.value))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
                  min={1}
                  max={4}
                />
              </div>
            )}
            {onMinRestChange && (
              <div>
                <label className="text-sm font-medium text-slate-200">
                  Min rest between matches (min)
                </label>
                <input
                  type="number"
                  value={minRestMinutesBetweenMatches}
                  onChange={(e) => onMinRestChange(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
                  min={0}
                  max={1440}
                />
              </div>
            )}
          </div>
        )}
        {children}
      </div>
    </StepSectionCard>
  );
}
