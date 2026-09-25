-- Fluxo seguro de criação, entrada e moderação de comunidades.

CREATE OR REPLACE FUNCTION public.create_community(
    p_name text,
    p_slug text,
    p_logo_url text DEFAULT NULL,
    p_meeting_schedule text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE new_id uuid;
BEGIN
    IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Autenticação necessária.'; END IF;
    IF NOT EXISTS (
        SELECT 1
        FROM public.profiles p
        JOIN public.profile_private_data d ON d.user_id = p.id
        WHERE p.id = auth.uid() AND p.profile_completed AND d.account_enabled
    ) THEN
        RAISE EXCEPTION 'Complete e ative seu cadastro antes de criar uma comunidade.';
    END IF;

    INSERT INTO public.communities (name, slug, logo_url, meeting_schedule, created_by)
    VALUES (btrim(p_name), lower(btrim(p_slug)), NULLIF(btrim(p_logo_url), ''), NULLIF(btrim(p_meeting_schedule), ''), auth.uid())
    RETURNING id INTO new_id;

    INSERT INTO public.community_members (community_id, user_id, role, status)
    VALUES (new_id, auth.uid(), 'owner', 'pending');

    INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id)
    VALUES (auth.uid(), 'community_submitted', 'community', new_id);
    RETURN new_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.request_community_membership(p_community_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Autenticação necessária.'; END IF;
    IF NOT EXISTS (
        SELECT 1 FROM public.profile_private_data d
        JOIN public.profiles p ON p.id = d.user_id
        WHERE d.user_id = auth.uid() AND d.account_enabled AND p.profile_completed
    ) THEN
        RAISE EXCEPTION 'Complete e ative seu cadastro antes de participar.';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.communities c WHERE c.id = p_community_id AND c.status = 'active') THEN
        RAISE EXCEPTION 'Comunidade indisponível.';
    END IF;

    INSERT INTO public.community_members (community_id, user_id, role, status)
    VALUES (p_community_id, auth.uid(), 'member', 'pending')
    ON CONFLICT (community_id, user_id) DO UPDATE SET
        status = 'pending', left_at = NULL, updated_at = now()
    WHERE community_members.status IN ('left', 'rejected');
END;
$$;

CREATE OR REPLACE FUNCTION public.review_community(p_community_id uuid, p_approve boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    PERFORM public.assert_moderator_access();

    UPDATE public.communities
    SET status = CASE WHEN p_approve THEN 'active'::public.community_status ELSE 'rejected'::public.community_status END,
        reviewed_by = auth.uid(), reviewed_at = now()
    WHERE id = p_community_id AND status = 'pending';

    IF NOT FOUND THEN RAISE EXCEPTION 'Comunidade pendente não encontrada.'; END IF;

    UPDATE public.community_members
    SET status = CASE WHEN p_approve THEN 'active'::public.membership_status ELSE 'rejected'::public.membership_status END,
        approved_by = auth.uid(), approved_at = now(),
        joined_at = CASE WHEN p_approve THEN now() ELSE NULL END
    WHERE community_id = p_community_id AND role = 'owner';

    INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id)
    VALUES (auth.uid(), CASE WHEN p_approve THEN 'community_approved' ELSE 'community_rejected' END, 'community', p_community_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.review_community_membership(
    p_community_id uuid,
    p_user_id uuid,
    p_approve boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE active_count integer;
BEGIN
    PERFORM public.assert_moderator_access();

    IF p_approve THEN
        SELECT count(*) INTO active_count FROM public.community_members
        WHERE community_id = p_community_id AND status = 'active';
        IF active_count >= 150 THEN RAISE EXCEPTION 'A comunidade atingiu o limite de 150 membros.'; END IF;
    END IF;

    UPDATE public.community_members
    SET status = CASE WHEN p_approve THEN 'active'::public.membership_status ELSE 'rejected'::public.membership_status END,
        approved_by = auth.uid(), approved_at = now(),
        joined_at = CASE WHEN p_approve THEN now() ELSE joined_at END
    WHERE community_id = p_community_id AND user_id = p_user_id AND status = 'pending';

    IF NOT FOUND THEN RAISE EXCEPTION 'Solicitação pendente não encontrada.'; END IF;

    INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
    VALUES (
        auth.uid(),
        CASE WHEN p_approve THEN 'membership_approved' ELSE 'membership_rejected' END,
        'community', p_community_id, jsonb_build_object('user_id', p_user_id)
    );
END;
$$;

REVOKE ALL ON FUNCTION public.request_community_membership(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.review_community(uuid,boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.review_community_membership(uuid,uuid,boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.request_community_membership(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.review_community(uuid,boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.review_community_membership(uuid,uuid,boolean) TO authenticated;
