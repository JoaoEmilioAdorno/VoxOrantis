-- Escopo simplificado: capelas, biblioteca de orações e moderadores.
-- Preserva contas e conteúdos legados; remove o módulo de comunidades.

INSERT INTO public.moderators (user_id)
SELECT DISTINCT user_id FROM public.platform_user_roles
WHERE role IN ('owner', 'admin', 'moderator')
ON CONFLICT (user_id) DO NOTHING;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.moderators) THEN
        RAISE EXCEPTION 'A remoção exige ao menos um moderador preservado.';
    END IF;
END $$;

CREATE OR REPLACE FUNCTION public.can_moderate()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.moderators WHERE user_id = auth.uid()
    );
$$;
REVOKE ALL ON FUNCTION public.can_moderate() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_moderate() TO authenticated;

-- O globo continua mostrando todas as orações, sem associação comunitária.
DROP VIEW public.public_active_prayers;
CREATE VIEW public.public_active_prayers WITH (security_invoker = true) AS
SELECT id, latitude, longitude, created_at, expires_at
FROM public.prayers WHERE expires_at > now();
GRANT SELECT ON public.public_active_prayers TO anon, authenticated;

ALTER TABLE public.prayers DROP COLUMN community_id, DROP COLUMN created_by;
DROP TRIGGER IF EXISTS voxorantis_auth_user_created ON auth.users;

-- Sem CASCADE: uma dependência externa inesperada deve impedir a migração.
DROP TABLE public.community_meetings, public.community_events,
    public.group_members, public.community_groups, public.community_members,
    public.communities, public.guardian_consents, public.profile_private_data,
    public.platform_user_roles, public.profiles, public.audit_logs;

-- Remove todas as assinaturas das funções exclusivas do módulo retirado.
DO $$
DECLARE obsolete_function record;
BEGIN
    FOR obsolete_function IN
        SELECT p.oid::regprocedure AS signature
        FROM pg_proc p
        WHERE p.pronamespace = 'public'::regnamespace
          AND p.proname = ANY (ARRAY[
            'attach_prayer_to_community', 'complete_registration',
            'create_community', 'create_community_event', 'create_community_group',
            'create_community_with_meetings', 'create_scheduled_community',
            'handle_voxorantis_new_user', 'has_platform_role',
            'is_active_community_member', 'is_community_manager',
            'request_community_membership', 'review_community',
            'review_community_event', 'review_community_group',
            'review_community_meeting', 'review_community_membership',
            'review_guardian_consent', 'save_community_meeting',
            'submit_guardian_consent', 'update_community_page',
            'update_scheduled_community_page'
          ])
    LOOP
        EXECUTE format('DROP FUNCTION %s', obsolete_function.signature);
    END LOOP;
END $$;

DROP TYPE public.community_prayer_mode, public.community_event_type,
    public.review_status, public.community_status, public.membership_role,
    public.membership_status, public.consent_status, public.platform_role;

-- Reforça o mesmo controle de acesso na leitura e nas ações de moderação.
ALTER POLICY "Moderators can read all prayer requests" ON public.prayer_requests
USING (public.can_moderate());
ALTER POLICY "Moderators can read all miracle requests" ON public.miracle_requests
USING (public.can_moderate());

NOTIFY pgrst, 'reload schema';
