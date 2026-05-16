"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  getFriendActivity,
  markActivityAsRead,
} from "@/server/actions/friends";
import type { FriendActivity } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";

const ACTION_LABELS: Record<string, string> = {
  friend_added: "became your friend",
  album_rated: "rated an album",
  album_shared: "shared an album",
  friend_request_received: "sent you a friend request",
};

export function FriendActivity() {
  const [activities, setActivities] = useState<FriendActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadActivity();
  }, []);

  const loadActivity = async () => {
    try {
      setLoading(true);
      const data = await getFriendActivity();
      setActivities(data);

      // Mark all as read
      await Promise.all(
        data
          .filter((a) => !a.is_read)
          .map((a) => markActivityAsRead(a.id))
      );
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load activity",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="h-16 animate-pulse" />
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">No activity yet</p>
        <p className="text-sm text-muted-foreground mt-1">
          Activity from friends will appear here
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {activities.map((activity) => (
        <Card
          key={activity.id}
          className={`p-4 ${activity.is_read ? "opacity-60" : "bg-muted/50"}`}
        >
          <div className="flex items-start gap-3">
            {activity.actor?.avatar_url ? (
              <Image
                src={activity.actor.avatar_url}
                alt={activity.actor.display_name || activity.actor.handle || "User"}
                width={40}
                height={40}
                className="rounded-full mt-1"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-muted mt-1" />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium">
                  {activity.actor?.display_name || activity.actor?.handle}
                </span>
                <span className="text-muted-foreground">
                  {ACTION_LABELS[activity.action] || activity.action}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(activity.created_at), {
                  addSuffix: true,
                })}
              </p>
              {activity.metadata?.albumName && (
                <Badge className="mt-2" variant="outline">
                  {activity.metadata.albumName as string}
                </Badge>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
