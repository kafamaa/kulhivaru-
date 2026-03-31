"use client";

import { useState } from "react";

export function TournamentShareButton({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);

  const onShare = async () => {
    try {
      const url = `${window.location.origin}/t/${slug}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      // Clipboard can fail if permissions are restricted.
      setCopied(false);
    }
  };

  return (
    <button
      type="button"
      onClick={onShare}
      className="inline-flex items-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10"
    >
      {copied ? "Link copied" : "Share"}
    </button>
  );
}

