-- Friends table: stores confirmed friendships (bi-directional, stored once)
create table if not exists public.friends (
  id uuid primary key default gen_random_uuid(),
  user_id_1 uuid not null references public.users(id) on delete cascade,
  user_id_2 uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  -- Ensure user_id_1 < user_id_2 to avoid duplicates
  constraint users_different check (user_id_1 != user_id_2),
  unique(user_id_1, user_id_2)
);

-- Friend requests table: pending friend requests (directional)
create table if not exists public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.users(id) on delete cascade,
  recipient_id uuid not null references public.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sender_not_recipient check (sender_id != recipient_id),
  constraint unique_request unique(sender_id, recipient_id)
);

-- Friend activity feed: tracks friend actions for notifications
create table if not exists public.friend_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  actor_id uuid not null references public.users(id) on delete cascade,
  action text not null check (action in ('friend_added', 'album_rated', 'album_shared', 'friend_request_received')),
  subject_id uuid, -- album_id, track_id, or other related id
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  is_read boolean not null default false
);

-- Indexes for performance
create index if not exists idx_friends_user_id_1 on public.friends(user_id_1);
create index if not exists idx_friends_user_id_2 on public.friends(user_id_2);
create index if not exists idx_friend_requests_sender on public.friend_requests(sender_id);
create index if not exists idx_friend_requests_recipient on public.friend_requests(recipient_id);
create index if not exists idx_friend_requests_status on public.friend_requests(status);
create index if not exists idx_friend_activity_user on public.friend_activity(user_id);
create index if not exists idx_friend_activity_created on public.friend_activity(created_at desc);
create index if not exists idx_friend_activity_unread on public.friend_activity(user_id, is_read) where not is_read;

-- Enable RLS
alter table public.friends enable row level security;
alter table public.friend_requests enable row level security;
alter table public.friend_activity enable row level security;

-- Policies for friends table: users can see their own friendships
create policy "friends_select_self" on public.friends for select 
using (user_id_1 = auth.uid() or user_id_2 = auth.uid());

create policy "friends_insert_self" on public.friends for insert 
with check (user_id_1 = auth.uid() or user_id_2 = auth.uid());

create policy "friends_delete_self" on public.friends for delete 
using (user_id_1 = auth.uid() or user_id_2 = auth.uid());

-- Policies for friend_requests table: users can manage their own requests
create policy "friend_requests_select_self" on public.friend_requests for select 
using (sender_id = auth.uid() or recipient_id = auth.uid());

create policy "friend_requests_insert_self" on public.friend_requests for insert 
with check (sender_id = auth.uid());

create policy "friend_requests_update_self" on public.friend_requests for update 
using (recipient_id = auth.uid()) with check (recipient_id = auth.uid());

create policy "friend_requests_delete_self" on public.friend_requests for delete 
using (sender_id = auth.uid() or (recipient_id = auth.uid() and status = 'pending'));

-- Policies for friend_activity: users can see their own activity and update read status
create policy "friend_activity_select_self" on public.friend_activity for select 
using (user_id = auth.uid());

create policy "friend_activity_update_self" on public.friend_activity for update 
using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "friend_activity_delete_self" on public.friend_activity for delete 
using (user_id = auth.uid());
