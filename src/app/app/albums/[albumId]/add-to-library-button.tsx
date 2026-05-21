"use client";

import { useActionState } from "react";
import { Check, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { addAlbumToLibraryAction, type AddAlbumToLibraryState } from "@/server/actions/app-actions";

const initialState: AddAlbumToLibraryState = { status: "idle" };

export function AddToLibraryButton({ albumId, initiallyAdded }: { albumId: string; initiallyAdded: boolean }) {
  const [state, formAction, pending] = useActionState<AddAlbumToLibraryState, FormData>(addAlbumToLibraryAction, {
    ...initialState,
    status: initiallyAdded ? "added" : "idle",
  });

  const isAdded = state.status === "added";
  const disabled = pending || isAdded;

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="albumId" value={albumId} />
      <Button type="submit" disabled={disabled} variant={isAdded ? "secondary" : "default"}>
        {isAdded ? <Check className="mr-2 size-4" /> : <Plus className="mr-2 size-4" />}
        {isAdded ? "Added to your library" : pending ? "Adding..." : "Add album to your library"}
      </Button>
      {state.status === "error" && state.message ? <span className="text-sm text-destructive">{state.message}</span> : null}
    </form>
  );
}