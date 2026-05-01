import { NextResponse } from "next/server";

import { requireUser } from "@/server/auth";

export async function GET(request: Request, { params }: { params: { albumId: string } }) {
  const { supabase } = await requireUser();

  const albumId = params.albumId;

  const { data } = await supabase
    .from("user_albums")
    .select("derived_rating")
    .eq("album_id", albumId)
    .maybeSingle();

  return NextResponse.json({ average: data?.derived_rating ?? null });
}
