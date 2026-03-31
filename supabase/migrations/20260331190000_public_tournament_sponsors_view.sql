-- Public sponsors by tournament slug for public overview page.

CREATE OR REPLACE VIEW public.public_tournament_sponsors
AS
SELECT
  t.slug AS tournament_slug,
  a.id,
  a.file_url,
  a.sponsor_name,
  a.sponsor_tier,
  a.sort_order,
  a.created_at
FROM public.tournaments t
JOIN public.tournament_media_assets a ON a.tournament_id = t.id
WHERE t.status IN ('upcoming', 'ongoing', 'completed')
  AND a.asset_type IN ('sponsor_logo', 'sponsor_banner')
  AND a.visibility = 'public'
  AND a.is_active = true;

GRANT SELECT ON public.public_tournament_sponsors TO anon, authenticated;
