BEGIN;
DO $$ BEGIN
  IF has_function_privilege('anon', 'public.delete_published_prayer(uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'Visitantes não podem excluir orações';
  END IF;
END $$;
SELECT set_config('test.prayer_id', public.submit_prayer_suggestion('Teste de exclusão', 'Registro temporário para validar a exclusão.', gen_random_uuid())::text, true);
UPDATE public.prayer_suggestions SET status='published', revised_title=title, revised_text=text,
  published_at=now(), audio_path='test/delete-prayer.mp3'
WHERE id=current_setting('test.prayer_id')::uuid;
SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000000',true);
SET LOCAL ROLE authenticated;
DO $$ BEGIN
  BEGIN
    PERFORM public.delete_published_prayer(current_setting('test.prayer_id')::uuid);
    RAISE EXCEPTION 'Conta comum conseguiu excluir';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END $$;
RESET ROLE;
SELECT set_config('request.jwt.claim.sub',(SELECT user_id::text FROM public.moderators LIMIT 1),true);
SET LOCAL ROLE authenticated;
DO $$ BEGIN
  IF public.delete_published_prayer(current_setting('test.prayer_id')::uuid) IS DISTINCT FROM 'test/delete-prayer.mp3' THEN
    RAISE EXCEPTION 'Referência do áudio não retornada para limpeza';
  END IF;
  IF EXISTS (SELECT 1 FROM public.prayer_suggestions WHERE id=current_setting('test.prayer_id')::uuid) THEN
    RAISE EXCEPTION 'A oração não foi excluída';
  END IF;
  IF EXISTS (SELECT 1 FROM public.public_prayer_suggestions WHERE id=current_setting('test.prayer_id')::uuid) THEN
    RAISE EXCEPTION 'A oração ainda está publicada';
  END IF;
END $$;
ROLLBACK;
SELECT 'Autorização, exclusão e retirada da biblioteca: OK' AS result;
