-- =============================================================
--  Arquivo de Evidências Jurídicas — Schema + Segurança (RLS)
--  Rode este script no Supabase:  SQL Editor -> New query -> Run
-- =============================================================

-- Extensão para gerar tokens/UUID
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------------
-- Tabela: evidences  (cada item do arquivo de evidências)
-- ------------------------------------------------------------------
create table if not exists public.evidences (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users (id) on delete cascade,
  title       text not null,
  description text,
  fact_date   date,                       -- data em que o fato ocorreu
  pdf_path    text,                       -- PDF gerado da evidência (bucket "media")
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Para bases criadas antes da versão em PDF:
alter table public.evidences add column if not exists pdf_path text;

create index if not exists evidences_owner_idx on public.evidences (owner_id, created_at desc);

-- ------------------------------------------------------------------
-- Tabela: media_assets  (mídias de cada evidência)
-- ------------------------------------------------------------------
create table if not exists public.media_assets (
  id           uuid primary key default gen_random_uuid(),
  evidence_id  uuid not null references public.evidences (id) on delete cascade,
  owner_id     uuid not null references auth.users (id) on delete cascade,
  kind         text not null check (kind in ('foto','video','audio','link','documento')),
  storage_path text,          -- caminho no bucket "media" (para arquivos)
  external_url text,          -- URL externa (para o tipo "link")
  mime_type    text,
  filename     text,          -- nome original do arquivo (usado no PDF)
  created_at   timestamptz not null default now()
);

-- Para bases criadas antes da versão em PDF:
alter table public.media_assets add column if not exists filename text;

create index if not exists media_evidence_idx on public.media_assets (evidence_id);

-- ------------------------------------------------------------------
-- Tabela: share_links  (links públicos de só-leitura + QR)
-- ------------------------------------------------------------------
create table if not exists public.share_links (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references auth.users (id) on delete cascade,
  token      text not null unique default encode(gen_random_bytes(16), 'hex'),
  label      text,
  revoked    boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists share_owner_idx on public.share_links (owner_id);
create index if not exists share_token_idx on public.share_links (token);

-- ------------------------------------------------------------------
-- updated_at automático
-- ------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_evidences_touch on public.evidences;
create trigger trg_evidences_touch
  before update on public.evidences
  for each row execute function public.touch_updated_at();

-- =============================================================
--  RLS — cada usuário só enxerga o que é dele
-- =============================================================
alter table public.evidences    enable row level security;
alter table public.media_assets enable row level security;
alter table public.share_links  enable row level security;

-- evidences
drop policy if exists "evid_select_own" on public.evidences;
create policy "evid_select_own" on public.evidences
  for select using (auth.uid() = owner_id);
drop policy if exists "evid_insert_own" on public.evidences;
create policy "evid_insert_own" on public.evidences
  for insert with check (auth.uid() = owner_id);
drop policy if exists "evid_update_own" on public.evidences;
create policy "evid_update_own" on public.evidences
  for update using (auth.uid() = owner_id);
drop policy if exists "evid_delete_own" on public.evidences;
create policy "evid_delete_own" on public.evidences
  for delete using (auth.uid() = owner_id);

-- media_assets
drop policy if exists "media_select_own" on public.media_assets;
create policy "media_select_own" on public.media_assets
  for select using (auth.uid() = owner_id);
drop policy if exists "media_insert_own" on public.media_assets;
create policy "media_insert_own" on public.media_assets
  for insert with check (auth.uid() = owner_id);
drop policy if exists "media_delete_own" on public.media_assets;
create policy "media_delete_own" on public.media_assets
  for delete using (auth.uid() = owner_id);

-- share_links
drop policy if exists "share_all_own" on public.share_links;
create policy "share_all_own" on public.share_links
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- =============================================================
--  Leitura pública via token (só-leitura)
--  SECURITY DEFINER: ignora o RLS de forma controlada e só
--  devolve dados quando o token existe e não foi revogado.
-- =============================================================
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

-- Permite que o papel anônimo (visitante do link) chame a função
grant execute on function public.get_shared_archive(text) to anon, authenticated;

-- =============================================================
--  STORAGE — bucket público "media"
--  Crie o bucket "media" (público) pelo painel OU deixe as linhas
--  abaixo criarem/configurarem. Arquivos ficam em caminhos com
--  UUID (não-adivinháveis). O upload é restrito ao dono.
-- =============================================================
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do update set public = true;

-- Qualquer um pode LER (necessário para o link público exibir a mídia)
drop policy if exists "media_public_read" on storage.objects;
create policy "media_public_read" on storage.objects
  for select using (bucket_id = 'media');

-- Só o dono pode ENVIAR arquivos, dentro da "pasta" do próprio user id
drop policy if exists "media_owner_insert" on storage.objects;
create policy "media_owner_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);

-- Só o dono pode SOBRESCREVER (upsert) arquivos da própria "pasta".
-- Necessário para regerar o PDF da evidência num caminho fixo ao editar.
drop policy if exists "media_owner_update" on storage.objects;
create policy "media_owner_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "media_owner_delete" on storage.objects;
create policy "media_owner_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
