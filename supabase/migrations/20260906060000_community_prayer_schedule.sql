-- Dias de oração e escolha entre oração compartilhada ou por encontro.

DO $$ BEGIN
    CREATE TYPE public.community_prayer_mode AS ENUM ('shared', 'per_meeting');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.communities
    ADD COLUMN IF NOT EXISTS prayer_days smallint[] NOT NULL DEFAULT ARRAY[0]::smallint[],
    ADD COLUMN IF NOT EXISTS prayer_mode public.community_prayer_mode NOT NULL DEFAULT 'per_meeting',
    ADD COLUMN IF NOT EXISTS shared_prayer_text text;

ALTER TABLE public.communities
DROP CONSTRAINT IF EXISTS communities_prayer_days_valid;

ALTER TABLE public.communities
ADD CONSTRAINT communities_prayer_days_valid CHECK (
    cardinality(prayer_days) BETWEEN 1 AND 7
    AND prayer_days <@ ARRAY[0,1,2,3,4,5,6]::smallint[]
);

CREATE OR REPLACE FUNCTION public.create_scheduled_community(
    p_name text,
    p_slug text,
    p_logo_url text,
    p_cover_image_url text,
    p_meeting_schedule text,
    p_description text,
    p_objective text,
    p_community_rules text,
    p_meeting_count integer,
    p_prayer_days smallint[],
    p_prayer_mode public.community_prayer_mode,
    p_shared_prayer_text text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE new_id uuid;
BEGIN
    IF cardinality(p_prayer_days) NOT BETWEEN 1 AND 7
       OR NOT p_prayer_days <@ ARRAY[0,1,2,3,4,5,6]::smallint[] THEN
        RAISE EXCEPTION 'Selecione pelo menos um dia válido para as orações.';
    END IF;
    IF p_prayer_mode = 'shared' AND length(btrim(COALESCE(p_shared_prayer_text, ''))) < 10 THEN
        RAISE EXCEPTION 'Informe a oração que será usada em todos os encontros.';
    END IF;

    new_id := public.create_community_with_meetings(
        p_name, p_slug, p_logo_url, p_cover_image_url, p_meeting_schedule,
        p_description, p_objective, p_community_rules, p_meeting_count
    );

    UPDATE public.communities
    SET prayer_days = p_prayer_days,
        prayer_mode = p_prayer_mode,
        shared_prayer_text = CASE WHEN p_prayer_mode = 'shared' THEN btrim(p_shared_prayer_text) ELSE NULL END
    WHERE id = new_id;
    RETURN new_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_scheduled_community_page(
    p_community_id uuid,
    p_logo_url text,
    p_cover_image_url text,
    p_meeting_schedule text,
    p_description text,
    p_objective text,
    p_community_rules text,
    p_meeting_count integer,
    p_prayer_days smallint[],
    p_prayer_mode public.community_prayer_mode,
    p_shared_prayer_text text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF cardinality(p_prayer_days) NOT BETWEEN 1 AND 7
       OR NOT p_prayer_days <@ ARRAY[0,1,2,3,4,5,6]::smallint[] THEN
        RAISE EXCEPTION 'Selecione pelo menos um dia válido para as orações.';
    END IF;
    IF p_prayer_mode = 'shared' AND length(btrim(COALESCE(p_shared_prayer_text, ''))) < 10 THEN
        RAISE EXCEPTION 'Informe a oração compartilhada.';
    END IF;

    PERFORM public.update_community_page(
        p_community_id, p_logo_url, p_cover_image_url, p_meeting_schedule,
        p_description, p_objective, p_community_rules, p_meeting_count
    );

    UPDATE public.communities
    SET prayer_days = p_prayer_days,
        prayer_mode = p_prayer_mode,
        shared_prayer_text = CASE WHEN p_prayer_mode = 'shared' THEN btrim(p_shared_prayer_text) ELSE NULL END
    WHERE id = p_community_id;
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
DECLARE
    target_community_id uuid;
    target_prayer_mode public.community_prayer_mode;
    common_prayer text;
BEGIN
    SELECT m.community_id, c.prayer_mode, c.shared_prayer_text
    INTO target_community_id, target_prayer_mode, common_prayer
    FROM public.community_meetings m
    JOIN public.communities c ON c.id = m.community_id
    WHERE m.id = p_meeting_id;

    IF target_community_id IS NULL OR NOT public.is_community_manager(target_community_id) THEN
        RAISE EXCEPTION 'Acesso reservado aos responsáveis pela comunidade.' USING ERRCODE = '42501';
    END IF;
    IF length(btrim(COALESCE(p_title, ''))) < 2 OR length(btrim(COALESCE(p_instructions, ''))) < 10 THEN
        RAISE EXCEPTION 'Preencha título e orientação do encontro.';
    END IF;
    IF target_prayer_mode = 'per_meeting' AND length(btrim(COALESCE(p_prayer_text, ''))) < 10 THEN
        RAISE EXCEPTION 'Informe a oração deste encontro.';
    END IF;
    IF target_prayer_mode = 'shared' AND length(btrim(COALESCE(common_prayer, ''))) < 10 THEN
        RAISE EXCEPTION 'A comunidade ainda não possui uma oração compartilhada.';
    END IF;

    UPDATE public.community_meetings
    SET title = btrim(p_title),
        prayer_text = CASE WHEN target_prayer_mode = 'per_meeting' THEN btrim(p_prayer_text) ELSE NULL END,
        instructions = btrim(p_instructions), image_url = NULLIF(btrim(p_image_url), ''),
        status = 'pending', ready_for_review = true, reviewed_by = NULL, reviewed_at = NULL
    WHERE id = p_meeting_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_scheduled_community(text,text,text,text,text,text,text,text,integer,smallint[],public.community_prayer_mode,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_scheduled_community_page(uuid,text,text,text,text,text,text,integer,smallint[],public.community_prayer_mode,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_scheduled_community(text,text,text,text,text,text,text,text,integer,smallint[],public.community_prayer_mode,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_scheduled_community_page(uuid,text,text,text,text,text,text,integer,smallint[],public.community_prayer_mode,text) TO authenticated;
