# GameOn Supabase migrations

## Apply migrations

1. **Supabase Dashboard**  
   Open your project → SQL Editor. Paste and run the contents of  
   `migrations/20260318120000_gameon_public_views.sql`.

2. **Supabase CLI** (if you use it)  
   From the project root:
   ```bash
   npx supabase db push
   ```

## Seed data (optional)

To see real data on the landing page, run `seed.sql` once in the SQL Editor after the migration.  
It inserts one organization, two tournaments, three teams, two matches, two players, match events, standings, and one highlight.

## Views created

| View | Purpose |
|------|--------|
| `public_tournaments` | Tournaments list (explore, ongoing, upcoming, featured) |
| `public_matches_preview` | Matches strip for homepage (live/upcoming/results) |
| `platform_stats` | Single row: tournaments_hosted, matches_played, teams_registered |
| `public_top_scorers` | Top scorers for stats preview |
| `public_standings_preview` | Standings rows for stats preview |
| `public_featured_player` | Top scorer for featured section |
| `public_featured_team` | Team with highest points for featured section |
| `public_streams` | Live/upcoming streams for watch section |
| `public_highlights` | Highlights/VODs for watch section |

All views use `security_invoker = on` and are readable by `anon` when RLS on base tables allows it.
