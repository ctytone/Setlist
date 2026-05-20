import { NextResponse } from "next/server";

import { requireUser } from "@/server/auth";
import { acceptFriendRequest } from "@/server/actions/friends";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Failed to accept friend request";
}

export async function POST(request: Request) {
  await requireUser();

  const body = await request.json().catch(() => ({}));
  const requestId = typeof body?.requestId === "string" ? body.requestId.trim() : "";

  if (!requestId) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    await acceptFriendRequest(requestId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 400 });
  }
}
