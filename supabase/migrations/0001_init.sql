-- Lil' Mems core schema: child profiles + timestamped memory records.
-- Run via `supabase db push` or paste into the Supabase SQL editor.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- children
-- ---------------------------------------------------------------------------
create table if not exists public.children (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  birth_date date,
  created_at timestamptz not null default now()
);

create index if not exists children_parent_id_idx on public.children (parent_id);

alter table public.children enable row level security;

create policy "Parents manage their own children"
  on public.children
  for all
  using (auth.uid() = parent_id)
  with check (auth.uid() = parent_id);

-- ---------------------------------------------------------------------------
-- memories
-- ---------------------------------------------------------------------------
create table if not exists public.memories (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children (id) on delete cascade,
  parent_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('voice', 'photo')),
  title text,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  audio_path text,
  audio_duration_seconds numeric,
  photo_path text,
  transcript text,
  transcript_status text not null default 'pending'
    check (transcript_status in ('pending', 'processing', 'completed', 'failed')),
  transcript_error text,
  constraint memories_kind_requires_media check (
    (kind = 'voice' and audio_path is not null)
    or (kind = 'photo' and photo_path is not null and audio_path is not null)
  )
);

create index if not exists memories_child_id_occurred_at_idx
  on public.memories (child_id, occurred_at desc);
create index if not exists memories_parent_id_idx on public.memories (parent_id);

alter table public.memories enable row level security;

create policy "Parents manage their own children's memories"
  on public.memories
  for all
  using (auth.uid() = parent_id)
  with check (auth.uid() = parent_id);

-- ---------------------------------------------------------------------------
-- storage buckets
-- Files are stored under `${auth.uid()}/${childId}/${memoryId}-...` so the
-- policies below can authorize purely from the path.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('memory-audio', 'memory-audio', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('memory-photos', 'memory-photos', false)
on conflict (id) do nothing;

create policy "Parents manage their own audio files"
  on storage.objects
  for all
  using (bucket_id = 'memory-audio' and auth.uid()::text = (storage.foldername(name))[1])
  with check (bucket_id = 'memory-audio' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Parents manage their own photo files"
  on storage.objects
  for all
  using (bucket_id = 'memory-photos' and auth.uid()::text = (storage.foldername(name))[1])
  with check (bucket_id = 'memory-photos' and auth.uid()::text = (storage.foldername(name))[1]);
