-- AZ CLEAN AUTO CHUNK SORTER DATABASE V1
-- Run this once in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.entries (
  id uuid primary key default gen_random_uuid(),
  original_text text not null,
  clean_text text not null,
  letter text not null check (letter ~ '^[A-Z]$'),
  status text not null default 'APPROVED'
    check (status in ('APPROVED', 'REVIEW', 'DUPLICATE_REVIEW', 'REJECTED')),
  source_file text,
  source_batch text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint entries_clean_text_unique unique (clean_text)
);

create index if not exists entries_letter_idx on public.entries(letter);
create index if not exists entries_status_idx on public.entries(status);
create index if not exists entries_created_at_idx on public.entries(created_at desc);
create index if not exists entries_clean_text_search_idx
  on public.entries using gin (to_tsvector('simple', clean_text));

create table if not exists public.checkpoints (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  entry_count bigint not null default 0,
  letter_counts jsonb not null default '{}'::jsonb,
  status_counts jsonb not null default '{}'::jsonb,
  snapshot jsonb not null default '[]'::jsonb,
  app_version text,
  git_commit text,
  created_at timestamptz not null default now()
);

create index if not exists checkpoints_created_at_idx
  on public.checkpoints(created_at desc);

alter table public.entries enable row level security;
alter table public.checkpoints enable row level security;

-- No public browser policies are intentionally created.
-- The application accesses these tables only through secure server API routes
-- using SUPABASE_SERVICE_ROLE_KEY stored in Vercel environment variables.

comment on table public.entries is 'Persistent A-Z alliteration archive with exact duplicate protection.';
comment on table public.checkpoints is 'Named database snapshots and archive statistics.';
