"use client";

import Link from "next/link";

import { ErrorStatePanel } from "@/src/components/public/shared/error-state-panel";

export default function PlayerDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-5xl px-4 pt-12 pb-20">
      <ErrorStatePanel
        title="Couldn&apos;t load player data"
        message={error.message ?? "Unknown error"}
        onRetry={reset}
        retryLabel="Retry"
        backHref="/explore?type=players"
        backLabel="Browse Players"
        extra={
          <div className="mt-3 text-xs text-slate-400">
            If this keeps happening, the player might not be public anymore.
          </div>
        }
      />
    </div>
  );
}

