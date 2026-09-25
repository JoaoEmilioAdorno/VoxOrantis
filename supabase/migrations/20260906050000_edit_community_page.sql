-- Edição da apresentação e redimensionamento seguro dos encontros.

CREATE OR REPLACE FUNCTION public.update_community_page(
    p_community_id uuid,
    p_logo_url text,
    p_cover_image_url text,
    p_meeting_schedule text,
    p_description text,
    p_objective text,
    p_community_rules text,
    p_meeting_count integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE old_count integer;
BEGIN
    IF NOT public.is_community_manager(p_community_id) THEN
        RAISE EXCEPTION 'Acesso reservado aos responsáveis pela comunidade.' USING ERRCODE = '42501';
    END IF;
    IF p_meeting_count NOT BETWEEN 1 AND 365 THEN RAISE EXCEPTION 'Informe entre 1 e 365 encontros.'; END IF;
    IF length(btrim(p_description)) < 20 OR length(btrim(p_objective)) < 10 OR length(btrim(p_community_rules)) < 10 THEN
        RAISE EXCEPTION 'Preencha a descrição, o objetivo e as regras.';
    END IF;

    SELECT meeting_count INTO old_count FROM public.communities WHERE id = p_community_id FOR UPDATE;
    IF old_count IS NULL THEN RAISE EXCEPTION 'Comunidade não encontrada.'; END IF;

    IF p_meeting_count < old_count AND EXISTS (
        SELECT 1 FROM public.community_meetings
        WHERE community_id = p_community_id
          AND meeting_number > p_meeting_count
          AND (title IS NOT NULL OR prayer_text IS NOT NULL OR instructions IS NOT NULL OR image_url IS NOT NULL)
    ) THEN
        RAISE EXCEPTION 'Não é possível remover encontros que já possuem conteúdo.';
    END IF;

    UPDATE public.communities
    SET logo_url = NULLIF(btrim(p_logo_url), ''),
        cover_image_url = NULLIF(btrim(p_cover_image_url), ''),
        meeting_schedule = NULLIF(btrim(p_meeting_schedule), ''),
        description = btrim(p_description), objective = btrim(p_objective),
        community_rules = btrim(p_community_rules), meeting_count = p_meeting_count
    WHERE id = p_community_id;

    IF p_meeting_count > old_count THEN
        INSERT INTO public.community_meetings(community_id, meeting_number, created_by)
        SELECT p_community_id, number, auth.uid()
        FROM generate_series(old_count + 1, p_meeting_count) AS number;
    ELSIF p_meeting_count < old_count THEN
        DELETE FROM public.community_meetings
        WHERE community_id = p_community_id AND meeting_number > p_meeting_count;
    END IF;

    INSERT INTO public.audit_logs(actor_id, action, entity_type, entity_id, metadata)
    VALUES (auth.uid(), 'community_page_updated', 'community', p_community_id, jsonb_build_object('meeting_count', p_meeting_count));
END;
$$;

REVOKE ALL ON FUNCTION public.update_community_page(uuid,text,text,text,text,text,text,integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_community_page(uuid,text,text,text,text,text,text,integer) TO authenticated;
