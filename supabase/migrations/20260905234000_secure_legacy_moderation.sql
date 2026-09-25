-- Fecha o acesso de moderação legado para contas autenticadas sem papel confiável.

CREATE OR REPLACE FUNCTION public.can_moderate()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.has_platform_role(
        ARRAY['owner', 'admin', 'moderator']::public.platform_role[]
    );
$$;

DO $$
BEGIN
    IF to_regprocedure('public.approve_prayer_request(uuid)') IS NOT NULL
       AND to_regprocedure('public.approve_prayer_request_unchecked(uuid)') IS NULL THEN
        ALTER FUNCTION public.approve_prayer_request(uuid) RENAME TO approve_prayer_request_unchecked;
    END IF;
    IF to_regprocedure('public.reject_prayer_request(uuid)') IS NOT NULL
       AND to_regprocedure('public.reject_prayer_request_unchecked(uuid)') IS NULL THEN
        ALTER FUNCTION public.reject_prayer_request(uuid) RENAME TO reject_prayer_request_unchecked;
    END IF;
    IF to_regprocedure('public.approve_miracle_request(uuid)') IS NOT NULL
       AND to_regprocedure('public.approve_miracle_request_unchecked(uuid)') IS NULL THEN
        ALTER FUNCTION public.approve_miracle_request(uuid) RENAME TO approve_miracle_request_unchecked;
    END IF;
    IF to_regprocedure('public.reject_miracle_request(uuid)') IS NOT NULL
       AND to_regprocedure('public.reject_miracle_request_unchecked(uuid)') IS NULL THEN
        ALTER FUNCTION public.reject_miracle_request(uuid) RENAME TO reject_miracle_request_unchecked;
    END IF;
    IF to_regprocedure('public.save_prayer_suggestion_revision(uuid,text,text)') IS NOT NULL
       AND to_regprocedure('public.save_prayer_suggestion_revision_unchecked(uuid,text,text)') IS NULL THEN
        ALTER FUNCTION public.save_prayer_suggestion_revision(uuid,text,text) RENAME TO save_prayer_suggestion_revision_unchecked;
    END IF;
    IF to_regprocedure('public.mark_prayer_suggestion_reviewed(uuid)') IS NOT NULL
       AND to_regprocedure('public.mark_prayer_suggestion_reviewed_unchecked(uuid)') IS NULL THEN
        ALTER FUNCTION public.mark_prayer_suggestion_reviewed(uuid) RENAME TO mark_prayer_suggestion_reviewed_unchecked;
    END IF;
    IF to_regprocedure('public.publish_prayer_suggestion(uuid)') IS NOT NULL
       AND to_regprocedure('public.publish_prayer_suggestion_unchecked(uuid)') IS NULL THEN
        ALTER FUNCTION public.publish_prayer_suggestion(uuid) RENAME TO publish_prayer_suggestion_unchecked;
    END IF;
    IF to_regprocedure('public.reject_prayer_suggestion(uuid)') IS NOT NULL
       AND to_regprocedure('public.reject_prayer_suggestion_unchecked(uuid)') IS NULL THEN
        ALTER FUNCTION public.reject_prayer_suggestion(uuid) RENAME TO reject_prayer_suggestion_unchecked;
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.assert_moderator_access()
RETURNS void
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF auth.uid() IS NULL OR NOT public.can_moderate() THEN
        RAISE EXCEPTION 'Acesso reservado à moderação.' USING ERRCODE = '42501';
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.approve_prayer_request(request_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    PERFORM public.assert_moderator_access();
    PERFORM public.approve_prayer_request_unchecked(request_id);
END; $$;

CREATE OR REPLACE FUNCTION public.reject_prayer_request(request_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    PERFORM public.assert_moderator_access();
    PERFORM public.reject_prayer_request_unchecked(request_id);
END; $$;

CREATE OR REPLACE FUNCTION public.approve_miracle_request(request_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    PERFORM public.assert_moderator_access();
    PERFORM public.approve_miracle_request_unchecked(request_id);
END; $$;

CREATE OR REPLACE FUNCTION public.reject_miracle_request(request_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    PERFORM public.assert_moderator_access();
    PERFORM public.reject_miracle_request_unchecked(request_id);
END; $$;

CREATE OR REPLACE FUNCTION public.save_prayer_suggestion_revision(p_suggestion_id uuid, p_title text, p_text text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    PERFORM public.assert_moderator_access();
    PERFORM public.save_prayer_suggestion_revision_unchecked(p_suggestion_id, p_title, p_text);
END; $$;

CREATE OR REPLACE FUNCTION public.mark_prayer_suggestion_reviewed(p_suggestion_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    PERFORM public.assert_moderator_access();
    PERFORM public.mark_prayer_suggestion_reviewed_unchecked(p_suggestion_id);
END; $$;

CREATE OR REPLACE FUNCTION public.publish_prayer_suggestion(p_suggestion_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    PERFORM public.assert_moderator_access();
    PERFORM public.publish_prayer_suggestion_unchecked(p_suggestion_id);
END; $$;

CREATE OR REPLACE FUNCTION public.reject_prayer_suggestion(p_suggestion_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    PERFORM public.assert_moderator_access();
    PERFORM public.reject_prayer_suggestion_unchecked(p_suggestion_id);
END; $$;

REVOKE ALL ON FUNCTION public.can_moderate() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.assert_moderator_access() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_moderate() TO authenticated;

REVOKE ALL ON FUNCTION public.approve_prayer_request_unchecked(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.reject_prayer_request_unchecked(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.approve_miracle_request_unchecked(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.reject_miracle_request_unchecked(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.save_prayer_suggestion_revision_unchecked(uuid,text,text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.mark_prayer_suggestion_reviewed_unchecked(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.publish_prayer_suggestion_unchecked(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.reject_prayer_suggestion_unchecked(uuid) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.approve_prayer_request(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_prayer_request(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_miracle_request(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_miracle_request(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_prayer_suggestion_revision(uuid,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_prayer_suggestion_reviewed(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.publish_prayer_suggestion(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_prayer_suggestion(uuid) TO authenticated;

DROP POLICY IF EXISTS "Authenticated moderation guard" ON public.prayer_suggestions;
CREATE POLICY "Authenticated moderation guard"
ON public.prayer_suggestions AS RESTRICTIVE
FOR SELECT TO authenticated
USING (public.can_moderate());
