-- Vox Orantis
-- Sprint 2 — Commit 16
-- Limpeza automática das orações expiradas


-- =========================================================
-- FUNÇÃO DE LIMPEZA
-- =========================================================

CREATE OR REPLACE FUNCTION public.cleanup_expired_prayers()
RETURNS void
LANGUAGE plpgsql
AS $function$
BEGIN
    DELETE FROM public.prayers
    WHERE expires_at <= now();
END;
$function$;


-- =========================================================
-- AGENDAMENTO
-- Executa a limpeza uma vez por minuto
-- =========================================================

CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
BEGIN

    IF NOT EXISTS (
        SELECT 1
        FROM cron.job
        WHERE command = 'select public.cleanup_expired_prayers();'
    ) THEN

        PERFORM cron.schedule(
            '* * * * *',
            'select public.cleanup_expired_prayers();'
        );

    END IF;

END;
$$;