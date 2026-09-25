-- Solicitação e revisão manual do consentimento para menores de 16 anos.

CREATE OR REPLACE FUNCTION public.submit_guardian_consent(
    p_guardian_name text,
    p_guardian_email text,
    p_relationship text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE consent_id uuid;
BEGIN
    IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Autenticação necessária.'; END IF;
    IF NOT EXISTS (
        SELECT 1 FROM public.profile_private_data d
        WHERE d.user_id = auth.uid() AND d.guardian_consent_required
    ) THEN
        RAISE EXCEPTION 'Esta conta não exige autorização de responsável.';
    END IF;
    IF length(btrim(p_guardian_name)) < 2 THEN RAISE EXCEPTION 'Nome do responsável obrigatório.'; END IF;
    IF position('@' IN p_guardian_email) <= 1 THEN RAISE EXCEPTION 'E-mail do responsável inválido.'; END IF;
    IF length(btrim(p_relationship)) < 2 THEN RAISE EXCEPTION 'Informe o vínculo com o responsável.'; END IF;

    INSERT INTO public.guardian_consents (
        minor_user_id, guardian_name, guardian_email, relationship, status
    ) VALUES (
        auth.uid(), btrim(p_guardian_name), lower(btrim(p_guardian_email)),
        btrim(p_relationship), 'pending'
    )
    ON CONFLICT (minor_user_id) DO UPDATE SET
        guardian_name = EXCLUDED.guardian_name,
        guardian_email = EXCLUDED.guardian_email,
        relationship = EXCLUDED.relationship,
        status = 'pending',
        reviewed_by = NULL,
        reviewed_at = NULL
    RETURNING id INTO consent_id;

    RETURN consent_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.review_guardian_consent(
    p_consent_id uuid,
    p_approve boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE target_user_id uuid;
BEGIN
    IF NOT public.has_platform_role(ARRAY['owner','admin']::public.platform_role[]) THEN
        RAISE EXCEPTION 'Acesso reservado a proprietários e administradores.' USING ERRCODE = '42501';
    END IF;

    UPDATE public.guardian_consents
    SET status = CASE WHEN p_approve THEN 'approved' ELSE 'rejected' END,
        reviewed_by = auth.uid(),
        reviewed_at = now()
    WHERE id = p_consent_id AND status = 'pending'
    RETURNING minor_user_id INTO target_user_id;

    IF target_user_id IS NULL THEN RAISE EXCEPTION 'Solicitação pendente não encontrada.'; END IF;

    UPDATE public.profile_private_data
    SET account_enabled = p_approve
    WHERE user_id = target_user_id;

    INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id)
    VALUES (
        auth.uid(),
        CASE WHEN p_approve THEN 'guardian_consent_approved' ELSE 'guardian_consent_rejected' END,
        'guardian_consent',
        p_consent_id
    );
END;
$$;

REVOKE ALL ON FUNCTION public.submit_guardian_consent(text,text,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.review_guardian_consent(uuid,boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_guardian_consent(text,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.review_guardian_consent(uuid,boolean) TO authenticated;
