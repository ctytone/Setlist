import { NextResponse } from "next/server";

import { requireUser } from "@/server/auth";
import { sendFriendRequest } from "@/server/actions/friends";

export async function POST(request: Request) {
  const { user } = await requireUser();

  const body = await request.json().catch(() => ({}));
  const recipientUserId = typeof body?.recipientUserId === "string" ? body.recipientUserId.trim() : "";

  if (!recipientUserId) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (recipientUserId === user.id) {
    return NextResponse.json({ error: "Cannot send friend request to yourself" }, { status: 400 });
  }

  try {
    const requestRecord = await sendFriendRequest(recipientUserId);
    return NextResponse.json({ request: requestRecord });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to send friend request";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}