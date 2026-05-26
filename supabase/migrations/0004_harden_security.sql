-- Harden the shared Spotify catalog against untrusted writes.
-- All writes to catalog tables should come from server-only service-role code.

drop policy if exists "artists_write_authenticated" on public.artists;
drop policy if exists "albums_write_authenticated" on public.albums;
drop policy if exists "tracks_write_authenticated" on public.tracks;
drop policy if exists "album_tracks_write_authenticated" on public.album_tracks;

revoke insert, update, delete on table public.artists from authenticated;
revoke insert, update, delete on table public.albums from authenticated;
revoke insert, update, delete on table public.tracks from authenticated;
revoke insert, update, delete on table public.album_tracks from authenticated;