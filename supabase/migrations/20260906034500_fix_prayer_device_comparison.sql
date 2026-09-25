-- Compatibilidade com a coluna legada prayers.device_id, armazenada como texto.

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
