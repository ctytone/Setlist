"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { requireUser } from "@/server/auth";
import { Friend, FriendRequest, FriendActivity, User } from "@/lib/types";

// Get user's friends list with basic info
export async function getFriendsList(): Promise<Friend[]> {
  const { user } = await requireUser();
  const supabase = createServiceRoleClient();

  if (!user?.id) {
    throw new Error("User not authenticated");
  }

  const { data, error } = await supabase
    .from("friends")
    .select(
      `
      user_id_1, user_id_2,
      users_1:user_id_1(id, handle, display_name, avatar_url, created_at, updated_at),
      users_2:user_id_2(id, handle, display_name, avatar_url, created_at, updated_at)
    `
    )
    .or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`);

  if (error) {
    throw error;
  }

  // Normalize the result
  const friends: Friend[] = data.map((row: any) => {
    const friend =
      row.user_id_1 === user.id ? row.users_2 : row.users_1;
    return friend;
  });

  return friends;
}

// Get pending friend requests (both sent and received)
export async function getFriendRequests(): Promise<{
  received: FriendRequest[];
  sent: FriendRequest[];
}> {
  const { user } = await requireUser();
  const supabase = createServiceRoleClient();

  if (!user?.id) {
    throw new Error("User not authenticated");
  }

  const { data, error } = await supabase
    .from("friend_requests")
    .select(
      `
      id, sender_id, recipient_id, status, created_at, updated_at,
      sender:sender_id(id, handle, display_name, avatar_url, created_at, updated_at),
      recipient:recipient_id(id, handle, display_name, avatar_url, created_at, updated_at)
    `
    )
    .eq("status", "pending")
    .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`);

  if (error) {
    throw error;
  }

  const received = (data as any[]).filter((req: any) => req.recipient_id === user.id) as FriendRequest[];
  const sent = (data as any[]).filter((req: any) => req.sender_id === user.id) as FriendRequest[];

  return { received, sent };
}

