import { AlbumCard } from "@/components/album-card";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { requireUser } from "@/server/auth";

type AlbumRelation =
  | {
      id: string;
      name: string;
      release_date: string | null;
      cover_url: string | null;
      artists: { name: string } | Array<{ name: string }> | null;
    }
  | Array<{
      id: string;
      name: string;
      release_date: string | null;
      cover_url: string | null;
      artists: { name: string } | Array<{ name: string }> | null;
    }>
  | null;

function pickAlbum(albumRelation: AlbumRelation) {
  if (!albumRelation) {
    return null;
  }

  return Array.isArray(albumRelation) ? albumRelation[0] ?? null : albumRelation;
}

function pickArtistName(artistRelation: { name: string } | Array<{ name: string }> | null) {
  if (!artistRelation) {
    return "";
  }

  if (Array.isArray(artistRelation)) {
    return artistRelation[0]?.name ?? "";
  }

  return artistRelation.name;
}

export default async function AlbumsPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    year?: string;
    artist?: string;
    sort?: string;
  }>;
}) {
  const params = await searchParams;
  const { supabase, user } = await requireUser();

  let query = supabase
    .from("user_albums")
    .select(
      `
      album_id,
      derived_rating,
      albums (
        id,
        name,
        release_date,
        cover_url,
        artists:primary_artist_id (name)
      )
    `,
    )
    .eq("user_id", user.id);

  if (params.sort === "rating") {
    query = query.order("derived_rating", { ascending: false, nullsFirst: false });
  } else {
    query = query.order("updated_at", { ascending: false });
  }

  console.log("[Albums page] User ID:", user.id);
  const { data: rows, error } = await query;
  console.log("[Albums page] Query result:", { rowCount: rows?.length, error, sample: rows?.[0] });

  // Fetch item statuses separately since there's no direct FK relationship
  const albumIds = (rows ?? []).map((row) => row.album_id);
  const { data: itemStatuses } = await supabase
    .from("item_statuses")
    .select("item_id,status")
    .eq("user_id", user.id)
    .eq("item_type", "album")
    .in("item_id", albumIds.length > 0 ? albumIds : ["00000000-0000-0000-0000-000000000000"]);

  const statusMap = new Map(itemStatuses?.map((s) => [s.item_id, s]) ?? []);

  const filtered = (rows ?? []).filter((row) => {
    const album = pickAlbum(row.albums as AlbumRelation);
    if (!album) {
      console.log("[Albums page] Filtered out row with null album:", row);
    }
    const status = statusMap.get(row.album_id)?.status;
    const releaseYear = album?.release_date?.slice(0, 4);
    const artistName = pickArtistName(album?.artists ?? null);

    if (params.status && params.status !== "all" && status !== params.status) {
      return false;
    }

    if (params.year && !releaseYear?.includes(params.year)) {
      return false;
    }

    if (params.artist && !artistName.toLowerCase().includes(params.artist.toLowerCase())) {
      return false;
    }

    return true;
  });

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl">Your albums</h1>
          <p className="text-sm text-muted-foreground">
            Filter by status, artist, year, and rating-derived ordering.
          </p>
        </div>
        <Badge variant="outline">{filtered.length} albums</Badge>
      </div>

      <form className="grid gap-3 rounded-lg border border-border/70 bg-card/70 p-4 sm:grid-cols-4">
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Status</label>
          <Select name="status" defaultValue={params.status ?? "all"}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="want_to_listen">Want to listen</SelectItem>
              <SelectItem value="currently_listening">Currently listening</SelectItem>
              <SelectItem value="rated">Rated</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Artist</label>
          <Input name="artist" defaultValue={params.artist ?? ""} placeholder="Search artist" />
        </div>
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Year</label>
          <Input name="year" defaultValue={params.year ?? ""} placeholder="YYYY" />
        </div>
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Sort</label>
          <Select name="sort" defaultValue={params.sort ?? "recent"}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Recently added</SelectItem>
              <SelectItem value="rating">Highest average rating</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" className="sm:col-span-4">
          Apply filters
        </Button>
      </form>

      {filtered.length ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {filtered.map((row) => {
            const album = pickAlbum(row.albums as AlbumRelation);
            const status = statusMap.get(row.album_id)?.status ?? null;

            return (
              <AlbumCard
                key={row.album_id}
                id={row.album_id}
                name={album?.name ?? "Unknown album"}
                artist={pickArtistName(album?.artists ?? null) || "Unknown artist"}
                coverUrl={album?.cover_url ?? null}
                rating={row.derived_rating ? Number(row.derived_rating) : null}
                status={status}
              />
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No albums yet"
          description="Sync your Spotify saved albums or search manually to start building your collection."
        />
      )}
    </section>
  );
}
