import { FriendActivity } from "../friends/friend-activity";
import { FriendRequests } from "../friends/friend-requests";

export default function NotificationsPage() {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl">Notifications</h1>
        <p className="text-sm text-muted-foreground">
          Friend requests and recent activity in one place.
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-3">
          <h2 className="font-medium text-lg">Friend requests</h2>
          <FriendRequests />
        </div>

        <div className="space-y-3">
          <h2 className="font-medium text-lg">Recent activity</h2>
          <FriendActivity />
        </div>
      </div>
    </section>
  );
}