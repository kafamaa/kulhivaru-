-- Extend public.players with richer profile fields.

ALTER TABLE public.players
  ADD COLUMN IF NOT EXISTS nickname text,
  ADD COLUMN IF NOT EXISTS dob date,
  ADD COLUMN IF NOT EXISTS id_number text;

