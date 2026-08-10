-- Vox Orantis
-- Sprint Final — Commit 18
-- Libera apenas as colunas públicas necessárias ao Realtime

GRANT SELECT (
    id,
    latitude,
    longitude,
    created_at,
    expires_at
)
ON public.prayers
TO anon;

DROP POLICY IF EXISTS "Realtime can read public prayer data"
ON public.prayers;

CREATE POLICY "Realtime can read public prayer data"
ON public.prayers
FOR SELECT
TO anon
USING (true);