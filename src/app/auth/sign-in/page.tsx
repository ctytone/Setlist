import Link from "next/link";

import { signInAction } from "@/server/actions/app-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-md items-center px-4 py-10 sm:px-0">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="font-heading text-2xl">Sign in</CardTitle>
          <CardDescription>Access your albums, songs, ratings, and tags.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {params.error ? (
            <p className="rounded-md border border-destructive/40 bg-destructive/10 p-2 text-sm text-destructive">
              {decodeURIComponent(params.error)}
            </p>
          ) : null}
          <form action={signInAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required minLength={8} />
            </div>
            <Button type="submit" className="w-full">
              Sign in
            </Button>
          </form>
          <p className="text-sm text-muted-foreground">
            Spotify linking is reserved for the admin account after sign-in.
          </p>
          <p className="text-sm text-muted-foreground">
            New here? <Link href="/auth/sign-up" className="underline">Create an account</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
