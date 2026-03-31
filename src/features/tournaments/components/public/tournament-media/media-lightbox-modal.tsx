"use client";

import { useEffect } from "react";
import Image from "next/image";

import type { TournamentMediaListItem } from "@/src/features/tournaments/queries/list-public-tournament-media";
import { MediaTypeBadge } from "./media-type-badge";

export function MediaLightboxModal({
  open,
  item,
  onClose,
}: {
  open: boolean;
  item: TournamentMediaListItem | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    // Prevent background scroll while open.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open || !item) return null;

  const canEmbed = Boolean(item.streamUrl);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.currentTarget === e.target) onClose();
      }}
    >
      <div className="relative w-[92vw] max-w-4xl overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-[0_30px_120px_rgba(0,0,0,0.55)]">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10"
          aria-label="Close"
        >
          Close
        </button>

        <div className="relative aspect-video bg-slate-950">
          {item.thumbnailUrl ? (
            <Image
              src={item.thumbnailUrl}
              alt=""
              fill
              className="object-cover opacity-90"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-slate-500">
              No preview
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/25 to-transparent" />

          <div className="absolute left-4 top-4 z-10">
            <MediaTypeBadge type={item.type} isLive={item.isLive} />
          </div>

          <div className="absolute bottom-4 left-4 right-4 z-10">
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 backdrop-blur-md">
              <div className="truncate text-sm font-semibold text-slate-50">
                {item.title}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-300">
                {item.duration ? (
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                    {item.duration}
                  </span>
                ) : null}
                {item.startAt ? (
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                    {new Date(item.startAt).toISOString().slice(0, 10)}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          {canEmbed ? (
            <div className="absolute inset-0 z-0">
              <iframe
                title={item.title}
                src={item.streamUrl ?? undefined}
                className="h-full w-full"
                allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

