-- Records for the Export Quoting Engine and the Sample & After-Sales Tracker.
--
-- The browser keeps its own copy (local-first) and syncs whole documents
-- here; the newest updated_at wins. One table holds every kind so a new tool
-- needs no migration. Deletes are soft (deleted = true) so they reach every
-- device the user signs in on.

create table if not exists public.tool_records (
  id          uuid primary key,
  user_id     uuid not null references auth.users (id) on delete cascade,
  kind        text not null check (kind in ('quote', 'sample', 'case')),
  doc         jsonb not null,
  deleted     boolean not null default false,
  updated_at  timestamptz not null default now(),
  created_at  timestamptz not null default now(),
  -- A single record is a quote or a case file, never a data dump.
  constraint tool_records_doc_size check (pg_column_size(doc) < 512 * 1024)
);

create index if not exists tool_records_user_kind_idx on public.tool_records (user_id, kind);

alter table public.tool_records enable row level security;

-- Each person sees and changes only their own records.
drop policy if exists "tool_records_select_own" on public.tool_records;
create policy "tool_records_select_own" on public.tool_records
  for select using (auth.uid() = user_id);

drop policy if exists "tool_records_insert_own" on public.tool_records;
create policy "tool_records_insert_own" on public.tool_records
  for insert with check (auth.uid() = user_id);

drop policy if exists "tool_records_update_own" on public.tool_records;
create policy "tool_records_update_own" on public.tool_records
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "tool_records_delete_own" on public.tool_records;
create policy "tool_records_delete_own" on public.tool_records
  for delete using (auth.uid() = user_id);
