import { Card } from "@/components/ui/card";
import { getFriendRequests } from "@/server/actions/friends";
import { FriendRequestsClient } from "./friend-requests-client";

export async function FriendRequests() {
  const { received } = await getFriendRequests();

  return (
    <Card className="p-6">
      <div className="space-y-2">
        <div>
          <h2 className="text-lg font-medium">Pending friend requests</h2>
          <p className="text-sm text-muted-foreground">Requests sent to you that are awaiting your response.</p>
        </div>

        <FriendRequestsClient requests={received} />
      </div>
    </Card>
  );
}

export default FriendRequests;
