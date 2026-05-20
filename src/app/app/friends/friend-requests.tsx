"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { FriendRequestsClient } from "./friend-requests-client";

export default function FriendRequests() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/friends/list");
        const payload = await res.json();
        if (!res.ok) {
          setError(payload?.error || "Failed to load requests");
          setRequests([]);
        } else {
          setRequests(payload.received || []);
        }
      } catch (err: any) {
        setError(err?.message || String(err));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-sm text-muted-foreground">Loading requests…</div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div>
          <h2 className="text-lg font-medium">Pending friend requests</h2>
          <p className="text-sm text-destructive">Error loading requests: {error}</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-2">
        <div>
          <h2 className="text-lg font-medium">Pending friend requests</h2>
          <p className="text-sm text-muted-foreground">Requests sent to you that are awaiting your response.</p>
        </div>

        <FriendRequestsClient requests={requests} />
      </div>
    </Card>
  );
}
