-- Permite que visitantes consultem grupos; a RLS continua expondo somente aprovados.

GRANT SELECT ON public.community_groups TO anon;
