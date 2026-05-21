import Image from "next/image";
import { notFound } from "next/navigation";

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

  const [{ data: profile }, { count: albumCount }, { count: ratingCount }, { count: friendCount }] =
    await Promise.all([
      supabase
        .from("users")
        .select("id,handle,display_name,avatar_url,created_at,updated_at")
        .eq("id", userId)
        .maybeSingle(),
      supabase.from("user_albums").select("album_id", { count: "exact", head: true }).eq("user_id", userId),
      supabase.from("song_ratings").select("track_id", { count: "exact", head: true }).eq("user_id", userId),
      supabase
        .from("friend_activity")
        .select("id", { count: "exact", head: true })
        .eq("action", "friend_added")
        .or(`user_id.eq.${userId},actor_id.eq.${userId}`),
    ]);

  if (!profile) {
    notFound();
  }

  const canViewProfile = profile.id === user.id || (await isFriendWithUser(user.id, profile.id));

  if (!canViewProfile) {
    notFound();
  }

  const displayName = profile.display_name || profile.handle || "User";

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
          <CardContent className="text-2xl font-semibold">{albumCount ?? 0}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Ratings</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{ratingCount ?? 0}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Mutual graph</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{friendCount ?? 0}</CardContent>
        </Card>
      </div>
    </section>
  );
}