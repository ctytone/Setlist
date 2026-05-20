"use client";

import { Card } from "@/components/ui/card";
import { Bell } from "lucide-react";

export function FriendRequests() {
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
