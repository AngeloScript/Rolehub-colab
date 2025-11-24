
"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Users, LogOut, MessageCircle, PlusSquare, Bell, User as UserIcon, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '../ui/separator';
import { RoleHubAnimatedLogo } from '../RoleHubAnimatedLogo';
import { Badge } from '../ui/badge';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Skeleton } from '../ui/skeleton';
import { useState, useEffect } from 'react';

const navItems = [
  { href: '/events', icon: Home, label: 'Eventos' },
  { href: '/calendar', icon: Calendar, label: 'Calendário' },
  { href: '/search', icon: Users, label: 'Procurar' },
  { href: '/messages', icon: MessageCircle, label: 'Mensagens' },
  { href: '/notifications', icon: Bell, label: 'Notificações' },
];

const userNavItems = [
  { href: '/events/create', icon: PlusSquare, label: 'Criar Rolê' },
]

export function SidebarNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);

  const { user: authUser, userData, loading } = useAuth();


  useEffect(() => {
    // Mock unread count
    setUnreadCount(1);
  }, [pathname]);


  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/login');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  }

  const isPageActive = (href: string) => {
    if (href === '/events') {
      return pathname === href || pathname.startsWith('/events/');
    }
    return pathname.startsWith(href);
  };

  return (
    <aside className="hidden md:flex flex-col w-64 p-4 border-r border-border h-screen fixed top-0 left-0">
      <div className="flex items-center justify-center gap-2 mb-8 h-10">
        <Link href="/events">
          <RoleHubAnimatedLogo className="w-[150px] h-[50px]" />
        </Link>
      </div>
      <nav className="flex flex-col gap-1 flex-grow">
        <p className="px-3 text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Descobrir</p>
        {navItems.map((item) => {
          const isActive = isPageActive(item.href);
          return (
            <Link href={item.href} key={item.href}>
              <div className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-base font-medium relative',
                isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
              )}>
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
                {item.href === '/notifications' && unreadCount > 0 && <Badge variant="destructive" className="absolute right-3 top-1/2 -translate-y-1/2 p-0 h-4 w-4 flex items-center justify-center text-[10px]">{unreadCount}</Badge>}
              </div>
            </Link>
          );
        })}
        <Separator className="my-4" />
        <p className="px-3 text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Minha Conta</p>
        {userNavItems.map((item) => {
          const isActive = isPageActive(item.href);
          return (
            <Link href={item.href} key={item.href}>
              <div className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-base font-medium relative',
                isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
              )}>
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto">
        <Separator className='my-4' />
        <div className="flex items-center justify-between">
          <Link href="/profile" className="flex items-center gap-2 group">
            {loading ? <Skeleton className="h-10 w-10 rounded-full" /> :
              <Avatar className="h-10 w-10">
                <AvatarImage src={userData?.avatar} alt={userData?.name} />
                <AvatarFallback>{userData?.name?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
            }
            <div className="flex flex-col">
              {loading ? (
                <>
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-3 w-16" />
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{userData?.name || 'Usuário'}</p>
                  <p className="text-xs text-muted-foreground">Ver Perfil</p>
                </>
              )}
            </div>
          </Link>
          <button onClick={handleLogout} className='p-2 text-muted-foreground hover:text-destructive rounded-md transition-colors' aria-label="Sair">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
