"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FriendActivity } from "./friend-activity";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell } from "lucide-react";

export function FriendRequests() {
  const { toast } = useToast();

  return (
    <Card className="p-6">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-muted p-2 text-muted-foreground">
          <Bell className="h-4 w-4" />
        </div>
        <div className="space-y-1">
          <p className="font-medium">Friend requests are immediate</p>
          <p className="text-sm text-muted-foreground">
            This app adds friends directly and records the event in activity instead of storing pending requests.
          </p>
        </div>
      </div>
    </Card>
  );
}
