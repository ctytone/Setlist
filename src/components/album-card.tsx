"use client";

import Image from "next/image";
import Link from "next/link";
import { Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { deleteAlbumAction } from "@/server/actions/app-actions";

export function AlbumCard({
  id,
  name,
  artist,
  coverUrl,
  rating,
  status,
}: {
  id: string;
  name: string;
  artist: string;
  coverUrl: string | null;
  rating: number | null;
  status: string | null;
}) {
  return (
    <div className="relative">
      <Link href={`/app/albums/${id}`}>
        <Card className="overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md">
          <CardContent className="p-0">
            <div className="aspect-square w-full bg-muted/60">
              {coverUrl ? (
                <Image
                  src={coverUrl}
                  alt={name}
                  width={400}
                  height={400}
                  className="h-full w-full object-cover"
                />
              ) : null}
            </div>
            <div className="space-y-2 p-4">
              <p className="line-clamp-1 text-sm font-medium">{name}</p>
              <p className="line-clamp-1 text-xs text-muted-foreground">{artist}</p>
              <div className="flex items-center justify-between gap-2 text-xs">
                <span>
                  {rating === null ? "Not listened" : `${rating.toFixed(2)} avg`}
                </span>
                {status ? <Badge variant="secondary">{status.replaceAll("_", " ")}</Badge> : null}
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
      <form action={deleteAlbumAction} className="absolute right-2 top-2">
        <input type="hidden" name="albumId" value={id} />
        <Button
          type="submit"
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground"
          onClick={(e) => e.stopPropagation()}
          title="Remove album from library"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
