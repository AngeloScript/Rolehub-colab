
"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { SidebarNav } from "./SidebarNav";
import { BottomNavBar } from "./BottomNavBar";

type AppLayoutProps = {
    children: React.ReactNode;
};

// All pages that should have the main app layout (sidebars, etc.)
const LAYOUT_PAGES = [
    '/events',
    '/calendar',
    '/search',
    '/events/create',
    '/messages',
    '/notifications',
    '/profile'
];


export function AppLayout({ children }: AppLayoutProps) {
    const pathname = usePathname();

    // Check if the current path (or its base path) is one of the layout pages.
    const isLayoutPage = LAYOUT_PAGES.some(p => pathname === p || pathname.startsWith(`${p}/`));

    // Pages like login, register, splash screen don't use the main layout
    if (!isLayoutPage) {
        return (
            <AnimatePresence mode="wait">
                <motion.div
                    key={pathname}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    {children}
                </motion.div>
            </AnimatePresence>
        );
    }

    return (
        <div className="flex min-h-screen bg-background">
            <SidebarNav />
            <main className="flex-1 md:ml-64">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={pathname}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                        {children}
                    </motion.div>
                </AnimatePresence>
            </main>
            <BottomNavBar />
        </div>
    );
}
