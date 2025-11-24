
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, PlusSquare, MessageCircle, User as UserIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const navItems = [
  { href: '/events', label: 'Eventos' },
  { href: '/search', label: 'Procurar' },
  { href: '/events/create', label: 'Criar' },
  { href: '/messages', label: 'Mensagens' },
  { href: '/profile', label: 'Perfil' },
];

const navIcons: { [key: string]: React.ElementType } = {
    'Eventos': Home,
    'Procurar': Users,
    'Criar': PlusSquare,
    'Mensagens': MessageCircle,
    'Perfil': UserIcon,
};


export function BottomNavBar() {
  const pathname = usePathname();

 const isPageActive = (href: string) => {
    if (href === '/events') {
      // Only active if it's the exact path or a sub-path of an event detail page
      return pathname === href || pathname.startsWith('/events/');
    }
    return pathname.startsWith(href);
  };
  

  const handleNavClick = (e: React.MouseEvent, href: string) => {
    if (pathname === href) {
        e.preventDefault();
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-sm border-t border-border md:hidden z-50">
      <div className="flex justify-around items-center h-full max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = isPageActive(item.href);
          const Icon = navIcons[item.label];
          return (
            <Link href={item.href} key={item.href} onClick={(e) => handleNavClick(e, item.href)} className="flex flex-col items-center justify-center w-full h-full text-center group relative">
              <motion.div whileTap={{ scale: 0.9 }}>
                <Icon className={cn(
                  'w-6 h-6 mb-1 transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-primary/80'
                )} />
              </motion.div>
              <span className={cn(
                'text-[10px] font-medium transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-primary/80'
              )}>
                {item.label}
              </span>
              {isActive && (
                <motion.div 
                    layoutId="active-nav-indicator-mobile" 
                    className="absolute bottom-0 h-0.5 w-6 bg-primary rounded-full"
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
