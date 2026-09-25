-- Grupos e agenda comunitária com publicação após moderação universal.

DO $$ BEGIN
    CREATE TYPE public.review_status AS ENUM ('pending', 'approved', 'rejected', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE public.community_event_type AS ENUM ('event', 'novena');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.community_groups
    ADD COLUMN IF NOT EXISTS status public.review_status NOT NULL DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

ALTER TABLE public.community_events
    ADD COLUMN IF NOT EXISTS event_type public.community_event_type NOT NULL DEFAULT 'event',
    ADD COLUMN IF NOT EXISTS status public.review_status NOT NULL DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_groups_status_created
ON public.community_groups(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_events_status_start
ON public.community_events(status, starts_at);

CREATE OR REPLACE FUNCTION public.create_community_group(
    p_community_id uuid,
    p_name text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE new_id uuid;
BEGIN
    IF NOT public.is_active_community_member(p_community_id) THEN
        RAISE EXCEPTION 'Somente membros aprovados podem criar grupos.' USING ERRCODE = '42501';
    END IF;

    INSERT INTO public.community_groups(community_id, name, created_by, status)
    VALUES (p_community_id, btrim(p_name), auth.uid(), 'pending')
    RETURNING id INTO new_id;

    INSERT INTO public.group_members(group_id, user_id)
    VALUES (new_id, auth.uid());

    INSERT INTO public.audit_logs(actor_id, action, entity_type, entity_id)
    VALUES (auth.uid(), 'community_group_submitted', 'community_group', new_id);
    RETURN new_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_community_event(
    p_community_id uuid,
    p_group_id uuid,
    p_title text,
    p_description text,
    p_starts_at timestamptz,
    p_ends_at timestamptz,
    p_location_or_url text,
    p_event_type public.community_event_type,
    p_recurrence_rule text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE new_id uuid;
BEGIN
    IF NOT public.is_community_manager(p_community_id) THEN
        RAISE EXCEPTION 'Somente responsáveis pela comunidade podem criar eventos.' USING ERRCODE = '42501';
    END IF;
    IF p_group_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM public.community_groups g
        WHERE g.id = p_group_id AND g.community_id = p_community_id AND g.status = 'approved'
    ) THEN
        RAISE EXCEPTION 'Grupo inválido para esta comunidade.';
    END IF;
    IF p_event_type = 'novena' AND p_ends_at IS NULL THEN
        RAISE EXCEPTION 'Informe o encerramento da novena.';
    END IF;

    INSERT INTO public.community_events(
        community_id, group_id, title, description, starts_at, ends_at,
        location_or_url, event_type, recurrence_rule, created_by, status
    ) VALUES (
        p_community_id, p_group_id, btrim(p_title), NULLIF(btrim(p_description), ''),
        p_starts_at, p_ends_at, NULLIF(btrim(p_location_or_url), ''),
        p_event_type, CASE WHEN p_event_type = 'novena' THEN 'FREQ=DAILY' ELSE NULLIF(btrim(p_recurrence_rule), '') END,
        auth.uid(), 'pending'
    ) RETURNING id INTO new_id;

    INSERT INTO public.audit_logs(actor_id, action, entity_type, entity_id)
    VALUES (auth.uid(), 'community_event_submitted', 'community_event', new_id);
    RETURN new_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.review_community_group(p_group_id uuid, p_approve boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    PERFORM public.assert_moderator_access();
    UPDATE public.community_groups
    SET status = CASE WHEN p_approve THEN 'approved'::public.review_status ELSE 'rejected'::public.review_status END,
        reviewed_by = auth.uid(), reviewed_at = now()
    WHERE id = p_group_id AND status = 'pending';
    IF NOT FOUND THEN RAISE EXCEPTION 'Grupo pendente não encontrado.'; END IF;
    INSERT INTO public.audit_logs(actor_id, action, entity_type, entity_id)
    VALUES (auth.uid(), CASE WHEN p_approve THEN 'community_group_approved' ELSE 'community_group_rejected' END, 'community_group', p_group_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.review_community_event(p_event_id uuid, p_approve boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    PERFORM public.assert_moderator_access();
    UPDATE public.community_events
    SET status = CASE WHEN p_approve THEN 'approved'::public.review_status ELSE 'rejected'::public.review_status END,
        reviewed_by = auth.uid(), reviewed_at = now()
    WHERE id = p_event_id AND status = 'pending';
    IF NOT FOUND THEN RAISE EXCEPTION 'Evento pendente não encontrado.'; END IF;
    INSERT INTO public.audit_logs(actor_id, action, entity_type, entity_id)
    VALUES (auth.uid(), CASE WHEN p_approve THEN 'community_event_approved' ELSE 'community_event_rejected' END, 'community_event', p_event_id);
END;
$$;

DROP POLICY IF EXISTS "Active members read groups" ON public.community_groups;
DROP POLICY IF EXISTS "Active members create groups" ON public.community_groups;
DROP POLICY IF EXISTS "Group creators and managers update groups" ON public.community_groups;
DROP POLICY IF EXISTS "Public reads events of active communities" ON public.community_events;
DROP POLICY IF EXISTS "Managers create events" ON public.community_events;
DROP POLICY IF EXISTS "Managers update events" ON public.community_events;

CREATE POLICY "Approved groups are public"
ON public.community_groups FOR SELECT
USING (
    status = 'approved'
    OR created_by = auth.uid()
    OR public.can_moderate()
    OR public.is_community_manager(community_id)
);

CREATE POLICY "Approved events are public"
ON public.community_events FOR SELECT
USING (
    status = 'approved'
    OR created_by = auth.uid()
    OR public.can_moderate()
    OR public.is_community_manager(community_id)
);

REVOKE ALL ON FUNCTION public.create_community_group(uuid,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_community_event(uuid,uuid,text,text,timestamptz,timestamptz,text,public.community_event_type,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.review_community_group(uuid,boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.review_community_event(uuid,boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_community_group(uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_community_event(uuid,uuid,text,text,timestamptz,timestamptz,text,public.community_event_type,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.review_community_group(uuid,boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.review_community_event(uuid,boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_moderate() TO anon;
GRANT EXECUTE ON FUNCTION public.is_community_manager(uuid) TO anon;
