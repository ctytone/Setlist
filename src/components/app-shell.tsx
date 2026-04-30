import Link from "next/link";
import { Music2, Search, BarChart3, Settings, Disc3 } from "lucide-react";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/app/albums", label: "Albums", icon: Disc3 },
  { href: "/app/search", label: "Search", icon: Search },
  { href: "/app/stats", label: "Stats", icon: BarChart3 },
  { href: "/app/settings", label: "Settings", icon: Settings },
];

function NavLinks() {
  return (
    <div className="flex items-center gap-1">
      {navItems.map((item) => {
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur">
        <div className="container mx-auto flex min-h-16 items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/app/albums" className="inline-flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-primary">
              <Music2 className="h-4 w-4" />
            </span>
            <span className="font-heading text-lg">Setlist</span>
          </Link>
          <div className="hidden md:block">
            <NavLinks />
          </div>
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger render={<Button size="sm" variant="outline" />}>
                Menu
              </SheetTrigger>
              <SheetContent side="right">
                <div className="mt-8">
                  <NavLinks />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
