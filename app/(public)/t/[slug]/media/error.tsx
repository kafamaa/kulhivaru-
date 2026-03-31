"use client";

import Link from "next/link";

export default function TournamentMediaError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-5xl px-4 pt-12 pb-20">
      <div className="mx-auto max-w-2xl rounded-3xl border border-red-400/20 bg-red-500/10 p-10 text-center backdrop-blur-md">
        <h3 className="text-2xl font-semibold text-red-100">
          Couldn&apos;t load media
        </h3>
        <p className="mt-2 text-sm text-red-200/90">
          {error.message ?? "Unknown error"}
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center rounded-2xl bg-red-500/20 border border-red-400/30 px-4 py-2 text-sm font-semibold text-red-100 hover:bg-red-500/25"
          >
            Retry
          </button>
          <Link
            href="/explore"
            className="inline-flex items-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10"
          >
            Go to Explore
          </Link>
        </div>
      </div>
    </div>
  );
}

