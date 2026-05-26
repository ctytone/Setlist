import Image from "next/image";
import Link from "next/link";
import { ExternalLink, Trash2 } from "lucide-react";

import { deleteAlbumAction } from "@/server/actions/app-actions";
import { requireUser } from "@/server/auth";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import LiveAlbumAverage from "@/components/live-album-average";
import SongRatingCell from "@/components/song-rating-cell";
import StatusForm from "@/components/status-form";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { AddToLibraryButton } from "./add-to-library-button";

type TrackRelation =
  | {
      id: string;
      name: string;
      duration_ms: number | null;
    }
  | Array<{
      id: string;
      name: string;
      duration_ms: number | null;
    }>
  | null;

function pickTrack(trackRelation: TrackRelation) {
  if (!trackRelation) {
    return null;
  }

  return Array.isArray(trackRelation) ? trackRelation[0] ?? null : trackRelation;
}

type ArtistRelation =
  | {
      id: string;
      name: string;
    }
  | Array<{
      id: string;
      name: string;
    }>
  | null;

function pickArtist(artistRelation: ArtistRelation) {
  if (!artistRelation) {
    return null;
  }

  return Array.isArray(artistRelation) ? artistRelation[0] ?? null : artistRelation;
}

export default async function AlbumDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ albumId: string }>;
  searchParams?: Promise<{ view?: string; userId?: string }>;
}) {
  const { albumId } = await params;
  const { supabase, user } = await requireUser();
  const serviceRoleClient = createServiceRoleClient();
  const viewerParams = searchParams ? await searchParams : {};
  const sourceUserId = viewerParams.view === "friend" ? viewerParams.userId ?? null : null;
  const isFriendView = Boolean(sourceUserId && sourceUserId !== user.id);

  const [{ data: album }, { data: trackRows }, { data: currentUserRatings }, { data: statuses }, { data: existingLibraryEntry }] = await Promise.all([
    serviceRoleClient
      .from("albums")
      .select("id,name,release_date,cover_url,spotify_id,spotify_url,artists:primary_artist_id(id,name)")
      .eq("id", albumId)
      .maybeSingle(),
    serviceRoleClient
      .from("album_tracks")
      .select("track_number,disc_number,tracks(id,name,duration_ms)")
      .eq("album_id", albumId)
      .order("disc_number", { ascending: true })
      .order("track_number", { ascending: true }),
    supabase.from("song_ratings").select("track_id,rating,is_public").eq("user_id", user.id),
    supabase
      .from("item_statuses")
      .select("status")
      .eq("user_id", user.id)
      .eq("item_type", "album")
      .eq("item_id", albumId)
      .maybeSingle(),
    supabase
      .from("user_albums")
      .select("album_id")
      .eq("user_id", user.id)
      .eq("album_id", albumId)
      .maybeSingle(),
  ]);

  if (!album) {
    return <EmptyState title="Album not found" description="Try adding it again from search." />;
  }

  const sourceUser = sourceUserId
    ? (await serviceRoleClient
        .from("users")
        .select("id,handle,display_name,avatar_url,created_at,updated_at")
        .eq("id", sourceUserId)
        .maybeSingle()).data
    : null;

  const canViewFriendRatings = Boolean(sourceUser && (sourceUser.id === user.id || (await (async () => {
    const { data, error } = await serviceRoleClient
      .from("friend_activity")
      .select("id")
      .or(`and(user_id.eq.${user.id},actor_id.eq.${sourceUser.id},action.eq.friend_added),and(user_id.eq.${sourceUser.id},actor_id.eq.${user.id},action.eq.friend_added)`)
      .limit(1);

    if (error) {
      throw error;
    }

    return (data ?? []).length > 0;
  })())));

  const profileLabel = sourceUser?.display_name || sourceUser?.handle || "Their";
  const spotifyAlbumHref = album.spotify_id ? `spotify:album:${album.spotify_id}` : album.spotify_url ?? null;

  const trackRowsTyped = (trackRows ?? []) as Array<{
    track_number: number;
    disc_number: number;
    tracks: TrackRelation;
  }>;

  const currentRatings = (currentUserRatings ?? []) as Array<{ track_id: string; rating: number | string; is_public: boolean }>;
  const sourceRatings = canViewFriendRatings
    ? ((await serviceRoleClient
        .from("song_ratings")
        .select("track_id,rating,is_public,tracks:track_id(id,name,duration_ms,artists:primary_artist_id(name))")
        .eq("user_id", sourceUser!.id)
        .eq("track_id", albumId)
        .order("rated_at", { ascending: false })).data ?? [])
    : [];

  const ratingMap = new Map(currentRatings.map((entry) => [entry.track_id, Number(entry.rating)]));
  const friendRatingMap = new Map((sourceRatings as Array<{ track_id: string; rating: number | string }>).map((entry) => [entry.track_id, Number(entry.rating)]));
  const listenedCount = trackRowsTyped.filter((row) => {
    const track = pickTrack(row.tracks as TrackRelation);
    return Boolean(track?.id && ratingMap.has(track.id));
  }).length;
  const totalTracks = trackRows?.length ?? 0;
  const artist = pickArtist(album.artists as ArtistRelation);
  const albumLabel = isFriendView && sourceUser ? `${profileLabel}'s ratings` : "Your album";
  const canEdit = !isFriendView;
  const alreadyInLibrary = Boolean(existingLibraryEntry);

  return (
    <section className="space-y-6">
      <Card className="relative">
        <CardContent className="grid gap-4 p-4 sm:grid-cols-[220px_1fr]">
          <div className="aspect-square w-full overflow-hidden rounded-md bg-muted">
            {album.cover_url ? (
              <Image
                src={album.cover_url}
                alt={album.name}
                width={480}
                height={480}
                className="h-full w-full object-cover"
              />
            ) : null}
          </div>
          <div className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="font-heading text-3xl">{album.name}</h1>
                <p className="text-sm text-muted-foreground">
                  {artist?.name ?? "Unknown artist"} • {album.release_date || "Unknown release"}
                </p>
                {isFriendView && sourceUser ? (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Viewing {profileLabel}&apos;s ratings.
                  </p>
                ) : null}
              </div>
              {spotifyAlbumHref ? (
                <a
                  href={spotifyAlbumHref}
                  className="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  Open in Spotify
                  <ExternalLink className="size-4" />
                </a>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">
                {listenedCount}/{totalTracks} tracks rated
              </Badge>
              <Badge variant="secondary">
                {totalTracks - listenedCount} not listened to yet
              </Badge>
            </div>
            <div className="mt-4">
              <LiveAlbumAverage albumId={albumId} />
            </div>
            {canEdit ? (
              <StatusForm itemId={albumId} initialStatus={statuses?.status ?? "want_to_listen"} />
            ) : sourceUser ? (
              <div className="flex flex-wrap items-center gap-3">
                <AddToLibraryButton albumId={albumId} initiallyAdded={alreadyInLibrary} />
                <Link href="/app/albums" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
                  Back to your library
                </Link>
              </div>
            ) : null}
          </div>
        </CardContent>
        {canEdit ? (
          <form action={deleteAlbumAction} className="absolute right-4 top-4">
            <input type="hidden" name="albumId" value={albumId} />
            <Button
              type="submit"
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground"
              title="Remove album from library"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </form>
        ) : null}
      </Card>

      {/* Tags UI removed — will be reintroduced later with automated tagging */}

      <Card>
        <CardHeader>
          <CardTitle>{albumLabel}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {trackRowsTyped.map((row) => {
            const track = pickTrack(row.tracks as TrackRelation);
            if (!track) {
              return null;
            }

            const rating = canEdit ? ratingMap.get(track.id) : friendRatingMap.get(track.id);

            return (
              <div key={track.id} className="rounded-md border border-border/70 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">
                      {row.track_number}. {track.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {Math.round(Number(track.duration_ms) / 60000)} min
                    </p>
                  </div>
                  {canEdit ? (
                    <SongRatingCell
                      trackId={track.id}
                      albumId={albumId}
                      initialRating={rating ? Number(rating) : null}
                    />
                  ) : (
                    <Badge variant={rating ? "default" : "secondary"}>
                      {rating ? `${Number(rating).toFixed(1)} stars` : "No rating"}
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </section>
  );
}
