CREATE FUNCTION public.delete_published_prayer(p_suggestion_id uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE deleted_audio text;
BEGIN
    PERFORM public.assert_moderator_access();
    DELETE FROM public.prayer_suggestions
    WHERE id = p_suggestion_id AND status = 'published'
    RETURNING audio_path INTO deleted_audio;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Oração publicada não encontrada.';
    END IF;
    RETURN deleted_audio;
END;
$$;
REVOKE ALL ON FUNCTION public.delete_published_prayer(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_published_prayer(uuid) TO authenticated;
NOTIFY pgrst, 'reload schema';
