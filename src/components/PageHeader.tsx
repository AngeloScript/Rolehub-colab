
"use client";

import { type LucideIcon, Bell } from 'lucide-react';
import { RoleHubAnimatedLogo } from './RoleHubAnimatedLogo';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Badge } from './ui/badge';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  actionIcon?: LucideIcon;
  onAction?: () => void;
  className?: string;
};

export function PageHeader({ title, subtitle, actionIcon: ActionIcon, onAction, className }: PageHeaderProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    // This simulates fetching the count and updating it
    setUnreadCount(1);
  }, [pathname]);


  return (
    <header className={cn("px-4 pt-4 pb-4 md:pt-6", className)}>
      <div className="md:hidden flex justify-between items-center h-10 mb-4 relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-10" />
        <div className="flex-1 flex justify-center">
            <RoleHubAnimatedLogo className="w-[130px] h-[45px]" />
        </div>
        <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-0">
            <Link href="/notifications">
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary relative h-9 w-9">
                    <Bell className="w-6 h-6" />
                    {unreadCount > 0 && (
                      <Badge variant="destructive" className="absolute top-1 right-1 p-0 h-4 w-4 flex items-center justify-center text-[10px]">{unreadCount}</Badge>
                    )}
                </Button>
            </Link>
             {ActionIcon && onAction && (
              <Button variant="ghost" size="icon" onClick={onAction} className="text-muted-foreground hover:text-primary h-9 w-9">
                <ActionIcon className="w-6 h-6" />
              </Button>
            )}
        </div>
      </div>

      <div className="hidden md:flex items-center justify-between">
        <div className="flex-col">
          <h1 className="text-3xl font-headline font-bold text-foreground">{title}</h1>
          {subtitle && <p className="text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        {ActionIcon && onAction && (
          <Button variant="ghost" size="icon" onClick={onAction} className="text-muted-foreground hover:text-primary">
            <ActionIcon className="w-6 h-6" />
          </Button>
        )}
      </div>
    </header>
  );
}
