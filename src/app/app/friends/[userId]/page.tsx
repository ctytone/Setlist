import Image from "next/image";
import { notFound } from "next/navigation";

import { AlbumCard } from "@/components/album-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/server/auth";
import { createServiceRoleClient } from "@/lib/supabase/server";

type ProfileRow = {
  id: string;
  handle: string | null;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

type ProfileAlbumRow = {
  album_id: string;
  derived_rating: number | string | null;
  updated_at: string;
  albums: {
    id: string;
    name: string;
    cover_url: string | null;
    primary_artist_id: string | null;
    artists: { name: string } | Array<{ name: string }> | null;
  } | Array<{
    id: string;
    name: string;
    cover_url: string | null;
    primary_artist_id: string | null;
    artists: { name: string } | Array<{ name: string }> | null;
  }> | null;
};

type ProfileRatingRow = {
  track_id: string;
  rating: number | string;
  is_public: boolean;
  rated_at: string;
  tracks: {
    id: string;
    name: string;
    duration_ms: number | null;
    artists: { name: string } | Array<{ name: string }> | null;
  } | Array<{
    id: string;
    name: string;
    duration_ms: number | null;
    artists: { name: string } | Array<{ name: string }> | null;
  }> | null;
};

type ProfileActivityRow = {
  id: string;
  user_id: string;
  actor_id: string;
  action: string;
  subject_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  is_read: boolean;
  actor: ProfileRow | Array<ProfileRow> | null;
};

async function isFriendWithUser(currentUserId: string, targetUserId: string) {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("friend_activity")
    .select("id")
    .or(
      `and(user_id.eq.${currentUserId},actor_id.eq.${targetUserId},action.eq.friend_added),and(user_id.eq.${targetUserId},actor_id.eq.${currentUserId},action.eq.friend_added)`
    )
    .limit(1);

  if (error) {
    throw error;
  }

  return (data ?? []).length > 0;
}

function formatJoinedDate(iso: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

export default async function FriendProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const { supabase, user } = await requireUser();
  const serviceRoleClient = createServiceRoleClient();

  const [
    { data: profile },
    { data: albumRows },
    { data: ratingRows },
    { data: activityRows },
  ] =
    await Promise.all([
      serviceRoleClient
        .from("users")
        .select("id,handle,display_name,avatar_url,created_at,updated_at")
        .eq("id", userId)
        .maybeSingle(),
      serviceRoleClient
        .from("user_albums")
        .select("album_id,derived_rating,updated_at,albums:album_id(id,name,cover_url,primary_artist_id,artists:primary_artist_id(name))")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })
        .limit(8),
      serviceRoleClient
        .from("song_ratings")
        .select("track_id,rating,is_public,rated_at,tracks:track_id(id,name,duration_ms,artists:primary_artist_id(name))")
        .eq("user_id", userId)
        .order("rated_at", { ascending: false })
        .limit(8),
      serviceRoleClient
        .from("friend_activity")
        .select("id,user_id,actor_id,action,subject_id,metadata,created_at,is_read,actor:actor_id(id,handle,display_name,avatar_url,created_at,updated_at)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(6),
    ]);

  if (!profile) {
    notFound();
  }

  const canViewProfile = profile.id === user.id || (await isFriendWithUser(user.id, profile.id));

  if (!canViewProfile) {
    notFound();
  }

  const displayName = profile.display_name || profile.handle || "User";
  const albums = (albumRows ?? []) as ProfileAlbumRow[];
  const ratings = (ratingRows ?? []) as ProfileRatingRow[];
  const activities = (activityRows ?? []) as ProfileActivityRow[];

  const albumCount = albums.length;
  const ratingCount = ratings.filter((entry) => entry.is_public || profile.id === user.id).length;
  const activityCount = activities.length;

  function pickRelationName(relation: { name: string } | Array<{ name: string }> | null | undefined) {
    if (!relation) {
      return "Unknown";
    }

    return Array.isArray(relation) ? relation[0]?.name ?? "Unknown" : relation.name;
  }

  return (
    <section className="space-y-6">
      <Card className="overflow-hidden">
        <CardContent className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
          <div className="relative h-28 w-28 overflow-hidden rounded-3xl border border-border/70 bg-muted shadow-sm">
            {profile.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={displayName}
                fill
                sizes="112px"
                className="object-cover"
                priority
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-4xl font-semibold text-muted-foreground">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-heading text-3xl">{displayName}</h1>
              {profile.handle ? <Badge variant="outline">@{profile.handle}</Badge> : null}
              {profile.id === user.id ? <Badge>Your profile</Badge> : <Badge variant="secondary">Friend</Badge>}
            </div>
            <p className="text-sm text-muted-foreground">
              Joined {formatJoinedDate(profile.created_at)}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Albums</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{albumCount}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Ratings</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{ratingCount}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Activity</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{activityCount}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {activities.length ? (
            activities.map((activity) => {
              const actor = Array.isArray(activity.actor) ? activity.actor[0] ?? null : activity.actor;
              const actorName = actor?.display_name || actor?.handle || "Unknown user";

              return (
                <div key={activity.id} className="flex items-start justify-between gap-3 rounded-md border border-border/70 p-3">
                  <div className="min-w-0 space-y-1">
                    <p className="font-medium">
                      {actorName} <span className="text-muted-foreground">{activity.action.replaceAll("_", " ")}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(activity.created_at))}
                    </p>
                  </div>
                  {activity.metadata && "albumName" in activity.metadata && activity.metadata.albumName ? (
                    <Badge variant="outline">{String(activity.metadata.albumName)}</Badge>
                  ) : null}
                </div>
              );
            })
          ) : (
            <p className="text-muted-foreground">No recent activity yet.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent ratings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {ratings.length ? (
            ratings.map((rating) => {
              const track = Array.isArray(rating.tracks) ? rating.tracks[0] ?? null : rating.tracks;
              const artistName = pickRelationName(track?.artists);

              return (
                <div key={rating.track_id} className="flex items-center justify-between gap-3 rounded-md border border-border/70 p-3 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{track?.name ?? "Unknown track"}</p>
                    <p className="text-xs text-muted-foreground truncate">{artistName}</p>
                  </div>
                  <Badge variant={rating.is_public ? "default" : "secondary"}>{Number(rating.rating).toFixed(1)} stars</Badge>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-muted-foreground">No ratings yet.</p>
          )}
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h2 className="font-heading text-xl">Recent albums</h2>
        {albums.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {albums.map((row) => {
              const album = Array.isArray(row.albums) ? row.albums[0] ?? null : row.albums;
              const artistName = pickRelationName(album?.artists);

              if (!album) {
                return null;
              }

              return (
                <AlbumCard
                  key={row.album_id}
                  id={row.album_id}
                  name={album.name}
                  artist={artistName}
                  coverUrl={album.cover_url}
                  rating={row.derived_rating === null ? null : Number(row.derived_rating)}
                  status={null}
                />
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">No albums yet.</CardContent>
          </Card>
        )}
      </div>
    </section>
  );
}