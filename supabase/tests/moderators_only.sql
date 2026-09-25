-- Verificação da remoção e do acesso às capelas. Não grava conteúdo.
BEGIN;

DO $$ BEGIN
    IF to_regclass('public.communities') IS NOT NULL
       OR to_regclass('public.community_members') IS NOT NULL
       OR to_regclass('public.profiles') IS NOT NULL
       OR to_regclass('public.platform_user_roles') IS NOT NULL THEN
        RAISE EXCEPTION 'As estruturas retiradas ainda existem.';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.moderators) THEN
        RAISE EXCEPTION 'Nenhum moderador preservado.';
    END IF;
    IF has_function_privilege('authenticated', 'public.approve_prayer_request_unchecked(uuid)', 'EXECUTE') THEN
        RAISE EXCEPTION 'A função interna de moderação está exposta.';
    END IF;
END $$;

SET LOCAL ROLE anon;
SELECT count(*) AS public_globe_points FROM public.public_active_prayers;
SELECT count(*) AS public_prayer_requests FROM public.prayer_requests;
SELECT count(*) AS public_miracles FROM public.miracle_requests;
RESET ROLE;

SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000000', true);
SET LOCAL ROLE authenticated;
DO $$ BEGIN
    IF public.can_moderate() THEN
        RAISE EXCEPTION 'Uma conta sem autorização obteve acesso.';
    END IF;
    BEGIN
        PERFORM public.approve_prayer_request('00000000-0000-0000-0000-000000000000');
        RAISE EXCEPTION 'A aprovação não bloqueou a conta sem autorização.';
    EXCEPTION WHEN insufficient_privilege THEN NULL;
    END;
END $$;
RESET ROLE;

SELECT set_config('request.jwt.claim.sub', (SELECT user_id::text FROM public.moderators LIMIT 1), true);
SET LOCAL ROLE authenticated;
DO $$ BEGIN
    IF NOT public.can_moderate() THEN
        RAISE EXCEPTION 'O moderador perdeu seu acesso.';
    END IF;
END $$;
SELECT count(*) AS moderation_prayers FROM public.prayer_requests;
SELECT count(*) AS moderation_miracles FROM public.miracle_requests;
SELECT count(*) AS moderation_suggestions FROM public.prayer_suggestions;
ROLLBACK;
