"use client";

import Link from "next/link";
import type { ReactNode } from "react";

export function ErrorStatePanel({
  title,
  message,
  onRetry,
  retryLabel = "Retry",
  backHref = "/",
  backLabel = "Go Home",
  extra,
}: {
  title: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  backHref?: string;
  backLabel?: string;
  extra?: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-2xl rounded-3xl border border-red-400/20 bg-red-500/10 p-10 text-center backdrop-blur-md">
      <h3 className="text-2xl font-semibold text-red-100">{title}</h3>
      {message ? (
        <p className="mt-2 text-sm text-red-200/90">{message}</p>
      ) : null}
      {extra ? <div className="mt-4">{extra}</div> : null}
      <div className="mt-7 flex flex-wrap justify-center gap-2">
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center rounded-2xl bg-red-500/20 border border-red-400/30 px-4 py-2 text-sm font-semibold text-red-100 hover:bg-red-500/25"
          >
            {retryLabel}
          </button>
        ) : null}
        <Link
          href={backHref}
          className="inline-flex items-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10"
        >
          {backLabel}
        </Link>
      </div>
    </div>
  );
}

