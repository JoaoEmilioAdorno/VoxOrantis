-- Define a primeira conta proprietária da plataforma.
-- Falha explicitamente se a conta ainda não existir no Supabase Auth.

DO $$
DECLARE
    owner_user_id uuid;
BEGIN
    SELECT id INTO owner_user_id
    FROM auth.users
    WHERE lower(email) = lower('xomanoje@gmail.com')
    LIMIT 1;

    IF owner_user_id IS NULL THEN
        RAISE EXCEPTION 'A conta proprietária xomanoje@gmail.com não existe no Supabase Auth.';
    END IF;

    INSERT INTO public.profiles (id, display_name)
    VALUES (owner_user_id, 'Proprietário Vox Orantis')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.platform_user_roles (user_id, role, granted_by)
    VALUES (owner_user_id, 'owner', owner_user_id)
    ON CONFLICT (user_id, role) DO NOTHING;

    INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
    VALUES (
        owner_user_id,
        'platform_owner_bootstrapped',
        'profile',
        owner_user_id,
        jsonb_build_object('email', 'xomanoje@gmail.com')
    );
END;
$$;
