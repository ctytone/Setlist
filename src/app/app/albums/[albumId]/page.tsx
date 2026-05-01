import Image from "next/image";

import { assignTagAction, createTagAction, updateStatusAction } from "@/server/actions/app-actions";
import { requireUser } from "@/server/auth";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RatingStars } from "@/components/rating-stars";
import LiveAlbumAverage from "@/components/live-album-average";
import SongRatingForm from "@/components/song-rating-form";

const ratingValues = Array.from({ length: 10 }, (_, index) => ((index + 1) * 0.5).toFixed(1));

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
}: {
  params: Promise<{ albumId: string }>;
}) {
  const { albumId } = await params;
  const { supabase, user } = await requireUser();

  const [{ data: album }, { data: trackRows }, { data: ratings }, { data: statuses }, { data: tags }, { data: itemTags }] = await Promise.all([
    supabase
      .from("albums")
      .select("id,name,release_date,cover_url,artists:primary_artist_id(id,name)")
      .eq("id", albumId)
      .maybeSingle(),
    supabase
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
    supabase.from("tags").select("id,name").eq("user_id", user.id).order("name", { ascending: true }),
    supabase
      .from("item_tags")
      .select("tag_id")
      .eq("user_id", user.id)
      .eq("item_type", "album")
      .eq("item_id", albumId),
  ]);

  if (!album) {
    return <EmptyState title="Album not found" description="Try adding it again from search." />;
  }

  const ratingMap = new Map((ratings ?? []).map((entry) => [entry.track_id, Number(entry.rating)]));
  const listenedCount = (trackRows ?? []).filter((row) => {
    const track = pickTrack(row.tracks as TrackRelation);
    return Boolean(track?.id && ratingMap.has(track.id));
  }).length;
  const totalTracks = trackRows?.length ?? 0;
  const selectedTagIds = new Set((itemTags ?? []).map((item) => item.tag_id));
  const artist = pickArtist(album.artists as ArtistRelation);

  return (
    <section className="space-y-6">
      <Card>
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
            <div>
              <h1 className="font-heading text-3xl">{album.name}</h1>
              <p className="text-sm text-muted-foreground">
                {artist?.name ?? "Unknown artist"} • {album.release_date || "Unknown release"}
              </p>
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
            <form action={updateStatusAction} className="flex flex-wrap items-center gap-2">
              <input type="hidden" name="itemType" value="album" />
              <input type="hidden" name="itemId" value={albumId} />
              <select
                name="status"
                defaultValue={statuses?.status ?? "want_to_listen"}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="want_to_listen">Want to listen</option>
                <option value="currently_listening">Currently listening</option>
                <option value="rated">Rated</option>
              </select>
              <Button type="submit" variant="outline">
                Save status
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tags</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <form action={createTagAction} className="flex gap-2">
            <Input name="name" placeholder="Create tag" className="max-w-xs" />
            <Button type="submit" variant="outline">
              Add tag
            </Button>
          </form>
          <div className="flex flex-wrap gap-2">
            {(tags ?? []).map((tag) => (
              <form key={tag.id} action={assignTagAction}>
                <input type="hidden" name="itemType" value="album" />
                <input type="hidden" name="itemId" value={albumId} />
                <input type="hidden" name="tagId" value={tag.id} />
                <Button
                  type="submit"
                  size="sm"
                  variant={selectedTagIds.has(tag.id) ? "default" : "outline"}
                >
                  {tag.name}
                </Button>
              </form>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tracks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(trackRows ?? []).map((row) => {
            const track = pickTrack(row.tracks as TrackRelation);
            if (!track) {
              return null;
            }

            const rating = ratingMap.get(track.id);

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
                  <Badge variant={rating ? "default" : "secondary"}>
                    {rating ? `${rating.toFixed(1)} stars` : "Not listened to yet"}
                  </Badge>
                </div>
                <div className="mt-3">
                  <SongRatingForm trackId={track.id} albumId={albumId} initialRating={rating ? Number(rating) : null} />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </section>
  );
}
