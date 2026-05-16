"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { getFriendsList, removeFriend } from "@/server/actions/friends";
import { Friend } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Trash2 } from "lucide-react";

export function FriendsList() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadFriends();
  }, []);

  const loadFriends = async () => {
    try {
      setLoading(true);
      const data = await getFriendsList();
      setFriends(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load friends list",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    try {
      await removeFriend(friendId);
      setFriends(friends.filter((f) => f.id !== friendId));
      toast({
        title: "Success",
        description: "Friend removed",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove friend",
        variant: "destructive",
      });
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

  if (friends.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">No friends yet</p>
        <p className="text-sm text-muted-foreground mt-1">
          Add friends to start comparing ratings and seeing their activity
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {friends.map((friend) => (
        <Card
          key={friend.id}
          className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {friend.avatar_url ? (
              <Image
                src={friend.avatar_url}
                alt={friend.display_name || friend.handle || "User"}
                width={40}
                height={40}
                className="rounded-full"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-muted" />
            )}
            <div className="min-w-0">
              <p className="font-medium truncate">
                {friend.display_name || friend.handle}
              </p>
              {friend.display_name && (
                <p className="text-sm text-muted-foreground truncate">
                  @{friend.handle}
                </p>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleRemoveFriend(friend.id)}
            className="ml-2 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </Card>
      ))}
    </div>
  );
}
