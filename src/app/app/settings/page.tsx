import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { signOutAction, syncSavedAlbumsAction, updateUsernameAction } from "@/server/actions/app-actions";
import { requireUser } from "@/server/auth";
import { cn } from "@/lib/utils";
import LocalTime from "@/components/local-time";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ spotify?: string }>;
}) {
  const params = await searchParams;
  const { supabase, user } = await requireUser();

  const [{ data: spotifyAccount }, { data: syncState }, { data: userSettings }, { data: userProfile }] = await Promise.all([
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
    supabase.from("users").select("handle").eq("id", user.id).maybeSingle(),
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
          <CardTitle>Username</CardTitle>
          <CardDescription>
            This is the public name other users see when they find or add you.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <form action={updateUsernameAction} className="space-y-3 max-w-md">
            <div className="space-y-2">
              <Input
                id="username"
                name="username"
                type="text"
                required
                minLength={3}
                maxLength={30}
                defaultValue={userProfile?.handle ?? ""}
                placeholder="yourname"
                autoComplete="username"
              />
              <p className="text-xs text-muted-foreground">
                Use letters, numbers, and underscores only.
              </p>
            </div>
            {params.username ? (
              <p className={`text-sm ${params.username === "updated" ? "text-green-600" : "text-destructive"}`}>
                {params.username === "updated"
                  ? "Username updated successfully."
                  : decodeURIComponent(params.username)}
              </p>
            ) : null}
            <Button type="submit">Save username</Button>
          </form>
        </CardContent>
      </Card>

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
            Last sync: <LocalTime iso={syncState?.completed_at ?? null} />
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

      {/* Tags UI removed per user request */}

      <form action={signOutAction}>
        <Button type="submit" variant="outline">Sign out</Button>
      </form>
    </section>
  );
}
