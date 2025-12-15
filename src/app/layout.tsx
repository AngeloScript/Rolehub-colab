import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { VitalsMonitor } from '@/components/VitalsMonitor';
import { Inter, Poppins } from 'next/font/google';
import { cn } from '@/lib/utils';
import { AuthProvider } from '@/hooks/use-auth';


export const metadata: Metadata = {
  title: 'RoleHub',
  description: 'Encontre seu próximo rolê',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'RoleHub',
  },
};

const fontInter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const fontPoppins = Poppins({
  subsets: ['latin'],
  weight: ['600', '700'],
  display: 'swap',
  variable: '--font-poppins',
});


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={cn("font-body antialiased", fontInter.variable, fontPoppins.variable)}>
        <AuthProvider>
          <VitalsMonitor />
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
