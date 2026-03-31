"use client";

import { useCallback, useMemo, useState } from "react";
import type { WizardDraft, WizardFormatRules } from "../types";
import { getDefaultFormatRules } from "../lib/wizard-defaults";
import { FormatOptionCard } from "../components/format-option-card";
import { RecommendationPanel } from "../components/recommendation-panel";
import { ScheduleRulesCard } from "../components/schedule-rules-card";
import { TiebreakOrderEditor } from "../components/tiebreak-order-editor";
import { StepSectionCard } from "../components/step-section-card";

interface FormatRulesStepFormProps {
  draft: WizardDraft;
  onChange: (formatRules: WizardFormatRules[]) => void;
  onRuleConfigChange: (next: WizardDraft["ruleConfig"]) => void;
  onResetSportRules: () => void;
}

export function FormatRulesStepForm({
  draft,
  onChange,
  onRuleConfigChange,
  onResetSportRules,
}: FormatRulesStepFormProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const updateFormat = useCallback(
    (categoryId: string, patch: Partial<WizardFormatRules>) => {
      const existing = draft.formatRules.find((f) => f.categoryId === categoryId);
      if (!existing) {
        onChange([
          ...draft.formatRules,
          { ...getDefaultFormatRules(categoryId, draft.basics.sport), ...patch },
        ]);
        return;
      }
      onChange(
        draft.formatRules.map((f) =>
          f.categoryId === categoryId ? { ...f, ...patch } : f
        )
      );
    },
    [draft.formatRules, draft.basics.sport, onChange]
  );
  const isFutsal = draft.ruleConfig.tournament.sport.trim().toLowerCase() === "futsal";
  const futsalRules = draft.ruleConfig.tournament.ruleConfig;
  const advancedJson = useMemo(
    () => JSON.stringify(draft.ruleConfig.tournament.ruleConfig ?? {}, null, 2),
    [draft.ruleConfig.tournament.ruleConfig],
  );

  if (draft.categories.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-8 text-center text-slate-400">
        Add categories in step 2 first, then configure format and rules here.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <StepSectionCard
        title="Sport Rules"
        description={`Loaded for ${draft.ruleConfig.tournament.sport}`}
      >
        <div className="space-y-3">
          <p className="text-xs text-slate-400">
            Keep defaults for quick setup, or customize only the fields you need.
          </p>
          {isFutsal ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <NumberRuleField
                label="Players on court"
                value={futsalRules.players_on_court}
                onChange={(v) => patchRule("players_on_court", v)}
              />
              <NumberRuleField
                label="Halves"
                value={futsalRules.halves}
                onChange={(v) => patchRule("halves", v)}
              />
              <NumberRuleField
                label="Half duration (minutes)"
                value={futsalRules.half_duration_minutes}
                onChange={(v) => patchRule("half_duration_minutes", v)}
              />
              <NumberRuleField
                label="Team foul limit per half"
                value={futsalRules.team_foul_limit_per_half}
                onChange={(v) => patchRule("team_foul_limit_per_half", v)}
              />
              <BooleanRuleField
                label="Rolling substitutions"
                value={Boolean(futsalRules.rolling_substitutions)}
                onChange={(v) => patchRule("rolling_substitutions", v)}
              />
              <BooleanRuleField
                label="Yellow / red cards enabled"
                value={Boolean(futsalRules.yellow_red_cards_enabled)}
                onChange={(v) => patchRule("yellow_red_cards_enabled", v)}
              />
              <BooleanRuleField
                label="Penalty after foul limit"
                value={Boolean(futsalRules.penalty_after_foul_limit)}
                onChange={(v) => patchRule("penalty_after_foul_limit", v)}
              />
              <BooleanRuleField
                label="Reset fouls each half"
                value={Boolean(futsalRules.reset_fouls_each_half)}
                onChange={(v) => patchRule("reset_fouls_each_half", v)}
              />
              <BooleanRuleField
                label="Extra time enabled"
                value={Boolean(futsalRules.extra_time_enabled)}
                onChange={(v) => patchRule("extra_time_enabled", v)}
              />
              <BooleanRuleField
                label="Penalties enabled"
                value={Boolean(futsalRules.penalties_enabled)}
                onChange={(v) => patchRule("penalties_enabled", v)}
              />
            </div>
          ) : (
            <div className="rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2 text-xs text-slate-300">
              Default rules for {draft.ruleConfig.tournament.sport} are active. Use advanced editor only if needed.
            </div>
          )}
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setShowAdvanced((p) => !p)}
              className="rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-1.5 text-xs font-semibold text-slate-200"
            >
              {showAdvanced ? "Hide advanced JSON" : "Show advanced JSON"}
            </button>
            <button
              type="button"
              onClick={onResetSportRules}
              className="rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-1.5 text-xs font-semibold text-slate-100 hover:border-emerald-500/40"
            >
              Reset to default sport rules
            </button>
          </div>
          {showAdvanced ? (
            <textarea
              value={advancedJson}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value) as Record<string, unknown>;
                  onRuleConfigChange({
                    ...draft.ruleConfig,
                    tournament: {
                      ...draft.ruleConfig.tournament,
                      source: "organizer_custom",
                      ruleConfig: parsed,
                    },
                  });
                } catch {
                  // keep invalid JSON local until corrected
                }
              }}
              rows={10}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100"
            />
          ) : null}
        </div>
      </StepSectionCard>
      <RecommendationPanel>
        For most leagues, round robin (all play all) or groups + knockout work well.
        Configure each category below.
      </RecommendationPanel>
      {draft.categories.map((cat) => {
        const format =
          draft.formatRules.find((f) => f.categoryId === cat.id) ??
          getDefaultFormatRules(cat.id, draft.basics.sport);
        return (
          <StepSectionCard
            key={cat.id}
            title={cat.name || "Unnamed category"}
            description="Competition format and schedule rules"
          >
            <div className="space-y-6">
              <div>
                <p className="mb-2 text-sm font-medium text-slate-200">Format</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormatOptionCard
                    formatType="round_robin"
                    title="Round robin"
                    description="Every team plays every other team."
                    selected={format.formatType === "round_robin"}
                    onSelect={() => updateFormat(cat.id, { formatType: "round_robin" })}
                  />
                  <FormatOptionCard
                    formatType="groups_knockout"
                    title="Groups + knockout"
                    description="Group stage then knockout rounds."
                    selected={format.formatType === "groups_knockout"}
                    onSelect={() => updateFormat(cat.id, { formatType: "groups_knockout" })}
                  />
                  <FormatOptionCard
                    formatType="knockout_only"
                    title="Knockout only"
                    description="Single or double elimination."
                    selected={format.formatType === "knockout_only"}
                    onSelect={() => updateFormat(cat.id, { formatType: "knockout_only" })}
                  />
                </div>
              </div>
              {(format.formatType === "groups_knockout" || format.formatType === "round_robin") && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-slate-200">Group count</label>
                    <input
                      type="number"
                      value={format.groupCount}
                      onChange={(e) =>
                        updateFormat(cat.id, { groupCount: Number(e.target.value) })
                      }
                      className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
                      min={1}
                      max={32}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-200">
                      Teams advance per group
                    </label>
                    <input
                      type="number"
                      value={format.teamsAdvancePerGroup}
                      onChange={(e) =>
                        updateFormat(cat.id, {
                          teamsAdvancePerGroup: Number(e.target.value),
                        })
                      }
                      className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
                      min={1}
                      max={16}
                    />
                  </div>
                </div>
              )}
              <ScheduleRulesCard
                matchDurationMinutes={format.matchDurationMinutes}
                breakDurationMinutes={format.breakDurationMinutes}
                onMatchDurationChange={(v) =>
                  updateFormat(cat.id, { matchDurationMinutes: v })
                }
                onBreakDurationChange={(v) =>
                  updateFormat(cat.id, { breakDurationMinutes: v })
                }
                preferredStartTime={format.preferredStartTime}
                preferredEndTime={format.preferredEndTime}
                onPreferredStartTimeChange={(v) =>
                  updateFormat(cat.id, { preferredStartTime: v })
                }
                onPreferredEndTimeChange={(v) =>
                  updateFormat(cat.id, { preferredEndTime: v })
                }
                maxMatchesPerDayPerTeam={format.maxMatchesPerDayPerTeam}
                minRestMinutesBetweenMatches={format.minRestMinutesBetweenMatches}
                onMaxMatchesPerDayChange={(v) =>
                  updateFormat(cat.id, { maxMatchesPerDayPerTeam: v })
                }
                onMinRestChange={(v) =>
                  updateFormat(cat.id, { minRestMinutesBetweenMatches: v })
                }
              >
                <div className="mt-4">
                  <TiebreakOrderEditor
                    rules={format.tiebreakOrder}
                    onChange={(rules) => updateFormat(cat.id, { tiebreakOrder: rules })}
                  />
                </div>
              </ScheduleRulesCard>
            </div>
          </StepSectionCard>
        );
      })}
    </div>
  );

  function patchRule(key: string, value: unknown) {
    onRuleConfigChange({
      ...draft.ruleConfig,
      tournament: {
        ...draft.ruleConfig.tournament,
        source: "organizer_custom",
        ruleConfig: {
          ...draft.ruleConfig.tournament.ruleConfig,
          [key]: value,
        },
      },
    });
  }
}

function NumberRuleField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: unknown;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-300">{label}</span>
      <input
        type="number"
        value={Number(value ?? 0)}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
      />
    </label>
  );
}

function BooleanRuleField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-300">{label}</span>
      <select
        value={value ? "true" : "false"}
        onChange={(e) => onChange(e.target.value === "true")}
        className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
      >
        <option value="true">Enabled</option>
        <option value="false">Disabled</option>
      </select>
    </label>
  );
}
