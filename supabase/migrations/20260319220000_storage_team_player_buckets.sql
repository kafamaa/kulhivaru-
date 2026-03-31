-- Create team-logos and player-avatars storage buckets (policies exist in earlier migrations).
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('team-logos', 'team-logos', true),
  ('player-avatars', 'player-avatars', true)
ON CONFLICT (id) DO NOTHING;
