import { Card } from "@/components/ui/card";
import { getFriendRequests } from "@/server/actions/friends";
import { FriendRequestsClient } from "./friend-requests-client";

export async function FriendRequests() {
  let received = [] as any[];

  try {
    const resp = await getFriendRequests();
    received = resp.received || [];
  } catch (err: any) {
    return (
      <Card className="p-6">
        <div className="space-y-2">
          <div>
            <h2 className="text-lg font-medium">Pending friend requests</h2>
            <p className="text-sm text-muted-foreground">Requests sent to you that are awaiting your response.</p>
          </div>

          <div className="text-sm text-destructive">Error loading requests: {String(err?.message ?? err)}</div>
          <div className="text-xs text-muted-foreground">Check the server logs or run the verification queries in the SQL editor.</div>
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

        <FriendRequestsClient requests={received} />
      </div>
    </Card>
  );
}

export default FriendRequests;
