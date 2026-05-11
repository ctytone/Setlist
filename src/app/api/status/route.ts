import { NextResponse } from "next/server";

import { statusSchema } from "@/lib/schemas";
import { requireUser } from "@/server/auth";
import { revalidatePath } from "next/cache";

export async function POST(request: Request) {
  const { supabase, user } = await requireUser();

  const body = await request.json().catch(() => ({}));

  const parsed = statusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  await supabase.from("item_statuses").upsert(
    {
      user_id: user.id,
      item_type: parsed.data.itemType,
      item_id: parsed.data.itemId,
      status: parsed.data.status,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "user_id,item_type,item_id",
    },
  );

  revalidatePath("/app/albums");
  revalidatePath(`/app/albums/${parsed.data.itemId}`);

  return NextResponse.json({ status: parsed.data.status });
}
