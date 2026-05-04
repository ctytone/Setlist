import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createTagAction, signOutAction, syncSavedAlbumsAction } from "@/server/actions/app-actions";
import { requireUser } from "@/server/auth";
import { cn } from "@/lib/utils";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ spotify?: string }>;
}) {
  const params = await searchParams;
  const { supabase, user } = await requireUser();

  const [{ data: spotifyAccount }, { data: syncState }, { data: userSettings }] = await Promise.all([
    supabase
      .from("spotify_accounts")
      .select("spotify_user_id,spotify_display_name,updated_at")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("sync_state")
      .select("status,completed_at,imported_count,last_error")
      .eq("user_id", user.id)
      .eq("source", "spotify_saved_albums")
      .maybeSingle(),
    supabase.from("user_settings").select("song_ratings_public_default").eq("user_id", user.id).maybeSingle(),
  ]);

  return (
    <section className="space-y-5">
      <div>
        <h1 className="font-heading text-3xl">Settings</h1>
        <p className="text-sm text-muted-foreground">Account, privacy defaults, Spotify link, and sync controls.</p>
      </div>

      {params.spotify ? (
        <p className="rounded-md border border-border/70 bg-muted/40 p-3 text-sm">
          Spotify link result: {params.spotify}
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Spotify account</CardTitle>
          <CardDescription>
            Link Spotify to sync your saved albums. Manual search and rating still work without linking.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Linked account: {spotifyAccount?.spotify_display_name ?? spotifyAccount?.spotify_user_id ?? "Not linked"}
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/api/spotify/oauth/start"
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              Link Spotify
            </Link>
            <form action={syncSavedAlbumsAction}>
              <Button type="submit" disabled={!spotifyAccount}>
                Sync library
              </Button>
            </form>
          </div>
          <p>
            Last sync: {syncState?.completed_at ? new Date(syncState.completed_at).toLocaleString() : "Never"}
          </p>
          {syncState?.status ? <p>Status: {syncState.status}</p> : null}
          {syncState?.imported_count ? <p>Imported albums: {syncState.imported_count}</p> : null}
          {syncState?.last_error ? <p className="text-destructive">Last error: {syncState.last_error}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rating privacy defaults</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Song ratings are public by default.
          {userSettings?.song_ratings_public_default === false
            ? " Your current preference is private by default."
            : " You can still set any rating to private while saving."}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tags</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createTagAction} className="flex gap-2">
            <Input name="name" placeholder="Create a reusable tag" className="max-w-sm" />
            <Button type="submit" variant="outline">
              Save tag
            </Button>
          </form>
        </CardContent>
      </Card>

      <form action={signOutAction}>
        <Button type="submit" variant="outline">Sign out</Button>
      </form>
    </section>
  );
}
