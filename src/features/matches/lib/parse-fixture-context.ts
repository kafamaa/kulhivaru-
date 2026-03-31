export interface FixtureContext {
  phaseKey: string;
  phaseLabel: string;
  groupKey: string; // "overall" or "A"/"B"/etc
  groupLabel: string;
}

function normalizeRoundLabel(input: string | null | undefined) {
  return (input ?? "").trim();
}

// Heuristic mapping from your current `matches.round_label` into a (phase, group) context.
// Assumption: round_label often contains strings like "Group A", "Quarter Final", etc.
export function parseFixtureContextFromRoundLabel(
  roundLabel: string | null | undefined
): FixtureContext {
  const rl = normalizeRoundLabel(roundLabel);
  const lower = rl.toLowerCase();

  // Group: look for "group X"
  const groupMatch = /group\s*([a-z0-9]+)/i.exec(rl);
  const groupLetter = groupMatch?.[1]?.toString()?.toUpperCase();

  const groupKey = groupLetter ? groupLetter : "overall";
  const groupLabel = groupLetter ? `Group ${groupLetter}` : "Overall";

  // Phase: infer from keywords; fall back to group-stage if "group" exists.
  let phaseKey = "unknown";
  let phaseLabel = "Phase";

  if (/(final)\b/i.test(lower)) {
    phaseKey = "final";
    phaseLabel = "Final";
  } else if (/(semi|semifinal)\b/i.test(lower)) {
    phaseKey = "semi-finals";
    phaseLabel = "Semi Finals";
  } else if (/(quarter|qf)\b/i.test(lower)) {
    phaseKey = "quarter-finals";
    phaseLabel = "Quarter Finals";
  } else if (/(group)/i.test(lower) || groupLetter) {
    phaseKey = "group-stage";
    phaseLabel = "Group Stage";
  } else if (rl.length > 0) {
    phaseKey = "custom";
    phaseLabel = "Phase";
  }

  return {
    phaseKey,
    phaseLabel,
    groupKey,
    groupLabel,
  };
}

