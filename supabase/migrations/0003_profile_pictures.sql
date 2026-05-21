-- Profile pictures storage bucket for public avatars.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update
set public = excluded.public,
    name = excluded.name;

drop policy if exists "avatars_select_public" on storage.objects;
drop policy if exists "avatars_insert_own" on storage.objects;
drop policy if exists "avatars_update_own" on storage.objects;
drop policy if exists "avatars_delete_own" on storage.objects;

create policy "avatars_select_public" on storage.objects
for select
using (bucket_id = 'avatars');

create policy "avatars_insert_own" on storage.objects
for insert
with check (
  bucket_id = 'avatars'
  and auth.uid() is not null
  and split_part(name, '/', 1) = auth.uid()::text
);

create policy "avatars_update_own" on storage.objects
for update
using (
  bucket_id = 'avatars'
  and auth.uid() is not null
  and split_part(name, '/', 1) = auth.uid()::text
)
with check (
  bucket_id = 'avatars'
  and auth.uid() is not null
  and split_part(name, '/', 1) = auth.uid()::text
);

create policy "avatars_delete_own" on storage.objects
for delete
using (
  bucket_id = 'avatars'
  and auth.uid() is not null
  and split_part(name, '/', 1) = auth.uid()::text
);

-- Keep public profile rows in sync with auth metadata when available.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, handle, display_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data ->> 'user_name',
    new.raw_user_meta_data ->> 'full_name',
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture')
  )
  on conflict (id) do nothing;

  insert into public.user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;