"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

import { FriendRequest } from "@/lib/types";

export function FriendRequestsClient({ requests }: { requests: FriendRequest[] }) {
  const [items, setItems] = useState(requests || []);
  const [loadingIds, setLoadingIds] = useState<string[]>([]);
  const { toast } = useToast();

  async function postAction(path: string, requestId: string) {
    setLoadingIds((s) => [...s, requestId]);
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ requestId }),
      });

      const payload = (await res.json().catch(() => ({}))) as { error?: string };

      if (!res.ok) {
        throw new Error(payload.error || "Request failed");
      }

      setItems((prev) => prev.filter((i) => i.id !== requestId));
      toast({ title: "Success", description: "Request updated" });
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || String(err), variant: "destructive" });
    } finally {
      setLoadingIds((s) => s.filter((id) => id !== requestId));
    }
  }

  return (
    <ul className="space-y-2">
      {items.length === 0 && <div className="text-sm text-muted-foreground">No pending requests</div>}
      {items.map((req) => (
        <li key={req.id} className="flex items-center justify-between">
          <div>
            <div className="font-medium">{req.sender?.display_name || req.sender?.handle || req.sender_id}</div>
            <div className="text-xs text-muted-foreground">Requested {new Date(req.created_at).toLocaleString()}</div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" disabled={loadingIds.includes(req.id)} onClick={() => postAction("/api/friends/accept", req.id)}>
              Accept
            </Button>
            <Button size="sm" variant="ghost" disabled={loadingIds.includes(req.id)} onClick={() => postAction("/api/friends/reject", req.id)}>
              Reject
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
