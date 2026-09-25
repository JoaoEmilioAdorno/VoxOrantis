-- Vínculo opcional de orações com comunidades e cores públicas no globo.

ALTER TABLE public.communities
ADD COLUMN IF NOT EXISTS color text NOT NULL DEFAULT '#FFD700';

ALTER TABLE public.communities
DROP CONSTRAINT IF EXISTS communities_color_format;

ALTER TABLE public.communities
ADD CONSTRAINT communities_color_format CHECK (color ~ '^#[0-9A-Fa-f]{6}$');

UPDATE public.communities
SET color = (ARRAY['#FACC15','#38BDF8','#A78BFA','#FB7185','#34D399','#FB923C','#E879F9','#60A5FA'])[
    1 + (ascii(substr(md5(lower(slug::text)), 1, 1)) % 8)
]
WHERE color = '#FFD700';

ALTER TABLE public.prayers
ADD COLUMN IF NOT EXISTS community_id uuid REFERENCES public.communities(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_prayers_community_expires
ON public.prayers(community_id, expires_at DESC);

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

    selected_color := palette[1 + (ascii(substr(md5(lower(btrim(p_slug))), 1, 1)) % array_length(palette, 1))];

    INSERT INTO public.communities(name, slug, logo_url, meeting_schedule, color, created_by)
    VALUES (btrim(p_name), lower(btrim(p_slug)), NULLIF(btrim(p_logo_url), ''), NULLIF(btrim(p_meeting_schedule), ''), selected_color, auth.uid())
    RETURNING id INTO new_id;

    INSERT INTO public.community_members(community_id, user_id, role, status)
    VALUES (new_id, auth.uid(), 'owner', 'pending');

    INSERT INTO public.audit_logs(actor_id, action, entity_type, entity_id)
    VALUES (auth.uid(), 'community_submitted', 'community', new_id);
    RETURN new_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.attach_prayer_to_community(
    p_prayer_id uuid,
    p_community_id uuid,
    p_device_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF auth.uid() IS NULL OR NOT public.is_active_community_member(p_community_id) THEN
        RAISE EXCEPTION 'Participação aprovada necessária.' USING ERRCODE = '42501';
    END IF;

    UPDATE public.prayers
    SET community_id = p_community_id, created_by = auth.uid()
    WHERE id = p_prayer_id
      AND device_id = p_device_id::text
      AND community_id IS NULL
      AND created_at > now() - interval '2 minutes';

    IF NOT FOUND THEN RAISE EXCEPTION 'Oração recente não encontrada.'; END IF;
END;
$$;

CREATE OR REPLACE VIEW public.public_active_prayers
WITH (security_invoker = true)
AS
SELECT
    p.id,
    p.latitude,
    p.longitude,
    p.created_at,
    p.expires_at,
    p.community_id,
    c.name AS community_name,
    COALESCE(c.color, '#FFD700') AS community_color
FROM public.prayers p
LEFT JOIN public.communities c
    ON c.id = p.community_id AND c.status = 'active'
WHERE p.expires_at > now();

GRANT SELECT ON public.public_active_prayers TO anon, authenticated;
GRANT SELECT (community_id) ON public.prayers TO anon, authenticated;
REVOKE ALL ON FUNCTION public.attach_prayer_to_community(uuid,uuid,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.attach_prayer_to_community(uuid,uuid,uuid) TO authenticated;
