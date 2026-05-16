"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { sendFriendRequest, searchUsers } from "@/server/actions/friends";
import { User } from "@/lib/types";
import Image from "next/image";
import { Plus, Search } from "lucide-react";

export function AddFriendDialog() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSearch = async (query: string) => {
    setSearch(query);
    if (query.length < 2) {
      setResults([]);
      return;
    }

    try {
      setLoading(true);
      const data = await searchUsers(query);
      setResults(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to search users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (user: User) => {
    try {
      await sendFriendRequest(user.handle || "");
      setResults(results.filter((u) => u.id !== user.id));
      toast({
        title: "Success",
        description: `Friend request sent to ${user.display_name || user.handle}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send friend request",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Friend
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Friend</DialogTitle>
          <DialogDescription>
            Search for a user by their handle to send a friend request
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by username..."
              className="pl-8"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {loading ? (
              <div className="text-center text-sm text-muted-foreground py-8">
                Searching...
              </div>
            ) : results.length === 0 && search.length >= 2 ? (
              <div className="text-center text-sm text-muted-foreground py-8">
                No users found
              </div>
            ) : (
              results.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {user.avatar_url ? (
                      <Image
                        src={user.avatar_url}
                        alt={user.display_name || user.handle || "User"}
                        width={32}
                        height={32}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-muted" />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {user.display_name || user.handle}
                      </p>
                      {user.display_name && (
                        <p className="text-xs text-muted-foreground truncate">
                          @{user.handle}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleSendRequest(user)}
                    className="ml-2"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
