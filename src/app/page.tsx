
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RoleHubAnimatedLogo } from '@/components/RoleHubAnimatedLogo';
import { cn } from '@/lib/utils';
import { motion } from "framer-motion";
import { AppLayout } from '@/components/layout/AppLayout';

function SplashGridBackground({ className }: { className?: string }) {
  return (
    <div className={cn("absolute inset-0 w-full h-full overflow-hidden -z-10", className)}>
       <div
        className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,white_20%,transparent_70%)]"
      />
      <motion.div
        className="absolute inset-0 z-0 bg-gradient-to-t from-background via-background/80 to-transparent"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2 }}
      />
       <motion.div
        className="absolute inset-[-200%] w-[400%] h-[400%] z-[-1] bg-[radial-gradient(circle_farthest-side_at_50%_50%,hsl(var(--primary)/0.05),transparent)]"
        animate={{
          rotate: [0, 360],
          scale: [1, 1.2, 1],
          translateX: ["-50%", "-50%", "-50%"],
          translateY: ["-50%", "-50%", "-50%"],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}


export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/login');
    }, 3000); 

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <AppLayout>
      <div className="flex flex-col items-center justify-center min-h-screen bg-background overflow-hidden relative">
          <SplashGridBackground />
          <RoleHubAnimatedLogo className="w-[300px] h-[100px] z-10" />
      </div>
    </AppLayout>
  );
}
