import Link from "next/link";

import { signUpAction } from "@/server/actions/app-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md items-center py-10">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="font-heading text-2xl">Create account</CardTitle>
          <CardDescription>
            Start tracking albums and songs. Spotify linking is optional.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {params.error ? (
            <p className="rounded-md border border-destructive/40 bg-destructive/10 p-2 text-sm text-destructive">
              {decodeURIComponent(params.error)}
            </p>
          ) : null}
          <form action={signUpAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                type="text"
                required
                minLength={3}
                maxLength={30}
                autoComplete="username"
                placeholder="yourname"
              />
              <p className="text-xs text-muted-foreground">
                This will be your public profile username.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required minLength={8} />
            </div>
            <Button type="submit" className="w-full">
              Create account
            </Button>
          </form>
          <p className="text-sm text-muted-foreground">
            Already have an account? <Link href="/auth/sign-in" className="underline">Sign in</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
