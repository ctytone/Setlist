import { NextResponse, NextRequest } from "next/server";

import { requireUser } from "@/server/auth";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ albumId: string }> },
) {
  const { supabase } = await requireUser();

  const { albumId } = await context.params;

  const { data } = await supabase
    .from("user_albums")
    .select("derived_rating")
    .eq("album_id", albumId)
    .maybeSingle();

  return NextResponse.json({ average: data?.derived_rating ?? null });
}
