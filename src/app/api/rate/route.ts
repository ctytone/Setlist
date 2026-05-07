import { NextResponse } from "next/server";

import { requireUser } from "@/server/auth";
import { songRatingSchema } from "@/lib/schemas";
import { recalculateAlbumRating } from "@/server/library";

export async function POST(request: Request) {
  const { supabase, user } = await requireUser();

  const body = await request.json().catch(() => ({}));
  const clear = body.clear === true || body.clear === "true";

  if (clear) {
    const trackId = typeof body.trackId === "string" ? body.trackId : "";
    const parsedTrackId = songRatingSchema.shape.trackId.safeParse(trackId);
    if (!parsedTrackId.success) {
      return NextResponse.json({ error: "Invalid rating" }, { status: 400 });
    }

    await supabase
      .from("song_ratings")
      .delete()
      .eq("user_id", user.id)
      .eq("track_id", parsedTrackId.data);
  } else {
    const raw = {
      trackId: body.trackId,
      rating: Number(body.rating),
      isPublic: true,
    };

    const parsed = songRatingSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid rating" }, { status: 400 });
    }

    await supabase.from("song_ratings").upsert(
      {
        user_id: user.id,
        track_id: parsed.data.trackId,
        rating: parsed.data.rating,
        is_public: true,
        rated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,track_id" },
    );
  }

  const albumId = body.albumId;
  let average = null;
  if (albumId) {
    average = await recalculateAlbumRating(albumId);
  }

  return NextResponse.json({ average });
}
