create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  handle text unique,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.spotify_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  spotify_user_id text not null,
  spotify_display_name text,
  spotify_email text,
  spotify_product text,
  access_token text not null,
  refresh_token text not null,
  scopes text,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.artists (
  id uuid primary key default gen_random_uuid(),
  spotify_id text unique,
  name text not null,
  image_url text,
  genres text[] not null default '{}',
  popularity int,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.albums (
  id uuid primary key default gen_random_uuid(),
  spotify_id text unique,
  name text not null,
  album_type text,
  release_date date,
  cover_url text,
  spotify_url text,
  popularity int,
  primary_artist_id uuid references public.artists(id),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tracks (
  id uuid primary key default gen_random_uuid(),
  spotify_id text unique,
  name text not null,
  duration_ms int,
  explicit boolean,
  spotify_preview_url text,
  primary_artist_id uuid references public.artists(id),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.album_tracks (
  album_id uuid not null references public.albums(id) on delete cascade,
  track_id uuid not null references public.tracks(id) on delete cascade,
  disc_number int not null default 1,
  track_number int not null,
  created_at timestamptz not null default now(),
  primary key (album_id, track_id)
);

create table if not exists public.user_albums (
  user_id uuid not null references public.users(id) on delete cascade,
  album_id uuid not null references public.albums(id) on delete cascade,
  source text not null default 'manual',
  imported_at timestamptz,
  derived_rating numeric(3,2),
  updated_at timestamptz not null default now(),
  primary key (user_id, album_id)
);

create table if not exists public.song_ratings (
  user_id uuid not null references public.users(id) on delete cascade,
  track_id uuid not null references public.tracks(id) on delete cascade,
  rating numeric(2,1) not null check (rating >= 0.5 and rating <= 5.0 and mod((rating * 10)::int, 5) = 0),
  is_public boolean not null default true,
  rated_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, track_id)
);

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  slug text not null,
  created_at timestamptz not null default now(),
  unique(user_id, slug)
);

create table if not exists public.item_tags (
  user_id uuid not null references public.users(id) on delete cascade,
  item_type text not null check (item_type in ('album', 'track', 'artist')),
  item_id uuid not null,
  tag_id uuid not null references public.tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, item_type, item_id, tag_id)
);

create table if not exists public.item_statuses (
  user_id uuid not null references public.users(id) on delete cascade,
  item_type text not null check (item_type in ('album', 'track', 'artist')),
  item_id uuid not null,
  status text not null check (status in ('want_to_listen', 'currently_listening', 'rated')),
  updated_at timestamptz not null default now(),
  primary key (user_id, item_type, item_id)
);

create table if not exists public.user_settings (
  user_id uuid primary key references public.users(id) on delete cascade,
  song_ratings_public_default boolean not null default true,
  profile_visibility text not null default 'private',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sync_state (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  source text not null,
  status text not null default 'idle',
  started_at timestamptz,
  completed_at timestamptz,
  imported_count int not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, source)
);

create index if not exists idx_albums_primary_artist on public.albums(primary_artist_id);
create index if not exists idx_tracks_primary_artist on public.tracks(primary_artist_id);
create index if not exists idx_user_albums_rating on public.user_albums(user_id, derived_rating desc);
create index if not exists idx_song_ratings_public on public.song_ratings(user_id, is_public);
create index if not exists idx_item_statuses_status on public.item_statuses(user_id, status);

alter table public.users enable row level security;
alter table public.spotify_accounts enable row level security;
alter table public.user_albums enable row level security;
alter table public.song_ratings enable row level security;
alter table public.tags enable row level security;
alter table public.item_tags enable row level security;
alter table public.item_statuses enable row level security;
alter table public.user_settings enable row level security;
alter table public.sync_state enable row level security;
alter table public.artists enable row level security;
alter table public.albums enable row level security;
alter table public.tracks enable row level security;
alter table public.album_tracks enable row level security;

create policy "users_select_self" on public.users for select using (id = auth.uid());
create policy "users_update_self" on public.users for update using (id = auth.uid());
create policy "users_insert_self" on public.users for insert with check (id = auth.uid());

create policy "spotify_accounts_owner_all" on public.spotify_accounts
for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "user_albums_owner_all" on public.user_albums
for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "song_ratings_owner_all" on public.song_ratings
for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "tags_owner_all" on public.tags
for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "item_tags_owner_all" on public.item_tags
for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "item_statuses_owner_all" on public.item_statuses
for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "user_settings_owner_all" on public.user_settings
for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "sync_state_owner_all" on public.sync_state
for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "artists_select_authenticated" on public.artists for select using (auth.role() = 'authenticated');
create policy "albums_select_authenticated" on public.albums for select using (auth.role() = 'authenticated');
create policy "tracks_select_authenticated" on public.tracks for select using (auth.role() = 'authenticated');
create policy "album_tracks_select_authenticated" on public.album_tracks for select using (auth.role() = 'authenticated');

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, handle, display_name)
  values (new.id, new.raw_user_meta_data ->> 'user_name', new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;

  insert into public.user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- TODO: Add future social graph tables (follows, profile visibility tiers, activity feed)
-- TODO: Add optional materialized stats cache if live queries become too expensive
-- TODO: Add a public_profile table for sharable user profile pages
