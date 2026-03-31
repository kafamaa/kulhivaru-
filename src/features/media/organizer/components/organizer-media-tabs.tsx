"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createAlbumAction, updateSponsorMetaAction } from "../actions/media-actions";
import type {
  OrganizerTournamentMediaSnapshot,
  TournamentMediaAssetRow,
  TournamentMediaAlbumRow,
} from "../queries/get-organizer-tournament-media-snapshot";

type AssetTypeKey =
  | "cover"
  | "banner"
  | "poster"
  | "logo"
  | "gallery"
  | "sponsor_logo"
  | "sponsor_banner"
  | "download";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "covers", label: "Covers & Branding" },
  { id: "gallery", label: "Gallery" },
  { id: "sponsors", label: "Sponsors" },
  { id: "downloads", label: "Downloads" },
  { id: "albums", label: "Albums" },
  { id: "usage", label: "Usage & Visibility" },
  { id: "storage", label: "Storage" },
  { id: "settings", label: "Settings" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function EmptyPanel({ title, message }: { title: string; message: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-6 text-center">
      <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
      <p className="mt-1 text-sm text-slate-400">{message}</p>
    </div>
  );
}

function AssetThumb({ asset, className = "" }: { asset: TournamentMediaAssetRow; className?: string }) {
  return (
    <div className={`relative aspect-video overflow-hidden rounded-lg bg-slate-900 ${className}`}>
      {asset.fileUrl ? (
        <Image
          src={asset.fileUrl}
          alt={asset.title ?? ""}
          fill
          className="object-cover"
          unoptimized={asset.fileUrl.startsWith("blob:") || asset.fileUrl.startsWith("data:")}
        />
      ) : (
        <div className="flex h-full items-center justify-center text-slate-500">No image</div>
      )}
      <div className="absolute left-2 top-2">
        <span className="rounded border border-white/10 bg-slate-950/70 px-2 py-0.5 text-[10px] uppercase text-slate-200">
          {asset.assetType.replace(/_/g, " ")}
        </span>
      </div>
    </div>
  );
}

export function OrganizerMediaTabs({ snapshot }: { snapshot: OrganizerTournamentMediaSnapshot }) {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [uploadingAsset, setUploadingAsset] = useState<AssetTypeKey | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [createAlbumOpen, setCreateAlbumOpen] = useState(false);
  const [createAlbumTitle, setCreateAlbumTitle] = useState("");
  const [createAlbumPending, setCreateAlbumPending] = useState(false);
  const [sponsorDrafts, setSponsorDrafts] = useState<
    Record<string, { sponsorName: string; sponsorTier: string }>
  >({});
  const [savingSponsorId, setSavingSponsorId] = useState<string | null>(null);
  const [sponsorMessage, setSponsorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingAssetRef = useRef<AssetTypeKey | null>(null);
  const router = useRouter();

  const { tournament, summary, identityAssets, galleryAssets, sponsorAssets, downloadAssets, albums, videoAssets } =
    snapshot;

  async function handleAssetUpload(file: File, assetType: AssetTypeKey) {
    setUploadError(null);
    setUploadingAsset(assetType);
    try {
      const form = new FormData();
      form.append("tournamentId", tournament.id);
      form.append("assetType", assetType);
      form.append("file", file);

      const resp = await fetch("/api/tournament-media/upload", {
        method: "POST",
        body: form,
      });

      const json = (await resp.json().catch(() => ({}))) as { error?: string; publicUrl?: string };
      if (!resp.ok) {
        setUploadError(json?.error ?? "Upload failed.");
        return;
      }
      router.refresh();
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploadingAsset(null);
    }
  }

  async function handleBatchUpload(files: File[], assetType: AssetTypeKey) {
    if (files.length === 0) return;
    setUploadError(null);
    setUploadingAsset(assetType);
    try {
      for (const file of files) {
        const form = new FormData();
        form.append("tournamentId", tournament.id);
        form.append("assetType", assetType);
        form.append("file", file);

        const resp = await fetch("/api/tournament-media/upload", {
          method: "POST",
          body: form,
        });

        const json = (await resp.json().catch(() => ({}))) as { error?: string };
        if (!resp.ok) {
          setUploadError(json?.error ?? "Upload failed.");
          return;
        }
      }
      router.refresh();
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploadingAsset(null);
    }
  }

  function triggerUpload(assetType: AssetTypeKey) {
    pendingAssetRef.current = assetType;
    fileInputRef.current?.click();
  }

  function getSponsorDraft(asset: TournamentMediaAssetRow) {
    return (
      sponsorDrafts[asset.id] ?? {
        sponsorName: asset.sponsorName ?? "",
        sponsorTier: asset.sponsorTier ?? "",
      }
    );
  }

  async function saveSponsorMeta(asset: TournamentMediaAssetRow) {
    const draft = getSponsorDraft(asset);
    setSponsorMessage(null);
    setSavingSponsorId(asset.id);
    const res = await updateSponsorMetaAction({
      tournamentId: tournament.id,
      assetId: asset.id,
      sponsorName: draft.sponsorName || null,
      sponsorTier: draft.sponsorTier || null,
    });
    setSavingSponsorId(null);
    if (!res.ok) {
      setSponsorMessage(res.error);
      return;
    }
    setSponsorMessage("Sponsor details saved.");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          const assetType = pendingAssetRef.current;
          e.target.value = "";
          pendingAssetRef.current = null;
          if (files.length === 0 || !assetType) return;
          if (assetType === "gallery" && files.length > 1) {
            void handleBatchUpload(files, assetType);
          } else {
            void handleAssetUpload(files[0]!, assetType);
          }
        }}
      />
      {/* Header */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex gap-4">
            {(identityAssets.cover || tournament.coverImageUrl) ? (
              <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-lg bg-slate-900">
                <Image
                  src={identityAssets.cover?.fileUrl ?? tournament.coverImageUrl!}
                  alt=""
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            ) : (
              <div className="flex h-16 w-28 shrink-0 items-center justify-center rounded-lg border border-dashed border-slate-700 bg-slate-900/50 text-xs text-slate-500">
                No cover
              </div>
            )}
            <div>
              <h1 className="text-2xl font-semibold text-slate-50">{tournament.name}</h1>
              <p className="mt-1 text-sm text-slate-300">
                {tournament.organizationName ?? "Tournament"} • {tournament.status}
              </p>
              {tournament.startDate && (
                <p className="mt-1 text-xs text-slate-500">
                  {tournament.startDate}
                  {tournament.endDate ? ` – ${tournament.endDate}` : ""}
                </p>
              )}
              <Link
                href={`/organizer/t/${tournament.id}`}
                className="mt-2 inline-block text-xs text-emerald-400 hover:text-emerald-300"
              >
                ← Back to tournament
              </Link>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setActiveTab("covers");
                triggerUpload("cover");
              }}
              disabled={!!uploadingAsset}
              className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
            >
              {uploadingAsset ? "Uploading…" : "Upload Media"}
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("covers");
                triggerUpload("cover");
              }}
              disabled={!!uploadingAsset}
              className="rounded-xl border border-slate-700 bg-slate-900/50 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800 disabled:opacity-50"
            >
              {uploadingAsset === "cover" ? "Uploading…" : "Set Cover"}
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("albums");
                setCreateAlbumOpen(true);
                setCreateAlbumTitle("");
              }}
              className="rounded-xl border border-slate-700 bg-slate-900/50 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
            >
              Create Album
            </button>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {uploadError && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3">
          <p className="text-sm text-red-200">{uploadError}</p>
        </div>
      )}
      {(summary.missingCover || summary.missingBanner) && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
          <p className="text-sm text-amber-200">
            {summary.missingCover && "Tournament cover is not set. "}
            {summary.missingBanner && "Banner image is missing. "}
            <button
              type="button"
              onClick={() => setActiveTab("covers")}
              className="font-medium underline hover:no-underline"
            >
              Set these in Covers & Branding
            </button>{" "}
            for a complete public presentation.
          </p>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
        <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
          <p className="text-[11px] uppercase tracking-wider text-slate-500">Total assets</p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-slate-50">{summary.totalAssets}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
          <p className="text-[11px] uppercase tracking-wider text-slate-500">Public</p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-slate-50">{summary.publicAssets}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
          <p className="text-[11px] uppercase tracking-wider text-slate-500">Gallery</p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-slate-50">{summary.galleryItems}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
          <p className="text-[11px] uppercase tracking-wider text-slate-500">Sponsors</p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-slate-50">{summary.sponsorAssets}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
          <p className="text-[11px] uppercase tracking-wider text-slate-500">Featured</p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-slate-50">{summary.featuredItems}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
          <p className="text-[11px] uppercase tracking-wider text-slate-500">Videos</p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-slate-50">{summary.videoCount}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => {
            const isActive = t.id === activeTab;
            return (
              <button
                key={t.id}
                type="button"
                className={[
                  "rounded-xl border px-3 py-1.5 text-xs font-medium",
                  isActive
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                    : "border-slate-800 bg-slate-900/30 text-slate-200 hover:bg-slate-900",
                ].join(" ")}
                onClick={() => setActiveTab(t.id)}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        <div className="mt-4">
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-slate-100">Main tournament visuals</h3>
                <div className="mt-3 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                  <div>
                    <p className="mb-2 text-xs text-slate-500">Cover</p>
                    {identityAssets.cover || tournament.coverImageUrl ? (
                      <div className="relative aspect-video overflow-hidden rounded-lg bg-slate-900">
                        <Image
                          src={identityAssets.cover?.fileUrl ?? tournament.coverImageUrl!}
                          alt=""
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div className="flex aspect-video items-center justify-center rounded-lg border border-dashed border-slate-700 text-xs text-slate-500">
                        Not set
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="mb-2 text-xs text-slate-500">Banner</p>
                    {identityAssets.banner ? (
                      <AssetThumb asset={identityAssets.banner} />
                    ) : (
                      <div className="flex aspect-video items-center justify-center rounded-lg border border-dashed border-slate-700 text-xs text-slate-500">
                        Not set
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="mb-2 text-xs text-slate-500">Poster</p>
                    {identityAssets.poster ? (
                      <AssetThumb asset={identityAssets.poster} />
                    ) : (
                      <div className="flex aspect-video items-center justify-center rounded-lg border border-dashed border-slate-700 text-xs text-slate-500">
                        Not set
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="mb-2 text-xs text-slate-500">Logo</p>
                    {identityAssets.logo || tournament.logoUrl ? (
                      <div className="relative aspect-square overflow-hidden rounded-lg bg-slate-900">
                        <Image
                          src={identityAssets.logo?.fileUrl ?? tournament.logoUrl!}
                          alt=""
                          fill
                          className="object-contain"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div className="flex aspect-square items-center justify-center rounded-lg border border-dashed border-slate-700 text-xs text-slate-500">
                        Not set
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-100">Quick health checklist</h3>
                <ul className="mt-2 space-y-2 text-sm">
                  <li className={summary.missingCover ? "text-amber-400" : "text-emerald-400"}>
                    {summary.missingCover ? "○" : "●"} Cover set
                  </li>
                  <li className={summary.missingBanner ? "text-amber-400" : "text-emerald-400"}>
                    {summary.missingBanner ? "○" : "●"} Banner set
                  </li>
                  <li className={galleryAssets.length === 0 ? "text-slate-500" : "text-emerald-400"}>
                    {galleryAssets.length === 0 ? "○" : "●"} Gallery has content
                  </li>
                  <li className={sponsorAssets.length === 0 ? "text-slate-500" : "text-emerald-400"}>
                    {sponsorAssets.length === 0 ? "○" : "●"} Sponsor assets configured
                  </li>
                  <li className={summary.publicAssets > 0 ? "text-emerald-400" : "text-slate-500"}>
                    {summary.publicAssets > 0 ? "●" : "○"} Public media visible
                  </li>
                </ul>
              </div>

              {videoAssets.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-100">Recent videos</h3>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                    {videoAssets.slice(0, 4).map((v) => (
                      <Link
                        key={v.id}
                        href={`/watch/${v.id}`}
                        className="group rounded-xl border border-slate-800 bg-slate-950/40 p-2 transition-colors hover:border-emerald-500/30"
                      >
                        <div className="relative aspect-video overflow-hidden rounded-lg bg-slate-900">
                          {v.thumbnailUrl ? (
                            <Image src={v.thumbnailUrl} alt="" fill className="object-cover" unoptimized />
                          ) : (
                            <div className="flex h-full items-center justify-center text-slate-500">Video</div>
                          )}
                          <span className="absolute left-2 top-2 rounded bg-slate-950/70 px-2 py-0.5 text-[10px] text-slate-200">
                            {v.type}
                          </span>
                        </div>
                        <p className="mt-2 truncate text-sm font-medium text-slate-100">{v.title}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                <h3 className="text-sm font-semibold text-slate-100">Quick upload</h3>
                <p className="mt-1 text-sm text-slate-400">
                  Drag and drop images here or use the Upload Media button above.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("covers");
                      triggerUpload("cover");
                    }}
                    disabled={!!uploadingAsset}
                    className="rounded-xl border border-dashed border-slate-600 bg-slate-900/30 px-4 py-3 text-sm text-slate-400 hover:border-emerald-500/40 hover:text-emerald-300 disabled:opacity-50"
                  >
                    {uploadingAsset === "cover" ? "Uploading…" : "Upload image"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("sponsors");
                      triggerUpload("sponsor_logo");
                    }}
                    disabled={!!uploadingAsset}
                    className="rounded-xl border border-dashed border-slate-600 bg-slate-900/30 px-4 py-3 text-sm text-slate-400 hover:border-emerald-500/40 hover:text-emerald-300 disabled:opacity-50"
                  >
                    {uploadingAsset === "sponsor_logo" ? "Uploading…" : "Add sponsor logo"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("gallery");
                      triggerUpload("gallery");
                    }}
                    disabled={!!uploadingAsset}
                    className="rounded-xl border border-dashed border-slate-600 bg-slate-900/30 px-4 py-3 text-sm text-slate-400 hover:border-emerald-500/40 hover:text-emerald-300 disabled:opacity-50"
                  >
                    {uploadingAsset === "gallery" ? "Uploading…" : "Batch gallery upload"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "covers" && (
            <div className="space-y-6">
              <p className="text-sm text-slate-400">
                Control the tournament&apos;s primary identity visuals. These appear on public pages.
              </p>
              <div className="grid gap-6 md:grid-cols-2">
                {[
                  { key: "cover", label: "Cover image", asset: identityAssets.cover, fallback: tournament.coverImageUrl },
                  { key: "banner", label: "Banner", asset: identityAssets.banner, fallback: null },
                  { key: "poster", label: "Poster", asset: identityAssets.poster, fallback: null },
                  { key: "logo", label: "Logo", asset: identityAssets.logo, fallback: tournament.logoUrl },
                ].map(({ key, label, asset, fallback }) => (
                  <div key={key} className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                    <h4 className="text-sm font-semibold text-slate-100">{label}</h4>
                    <div className="mt-3">
                      {asset ? (
                        <AssetThumb asset={asset} />
                      ) : fallback ? (
                        <div className="relative aspect-video overflow-hidden rounded-lg bg-slate-900">
                          <Image src={fallback} alt="" fill className="object-cover" unoptimized />
                        </div>
                      ) : (
                        <div className="flex aspect-video items-center justify-center rounded-lg border border-dashed border-slate-700 text-sm text-slate-500">
                          Not set
                        </div>
                      )}
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => triggerUpload(key as AssetTypeKey)}
                        disabled={!!uploadingAsset}
                        className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-medium text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
                      >
                        {uploadingAsset === key ? "Uploading…" : asset || fallback ? "Replace" : "Upload"}
                      </button>
                      {(asset || fallback) && (
                        <button
                          type="button"
                          className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "gallery" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-400">Event photos, promotional images, and gallery content.</p>
                <button
                  type="button"
                  onClick={() => triggerUpload("gallery")}
                  disabled={!!uploadingAsset}
                  className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
                >
                  {uploadingAsset === "gallery" ? "Uploading…" : "Upload to gallery"}
                </button>
              </div>
              {galleryAssets.length === 0 ? (
                <EmptyPanel
                  title="No gallery items"
                  message="Upload photos or create an album to get started."
                />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {galleryAssets.map((a) => (
                    <div
                      key={a.id}
                      className="group rounded-xl border border-slate-800 bg-slate-950/40 p-2 transition-colors hover:border-emerald-500/30"
                    >
                      <AssetThumb asset={a} />
                      <p className="mt-2 truncate text-sm text-slate-200">{a.title ?? "Untitled"}</p>
                      <div className="mt-1 flex gap-2">
                        <button
                          type="button"
                          className="text-xs text-emerald-400 hover:underline"
                        >
                          Featured
                        </button>
                        <button type="button" className="text-xs text-slate-400 hover:underline">
                          Edit
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "sponsors" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-400">Sponsor logos and banners for public display.</p>
                <button
                  type="button"
                  onClick={() => triggerUpload("sponsor_logo")}
                  disabled={!!uploadingAsset}
                  className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
                >
                  {uploadingAsset === "sponsor_logo" ? "Uploading…" : "Add sponsor logo"}
                </button>
              </div>
              {sponsorMessage ? (
                <div className="rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-xs text-slate-300">
                  {sponsorMessage}
                </div>
              ) : null}
              {sponsorAssets.length === 0 ? (
                <EmptyPanel
                  title="No sponsor assets"
                  message="Add sponsor logos to display them on public tournament pages."
                />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                  {sponsorAssets.map((a) => (
                    <div
                      key={a.id}
                      className="rounded-xl border border-slate-800 bg-slate-950/40 p-3"
                    >
                      <AssetThumb asset={a} className="aspect-square" />
                      <div className="mt-3 space-y-2">
                        <label className="block space-y-1">
                          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                            Sponsor name
                          </span>
                          <input
                            value={getSponsorDraft(a).sponsorName}
                            onChange={(e) =>
                              setSponsorDrafts((prev) => ({
                                ...prev,
                                [a.id]: {
                                  ...getSponsorDraft(a),
                                  sponsorName: e.target.value,
                                },
                              }))
                            }
                            placeholder="Sponsor"
                            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-sm text-slate-100 placeholder:text-slate-500"
                          />
                        </label>
                        <label className="block space-y-1">
                          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                            Tier
                          </span>
                          <input
                            value={getSponsorDraft(a).sponsorTier}
                            onChange={(e) =>
                              setSponsorDrafts((prev) => ({
                                ...prev,
                                [a.id]: {
                                  ...getSponsorDraft(a),
                                  sponsorTier: e.target.value,
                                },
                              }))
                            }
                            placeholder="Gold / Silver / Partner"
                            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-sm text-slate-100 placeholder:text-slate-500"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => void saveSponsorMeta(a)}
                          disabled={savingSponsorId === a.id}
                          className="w-full rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
                        >
                          {savingSponsorId === a.id ? "Saving…" : "Save details"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "downloads" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-400">Posters, flyers, schedules, and other downloadable files.</p>
                <button
                  type="button"
                  onClick={() => triggerUpload("download")}
                  disabled={!!uploadingAsset}
                  className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
                >
                  {uploadingAsset === "download" ? "Uploading…" : "Add download"}
                </button>
              </div>
              {downloadAssets.length === 0 ? (
                <EmptyPanel
                  title="No downloads"
                  message="Upload posters, flyers, or schedules for public download."
                />
              ) : (
                <div className="space-y-2">
                  {downloadAssets.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/40 p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded bg-slate-800" />
                        <div>
                          <p className="font-medium text-slate-100">{a.title ?? a.fileUrl.split("/").pop() ?? "File"}</p>
                          <p className="text-xs text-slate-500">{a.visibility}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
                      >
                        Copy link
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "albums" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-400">Organize gallery items into albums.</p>
                <button
                  type="button"
                  onClick={() => {
                    setCreateAlbumOpen(true);
                    setCreateAlbumTitle("");
                  }}
                  disabled={createAlbumPending}
                  className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
                >
                  {createAlbumPending ? "Creating…" : "Create album"}
                </button>
              </div>
              {createAlbumOpen && (
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                  <h4 className="text-sm font-semibold text-slate-100">New album</h4>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <input
                      type="text"
                      value={createAlbumTitle}
                      onChange={(e) => setCreateAlbumTitle(e.target.value)}
                      placeholder="Album title (e.g. Match Day 1)"
                      className="min-w-[200px] rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        const title = createAlbumTitle.trim();
                        if (!title) return;
                        setCreateAlbumPending(true);
                        setUploadError(null);
                        const res = await createAlbumAction({ tournamentId: tournament.id, title });
                        setCreateAlbumPending(false);
                        if (!res.ok) {
                          setUploadError(res.error);
                          return;
                        }
                        setCreateAlbumOpen(false);
                        setCreateAlbumTitle("");
                        router.refresh();
                      }}
                      disabled={!createAlbumTitle.trim() || createAlbumPending}
                      className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
                    >
                      Create
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCreateAlbumOpen(false);
                        setCreateAlbumTitle("");
                      }}
                      className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
              {albums.length === 0 ? (
                <EmptyPanel
                  title="No albums"
                  message="Create albums to organize your gallery (e.g. Match Day 1, Finals, Behind the Scenes)."
                />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                  {albums.map((a: TournamentMediaAlbumRow) => (
                    <div
                      key={a.id}
                      className="rounded-xl border border-slate-800 bg-slate-950/40 p-4"
                    >
                      <div className="flex aspect-video items-center justify-center rounded-lg bg-slate-900 text-slate-500">
                        {a.assetCount} items
                      </div>
                      <p className="mt-2 font-medium text-slate-100">{a.title}</p>
                      <p className="text-xs text-slate-500">{a.visibility} • {a.assetCount} assets</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "usage" && (
            <EmptyPanel
              title="Usage & Visibility"
              message="Control where assets appear and who can see them. Assign assets to public sections, change visibility, and manage display order."
            />
          )}

          {activeTab === "storage" && (
            <EmptyPanel
              title="Storage"
              message="View storage usage, identify unused or duplicate files, and clean up the media library."
            />
          )}

          {activeTab === "settings" && (
            <div className="space-y-6 max-w-2xl">
              <h3 className="text-sm font-semibold text-slate-100">Media settings</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-slate-500">Default visibility for new uploads</p>
                  <select className="mt-1 w-full max-w-xs rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-2 text-sm text-slate-100">
                    <option value="public">Public</option>
                    <option value="hidden">Hidden</option>
                    <option value="organizer_only">Organizer only</option>
                  </select>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Required media before publish</p>
                  <label className="mt-2 flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span className="text-sm text-slate-300">Cover image required</span>
                  </label>
                  <label className="mt-1 flex items-center gap-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm text-slate-300">Banner required</span>
                  </label>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Allowed file types</p>
                  <p className="mt-1 text-sm text-slate-400">Images: JPG, PNG, WebP, GIF. Documents: PDF. Max 10MB per file.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
