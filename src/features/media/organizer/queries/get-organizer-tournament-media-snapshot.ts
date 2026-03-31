import { createSupabaseServerClient } from "@/src/lib/supabase/server";

export type TournamentMediaAssetType =
  | "cover"
  | "banner"
  | "poster"
  | "logo"
  | "thumbnail"
  | "social_card"
  | "gallery"
  | "sponsor_logo"
  | "sponsor_banner"
  | "download";

export interface TournamentMediaAssetRow {
  id: string;
  assetType: TournamentMediaAssetType;
  fileUrl: string;
  title: string | null;
  caption: string | null;
  visibility: string;
  isFeatured: boolean;
  isActive: boolean;
  sortOrder: number;
  albumId: string | null;
  sponsorName: string | null;
  sponsorTier: string | null;
  createdAt: string;
}

export interface TournamentMediaAlbumRow {
  id: string;
  title: string;
  visibility: string;
  sortOrder: number;
  assetCount: number;
  createdAt: string;
}

export interface OrganizerTournamentMediaSnapshot {
  tournament: {
    id: string;
    name: string;
    slug: string;
    status: string;
    coverImageUrl: string | null;
    logoUrl: string | null;
    startDate: string | null;
    endDate: string | null;
    organizationName: string | null;
  };
  summary: {
    totalAssets: number;
    publicAssets: number;
    galleryItems: number;
    sponsorAssets: number;
    featuredItems: number;
    missingCover: boolean;
    missingBanner: boolean;
    videoCount: number;
    lastUpdated: string | null;
  };
  identityAssets: {
    cover: TournamentMediaAssetRow | null;
    banner: TournamentMediaAssetRow | null;
    poster: TournamentMediaAssetRow | null;
    logo: TournamentMediaAssetRow | null;
  };
  galleryAssets: TournamentMediaAssetRow[];
  sponsorAssets: TournamentMediaAssetRow[];
  downloadAssets: TournamentMediaAssetRow[];
  albums: TournamentMediaAlbumRow[];
  videoAssets: Array<{
    id: string;
    title: string;
    type: string;
    isLive: boolean;
    thumbnailUrl: string | null;
    createdAt: string;
  }>;
}

function toStr(v: unknown): string {
  return typeof v === "string" ? v : "";
}
function toOptStr(v: unknown): string | null {
  if (v == null || v === "") return null;
  return String(v);
}

