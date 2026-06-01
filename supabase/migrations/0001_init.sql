-- ============================================================================
-- Pedal — Fleet Maintenance Tracker
-- Initial schema migration. Paste this into the Supabase SQL editor and run.
-- ============================================================================

-- Extensions ----------------------------------------------------------------
create extension if not exists "pgcrypto"; -- for gen_random_uuid()

-- Enums ---------------------------------------------------------------------
do $$ begin
  create type bike_status as enum ('good', 'needs_attention', 'out_of_service');
exception when duplicate_object then null; end $$;

do $$ begin
  create type issue_severity as enum ('low', 'medium', 'high');
exception when duplicate_object then null; end $$;

do $$ begin
  create type issue_status as enum ('open', 'in_progress', 'resolved');
exception when duplicate_object then null; end $$;

-- Tables --------------------------------------------------------------------
create table if not exists public.studios (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  created_at  timestamptz not null default now()
);

create table if not exists public.bikes (
  id             uuid primary key default gen_random_uuid(),
  studio_id      uuid not null references public.studios(id) on delete cascade,
  name           text not null,
  floor_position text,
  status         bike_status not null default 'good',
  created_at     timestamptz not null default now()
);

create table if not exists public.issues (
  id           uuid primary key default gen_random_uuid(),
  bike_id      uuid not null references public.bikes(id) on delete cascade,
  description  text not null,
  severity     issue_severity not null default 'medium',
  status       issue_status not null default 'open',
  reported_by  text,
  created_at   timestamptz not null default now(),
  resolved_at  timestamptz
);

create table if not exists public.issue_notes (
  id          uuid primary key default gen_random_uuid(),
  issue_id    uuid not null references public.issues(id) on delete cascade,
  note        text not null,
  created_by  text,
  created_at  timestamptz not null default now()
);

create table if not exists public.issue_photos (
  id           uuid primary key default gen_random_uuid(),
  issue_id     uuid not null references public.issues(id) on delete cascade,
  storage_url  text not null,
  created_at   timestamptz not null default now()
);

-- Indexes -------------------------------------------------------------------
create index if not exists idx_bikes_studio       on public.bikes(studio_id);
create index if not exists idx_issues_bike         on public.issues(bike_id);
create index if not exists idx_issues_status       on public.issues(status);
create index if not exists idx_issue_notes_issue   on public.issue_notes(issue_id);
create index if not exists idx_issue_photos_issue  on public.issue_photos(issue_id);

-- Keep resolved_at consistent with status ----------------------------------
create or replace function public.sync_issue_resolved_at()
returns trigger language plpgsql as $$
begin
  if new.status = 'resolved' and new.resolved_at is null then
    new.resolved_at := now();
  elsif new.status <> 'resolved' then
    new.resolved_at := null;
  end if;
  return new;
end $$;

drop trigger if exists trg_sync_issue_resolved_at on public.issues;
create trigger trg_sync_issue_resolved_at
  before insert or update on public.issues
  for each row execute function public.sync_issue_resolved_at();

-- Row Level Security --------------------------------------------------------
-- Boutique studios run Pedal as an internal tool: any authenticated staff
-- member can read and write. Tighten with a studio_members table if you ever
-- need per-studio isolation.
alter table public.studios      enable row level security;
alter table public.bikes        enable row level security;
alter table public.issues       enable row level security;
alter table public.issue_notes  enable row level security;
alter table public.issue_photos enable row level security;

do $$
declare t text;
begin
  foreach t in array array[
    'studios','bikes','issues','issue_notes','issue_photos'
  ] loop
    execute format(
      'drop policy if exists "authenticated read %1$s" on public.%1$s;', t);
    execute format(
      'create policy "authenticated read %1$s" on public.%1$s
         for select to authenticated using (true);', t);

    execute format(
      'drop policy if exists "authenticated write %1$s" on public.%1$s;', t);
    execute format(
      'create policy "authenticated write %1$s" on public.%1$s
         for all to authenticated using (true) with check (true);', t);
  end loop;
end $$;

-- Storage bucket for issue photos -------------------------------------------
insert into storage.buckets (id, name, public)
values ('issue-photos', 'issue-photos', true)
on conflict (id) do nothing;

drop policy if exists "issue photos read"   on storage.objects;
drop policy if exists "issue photos write"  on storage.objects;
drop policy if exists "issue photos delete" on storage.objects;

create policy "issue photos read"
  on storage.objects for select
  using (bucket_id = 'issue-photos');

create policy "issue photos write"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'issue-photos');

create policy "issue photos delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'issue-photos');
