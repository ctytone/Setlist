import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import SongRatingForm from "@/components/song-rating-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/server/auth";

function pickNameRelation(
  relation: { name: string } | Array<{ name: string }> | null | undefined,
) {
  if (!relation) {
    return "Unknown";
  }

  if (Array.isArray(relation)) {
    return relation[0]?.name ?? "Unknown";
  }

  return relation.name;
}

export default async function SongPage({
  params,
}: {
  params: Promise<{ trackId: string }>;
}) {
  const { trackId } = await params;
  const { supabase, user } = await requireUser();

  const [{ data: track }, { data: rating }, { data: albumLink }] = await Promise.all([
    supabase
      .from("tracks")
      .select("id,name,duration_ms,artists:primary_artist_id(name)")
      .eq("id", trackId)
      .maybeSingle(),
    supabase
      .from("song_ratings")
      .select("rating,is_public,rated_at")
      .eq("user_id", user.id)
      .eq("track_id", trackId)
      .maybeSingle(),
    supabase
      .from("album_tracks")
      .select("albums:album_id(id,name)")
      .eq("track_id", trackId)
      .limit(1)
      .maybeSingle(),
  ]);

  if (!track) {
    notFound();
  }

  const artistName = pickNameRelation(track.artists as { name: string } | Array<{ name: string }> | null);
  const albumName = pickNameRelation(
    albumLink?.albums as { name: string } | Array<{ name: string }> | null,
  );

  // Determine albumId safely — `albumLink.albums` may be an array or an object.
  let albumIdValue = "";
  const albumsField = (albumLink as any)?.albums;
  if (albumsField) {
    if (Array.isArray(albumsField)) {
      albumIdValue = albumsField[0]?.id ?? "";
    } else {
      albumIdValue = albumsField.id ?? "";
    }
  }

  return (
    <section className="space-y-4">
      <h1 className="font-heading text-3xl">{track.name}</h1>
      <Card>
        <CardHeader>
          <CardTitle>Song details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Artist: {artistName}</p>
          <p>Duration: {Math.round(Number(track.duration_ms) / 1000)}s</p>
          <p>Album: {albumName}</p>
          <div className="flex items-center gap-2">
            <Badge variant={rating ? "default" : "secondary"}>
              {rating ? `${Number(rating.rating).toFixed(1)} stars` : "Not listened to yet"}
            </Badge>
            {/* Inline client rating form: clicking a star will POST and update live average. */}
            <div className="ml-2">
              <SongRatingForm trackId={trackId} albumId={albumIdValue} initialRating={rating ? Number(rating.rating) : null} />
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
