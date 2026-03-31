"use server";

import { publishTournamentAction } from "@/src/features/tournaments/wizard/actions/publish-tournament";
import {
  getDefaultCategory,
  getDefaultFormatRules,
  getEmptyDraft,
} from "@/src/features/tournaments/wizard/lib/wizard-defaults";
import { getSportRulePreset } from "@/src/features/rules/sport-rule-presets";
import type { FormatType } from "@/src/features/tournaments/wizard/types";

export type QuickTournamentType = "single" | "with_categories";

export interface QuickCategoryInput {
  name: string;
  sport: string;
  formatType: FormatType;
}

export async function createQuickTournamentAction(input: {
  organizationId: string | null;
  type: QuickTournamentType;
  tournamentName: string;
  title?: string;
  sport?: string;
  formatType?: FormatType;
  categories?: QuickCategoryInput[];
}) {
  const draft = getEmptyDraft(input.organizationId);
  const trimmedName = input.tournamentName.trim();
  const title = (input.title ?? "").trim();
  if (!trimmedName) return { ok: false as const, error: "Tournament name is required." };

  if (input.type === "single") {
    const selectedSport = (input.sport ?? "Football").trim() || "Football";
    const selectedFormat = (input.formatType ?? "round_robin") as FormatType;
    const category = {
      ...getDefaultCategory(0, selectedSport),
      name: "Main Category",
      shortLabel: "MAIN",
    };
    draft.basics.tournamentName = trimmedName;
    draft.basics.sport = selectedSport;
    draft.basics.description = title;
    draft.categories = [category];
    draft.formatRules = [
      {
        ...getDefaultFormatRules(category.id, selectedSport),
        formatType: selectedFormat,
      },
    ];
    const preset = getSportRulePreset(selectedSport);
    draft.ruleConfig = {
      tournament: {
        sport: selectedSport,
        source: "sport_default_auto",
        ruleConfig: { ...preset.ruleConfig },
      },
      categories: [],
      phases: [],
      templateVersion: preset.version,
    };
  } else {
    const rows = (input.categories ?? []).filter((c) => c.name.trim());
    if (rows.length === 0) {
      return { ok: false as const, error: "Add at least one category." };
    }
    const primarySport = (rows[0]?.sport ?? "Football").trim() || "Football";
    draft.basics.tournamentName = trimmedName;
    draft.basics.sport = primarySport;
    draft.basics.description = title;

    draft.categories = rows.map((row, i) => ({
      ...getDefaultCategory(i, row.sport),
      name: row.name.trim(),
      shortLabel: row.name.trim().slice(0, 8).toUpperCase(),
    }));
    draft.formatRules = draft.categories.map((cat, i) => ({
      ...getDefaultFormatRules(cat.id, rows[i]?.sport ?? primarySport),
      formatType: rows[i]?.formatType ?? "round_robin",
    }));
    const preset = getSportRulePreset(primarySport);
    draft.ruleConfig = {
      tournament: {
        sport: primarySport,
        source: "sport_default_auto",
        ruleConfig: { ...preset.ruleConfig },
      },
      categories: [],
      phases: [],
      templateVersion: preset.version,
    };
  }

  return publishTournamentAction(draft);
}
