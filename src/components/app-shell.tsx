"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Music2, Search, Bell, BarChart3, Settings, Disc3, Users } from "lucide-react";

import { cn } from "@/lib/utils";

const navItems = [
  { href: "/app/albums", label: "Albums", icon: Disc3 },
  { href: "/app/search", label: "Search", icon: Search },
  { href: "/app/friends", label: "Friends", icon: Users },
  { href: "/app/notifications", label: "Notifications", icon: Bell },
  { href: "/app/stats", label: "Stats", icon: BarChart3 },
  { href: "/app/settings", label: "Settings", icon: Settings },
];

function NavLinks({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();

  return (
    <div className={mobile ? "grid grid-cols-6 gap-1" : "flex items-center gap-1"}>
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              mobile
                ? "flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[11px] leading-tight transition-colors"
                : "inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm transition-colors",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-background">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur">
        <div className="container mx-auto flex min-h-16 items-center justify-between gap-4 px-4 py-3 pt-[calc(0.75rem+env(safe-area-inset-top))] sm:px-6 lg:px-8">
          <Link href="/app/albums" className="inline-flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-primary">
              <Music2 className="h-4 w-4" />
            </span>
            <span className="font-heading text-lg">Setlist</span>
          </Link>
          <div className="hidden md:block">
            <NavLinks />
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6 pb-[calc(6.5rem+env(safe-area-inset-bottom))] sm:px-6 lg:px-8 md:pb-6">
        {children}
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border/70 bg-background/95 backdrop-blur md:hidden">
        <div className="mx-auto max-w-5xl px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
          <NavLinks mobile />
        </div>
      </nav>
    </div>
  );
}
