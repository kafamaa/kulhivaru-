-- Tournament media assets: covers, banners, gallery, sponsors, downloads
-- Extends media_assets (video) with static asset management per spec.

-- Albums for gallery organization (created first; assets reference albums)
CREATE TABLE IF NOT EXISTS public.tournament_media_albums (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  title text NOT NULL,
  slug text,
  cover_asset_id uuid,
  visibility text NOT NULL DEFAULT 'public' CHECK (visibility IN ('public','hidden','organizer_only','archived')),
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.tournament_media_albums ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated read tournament_media_albums" ON public.tournament_media_albums;
CREATE POLICY "Allow authenticated read tournament_media_albums" ON public.tournament_media_albums FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated write tournament_media_albums" ON public.tournament_media_albums;
CREATE POLICY "Allow authenticated write tournament_media_albums" ON public.tournament_media_albums FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Static media assets (images, PDFs) for tournament identity, gallery, sponsors, downloads
CREATE TABLE IF NOT EXISTS public.tournament_media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  asset_type text NOT NULL CHECK (asset_type IN (
    'cover','banner','poster','logo','thumbnail','social_card',
    'gallery','sponsor_logo','sponsor_banner','download'
  )),
  file_url text NOT NULL,
  title text,
  caption text,
  file_name text,
  mime_type text,
  file_size bigint,
  width int,
  height int,
  visibility text NOT NULL DEFAULT 'public' CHECK (visibility IN ('public','hidden','organizer_only','archived')),
  is_featured boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  album_id uuid REFERENCES public.tournament_media_albums(id) ON DELETE SET NULL,
  sponsor_name text,
  sponsor_tier text,
  placement text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.tournament_media_assets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated read tournament_media_assets" ON public.tournament_media_assets;
CREATE POLICY "Allow authenticated read tournament_media_assets" ON public.tournament_media_assets FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated write tournament_media_assets" ON public.tournament_media_assets;
CREATE POLICY "Allow authenticated write tournament_media_assets" ON public.tournament_media_assets FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Album cover FK (optional; cover_asset_id references assets)
ALTER TABLE public.tournament_media_albums
  DROP CONSTRAINT IF EXISTS fk_album_cover_asset;
ALTER TABLE public.tournament_media_albums
  ADD CONSTRAINT fk_album_cover_asset
  FOREIGN KEY (cover_asset_id) REFERENCES public.tournament_media_assets(id) ON DELETE SET NULL;
