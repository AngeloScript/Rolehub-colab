"use client";

import { useUnreadMessages as useUnreadContext } from '@/context/UnreadContext';

export function useUnreadMessages() {
    return useUnreadContext();
}
