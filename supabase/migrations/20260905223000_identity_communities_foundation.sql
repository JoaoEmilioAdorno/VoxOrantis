-- Vox Orantis — fundação de identidade, confiança, comunidades, grupos e agenda
-- Esta migração cria estruturas novas e não altera as tabelas legadas.

CREATE EXTENSION IF NOT EXISTS citext;

DO $$ BEGIN
    CREATE TYPE public.platform_role AS ENUM ('owner', 'admin', 'moderator', 'member');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE public.community_status AS ENUM ('pending', 'active', 'rejected', 'suspended', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE public.membership_role AS ENUM ('owner', 'admin', 'member');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE public.membership_status AS ENUM ('pending', 'active', 'suspended', 'left', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE public.consent_status AS ENUM ('pending', 'approved', 'rejected', 'revoked');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username citext UNIQUE,
    display_name text,
    avatar_url text,
    profile_completed boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT profiles_username_length CHECK (
        username IS NULL OR length(username::text) BETWEEN 3 AND 30
    ),
    CONSTRAINT profiles_username_format CHECK (
        username IS NULL OR username::text ~ '^[a-zA-Z0-9._-]+$'
    ),
    CONSTRAINT profiles_display_name_length CHECK (
        display_name IS NULL OR length(btrim(display_name)) BETWEEN 1 AND 100
    )
);

CREATE TABLE IF NOT EXISTS public.profile_private_data (
    user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    full_name text,
    address text,
    contact_email citext,
    phone text,
    whatsapp text,
    birth_date date,
    guardian_consent_required boolean NOT NULL DEFAULT false,
    account_enabled boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT private_full_name_length CHECK (
        full_name IS NULL OR length(btrim(full_name)) BETWEEN 2 AND 150
    )
);

CREATE TABLE IF NOT EXISTS public.platform_user_roles (
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role public.platform_role NOT NULL DEFAULT 'member',
    granted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, role)
);

CREATE TABLE IF NOT EXISTS public.guardian_consents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    minor_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    guardian_name text NOT NULL,
    guardian_email citext NOT NULL,
    relationship text NOT NULL,
    status public.consent_status NOT NULL DEFAULT 'pending',
    reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    reviewed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (minor_user_id)
);

