import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const highlights = [
  "Rate songs in 0.5-star increments",
  "Auto-calculate album scores from rated tracks",
  "Sync saved Spotify albums or add manually",
  "Track statuses, tags, and listening progress",
];

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background text-foreground">
      <div className="hero-glow" />
      <main className="container relative mx-auto flex flex-1 flex-col px-4 py-10 sm:px-6 lg:px-8">
        <section className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center gap-8 py-10 md:py-16">
          <span className="font-heading text-sm uppercase tracking-[0.24em] text-muted-foreground">
            Setlist
          </span>
          <h1 className="max-w-3xl font-heading text-4xl leading-tight text-balance sm:text-5xl md:text-6xl">
            A cleaner way to track every album and song you have actually listened to.
          </h1>
          <p className="max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg">
            Keep your own music diary with Spotify import, track-level ratings, tags,
            and polished stats built for long-term collecting.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/auth/sign-up"
              className={cn(buttonVariants({ size: "lg" }), "rounded-full px-7")}
            >
              Create account
            </Link>
            <Link
              href="/app/albums"
              className={cn(buttonVariants({ size: "lg", variant: "outline" }), "rounded-full px-7")}
            >
              Open app
            </Link>
          </div>
          <div className="grid gap-3 pt-4 sm:grid-cols-2">
            {highlights.map((item) => (
              <Card key={item} className="border-border/70 bg-card/70 backdrop-blur">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{item}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 text-sm text-muted-foreground">
                  Core-first architecture with room for future public sharing.
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
      <footer className="container mx-auto border-t border-border/70 px-4 py-5 text-xs text-muted-foreground sm:px-6 lg:px-8">
        Built with Next.js, Supabase, Spotify API, and shadcn/ui.
      </footer>
    </div>
  );
}
