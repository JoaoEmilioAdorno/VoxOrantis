-- Corrige a atribuição do enum no fluxo de revisão do responsável.

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
    SET status = CASE
            WHEN p_approve THEN 'approved'::public.consent_status
            ELSE 'rejected'::public.consent_status
        END,
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
