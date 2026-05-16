"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  getFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
} from "@/server/actions/friends";
import { FriendRequest } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, X } from "lucide-react";

export function FriendRequests() {
  const [requests, setRequests] = useState<{
    received: FriendRequest[];
    sent: FriendRequest[];
  }>({
    received: [],
    sent: [],
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await getFriendRequests();
      setRequests(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load friend requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (requestId: string) => {
    try {
      await acceptFriendRequest(requestId);
      setRequests({
        ...requests,
        received: requests.received.filter((r) => r.id !== requestId),
      });
      toast({
        title: "Success",
        description: "Friend request accepted",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to accept request",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      await rejectFriendRequest(requestId);
      setRequests({
        ...requests,
        received: requests.received.filter((r) => r.id !== requestId),
      });
      toast({
        title: "Success",
        description: "Friend request rejected",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject request",
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

  return (
    <Tabs defaultValue="received" className="w-full">
      <TabsList className="grid w-full max-w-xs grid-cols-2">
        <TabsTrigger value="received">
          Received ({requests.received.length})
        </TabsTrigger>
        <TabsTrigger value="sent">Sent ({requests.sent.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="received" className="space-y-2 mt-4">
        {requests.received.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No pending requests</p>
          </Card>
        ) : (
          requests.received.map((request) => (
            <Card key={request.id} className="p-4 flex items-center gap-3">
              {request.sender?.avatar_url ? (
                <Image
                  src={request.sender.avatar_url}
                  alt={request.sender.display_name || request.sender.handle || "User"}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-muted" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">
                  {request.sender?.display_name || request.sender?.handle}
                </p>
                <p className="text-sm text-muted-foreground">
                  {new Date(request.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleAccept(request.id)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleReject(request.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))
        )}
      </TabsContent>

      <TabsContent value="sent" className="space-y-2 mt-4">
        {requests.sent.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No pending requests</p>
          </Card>
        ) : (
          requests.sent.map((request) => (
            <Card
              key={request.id}
              className="p-4 flex items-center gap-3 opacity-60"
            >
              {request.recipient?.avatar_url ? (
                <Image
                  src={request.recipient.avatar_url}
                  alt={request.recipient.display_name || request.recipient.handle || "User"}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-muted" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">
                  {request.recipient?.display_name || request.recipient?.handle}
                </p>
                <p className="text-sm text-muted-foreground">Pending...</p>
              </div>
            </Card>
          ))
        )}
      </TabsContent>
    </Tabs>
  );
}
