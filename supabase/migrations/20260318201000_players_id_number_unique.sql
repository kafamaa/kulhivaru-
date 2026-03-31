-- Ensure each player ID number is globally unique when present.

CREATE UNIQUE INDEX IF NOT EXISTS players_id_number_unique
ON public.players (id_number)
WHERE id_number IS NOT NULL;

