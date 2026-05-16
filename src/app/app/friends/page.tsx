"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FriendsList } from "./friends-list";
import { FriendRequests } from "./friend-requests";
import { FriendActivity } from "./friend-activity";
import { AddFriendDialog } from "./add-friend-dialog";

export default function FriendsPage() {
  const [activeTab, setActiveTab] = useState("friends");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Friends</h1>
          <p className="text-muted-foreground mt-2">
            Manage your friends, requests, and see their activity
          </p>
        </div>
        <AddFriendDialog />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="friends">Friends</TabsTrigger>
          <TabsTrigger value="requests">Requests</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="friends" className="space-y-4">
          <FriendsList />
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          <FriendRequests />
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <FriendActivity />
        </TabsContent>
      </Tabs>
    </div>
  );
}
