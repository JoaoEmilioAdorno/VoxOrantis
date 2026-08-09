-- Vox Orantis
-- Sprint 2 — Commit 14
-- Integridade e segurança estrutural do banco


-- =========================================================
-- CONSTRAINTS — PRAYERS
-- =========================================================

ALTER TABLE public.prayers
DROP CONSTRAINT IF EXISTS prayers_latitude_valid;

ALTER TABLE public.prayers
ADD CONSTRAINT prayers_latitude_valid
CHECK (latitude >= -90 AND latitude <= 90);


ALTER TABLE public.prayers
DROP CONSTRAINT IF EXISTS prayers_longitude_valid;

ALTER TABLE public.prayers
ADD CONSTRAINT prayers_longitude_valid
CHECK (longitude >= -180 AND longitude <= 180);


ALTER TABLE public.prayers
DROP CONSTRAINT IF EXISTS prayers_nickname_length;

ALTER TABLE public.prayers
ADD CONSTRAINT prayers_nickname_length
CHECK (
    nickname IS NULL
    OR length(nickname) <= 40
);


-- =========================================================
-- CONSTRAINTS — STATS
-- =========================================================

ALTER TABLE public.stats
DROP CONSTRAINT IF EXISTS stats_total_prayers_nonnegative;

ALTER TABLE public.stats
ADD CONSTRAINT stats_total_prayers_nonnegative
CHECK (total_prayers >= 0);


ALTER TABLE public.stats
DROP CONSTRAINT IF EXISTS stats_today_prayers_nonnegative;

ALTER TABLE public.stats
ADD CONSTRAINT stats_today_prayers_nonnegative
CHECK (today_prayers >= 0);


-- =========================================================
-- REMOVE ACESSO DIRETO DE ESCRITA
-- =========================================================

DROP POLICY IF EXISTS "Public can insert prayers"
ON public.prayers;

DROP POLICY IF EXISTS "RPC can update stats"
ON public.stats;


-- =========================================================
-- REMOVE LEITURA DIRETA DE PRAYERS
-- =========================================================

DROP POLICY IF EXISTS "Public can read prayers"
ON public.prayers;


-- =========================================================
-- VIEW PÚBLICA SEGURA
-- =========================================================

CREATE OR REPLACE VIEW public.public_active_prayers
WITH (security_invoker = true)
AS
SELECT
    id,
    latitude,
    longitude,
    created_at,
    expires_at
FROM public.prayers
WHERE expires_at > now();


-- =========================================================
-- PERMISSÃO DE LEITURA DA VIEW
-- =========================================================

GRANT SELECT
ON public.public_active_prayers
TO anon, authenticated;