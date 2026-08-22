-- Sugestões colaborativas de orações

CREATE TABLE IF NOT EXISTS public.prayer_suggestions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    text text NOT NULL,
    revised_title text,
    revised_text text,
    status text NOT NULL DEFAULT 'pending',
    device_id uuid NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    reviewed_at timestamptz,
    published_at timestamptz,
    rejected_at timestamptz,
    reviewed_by uuid REFERENCES auth.users(id),
    published_by uuid REFERENCES auth.users(id),
    rejected_by uuid REFERENCES auth.users(id),
    CONSTRAINT prayer_suggestions_title_length
        CHECK (length(btrim(title)) BETWEEN 1 AND 100),
    CONSTRAINT prayer_suggestions_text_length
        CHECK (length(btrim(text)) BETWEEN 1 AND 5000),
    CONSTRAINT prayer_suggestions_revised_title_length
        CHECK (
            revised_title IS NULL
            OR length(btrim(revised_title)) BETWEEN 1 AND 100
        ),
    CONSTRAINT prayer_suggestions_revised_text_length
        CHECK (
            revised_text IS NULL
            OR length(btrim(revised_text)) BETWEEN 1 AND 5000
        ),
    CONSTRAINT prayer_suggestions_status_valid
        CHECK (status IN ('pending', 'reviewed', 'published', 'rejected')),
    CONSTRAINT prayer_suggestions_reviewed_content
        CHECK (
            status = 'pending'
            OR status = 'rejected'
            OR (revised_title IS NOT NULL AND revised_text IS NOT NULL)
        )
);

CREATE INDEX IF NOT EXISTS idx_prayer_suggestions_status_created
ON public.prayer_suggestions (status, created_at);

CREATE INDEX IF NOT EXISTS idx_prayer_suggestions_device_created
ON public.prayer_suggestions (device_id, created_at DESC);

ALTER TABLE public.prayer_suggestions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Moderators can read prayer suggestions"
ON public.prayer_suggestions;

CREATE POLICY "Moderators can read prayer suggestions"
ON public.prayer_suggestions
FOR SELECT
TO authenticated
USING (true);

REVOKE ALL ON public.prayer_suggestions FROM anon;
GRANT SELECT ON public.prayer_suggestions TO authenticated;

CREATE OR REPLACE VIEW public.public_prayer_suggestions
WITH (security_invoker = false)
AS
SELECT
    id,
    revised_title AS title,
    revised_text AS text,
    published_at
FROM public.prayer_suggestions
WHERE status = 'published';

REVOKE ALL ON public.public_prayer_suggestions FROM PUBLIC;
GRANT SELECT ON public.public_prayer_suggestions TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.submit_prayer_suggestion(
    p_title text,
    p_text text,
    p_device_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    clean_title text := btrim(p_title);
    clean_text text := btrim(p_text);
    suggestion_id uuid;
BEGIN
    IF clean_title IS NULL OR length(clean_title) NOT BETWEEN 1 AND 100 THEN
        RAISE EXCEPTION 'Título inválido.';
    END IF;

    IF clean_text IS NULL OR length(clean_text) NOT BETWEEN 1 AND 5000 THEN
        RAISE EXCEPTION 'Texto da oração inválido.';
    END IF;

    IF p_device_id IS NULL THEN
        RAISE EXCEPTION 'Dispositivo inválido.';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM public.prayer_suggestions
        WHERE device_id = p_device_id
          AND created_at > now() - interval '1 minute'
    ) THEN
        RAISE EXCEPTION 'Aguarde antes de enviar outra sugestão.';
    END IF;

    INSERT INTO public.prayer_suggestions (
        title,
        text,
        device_id
    )
    VALUES (
        clean_title,
        clean_text,
        p_device_id
    )
    RETURNING id INTO suggestion_id;

    RETURN suggestion_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.save_prayer_suggestion_revision(
    p_suggestion_id uuid,
    p_title text,
    p_text text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    clean_title text := btrim(p_title);
    clean_text text := btrim(p_text);
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Autenticação necessária.';
    END IF;

    IF clean_title IS NULL OR length(clean_title) NOT BETWEEN 1 AND 100 THEN
        RAISE EXCEPTION 'Título inválido.';
    END IF;

    IF clean_text IS NULL OR length(clean_text) NOT BETWEEN 1 AND 5000 THEN
        RAISE EXCEPTION 'Texto da oração inválido.';
    END IF;

    UPDATE public.prayer_suggestions
    SET revised_title = clean_title,
        revised_text = clean_text
    WHERE id = p_suggestion_id
      AND status = 'pending';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Sugestão pendente não encontrada.';
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_prayer_suggestion_reviewed(
    p_suggestion_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Autenticação necessária.';
    END IF;

    UPDATE public.prayer_suggestions
    SET status = 'reviewed',
        reviewed_at = now(),
        reviewed_by = auth.uid()
    WHERE id = p_suggestion_id
      AND status = 'pending'
      AND revised_title IS NOT NULL
      AND revised_text IS NOT NULL;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'A sugestão precisa ter uma revisão salva.';
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.publish_prayer_suggestion(
    p_suggestion_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Autenticação necessária.';
    END IF;

    UPDATE public.prayer_suggestions
    SET status = 'published',
        published_at = now(),
        published_by = auth.uid()
    WHERE id = p_suggestion_id
      AND status = 'reviewed';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Somente sugestões revisadas podem ser publicadas.';
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_prayer_suggestion(
    p_suggestion_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Autenticação necessária.';
    END IF;

    UPDATE public.prayer_suggestions
    SET status = 'rejected',
        rejected_at = now(),
        rejected_by = auth.uid()
    WHERE id = p_suggestion_id
      AND status IN ('pending', 'reviewed');

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Sugestão não disponível para rejeição.';
    END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_prayer_suggestion(text, text, uuid)
FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_prayer_suggestion(text, text, uuid)
TO anon, authenticated;

REVOKE ALL ON FUNCTION public.save_prayer_suggestion_revision(uuid, text, text)
FROM PUBLIC;
REVOKE ALL ON FUNCTION public.mark_prayer_suggestion_reviewed(uuid)
FROM PUBLIC;
REVOKE ALL ON FUNCTION public.publish_prayer_suggestion(uuid)
FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reject_prayer_suggestion(uuid)
FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.save_prayer_suggestion_revision(uuid, text, text)
TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_prayer_suggestion_reviewed(uuid)
TO authenticated;
GRANT EXECUTE ON FUNCTION public.publish_prayer_suggestion(uuid)
TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_prayer_suggestion(uuid)
TO authenticated;
