# Setlist

A polished, mobile-friendly foundation for a Spotify-powered album and song rating app.

Stack:
- Next.js App Router + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (auth, database, storage-ready)
- Spotify Web API (search + saved albums sync)
- Zod runtime validation

## What This Version Includes

- Email/password auth with Supabase
- Optional Spotify account linking via OAuth
- Spotify search from inside the app (server route)
- Add albums from Spotify results
- Album detail pages with track list
- Song ratings in 0.5 increments
- Album average rating derived from rated tracks only
- Unrated tracks surfaced as "not listened to yet"
- Tags and status management (want to listen, currently listening, rated)
- Album list filters and sorting foundation
- Stats page with rating distribution, top albums/artists, and listening progress
- Spotify saved albums sync action + last sync state
- SQL migration with RLS from day one

## Local Setup

1. Install dependencies:
	npm install

2. Copy env values:
	copy .env.example .env.local

3. Fill in env values in .env.local:
	- NEXT_PUBLIC_APP_URL
	- NEXT_PUBLIC_SUPABASE_URL
	- NEXT_PUBLIC_SUPABASE_ANON_KEY
	- SUPABASE_SERVICE_ROLE_KEY
	- SPOTIFY_CLIENT_ID
	- SPOTIFY_CLIENT_SECRET
	- SPOTIFY_REDIRECT_URI

4. Create a Supabase project and run SQL migration:
	- Apply supabase/migrations/0001_init.sql

5. Configure Spotify app:
	- Add redirect URI matching SPOTIFY_REDIRECT_URI
	- Enable scopes used by this app: user-library-read user-read-email user-read-private

6. Start dev server:
	npm run dev

7. Open:
	http://localhost:3000

## Project Structure

- src/app: route handlers and pages
- src/components: reusable UI and app shell
- src/features: feature-local UI logic (search)
- src/lib: shared utilities (env, schemas, rating, Supabase, Spotify)
- src/server: server-only auth/library/actions
- supabase/migrations: SQL schema + RLS

## Data Model

Core tables created in the first migration:
- users
- spotify_accounts
- artists
- albums
- tracks
- album_tracks
- user_albums
- song_ratings
- tags
- item_tags
- item_statuses
- user_settings
- sync_state

Notes:
- Playlist support is intentionally excluded.
- Song ratings are stored independently.
- Album rating is derived from rated songs only.
- Schema is shaped so public profiles and social follows can be added later.

## Roadmap TODOs (Intentional Next Steps)

- Social/public sharing:
  - Add follow relationships and profile visibility tiers.
  - Add public profile pages with public-only rating projection.
- Advanced stats:
  - Add richer trend views and time-based listening analytics.
  - Add optional cached/materialized stats if needed for scale.
- Product hardening:
  - Add optimistic updates for rating/status interactions.
  - Improve sync reliability with background job queue + retries.
  - Add tests around actions, sync, and rating derivation rules.

## Scope Guardrails

- Keep first pass simple and extensible.
- Do not add playlists.
- Do not build mobile app/app-store work yet.
- Avoid premature complexity; prioritize maintainable foundations.
