"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";

function SyncLibraryButtonContent() {
  const { pending } = useFormStatus();
  const [showCheck, setShowCheck] = useState(false);
  const wasPendingRef = useRef(false);
  const checkTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (wasPendingRef.current && !pending) {
      setShowCheck(true);

      if (checkTimerRef.current) {
        window.clearTimeout(checkTimerRef.current);
      }

      checkTimerRef.current = window.setTimeout(() => {
        setShowCheck(false);
        checkTimerRef.current = null;
      }, 1100);
    }

    wasPendingRef.current = pending;

    return () => {
      if (checkTimerRef.current) {
        window.clearTimeout(checkTimerRef.current);
      }
    };
  }, [pending]);

  return (
    <Button type="submit" disabled={pending} aria-busy={pending}>
      {showCheck ? <Check className="h-4 w-4 text-emerald-600" /> : pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      <span>{showCheck ? "Synced" : pending ? "Syncing library" : "Sync library"}</span>
    </Button>
  );
}

export function SyncLibraryButton() {
  return <SyncLibraryButtonContent />;
}