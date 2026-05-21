import { NextResponse } from "next/server";
import sharp from "sharp";

import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";

function getAvatarObjectPath(avatarUrl: string | null | undefined) {
  if (!avatarUrl) {
    return null;
  }

  try {
    const parsed = new URL(avatarUrl);
    const prefix = "/storage/v1/object/public/avatars/";

    if (!parsed.pathname.startsWith(prefix)) {
      return null;
    }

    return decodeURIComponent(parsed.pathname.slice(prefix.length));
  } catch {
    return null;
  }
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }

  return "Failed to upload profile picture.";
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const serviceRoleClient = createServiceRoleClient();

  const { data: authData, error: authError } = await supabase.auth.getUser();
  const user = authData.user;

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const avatarEntry = formData.get("avatar");

  if (!(avatarEntry instanceof File) || avatarEntry.size <= 0) {
    return NextResponse.json({ error: "Please choose an image file." }, { status: 400 });
  }

  if (!avatarEntry.type.startsWith("image/")) {
    return NextResponse.json({ error: "Please upload a PNG, JPG, WebP, or HEIC image." }, { status: 400 });
  }

  if (avatarEntry.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "Please keep avatar images under 10 MB." }, { status: 400 });
  }

  const { data: existingProfile, error: profileLookupError } = await supabase
    .from("users")
    .select("avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  if (profileLookupError) {
    return NextResponse.json({ error: getErrorMessage(profileLookupError) }, { status: 400 });
  }

  let avatarBuffer: Buffer;

  try {
    const rawBuffer = Buffer.from(await avatarEntry.arrayBuffer());
    avatarBuffer = await sharp(rawBuffer)
      .rotate()
      .resize(512, 512, { fit: "cover", position: "centre" })
      .webp({ quality: 84 })
      .toBuffer();
  } catch {
    return NextResponse.json({ error: "That image could not be processed. Try a different photo." }, { status: 400 });
  }

  const avatarPath = `${user.id}/${crypto.randomUUID()}.webp`;
  const { error: uploadError } = await serviceRoleClient.storage
    .from("avatars")
    .upload(avatarPath, avatarBuffer, {
      contentType: "image/webp",
      upsert: true,
    });

  if (uploadError) {
    return NextResponse.json({ error: getErrorMessage(uploadError) }, { status: 400 });
  }

  const { data: publicUrlData } = serviceRoleClient.storage
    .from("avatars")
    .getPublicUrl(avatarPath);

  const avatarUrl = `${publicUrlData.publicUrl}?v=${Date.now()}`;
  const now = new Date().toISOString();

  const { error: authUpdateError } = await supabase.auth.updateUser({
    data: {
      avatar_url: avatarUrl,
      picture: avatarUrl,
    },
  });

  if (authUpdateError) {
    return NextResponse.json({ error: getErrorMessage(authUpdateError) }, { status: 400 });
  }

  const { error: profileError } = await supabase.from("users").upsert(
    {
      id: user.id,
      avatar_url: avatarUrl,
      updated_at: now,
    },
    { onConflict: "id" },
  );

  if (profileError) {
    return NextResponse.json({ error: getErrorMessage(profileError) }, { status: 400 });
  }

  const previousAvatarPath = getAvatarObjectPath(existingProfile?.avatar_url);

  if (previousAvatarPath && previousAvatarPath !== avatarPath) {
    await serviceRoleClient.storage.from("avatars").remove([previousAvatarPath]);
  }

  return NextResponse.json({ avatarUrl });
}