export async function getOrganizerTournamentMediaSnapshot(
  tournamentId: string
): Promise<OrganizerTournamentMediaSnapshot | null> {
  const supabase = await createSupabaseServerClient();

  const { data: t, error: tErr } = await supabase
    .from("tournaments")
    .select("id, name, slug, status, cover_image_url, logo_url, start_date, end_date, organization_id")
    .eq("id", tournamentId)
    .single();

  if (tErr || !t) return null;

  let organizationName: string | null = null;
  if (t.organization_id) {
    const { data: org } = await supabase
      .from("organizations")
      .select("name")
      .eq("id", t.organization_id)
      .single();
    organizationName = org?.name ? String(org.name) : null;
  }

  let staticAssets: unknown[] = [];
  const assetsRes = await supabase
    .from("tournament_media_assets")
    .select("id, asset_type, file_url, title, caption, visibility, is_featured, is_active, sort_order, album_id, sponsor_name, sponsor_tier, created_at")
    .eq("tournament_id", tournamentId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (!assetsRes.error) staticAssets = assetsRes.data ?? [];

  const assets: TournamentMediaAssetRow[] = staticAssets.map((r: any) => ({
    id: toStr(r.id),
    assetType: toStr(r.asset_type) as TournamentMediaAssetType,
    fileUrl: toStr(r.file_url),
    title: toOptStr(r.title),
    caption: toOptStr(r.caption),
    visibility: toStr(r.visibility) || "public",
    isFeatured: Boolean(r.is_featured),
    isActive: Boolean(r.is_active),
    sortOrder: Number(r.sort_order) || 0,
    albumId: toOptStr(r.album_id),
    sponsorName: toOptStr(r.sponsor_name),
    sponsorTier: toOptStr(r.sponsor_tier),
    createdAt: toStr(r.created_at),
  }));

  const cover = assets.find((a) => a.assetType === "cover" && a.isActive) ?? null;
  const banner = assets.find((a) => a.assetType === "banner" && a.isActive) ?? null;
  const poster = assets.find((a) => a.assetType === "poster" && a.isActive) ?? null;
  const logo = assets.find((a) => a.assetType === "logo" && a.isActive) ?? null;

  const galleryAssets = assets.filter((a) => a.assetType === "gallery");
  const sponsorAssets = assets.filter((a) => a.assetType === "sponsor_logo" || a.assetType === "sponsor_banner");
  const downloadAssets = assets.filter((a) => a.assetType === "download");

  const publicAssets = assets.filter((a) => a.visibility === "public" && a.isActive);
  const featuredItems = assets.filter((a) => a.isFeatured && a.isActive);

  let albumsRows: unknown[] = [];
  const albumsRes = await supabase
    .from("tournament_media_albums")
    .select("id, title, visibility, sort_order, created_at")
    .eq("tournament_id", tournamentId)
    .order("sort_order", { ascending: true });
  if (!albumsRes.error) albumsRows = albumsRes.data ?? [];

  const albumIds = albumsRows.map((a: any) => toStr(a.id));
  const { data: albumCounts } = albumIds.length
    ? await supabase
        .from("tournament_media_assets")
        .select("album_id")
        .eq("tournament_id", tournamentId)
        .in("album_id", albumIds)
    : { data: [] };

  const countByAlbum = (albumCounts?.data ?? []).reduce<Record<string, number>>((acc, r: any) => {
    const aid = toOptStr(r.album_id);
    if (aid) acc[aid] = (acc[aid] ?? 0) + 1;
    return acc;
  }, {});

  const albums: TournamentMediaAlbumRow[] = albumsRows.map((a: any) => ({
    id: toStr(a.id),
    title: toStr(a.title),
    visibility: toStr(a.visibility) || "public",
    sortOrder: Number(a.sort_order) || 0,
    assetCount: countByAlbum[toStr(a.id)] ?? 0,
    createdAt: toStr(a.created_at),
  }));

  const { data: videoRows } = await supabase
    .from("media_assets")
    .select("id, title, type, is_live, thumbnail_url, created_at")
    .eq("tournament_id", tournamentId)
    .order("is_live", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(20);

  const videoAssets = (videoRows ?? []).map((r: any) => ({
    id: toStr(r.id),
    title: toStr(r.title),
    type: toStr(r.type),
    isLive: Boolean(r.is_live),
    thumbnailUrl: toOptStr(r.thumbnail_url),
    createdAt: toStr(r.created_at),
  }));

  const allDates = [
    ...assets.map((a) => a.createdAt),
    ...videoAssets.map((v) => v.createdAt),
  ].filter(Boolean);
  const lastUpdated = allDates.length ? allDates.sort().reverse()[0] : null;

  const coverImageUrl = t.cover_image_url ? String(t.cover_image_url) : (cover?.fileUrl ?? null);
  const logoUrl = t.logo_url ? String(t.logo_url) : (logo?.fileUrl ?? null);

  return {
    tournament: {
      id: toStr(t.id),
      name: toStr(t.name),
      slug: toStr(t.slug),
      status: toStr(t.status),
      coverImageUrl,
      logoUrl,
      startDate: toOptStr(t.start_date),
      endDate: toOptStr(t.end_date),
      organizationName,
    },
    summary: {
      totalAssets: assets.length + videoAssets.length,
      publicAssets: publicAssets.length + videoAssets.length,
      galleryItems: galleryAssets.length,
      sponsorAssets: sponsorAssets.length,
      featuredItems: featuredItems.length,
      missingCover: !cover && !t.cover_image_url,
      missingBanner: !banner,
      videoCount: videoAssets.length,
      lastUpdated,
    },
    identityAssets: { cover, banner, poster, logo },
    galleryAssets,
    sponsorAssets,
    downloadAssets,
    albums,
    videoAssets,
  };
}
