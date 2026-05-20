import { NextResponse } from "next/server";

import { requireUser } from "@/server/auth";
import { getFriendRequests } from "@/server/actions/friends";

export async function GET() {
  await requireUser();

  try {
    const data = await getFriendRequests();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message || String(error) }, { status: 500 });
  }
}
