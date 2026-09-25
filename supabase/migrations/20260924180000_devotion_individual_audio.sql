-- Um roteiro pode associar um áudio privado a cada oração.
ALTER TABLE public.prayer_suggestions
ADD COLUMN IF NOT EXISTS devotion_audio_paths text[] NOT NULL DEFAULT '{}';

CREATE OR REPLACE FUNCTION public.can_read_prayer_audio(object_name text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
    SELECT public.can_moderate() OR EXISTS (
        SELECT 1 FROM public.prayer_suggestions
        WHERE status = 'published'
          AND (audio_path = object_name OR object_name = ANY(devotion_audio_paths))
    );
$$;

CREATE OR REPLACE FUNCTION public.is_unlinked_prayer_audio(object_name text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
    SELECT NOT EXISTS (
        SELECT 1 FROM public.prayer_suggestions
        WHERE audio_path = object_name OR object_name = ANY(devotion_audio_paths)
    );
$$;

DROP FUNCTION IF EXISTS public.submit_prayer_suggestion_with_audio(text,text,uuid,text);
CREATE FUNCTION public.submit_prayer_suggestion_with_audio(
    p_title text,
    p_text text,
    p_device_id uuid,
    p_audio_path text DEFAULT NULL,
    p_devotion_audio_paths text[] DEFAULT '{}'
)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    suggestion_id uuid;
    item text;
BEGIN
    FOREACH item IN ARRAY array_remove(array_prepend(p_audio_path, p_devotion_audio_paths), NULL)
    LOOP
        IF p_device_id IS NULL
           OR split_part(item, '/', 1) <> p_device_id::text
           OR NOT EXISTS (
               SELECT 1 FROM storage.objects
               WHERE bucket_id = 'prayer-audio' AND name = item
           ) THEN
            RAISE EXCEPTION 'Áudio enviado não encontrado.';
        END IF;
    END LOOP;

    suggestion_id := public.submit_prayer_suggestion(p_title, p_text, p_device_id);
    UPDATE public.prayer_suggestions
       SET audio_path = p_audio_path,
           devotion_audio_paths = COALESCE(p_devotion_audio_paths, '{}')
     WHERE id = suggestion_id;
    RETURN suggestion_id;
END;
$$;
REVOKE ALL ON FUNCTION public.submit_prayer_suggestion_with_audio(text,text,uuid,text,text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_prayer_suggestion_with_audio(text,text,uuid,text,text[]) TO anon, authenticated;

CREATE OR REPLACE VIEW public.public_prayer_suggestions AS
SELECT id, revised_title AS title, revised_text AS text, published_at,
       audio_path, devotion_audio_paths
FROM public.prayer_suggestions
WHERE status = 'published';

CREATE OR REPLACE FUNCTION public.publish_prayer_suggestion(p_suggestion_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    PERFORM public.assert_moderator_access();
    IF EXISTS (
        SELECT 1
        FROM public.prayer_suggestions p
        CROSS JOIN LATERAL unnest(array_remove(array_prepend(p.audio_path, p.devotion_audio_paths), NULL)) AS paths(item)
        WHERE p.id = p_suggestion_id
          AND NOT EXISTS (
              SELECT 1 FROM storage.objects o
              WHERE o.bucket_id = 'prayer-audio' AND o.name = paths.item
          )
    ) THEN
        RAISE EXCEPTION 'Todos os áudios precisam estar disponíveis antes da publicação.';
    END IF;
    PERFORM public.publish_prayer_suggestion_unchecked(p_suggestion_id);
END;
$$;

NOTIFY pgrst, 'reload schema';
