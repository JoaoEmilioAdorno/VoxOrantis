-- Áudios ficam privados até a publicação da oração; moderadores podem ouvi-los.
ALTER TABLE public.prayer_suggestions ADD COLUMN audio_path text UNIQUE;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('prayer-audio', 'prayer-audio', false, 20971520,
    ARRAY['audio/mpeg','audio/mp4','audio/wav','audio/ogg','audio/webm','audio/aac']);

CREATE FUNCTION public.can_read_prayer_audio(object_name text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
    SELECT public.can_moderate() OR EXISTS (
        SELECT 1 FROM public.prayer_suggestions
        WHERE audio_path = object_name AND status = 'published'
    );
$$;
CREATE FUNCTION public.is_unlinked_prayer_audio(object_name text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
    SELECT NOT EXISTS (SELECT 1 FROM public.prayer_suggestions WHERE audio_path = object_name);
$$;
REVOKE ALL ON FUNCTION public.can_read_prayer_audio(text), public.is_unlinked_prayer_audio(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_read_prayer_audio(text), public.is_unlinked_prayer_audio(text) TO anon, authenticated;

CREATE POLICY "Submit immutable prayer audio" ON storage.objects
FOR INSERT TO anon, authenticated WITH CHECK (
    bucket_id = 'prayer-audio'
    AND name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(mp3|m4a|mp4|wav|ogg|webm|aac)$'
);
CREATE POLICY "Read approved prayer audio or moderate" ON storage.objects
FOR SELECT TO anon, authenticated USING (
    bucket_id = 'prayer-audio' AND public.can_read_prayer_audio(name)
);
CREATE POLICY "Remove unlinked prayer uploads" ON storage.objects
FOR DELETE TO anon, authenticated USING (
    bucket_id = 'prayer-audio' AND public.is_unlinked_prayer_audio(name)
);

CREATE FUNCTION public.submit_prayer_suggestion_with_audio(
    p_title text, p_text text, p_device_id uuid, p_audio_path text DEFAULT NULL
)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE suggestion_id uuid;
BEGIN
    IF p_audio_path IS NOT NULL THEN
        IF p_device_id IS NULL
           OR split_part(p_audio_path, '/', 1) <> p_device_id::text
           OR NOT EXISTS (
               SELECT 1 FROM storage.objects
               WHERE bucket_id = 'prayer-audio' AND name = p_audio_path
           ) THEN
            RAISE EXCEPTION 'Áudio enviado não encontrado.';
        END IF;
    END IF;
    suggestion_id := public.submit_prayer_suggestion(p_title, p_text, p_device_id);
    UPDATE public.prayer_suggestions SET audio_path = p_audio_path WHERE id = suggestion_id;
    RETURN suggestion_id;
END;
$$;
REVOKE ALL ON FUNCTION public.submit_prayer_suggestion_with_audio(text,text,uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_prayer_suggestion_with_audio(text,text,uuid,text) TO anon, authenticated;

CREATE OR REPLACE VIEW public.public_prayer_suggestions AS
SELECT id, revised_title AS title, revised_text AS text, published_at, audio_path
FROM public.prayer_suggestions WHERE status = 'published';

CREATE OR REPLACE FUNCTION public.publish_prayer_suggestion(p_suggestion_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    PERFORM public.assert_moderator_access();
    IF EXISTS (
        SELECT 1 FROM public.prayer_suggestions p
        WHERE p.id = p_suggestion_id AND p.audio_path IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM storage.objects o WHERE o.bucket_id = 'prayer-audio' AND o.name = p.audio_path)
    ) THEN
        RAISE EXCEPTION 'O áudio precisa estar disponível antes da publicação.';
    END IF;
    PERFORM public.publish_prayer_suggestion_unchecked(p_suggestion_id);
END;
$$;
NOTIFY pgrst, 'reload schema';
