-- =============================================================
--  Migration: permitir SOBRESCREVER (upsert) arquivos no bucket "media"
--  Rode no Supabase: SQL Editor -> New query -> Run
--
--  Por que: ao EDITAR uma evidência, o app regera o PDF num caminho
--  fixo (<owner>/<evidenceId>/evidencia.pdf) usando upsert. Como o
--  arquivo já existe, o Storage faz um UPDATE em storage.objects — e
--  não havia policy de UPDATE, então o RLS bloqueava com a mensagem
--  "new row violates row-level security policy". Esta policy corrige.
-- =============================================================

drop policy if exists "media_owner_update" on storage.objects;
create policy "media_owner_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
