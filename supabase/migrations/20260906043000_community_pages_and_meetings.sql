-- Página completa da comunidade e espaços numerados para encontros.

ALTER TABLE public.communities
    ADD COLUMN IF NOT EXISTS description text,
    ADD COLUMN IF NOT EXISTS objective text,
    ADD COLUMN IF NOT EXISTS community_rules text,
    ADD COLUMN IF NOT EXISTS cover_image_url text,
    ADD COLUMN IF NOT EXISTS meeting_count integer NOT NULL DEFAULT 1;

ALTER TABLE public.communities
DROP CONSTRAINT IF EXISTS communities_meeting_count_valid;

ALTER TABLE public.communities
ADD CONSTRAINT communities_meeting_count_valid CHECK (meeting_count BETWEEN 1 AND 365);

CREATE TABLE IF NOT EXISTS public.community_meetings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id uuid NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
    meeting_number integer NOT NULL,
    title text,
    prayer_text text,
    instructions text,
    image_url text,
    status public.review_status NOT NULL DEFAULT 'pending',
    ready_for_review boolean NOT NULL DEFAULT false,
    created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    reviewed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(community_id, meeting_number),
    CONSTRAINT community_meeting_number_positive CHECK (meeting_number > 0),
    CONSTRAINT community_meeting_title_length CHECK (title IS NULL OR length(btrim(title)) BETWEEN 2 AND 150)
);

CREATE INDEX IF NOT EXISTS idx_community_meetings_order
ON public.community_meetings(community_id, meeting_number);

CREATE INDEX IF NOT EXISTS idx_community_meetings_review
ON public.community_meetings(status, ready_for_review, created_at);

ALTER TABLE public.community_meetings ENABLE ROW LEVEL SECURITY;

INSERT INTO public.community_meetings(community_id, meeting_number, created_by)
SELECT c.id, 1, c.created_by
FROM public.communities c
WHERE NOT EXISTS (
    SELECT 1 FROM public.community_meetings m WHERE m.community_id = c.id
);

CREATE POLICY "Published meetings are public"
ON public.community_meetings FOR SELECT
USING (
    status = 'approved'
    OR created_by = auth.uid()
    OR public.is_community_manager(community_id)
    OR public.can_moderate()
);

GRANT SELECT ON public.community_meetings TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.create_community_with_meetings(
    p_name text,
    p_slug text,
    p_logo_url text,
    p_cover_image_url text,
    p_meeting_schedule text,
    p_description text,
    p_objective text,
    p_community_rules text,
    p_meeting_count integer
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_id uuid;
    palette text[] := ARRAY['#FACC15','#38BDF8','#A78BFA','#FB7185','#34D399','#FB923C','#E879F9','#60A5FA'];
    selected_color text;
BEGIN
    IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Autenticação necessária.'; END IF;
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles p
        JOIN public.profile_private_data d ON d.user_id = p.id
        WHERE p.id = auth.uid() AND p.profile_completed AND d.account_enabled
    ) THEN
        RAISE EXCEPTION 'Complete e ative seu cadastro antes de criar uma comunidade.';
    END IF;
    IF p_meeting_count NOT BETWEEN 1 AND 365 THEN RAISE EXCEPTION 'Informe entre 1 e 365 encontros.'; END IF;
    IF length(btrim(p_description)) < 20 THEN RAISE EXCEPTION 'Inclua uma descrição mais completa.'; END IF;
    IF length(btrim(p_objective)) < 10 THEN RAISE EXCEPTION 'Informe o objetivo da comunidade.'; END IF;
    IF length(btrim(p_community_rules)) < 10 THEN RAISE EXCEPTION 'Informe as regras dos encontros.'; END IF;

    selected_color := palette[1 + (ascii(substr(md5(lower(btrim(p_slug))), 1, 1)) % array_length(palette, 1))];

    INSERT INTO public.communities(
        name, slug, logo_url, cover_image_url, meeting_schedule, description,
        objective, community_rules, meeting_count, color, created_by
    ) VALUES (
        btrim(p_name), lower(btrim(p_slug)), NULLIF(btrim(p_logo_url), ''),
        NULLIF(btrim(p_cover_image_url), ''), NULLIF(btrim(p_meeting_schedule), ''),
        btrim(p_description), btrim(p_objective), btrim(p_community_rules),
        p_meeting_count, selected_color, auth.uid()
    ) RETURNING id INTO new_id;

    INSERT INTO public.community_members(community_id, user_id, role, status)
    VALUES (new_id, auth.uid(), 'owner', 'pending');

    INSERT INTO public.community_meetings(community_id, meeting_number, created_by)
    SELECT new_id, number, auth.uid()
    FROM generate_series(1, p_meeting_count) AS number;

    INSERT INTO public.audit_logs(actor_id, action, entity_type, entity_id, metadata)
    VALUES (auth.uid(), 'community_submitted', 'community', new_id, jsonb_build_object('meeting_count', p_meeting_count));
    RETURN new_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.save_community_meeting(
    p_meeting_id uuid,
    p_title text,
    p_prayer_text text,
    p_instructions text,
    p_image_url text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE target_community_id uuid;
BEGIN
    SELECT community_id INTO target_community_id
    FROM public.community_meetings WHERE id = p_meeting_id;
    IF target_community_id IS NULL OR NOT public.is_community_manager(target_community_id) THEN
        RAISE EXCEPTION 'Acesso reservado aos responsáveis pela comunidade.' USING ERRCODE = '42501';
    END IF;
    IF length(btrim(p_title)) < 2 OR length(btrim(p_prayer_text)) < 10 OR length(btrim(p_instructions)) < 10 THEN
        RAISE EXCEPTION 'Preencha título, oração e orientação do encontro.';
    END IF;

    UPDATE public.community_meetings
    SET title = btrim(p_title), prayer_text = btrim(p_prayer_text),
        instructions = btrim(p_instructions), image_url = NULLIF(btrim(p_image_url), ''),
        status = 'pending', ready_for_review = true, reviewed_by = NULL, reviewed_at = NULL
    WHERE id = p_meeting_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.review_community_meeting(p_meeting_id uuid, p_approve boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    PERFORM public.assert_moderator_access();
    UPDATE public.community_meetings
    SET status = CASE WHEN p_approve THEN 'approved'::public.review_status ELSE 'rejected'::public.review_status END,
        ready_for_review = false, reviewed_by = auth.uid(), reviewed_at = now()
    WHERE id = p_meeting_id AND status = 'pending' AND ready_for_review;
    IF NOT FOUND THEN RAISE EXCEPTION 'Encontro pendente não encontrado.'; END IF;
    INSERT INTO public.audit_logs(actor_id, action, entity_type, entity_id)
    VALUES (auth.uid(), CASE WHEN p_approve THEN 'community_meeting_approved' ELSE 'community_meeting_rejected' END, 'community_meeting', p_meeting_id);
END;
$$;

DROP TRIGGER IF EXISTS community_meetings_set_updated_at ON public.community_meetings;
CREATE TRIGGER community_meetings_set_updated_at
BEFORE UPDATE ON public.community_meetings
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

REVOKE ALL ON FUNCTION public.create_community_with_meetings(text,text,text,text,text,text,text,text,integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.save_community_meeting(uuid,text,text,text,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.review_community_meeting(uuid,boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_community_with_meetings(text,text,text,text,text,text,text,text,integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_community_meeting(uuid,text,text,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.review_community_meeting(uuid,boolean) TO authenticated;
