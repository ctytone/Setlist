"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function StatusForm({
  itemId,
  initialStatus,
  itemType = "album",
}: {
  itemId: string;
  initialStatus?: string | null;
  itemType?: string;
}) {
  const [status, setStatus] = useState(initialStatus ?? "want_to_listen");
  const [busy, setBusy] = useState(false);
  const [showCheck, setShowCheck] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);

    try {
      const res = await fetch("/api/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemType, itemId, status }),
      });

      if (res.ok) {
        setShowCheck(true);
        window.setTimeout(() => setShowCheck(false), 1100);
      } else {
        console.error("Failed to save status", await res.text());
      }
    } catch (err) {
      console.error(err);
    } finally {
      // short delay so check animation is visible even on very fast responses
      setTimeout(() => setBusy(false), 300);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="itemType" value={itemType} />
      <input type="hidden" name="itemId" value={itemId} />
      <select
        name="status"
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="rounded-md border border-input bg-background px-3 py-2 text-sm"
      >
        <option value="want_to_listen">Want to listen</option>
        <option value="currently_listening">Currently listening</option>
        <option value="rated">Rated</option>
      </select>
      <div className="relative flex items-center">
        <Button type="submit" variant="outline" disabled={busy}>
          Save status
        </Button>

        <span
          aria-hidden
          className={`ml-2 inline-block text-emerald-600 transition-all duration-300 ease-in-out transform ${
            showCheck ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"
          }`}
          style={{
            position: "absolute",
            right: -28,
            top: "50%",
            transform: showCheck ? "translateY(-50%)" : "translateY(-60%)",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>
    </form>
  );
}
