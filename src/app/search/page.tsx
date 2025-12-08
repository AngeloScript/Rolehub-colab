
"use client";

import { useState, useMemo, useEffect } from 'react';
import { Search as SearchIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/PageHeader';
import { AppLayout } from '@/components/layout/AppLayout';
import { UserProfileDialog } from '@/components/UserProfileDialog';
import { supabase } from '@/lib/supabase';
import type { User } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user: authUser } = useAuth();

  // Fetch all users once
  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .limit(50);

        if (error) throw error;

        if (data) {
          // Filter out the current user from the list
          setAllUsers(data.filter(u => u.id !== authUser?.id) as unknown as User[]);
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, [authUser]);

  const filteredUsers = useMemo(() => {
    if (!searchQuery) {
      return allUsers;
    }
    return allUsers.filter(user =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, allUsers]);

  return (
    <AppLayout>
      <div className="pb-24 md:pb-4">
        <PageHeader title="Procurar Pessoas" />
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm p-4 border-b border-border">
          <div className="relative max-w-2xl mx-auto">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome..."
              className="pl-10 h-10 bg-card/50 focus:bg-background"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </header>
        <main className="p-4 max-w-2xl mx-auto">
          <div className="space-y-4">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-card/50">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
              ))
            ) : filteredUsers.length > 0 ? (
              filteredUsers.map(user => (
                <UserProfileDialog key={user.id} user={user}>
                  <div className="flex items-center gap-4 p-3 rounded-lg transition-colors bg-card/50 hover:bg-card cursor-pointer">
                    <Image src={user.avatar} alt={user.name} width={48} height={48} className="rounded-full" />
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">{user.name}</p>
                      <p className="text-sm text-muted-foreground truncate">{user.bio}</p>
                    </div>
                  </div>
                </UserProfileDialog>
              ))
            ) : (
              <div className="text-center py-10 col-span-full">
                <p className="text-muted-foreground">Nenhum usuário encontrado.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </AppLayout>
  );
}
