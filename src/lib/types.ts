export type SpotifyImage = {
  url: string;
  height: number | null;
  width: number | null;
};

export type SpotifyArtist = {
  id: string;
  name: string;
  popularity?: number;
  genres?: string[];
  images?: SpotifyImage[];
};

export type SpotifyAlbum = {
  id: string;
  name: string;
  albumType: string;
  releaseDate: string;
  totalTracks: number;
  popularity?: number;
  imageUrl: string | null;
  spotifyUrl: string | null;
  artists: SpotifyArtist[];
};

export type SpotifyTrack = {
  id: string;
  name: string;
  durationMs: number;
  trackNumber: number;
  discNumber: number;
  explicit: boolean;
  previewUrl: string | null;
  artists: SpotifyArtist[];
};

// Friends types
export type User = {
  id: string;
  handle: string | null;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Friend = User & {
  mutual_friends_count?: number;
  shared_albums_count?: number;
};

export type FriendRequest = {
  id: string;
  sender_id: string;
  recipient_id: string;
  status: "pending" | "accepted" | "rejected" | "cancelled";
  created_at: string;
  updated_at: string;
  sender?: User;
  recipient?: User;
};

export type FriendActivity = {
  id: string;
  user_id: string;
  actor_id: string;
  action: "friend_added" | "album_rated" | "album_shared" | "friend_request_received";
  subject_id: string | null;
  metadata?: Record<string, unknown>;
  created_at: string;
  is_read: boolean;
  actor?: User;
};