CREATE TABLE IF NOT EXISTS public.communities (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    slug citext NOT NULL UNIQUE,
    logo_url text,
    meeting_schedule text,
    status public.community_status NOT NULL DEFAULT 'pending',
    created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    reviewed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT communities_name_length CHECK (length(btrim(name)) BETWEEN 3 AND 100),
    CONSTRAINT communities_slug_format CHECK (slug::text ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

CREATE TABLE IF NOT EXISTS public.community_members (
    community_id uuid NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role public.membership_role NOT NULL DEFAULT 'member',
    status public.membership_status NOT NULL DEFAULT 'pending',
    invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    approved_at timestamptz,
    joined_at timestamptz,
    left_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (community_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.community_groups (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id uuid NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
    name text NOT NULL,
    created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT community_groups_name_length CHECK (length(btrim(name)) BETWEEN 2 AND 100)
);

CREATE TABLE IF NOT EXISTS public.group_members (
    group_id uuid NOT NULL REFERENCES public.community_groups(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (group_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.community_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id uuid NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
    group_id uuid REFERENCES public.community_groups(id) ON DELETE SET NULL,
    title text NOT NULL,
    description text,
    starts_at timestamptz NOT NULL,
    ends_at timestamptz,
    location_or_url text,
    recurrence_rule text,
    created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT community_events_title_length CHECK (length(btrim(title)) BETWEEN 2 AND 150),
    CONSTRAINT community_events_valid_period CHECK (ends_at IS NULL OR ends_at > starts_at)
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    action text NOT NULL,
    entity_type text NOT NULL,
    entity_id uuid,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_communities_status_created ON public.communities(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_members_user_status ON public.community_members(user_id, status);
CREATE INDEX IF NOT EXISTS idx_members_community_status ON public.community_members(community_id, status);
CREATE INDEX IF NOT EXISTS idx_groups_community ON public.community_groups(community_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_community_start ON public.community_events(community_id, starts_at);
CREATE INDEX IF NOT EXISTS idx_audit_created ON public.audit_logs(created_at DESC);

CREATE OR REPLACE FUNCTION public.has_platform_role(required_roles public.platform_role[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.platform_user_roles r
        WHERE r.user_id = auth.uid() AND r.role = ANY(required_roles)
    );
$$;

CREATE OR REPLACE FUNCTION public.is_active_community_member(target_community_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.community_members m
        WHERE m.community_id = target_community_id
          AND m.user_id = auth.uid()
          AND m.status = 'active'
    );
$$;

CREATE OR REPLACE FUNCTION public.is_community_manager(target_community_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.has_platform_role(ARRAY['owner', 'admin']::public.platform_role[])
       OR EXISTS (
            SELECT 1 FROM public.community_members m
            WHERE m.community_id = target_community_id
              AND m.user_id = auth.uid()
              AND m.status = 'active'
              AND m.role IN ('owner', 'admin')
       );
$$;

CREATE OR REPLACE FUNCTION public.handle_voxorantis_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name)
    VALUES (NEW.id, NULLIF(btrim(NEW.raw_user_meta_data ->> 'full_name'), ''))
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.profile_private_data (user_id, contact_email)
    VALUES (NEW.id, NEW.email)
    ON CONFLICT (user_id) DO NOTHING;

    INSERT INTO public.platform_user_roles (user_id, role)
    VALUES (NEW.id, 'member')
    ON CONFLICT (user_id, role) DO NOTHING;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS voxorantis_auth_user_created ON auth.users;
CREATE TRIGGER voxorantis_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_voxorantis_new_user();

-- Garante perfil para contas que já existiam antes desta migração.
INSERT INTO public.profiles (id, display_name)
SELECT u.id, NULLIF(btrim(u.raw_user_meta_data ->> 'full_name'), '')
FROM auth.users u
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profile_private_data (user_id, contact_email)
SELECT u.id, u.email
FROM auth.users u
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.platform_user_roles (user_id, role)
SELECT u.id, 'member'::public.platform_role
FROM auth.users u
ON CONFLICT (user_id, role) DO NOTHING;

CREATE OR REPLACE FUNCTION public.complete_registration(
    p_username text,
    p_full_name text,
    p_address text,
    p_contact_email text,
    p_phone text,
    p_whatsapp text,
    p_birth_date date
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    clean_username text := lower(btrim(p_username));
    is_minor boolean;
BEGIN
    IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Autenticação necessária.'; END IF;
    IF clean_username !~ '^[a-z0-9._-]{3,30}$' THEN RAISE EXCEPTION 'Apelido inválido.'; END IF;
    IF length(btrim(p_full_name)) < 2 THEN RAISE EXCEPTION 'Nome obrigatório.'; END IF;
    IF length(btrim(p_address)) < 5 THEN RAISE EXCEPTION 'Endereço obrigatório.'; END IF;
    IF position('@' IN p_contact_email) <= 1 THEN RAISE EXCEPTION 'E-mail de contato inválido.'; END IF;
    IF length(btrim(p_phone)) < 8 THEN RAISE EXCEPTION 'Telefone obrigatório.'; END IF;
    IF length(btrim(p_whatsapp)) < 8 THEN RAISE EXCEPTION 'WhatsApp obrigatório.'; END IF;
    IF p_birth_date IS NULL OR p_birth_date > current_date THEN RAISE EXCEPTION 'Data de nascimento inválida.'; END IF;

    is_minor := p_birth_date > (current_date - interval '16 years')::date;

    UPDATE public.profiles
    SET username = clean_username,
        display_name = btrim(p_full_name),
        profile_completed = true
    WHERE id = auth.uid();

    UPDATE public.profile_private_data
    SET full_name = btrim(p_full_name),
        address = btrim(p_address),
        contact_email = lower(btrim(p_contact_email)),
        phone = btrim(p_phone),
        whatsapp = btrim(p_whatsapp),
        birth_date = p_birth_date,
        guardian_consent_required = is_minor,
        account_enabled = NOT is_minor
    WHERE user_id = auth.uid();
END;
$$;

CREATE OR REPLACE FUNCTION public.create_community(p_name text, p_slug text, p_logo_url text DEFAULT NULL, p_meeting_schedule text DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE new_id uuid;
BEGIN
    IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Autenticação necessária.'; END IF;
    IF NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.profile_completed) THEN
        RAISE EXCEPTION 'Complete o cadastro antes de criar uma comunidade.';
    END IF;

    INSERT INTO public.communities (name, slug, logo_url, meeting_schedule, created_by)
    VALUES (btrim(p_name), lower(btrim(p_slug)), p_logo_url, p_meeting_schedule, auth.uid())
    RETURNING id INTO new_id;

    INSERT INTO public.community_members (community_id, user_id, role, status)
    VALUES (new_id, auth.uid(), 'owner', 'pending');
    RETURN new_id;
END;
$$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_private_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guardian_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are readable" ON public.profiles FOR SELECT USING (profile_completed);
CREATE POLICY "Users update own public profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "Users read own private data" ON public.profile_private_data FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_platform_role(ARRAY['owner','admin']::public.platform_role[]));
CREATE POLICY "Users update own private data" ON public.profile_private_data FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Trusted users read roles" ON public.platform_user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_platform_role(ARRAY['owner','admin']::public.platform_role[]));
CREATE POLICY "Owners and admins manage roles" ON public.platform_user_roles FOR ALL TO authenticated USING (public.has_platform_role(ARRAY['owner','admin']::public.platform_role[])) WITH CHECK (public.has_platform_role(ARRAY['owner','admin']::public.platform_role[]));
CREATE POLICY "Users submit own guardian consent" ON public.guardian_consents FOR INSERT TO authenticated WITH CHECK (minor_user_id = auth.uid());
CREATE POLICY "Users read own guardian consent" ON public.guardian_consents FOR SELECT TO authenticated USING (minor_user_id = auth.uid() OR public.has_platform_role(ARRAY['owner','admin']::public.platform_role[]));
CREATE POLICY "Owners and admins review guardian consent" ON public.guardian_consents FOR UPDATE TO authenticated USING (public.has_platform_role(ARRAY['owner','admin']::public.platform_role[])) WITH CHECK (public.has_platform_role(ARRAY['owner','admin']::public.platform_role[]));
CREATE POLICY "Active communities are public" ON public.communities FOR SELECT USING (status = 'active' OR created_by = auth.uid() OR public.has_platform_role(ARRAY['owner','admin','moderator']::public.platform_role[]));
CREATE POLICY "Community managers update community" ON public.communities FOR UPDATE TO authenticated USING (public.is_community_manager(id)) WITH CHECK (public.is_community_manager(id));
CREATE POLICY "Users read relevant memberships" ON public.community_members FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_community_manager(community_id) OR public.has_platform_role(ARRAY['moderator']::public.platform_role[]));
CREATE POLICY "Users request membership" ON public.community_members FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND role = 'member' AND status = 'pending');
CREATE POLICY "Trusted users manage memberships" ON public.community_members FOR UPDATE TO authenticated USING (public.is_community_manager(community_id) OR public.has_platform_role(ARRAY['moderator']::public.platform_role[])) WITH CHECK (public.is_community_manager(community_id) OR public.has_platform_role(ARRAY['moderator']::public.platform_role[]));
CREATE POLICY "Active members read groups" ON public.community_groups FOR SELECT TO authenticated USING (public.is_active_community_member(community_id) OR public.has_platform_role(ARRAY['owner','admin','moderator']::public.platform_role[]));
CREATE POLICY "Active members create groups" ON public.community_groups FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid() AND public.is_active_community_member(community_id));
CREATE POLICY "Group creators and managers update groups" ON public.community_groups FOR UPDATE TO authenticated USING (created_by = auth.uid() OR public.is_community_manager(community_id));
CREATE POLICY "Group members read membership" ON public.group_members FOR SELECT TO authenticated USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.community_groups g WHERE g.id = group_id AND public.is_community_manager(g.community_id)));
CREATE POLICY "Public reads events of active communities" ON public.community_events FOR SELECT USING (EXISTS (SELECT 1 FROM public.communities c WHERE c.id = community_id AND c.status = 'active'));
CREATE POLICY "Managers create events" ON public.community_events FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid() AND public.is_community_manager(community_id));
CREATE POLICY "Managers update events" ON public.community_events FOR UPDATE TO authenticated USING (public.is_community_manager(community_id));
CREATE POLICY "Trusted users read recent audit" ON public.audit_logs FOR SELECT TO authenticated USING (public.has_platform_role(ARRAY['owner','admin']::public.platform_role[]) OR (actor_id = auth.uid() AND created_at > now() - interval '3 months'));

DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
CREATE TRIGGER profiles_set_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS private_data_set_updated_at ON public.profile_private_data;
CREATE TRIGGER private_data_set_updated_at BEFORE UPDATE ON public.profile_private_data FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS communities_set_updated_at ON public.communities;
CREATE TRIGGER communities_set_updated_at BEFORE UPDATE ON public.communities FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS members_set_updated_at ON public.community_members;
CREATE TRIGGER members_set_updated_at BEFORE UPDATE ON public.community_members FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS groups_set_updated_at ON public.community_groups;
CREATE TRIGGER groups_set_updated_at BEFORE UPDATE ON public.community_groups FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS events_set_updated_at ON public.community_events;
CREATE TRIGGER events_set_updated_at BEFORE UPDATE ON public.community_events FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

REVOKE ALL ON FUNCTION public.has_platform_role(public.platform_role[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_active_community_member(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_community_manager(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_community(text, text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.complete_registration(text, text, text, text, text, text, date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_platform_role(public.platform_role[]) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_active_community_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_community_manager(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_community(text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_registration(text, text, text, text, text, text, date) TO authenticated;

REVOKE ALL ON public.profile_private_data FROM anon;
REVOKE ALL ON public.platform_user_roles FROM anon;
REVOKE ALL ON public.guardian_consents FROM anon;
REVOKE ALL ON public.community_members FROM anon;
REVOKE ALL ON public.community_groups FROM anon;
REVOKE ALL ON public.group_members FROM anon;
REVOKE ALL ON public.audit_logs FROM anon;
GRANT SELECT ON public.profiles, public.communities, public.community_events TO anon;
GRANT SELECT ON public.profiles, public.profile_private_data TO authenticated;
GRANT UPDATE (username, display_name, avatar_url) ON public.profiles TO authenticated;
GRANT SELECT ON public.platform_user_roles, public.guardian_consents, public.communities, public.community_members, public.community_groups, public.group_members, public.community_events, public.audit_logs TO authenticated;
GRANT INSERT, UPDATE ON public.guardian_consents, public.community_members, public.community_groups, public.community_events TO authenticated;

-- A limpeza física dos audit_logs com mais de três meses deve ser agendada
-- somente após confirmar a disponibilidade do pg_cron no projeto remoto.
