import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/src/lib/supabase/admin";

const ALLOWED_TYPES = [
  "cover",
  "banner",
  "poster",
  "logo",
  "gallery",
  "sponsor_logo",
  "sponsor_banner",
  "download",
] as const;

export async function POST(request: Request) {
  const admin = createSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: "Missing Supabase service-role credentials on server." },
      { status: 500 }
    );
  }

  const formData = await request.formData();
  const tournamentId = String(formData.get("tournamentId") ?? "");
  const assetType = String(formData.get("assetType") ?? "cover");
  const file = formData.get("file");
  const title = formData.get("title") ? String(formData.get("title")) : null;
  const sponsorName = formData.get("sponsorName") ? String(formData.get("sponsorName")) : null;
  const sponsorTier = formData.get("sponsorTier") ? String(formData.get("sponsorTier")) : null;

  if (!tournamentId) {
    return NextResponse.json({ error: "tournamentId is required" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(assetType as (typeof ALLOWED_TYPES)[number])) {
    return NextResponse.json(
      { error: "assetType must be cover, banner, poster, logo, gallery, sponsor_logo, sponsor_banner, or download" },
      { status: 400 }
    );
  }
  if (!file || typeof (file as File).arrayBuffer !== "function") {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }

  const f = file as File;
  const originalName = f.name || "image";
  const ext = originalName.split(".").pop() || "jpg";
  const path = `${tournamentId}/${assetType}/${Date.now()}-${originalName.replace(/[^a-zA-Z0-9.-]/g, "_")}`;

  const { error: uploadError } = await admin.storage
    .from("tournament-media")
    .upload(path, f, {
      upsert: true,
      contentType: f.type || undefined,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const {
    data: { publicUrl },
  } = admin.storage.from("tournament-media").getPublicUrl(path);

  if (!publicUrl) {
    return NextResponse.json({ error: "Could not generate public URL." }, { status: 500 });
  }

  // For cover and logo: also update tournaments table (used by public pages)
  if (assetType === "cover") {
    const { error: tErr } = await admin
      .from("tournaments")
      .update({ cover_image_url: publicUrl })
      .eq("id", tournamentId);
    if (tErr) {
      return NextResponse.json({ error: tErr.message }, { status: 500 });
    }
  }
  if (assetType === "logo") {
    const { error: tErr } = await admin
      .from("tournaments")
      .update({ logo_url: publicUrl })
      .eq("id", tournamentId);
    if (tErr) {
      return NextResponse.json({ error: tErr.message }, { status: 500 });
    }
  }

  // For identity assets (cover, banner, poster, logo): deactivate previous so only one is active
  const identityTypes = ["cover", "banner", "poster", "logo"];
  if (identityTypes.includes(assetType)) {
    await admin
      .from("tournament_media_assets")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("tournament_id", tournamentId)
      .eq("asset_type", assetType);
  }

  const insertTitle =
    title ?? (assetType === "gallery" ? originalName.replace(/\.[^/.]+$/, "") : assetType.replace(/_/g, " "));

  await admin.from("tournament_media_assets").insert({
    tournament_id: tournamentId,
    asset_type: assetType,
    file_url: publicUrl,
    title: insertTitle,
    visibility: "public",
    is_active: true,
    is_featured: assetType === "cover" || assetType === "logo",
    sort_order: 0,
    sponsor_name: sponsorName ?? null,
    sponsor_tier: sponsorTier ?? null,
  });

  return NextResponse.json({ publicUrl, assetType });
}
