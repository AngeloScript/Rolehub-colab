

export type Comment = {
  id: string;
  author: string;
  authorId: string;
  avatar: string;
  text: string;
  timestamp: string;
  likes: string[]; // array of user IDs who liked the comment
};

export type Event = {
  id: string;
  title: string;
  description: string;
  image: string;
  image_url?: string; // DB field alias
  date: string;
  fullDate?: string; // ISO string for countdown
  time: string;
  createdAt: string;
  location: string; // Full address from geocoding
  locationName: string; // User-friendly name like "Bar do Zé"
  location_name?: string; // DB field alias
  latitude: number;
  longitude: number;
  tags: string[];
  participants: number;
  confirmedAttendees: string[]; // Array of user IDs
  imageHint: string;
  vibes: {
    hot: number;
    cold: number;
  };
  organizerId: string;
  maxParticipants: number | null;
  isChatEnabled: boolean;
  primaryColor?: string;
  backgroundColor?: string;
  secondaryColor?: string;
  organizer?: User; // Add organizer details
  price?: number;
  currency?: string;
  privacy: 'public' | 'private';
};

export type Ticket = {
  id: string;
  eventId: string;
  userId: string;
  status: 'valid' | 'used' | 'cancelled';
  qrCode?: string;
  pricePaid: number;
  createdAt: string;
  event?: Event; // Hydrated event data
};

export type User = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  savedEvents: string[]; // array of event ids
  relationshipStatus: 'single' | 'dating' | 'married' | 'complicated' | 'not_specified';
  bio: string;
  following: string[]; // array of user ids
  followers: number;
  checkIns: number;
  isMock?: boolean;
  isPrivate?: boolean; // New privacy flag
};

export type FollowRequest = {
  id: string;
  followerId: string;
  targetId: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  follower?: User; // Hydrated follower data
};


export type Message = {
  id: string;
  senderId: string;
  author: string;
  avatar: string;
  text: string;
  timestamp: string;
  status?: 'sent' | 'delivered' | 'read' | 'sending';
  mediaUrl?: string;
  mediaType?: 'image' | 'audio' | 'video';
};

export type Notification = {
  id: string;
  type: 'new_follower' | 'event_comment' | 'event_saved' | 'event_reminder' | 'event_confirmation';
  user?: User;
  text: string;
  time: string; // Relative time string (e.g. "2h ago") - kept for compatibility
  timestamp?: string; // ISO string for sorting/formatting
  read: boolean;
  link?: string;
}

export type Conversation = {
  user: User;
  lastMessage: string;
  timestamp: string;
  unread: boolean;
}

export type ChatConversation = {
  id: string;
  participants: string[];
  lastMessage: string;
  lastMessageTimestamp: string;
  unread: boolean;
  otherUser?: User;
};

