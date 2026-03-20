import type { Metadata } from 'next';
import { Fira_Code, Fira_Sans, Geist } from 'next/font/google';
import './globals.css';
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from '@/lib/auth';

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const firaCode = Fira_Code({ 
  subsets: ['latin'], 
  variable: '--font-fira-code' 
});

const firaSans = Fira_Sans({ 
  subsets: ['latin'], 
  weight: ['300', '400', '500', '600', '700'], 
  variable: '--font-fira-sans' 
});

export const metadata: Metadata = {
  title: 'CivicTwin AI — Traffic Control',
  description: 'Predictive & Proactive Urban Traffic Management',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={cn("dark", firaCode.variable, firaSans.variable, "font-sans", geist.variable)}>
      <head>
        <link href="https://api.mapbox.com/mapbox-gl-js/v3.9.4/mapbox-gl.css" rel="stylesheet" />
      </head>
      <body className="antialiased min-h-screen bg-bg-primary text-text-primary font-body">
        <AuthProvider>
          <TooltipProvider>
            {children}
          </TooltipProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
