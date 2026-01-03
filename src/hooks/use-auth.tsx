"use client";

import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { User as AppUser } from '@/lib/types';

interface AuthContextType {
  user: SupabaseUser | null;
  userData: AppUser | null;
  loading: boolean;
  session: Session | null;
  refreshUserData: () => Promise<void>;
  updateLocalUserData: (data: Partial<AppUser>) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  session: null,
  refreshUserData: async () => { },
  updateLocalUserData: () => { },
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userData, setUserData] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session
    // Check active session
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Error checking session:", error);
          if (error.message.includes("Invalid Refresh Token") || error.message.includes("Refresh Token Not Found")) {
            console.warn("Invalid refresh token, signing out...");
            await supabase.auth.signOut();
            setSession(null);
            setUser(null);
            setLoading(false);
            return;
          }
        }

        setSession(session);
        setUser(session?.user ?? null);
        if (!session) setLoading(false);
      } catch (err: unknown) {
        console.error("Unexpected error in checkSession:", err);
        if (err instanceof Error && err.message.includes("Invalid Refresh Token")) {
          await supabase.auth.signOut();
        }
        setLoading(false);
      }
    };

    checkSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session) {
        setUserData(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserData = useCallback(async () => {
    if (user) {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error("Error fetching user data:", error);
          setUserData(null);
        } else if (data) {
          const mappedUser: AppUser = {
            id: data?.id,
            name: data?.name,
            email: data?.email,
            avatar: data?.avatar,
            savedEvents: data?.saved_events || [],
            relationshipStatus: data?.relationship_status,
            bio: data?.bio,
            following: data?.following || [],
            followers: data?.followers || 0,
            checkIns: data?.check_ins || 0,
            isMock: false
          };
          setUserData(mappedUser);
        }
      } catch (error) {
        console.error("Unexpected error fetching user data:", error);
        setUserData(null);
      } finally {
        setLoading(false);
      }
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user, fetchUserData]);

  const refreshUserData = async () => {
    await fetchUserData();
  };

  const updateLocalUserData = (data: Partial<AppUser>) => {
    setUserData(prev => prev ? { ...prev, ...data } : null);
  };

  return (
    <AuthContext.Provider value={{ user, userData, loading, session, refreshUserData, updateLocalUserData }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 