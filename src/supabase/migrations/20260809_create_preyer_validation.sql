-- Vox Orantis
-- Sprint 2 — Commit 13
-- Validação e sanitização da RPC create_prayer

ALTER TABLE public.prayers
ADD COLUMN IF NOT EXISTS device_id text;


CREATE OR REPLACE FUNCTION public.create_prayer(
    p_latitude double precision,
    p_longitude double precision,
    p_nickname text DEFAULT NULL::text,
    p_device_id text DEFAULT NULL::text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN

    -- =========================================================
    -- VALIDAÇÕES DE ENTRADA
    -- =========================================================

    IF p_latitude IS NULL
       OR p_latitude < -90
       OR p_latitude > 90
    THEN
        RAISE EXCEPTION
            'Latitude inválida.';
    END IF;


    IF p_longitude IS NULL
       OR p_longitude < -180
       OR p_longitude > 180
    THEN
        RAISE EXCEPTION
            'Longitude inválida.';
    END IF;


    IF p_nickname IS NOT NULL
       AND length(trim(p_nickname)) > 40
    THEN
        RAISE EXCEPTION
            'Nome ou apelido deve ter no máximo 40 caracteres.';
    END IF;


    IF p_device_id IS NULL
       OR trim(p_device_id) = ''
    THEN
        RAISE EXCEPTION
            'Identificador do dispositivo inválido.';
    END IF;


    BEGIN
        PERFORM p_device_id::uuid;
    EXCEPTION
        WHEN invalid_text_representation THEN
            RAISE EXCEPTION
                'Identificador do dispositivo inválido.';
    END;


    -- =========================================================
    -- PROTEÇÃO ANTI-SPAM POR DISPOSITIVO ANÔNIMO
    -- =========================================================

    IF EXISTS (
        SELECT 1
        FROM public.prayers
        WHERE device_id = p_device_id
          AND created_at >= now() - interval '10 seconds'
    ) THEN
        RAISE EXCEPTION
            'Aguarde alguns segundos antes de enviar outra oração.';
    END IF;


    -- =========================================================
    -- SALVA A ORAÇÃO
    -- =========================================================

    INSERT INTO public.prayers (
        latitude,
        longitude,
        nickname,
        device_id
    )
    VALUES (
        p_latitude,
        p_longitude,
        NULLIF(trim(p_nickname), ''),
        p_device_id
    );


    -- =========================================================
    -- ATUALIZA O CONTADOR MUNDIAL
    -- =========================================================

    UPDATE public.stats
    SET
        total_prayers = total_prayers + 1,
        today_prayers = today_prayers + 1,
        updated_at = now()
    WHERE id = 1;

END;
$function$;