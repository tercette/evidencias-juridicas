-- =============================================================
--  Migration: versão em PDF das evidências
--  Rode no Supabase: SQL Editor -> New query -> Run
--  (só é necessário se você já tinha rodado o schema.sql antes)
-- =============================================================

-- 1) Guarda o caminho do PDF gerado para cada evidência
alter table public.evidences add column if not exists pdf_path text;

-- 1b) Nome original do arquivo, usado na lista de anexos do PDF
alter table public.media_assets add column if not exists filename text;

-- 2) Recria a função de compartilhamento incluindo o pdf_path,
--    para o link público também oferecer o PDF.
create or replace function public.get_shared_archive(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
  v_result jsonb;
begin
  select owner_id into v_owner
  from public.share_links
  where token = p_token and revoked = false
  limit 1;

  if v_owner is null then
    return null;  -- token inválido/revogado
  end if;

  select jsonb_build_object(
    'evidences',
    coalesce(jsonb_agg(e order by e.fact_date desc nulls last, e.created_at desc), '[]'::jsonb)
  )
  into v_result
  from (
    select
      ev.id, ev.title, ev.description, ev.fact_date, ev.pdf_path, ev.created_at,
      coalesce(
        (select jsonb_agg(jsonb_build_object(
            'id', m.id, 'kind', m.kind,
            'storage_path', m.storage_path, 'external_url', m.external_url,
            'mime_type', m.mime_type
         ) order by m.created_at)
         from public.media_assets m where m.evidence_id = ev.id),
        '[]'::jsonb
      ) as media
    from public.evidences ev
    where ev.owner_id = v_owner
  ) e;

  return v_result;
end;
$$;

grant execute on function public.get_shared_archive(text) to anon, authenticated;
