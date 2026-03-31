"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function LiveMatchRefresher({
  matchStatus,
  intervalMs = 10000,
}: {
  matchStatus: string;
  intervalMs?: number;
}) {
  const router = useRouter();
  const [lastRefreshAt, setLastRefreshAt] = useState<number | null>(null);

  useEffect(() => {
    if (matchStatus !== "live") return;

    const tick = async () => {
      // `router.refresh()` re-renders the server components for this route.
      router.refresh();
      setLastRefreshAt(Date.now());
    };

    tick();
    const id = window.setInterval(tick, intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs, matchStatus, router]);

  if (matchStatus !== "live") return null;

  return (
    <div className="sr-only" aria-live="polite">
      Live match refreshed{lastRefreshAt ? ` at ${new Date(lastRefreshAt).toISOString()}` : ""}.
    </div>
  );
}

