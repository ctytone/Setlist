import { AlbumCard } from "@/components/album-card";
import { EmptyState } from "@/components/empty-state";
import { requireUser } from "@/server/auth";

type ArtistAlbumRelation =
  | {
      id: string;
      name: string;
      cover_url: string | null;
      primary_artist_id: string | null;
    }
  | Array<{
      id: string;
      name: string;
      cover_url: string | null;
      primary_artist_id: string | null;
    }>
  | null;

function pickArtistAlbum(relation: ArtistAlbumRelation) {
  if (!relation) {
    return null;
  }

  return Array.isArray(relation) ? relation[0] ?? null : relation;
}

export default async function ArtistPage({
  params,
}: {
  params: Promise<{ artistId: string }>;
}) {
  const { artistId } = await params;
  const { supabase, user } = await requireUser();

  const { data: artist } = await supabase
    .from("artists")
    .select("id,name,image_url,popularity,genres,spotify_id")
    .eq("spotify_id", artistId)
    .maybeSingle();

  if (!artist) {
    return <EmptyState title="Artist not found" description="Try opening from an album page." />;
  }

  const { data: albums } = await supabase
    .from("user_albums")
    .select(
      `
      album_id,
      derived_rating,
      albums!inner(id,name,cover_url,primary_artist_id)
    `,
    )
    .eq("user_id", user.id)
    .eq("albums.primary_artist_id", artist.id);

  return (
    <section className="space-y-5">
      <div>
        <h1 className="font-heading text-3xl">{artist.name}</h1>
        <p className="text-sm text-muted-foreground">
          {artist.genres?.length ? artist.genres.join(", ") : "No genres imported yet"}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {(albums ?? []).map((row) => {
          const album = pickArtistAlbum(row.albums as ArtistAlbumRelation);

          return (
            <AlbumCard
              key={row.album_id}
              id={row.album_id}
              name={album?.name ?? "Unknown album"}
              artist={artist.name}
              coverUrl={album?.cover_url ?? null}
              rating={row.derived_rating ? Number(row.derived_rating) : null}
              status={null}
            />
          );
        })}
      </div>
    </section>
  );
}
