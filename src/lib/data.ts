import type { User, Notification, Conversation } from './types';

export let mockUsers: User[] = [
  {
    id: 'user-1',
    name: 'Alex Cyber',
    email: 'alex@rolehub.io',
    avatar: 'https://placehold.co/128x128.png?text=AC',
    savedEvents: ['1', '3'],
    relationshipStatus: 'single',
    bio: 'Synthwave lover & electric skateboarder. Looking for the next neon-drenched adventure.',
    following: ['user-2'],
    followers: 256,
    checkIns: 12,
    isMock: true,
  },
  {
    id: 'user-2',
    name: 'NeonRider',
    email: 'neon@rider.com',
    avatar: 'https://placehold.co/128x128.png?text=NR',
    savedEvents: ['1', '5'],
    relationshipStatus: 'dating',
    bio: 'Artist and cyberpunk enthusiast. My world is made of pixels and rain.',
    following: ['user-1', 'user-3'],
    followers: 1024,
    checkIns: 34,
    isMock: true,
  },
  {
    id: 'user-3',
    name: 'IndieDevJess',
    email: 'jess@indiedev.com',
    avatar: 'https://placehold.co/128x128.png?text=IJ',
    savedEvents: ['2', '4'],
    relationshipStatus: 'not_specified',
    bio: 'Indie game developer by day, music lover by night.',
    following: [],
    followers: 512,
    checkIns: 8,
    isMock: true,
  },
];

let mockNotifications: Notification[] = [
    { 
        id: '1', 
        type: 'new_follower', 
        user: mockUsers[1],
        text: '<b>NeonRider</b> começou a seguir você.', 
        time: '2h', 
        read: false,
        link: '/profile/user-2'
    },
    { 
        id: '2', 
        type: 'event_comment',
        user: mockUsers[2],
        text: '<b>IndieDevJess</b> comentou no seu evento: "Cyberfunk Fest".', 
        time: '1d', 
        read: true,
        link: '/events/1'
    },
];


export let mockConversations: Conversation[] = [
    {
        user: mockUsers[1], // NeonRider
        lastMessage: 'Fechou então! Nos vemos lá.',
        timestamp: '5m',
        unread: true,
    },
    {
        user: mockUsers[2], // IndieDevJess
        lastMessage: 'Ok, combinado!',
        timestamp: '1h',
        unread: false,
    },
];


// --- DATA ACCESS FUNCTIONS ---

export const getUserById = (id: string): User | undefined => {
    return mockUsers.find(user => user.id === id);
}

export const getUserByUsername = (username: string): User | undefined => {
  return mockUsers.find(user => user.name === username);
}

export const getParticipantsForEvent = (eventId: string, count: number): User[] => {
  // Simple mock: returns a slice of all users to simulate participants
  return mockUsers.slice(0, Math.min(count, mockUsers.length));
}

export const getNotifications = (): Notification[] => {
    return mockNotifications;
}

export const getUnreadNotificationsCount = (): number => {
    return mockNotifications.filter(n => !n.read).length;
}

export const clearUnreadNotifications = (): void => {
    mockNotifications.forEach(n => n.read = true);
}

export const getConversations = (): Conversation[] => {
    return mockConversations;
}

export const markConversationAsRead = (userId: string): void => {
    const conversation = mockConversations.find(c => c.user.id === userId);
    if (conversation) {
        conversation.unread = false;
    }
};

export const mockUser = mockUsers[0];
