"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Camera, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { updateAvatarAction } from "@/server/actions/app-actions";

type AvatarUploadFormProps = {
  avatarUrl: string | null;
  displayName: string | null;
  handle: string | null;
};

function AvatarPreview({ avatarUrl, displayName, handle }: AvatarUploadFormProps) {
  const fallbackLabel = (displayName || handle || "User").trim();

  if (avatarUrl) {
    return (
      <div className="relative h-28 w-28 overflow-hidden rounded-3xl border border-border/70 bg-muted shadow-sm">
        <Image
          src={avatarUrl}
          alt={fallbackLabel}
          fill
          sizes="112px"
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div className="flex h-28 w-28 items-center justify-center rounded-3xl border border-dashed border-border/70 bg-muted/60 text-3xl font-semibold text-muted-foreground shadow-sm">
      {fallbackLabel.charAt(0).toUpperCase()}
    </div>
  );
}

function AvatarUploadRow({
  label,
  description,
  capture,
}: {
  label: string;
  description: string;
  capture?: "environment" | "user";
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);

  return (
    <form ref={formRef} action={updateAvatarAction} className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        name="avatar"
        accept="image/*"
        capture={capture}
        className="hidden"
        onChange={(event) => {
          if (!event.target.files?.length) {
            setSubmitting(false);
            return;
          }

          setSubmitting(true);
          formRef.current?.requestSubmit();
        }}
      />
      <Button
        type="button"
        variant="outline"
        className="w-full justify-start gap-3 px-3 py-6 text-left"
        onClick={() => {
          if (inputRef.current) {
            inputRef.current.value = "";
            inputRef.current.click();
          }
        }}
        disabled={submitting}
      >
        {capture ? <Camera className="size-4" /> : <Upload className="size-4" />}
        <span className="flex flex-col items-start gap-0.5">
          <span>{submitting ? "Uploading..." : label}</span>
          <span className="text-xs font-normal text-muted-foreground">{description}</span>
        </span>
      </Button>
    </form>
  );
}

export function AvatarUploadForm(props: AvatarUploadFormProps) {
  return (
    <div className="grid gap-4 md:grid-cols-[auto_1fr] md:items-start">
      <AvatarPreview {...props} />
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          We crop uploaded images to a square and convert them for fast loading.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <AvatarUploadRow
            label="Choose from library"
            description="Upload any image in your camera roll."
          />
          <AvatarUploadRow
            label="Take a new photo"
            description="Open the camera on your device."
            capture="environment"
          />
        </div>
      </div>
    </div>
  );
}