// Get friend activity feed
export async function getFriendActivity(limit: number = 50): Promise<FriendActivity[]> {
  const { user } = await requireUser();
  const supabase = createServiceRoleClient();

  if (!user?.id) {
    throw new Error("User not authenticated");
  }

  const { data, error } = await supabase
    .from("friend_activity")
    .select(
      `
      id, user_id, actor_id, action, subject_id, metadata, created_at, is_read,
      actor:actor_id(id, handle, display_name, avatar_url, created_at, updated_at)
    `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return (data as unknown as FriendActivity[]) || [];
}

// Send a friend request
export async function sendFriendRequest(
  recipientUserId: string
): Promise<FriendRequest> {
  const { user } = await requireUser();
  const supabase = createServiceRoleClient();

  if (!user?.id) {
    throw new Error("User not authenticated");
  }

  const { data: recipientData, error: recipientError } = await supabase
    .from("users")
    .select("id")
    .eq("id", recipientUserId)
    .single();

  if (recipientError || !recipientData) {
    throw new Error("User not found");
  }

  if (recipientData.id === user.id) {
    throw new Error("Cannot send friend request to yourself");
  }

  // Check if already friends
  const { data: friendshipData } = await supabase
    .from("friends")
    .select("id")
    .or(
      `and(user_id_1.eq.${user.id},user_id_2.eq.${recipientData.id}),and(user_id_1.eq.${recipientData.id},user_id_2.eq.${user.id})`
    )
    .single();

  if (friendshipData) {
    throw new Error("Already friends with this user");
  }

  // Check if request already exists
  const { data: existingRequest } = await supabase
    .from("friend_requests")
    .select("id")
    .or(
      `and(sender_id.eq.${user.id},recipient_id.eq.${recipientData.id}),and(sender_id.eq.${recipientData.id},recipient_id.eq.${user.id})`
    )
    .eq("status", "pending")
    .single();

  if (existingRequest) {
    throw new Error("Friend request already exists");
  }

  // Create friend request
  const { data, error } = await supabase
    .from("friend_requests")
    .insert({
      sender_id: user.id,
      recipient_id: recipientData.id,
      status: "pending",
    })
    .select(
      `
      id, sender_id, recipient_id, status, created_at, updated_at,
      sender:sender_id(id, handle, display_name, avatar_url, created_at, updated_at),
      recipient:recipient_id(id, handle, display_name, avatar_url, created_at, updated_at)
    `
    )
    .single();

  if (error) {
    throw error;
  }

  return data as unknown as FriendRequest;
}

// Accept a friend request
export async function acceptFriendRequest(requestId: string): Promise<void> {
  const { user } = await requireUser();
  const supabase = createServiceRoleClient();

  if (!user?.id) {
    throw new Error("User not authenticated");
  }

  // Get the friend request
  const { data: request, error: requestError } = await supabase
    .from("friend_requests")
    .select("sender_id, recipient_id")
    .eq("id", requestId)
    .eq("recipient_id", user.id)
    .single();

  if (requestError || !request) {
    throw new Error("Friend request not found");
  }

  // Create friendship (ensure consistent ordering)
  const [userId1, userId2] =
    request.sender_id < request.recipient_id
      ? [request.sender_id, request.recipient_id]
      : [request.recipient_id, request.sender_id];

  const { error: friendshipError } = await supabase
    .from("friends")
    .insert({
      user_id_1: userId1,
      user_id_2: userId2,
    });

  if (friendshipError) {
    throw friendshipError;
  }

  // Update request status
  const { error: updateError } = await supabase
    .from("friend_requests")
    .update({ status: "accepted" })
    .eq("id", requestId);

  if (updateError) {
    throw updateError;
  }

  // Log activity for both users
  const { error: activityError } = await supabase
    .from("friend_activity")
    .insert([
      {
        user_id: user.id,
        actor_id: request.sender_id,
        action: "friend_added",
        created_at: new Date().toISOString(),
      },
      {
        user_id: request.sender_id,
        actor_id: user.id,
        action: "friend_added",
        created_at: new Date().toISOString(),
      },
    ]);

  if (activityError) {
    throw activityError;
  }
}

// Reject a friend request
export async function rejectFriendRequest(requestId: string): Promise<void> {
  const { user } = await requireUser();
  const supabase = createServiceRoleClient();

  if (!user?.id) {
    throw new Error("User not authenticated");
  }

  const { error } = await supabase
    .from("friend_requests")
    .update({ status: "rejected" })
    .eq("id", requestId)
    .eq("recipient_id", user.id);

  if (error) {
    throw error;
  }
}

// Remove a friend
export async function removeFriend(friendId: string): Promise<void> {
  const { user } = await requireUser();
  const supabase = createServiceRoleClient();

  if (!user?.id) {
    throw new Error("User not authenticated");
  }

  const { error } = await supabase
    .from("friends")
    .delete()
    .or(
      `and(user_id_1.eq.${user.id},user_id_2.eq.${friendId}),and(user_id_1.eq.${friendId},user_id_2.eq.${user.id})`
    );

  if (error) {
    throw error;
  }
}

// Search for users to add as friends
export async function searchUsers(query: string): Promise<User[]> {
  const normalizedQuery = query.trim();

  if (normalizedQuery.length < 2) {
    return [];
  }

  const { user } = await requireUser();
  const supabase = createServiceRoleClient();

  if (!user?.id) {
    throw new Error("User not authenticated");
  }

  const { data: authUsersResponse, error: authUsersError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (authUsersError) {
    throw authUsersError;
  }

  const authUsers = authUsersResponse?.users ?? [];
  const lowerQuery = normalizedQuery.toLowerCase();

  function pickString(...values: Array<unknown>) {
    for (const value of values) {
      if (typeof value === "string" && value.trim()) {
        return value.trim();
      }
    }

    return null;
  }

  function getAuthCandidate(authUser: any): User {
    const metadata = authUser?.user_metadata ?? {};
    const emailLocalPart = typeof authUser?.email === "string" ? authUser.email.split("@")[0] ?? "" : "";

    const handle = pickString(
      metadata.user_name,
      metadata.username,
      metadata.preferred_username,
      metadata.nickname,
      emailLocalPart,
    );
    const displayName = pickString(
      metadata.full_name,
      metadata.name,
      metadata.display_name,
      handle,
    );

    return {
      id: authUser.id as string,
      handle,
      display_name: displayName,
      avatar_url: pickString(metadata.avatar_url, metadata.picture),
      created_at: authUser.created_at as string,
      updated_at: authUser.updated_at as string,
    };
  }

  const authMatches = authUsers
    .filter((authUser: any) => authUser.id !== user.id)
    .filter((authUser: any) => {
      const metadata = authUser?.user_metadata ?? {};
      const handle = pickString(
        metadata.user_name,
        metadata.username,
        metadata.preferred_username,
        metadata.nickname,
      ) ?? "";
      const displayName = pickString(
        metadata.full_name,
        metadata.name,
        metadata.display_name,
      ) ?? "";
      const email = typeof authUser?.email === "string" ? authUser.email : "";

      return [handle, displayName, email].some((value) => value.toLowerCase().includes(lowerQuery));
    })
    .map(getAuthCandidate)
    .slice(0, 10);

  const { data, error } = await supabase
    .from("users")
    .select("id, handle, display_name, avatar_url, created_at, updated_at")
    .or(`handle.ilike.%${normalizedQuery}%,display_name.ilike.%${normalizedQuery}%`)
    .neq("id", user.id)
    .limit(10);

  if (error) {
    throw error;
  }

  const authById = new Map(authUsers.map((authUser: any) => [authUser.id, getAuthCandidate(authUser)]));

  const publicMatches = (data ?? []).map((entry) => {
    const authMatch = authById.get(entry.id);

    return {
      ...entry,
      handle: entry.handle ?? authMatch?.handle ?? null,
      display_name: entry.display_name ?? authMatch?.display_name ?? null,
      avatar_url: entry.avatar_url ?? authMatch?.avatar_url ?? null,
    };
  });

  const merged = [...authMatches];

  for (const entry of publicMatches) {
    if (!merged.some((candidate) => candidate.id === entry.id)) {
      merged.push(entry);
    }
  }

  if (merged.length > 0) {
    const upsertPayload = merged.map((entry) => ({
      id: entry.id,
      handle: entry.handle,
      display_name: entry.display_name,
      avatar_url: entry.avatar_url,
    }));

    const { error: upsertError } = await supabase.from("users").upsert(upsertPayload, {
      onConflict: "id",
    });

    if (upsertError) {
      throw upsertError;
    }

    return merged;
  }

  return [];
}

// Mark activity as read
export async function markActivityAsRead(activityId: string): Promise<void> {
  const { user } = await requireUser();
  const supabase = createServiceRoleClient();

  if (!user?.id) {
    throw new Error("User not authenticated");
  }

  const { error } = await supabase
    .from("friend_activity")
    .update({ is_read: true })
    .eq("id", activityId)
    .eq("user_id", user.id);

  if (error) {
    throw error;
  }
}

// Get unread activity count
export async function getUnreadActivityCount(): Promise<number> {
  const { user } = await requireUser();
  const supabase = createServiceRoleClient();

  if (!user?.id) {
    return 0;
  }

  const { count, error } = await supabase
    .from("friend_activity")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  if (error) {
    return 0;
  }

  return count || 0;
}
