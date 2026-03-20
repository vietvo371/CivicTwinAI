'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import HeroSection from '@/components/landing/HeroSection';
import BentoGrid from '@/components/landing/BentoGrid';
import HowItWorks from '@/components/landing/HowItWorks';
import InfiniteMarquee from '@/components/landing/InfiniteMarquee';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#020617] relative overflow-x-clip font-sans selection:bg-blue-500/30">
      
      {/* Modern Navbar */}
      <nav className="sticky top-0 z-50 w-full max-w-7xl mx-auto px-6 py-4 flex items-center justify-between border-b border-white/10 bg-[#020617]/80 backdrop-blur-xl transition-all">
        <Link href="/">
          <div className="flex items-center gap-4 group cursor-pointer mr-2">
            {/* Transparent User Logo */}
            <div className="relative transition-transform duration-500 group-hover:scale-105">
               <Image src="/logo.png" alt="CivicTwin AI Logo" width={56} height={56} className="object-contain w-14 h-14 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" unoptimized />
            </div>
            {/* Project Name */}
            <span className="text-3xl font-bold tracking-tight text-white font-heading">
              CivicTwin<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">AI</span>
            </span>
          </div>
        </Link>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-6 mr-4 text-sm font-medium text-slate-400">
            <span className="hover:text-blue-400 cursor-pointer transition-colors">Technology</span>
            <span className="hover:text-blue-400 cursor-pointer transition-colors">Infrastructure</span>
            <span className="hover:text-blue-400 cursor-pointer transition-colors">Security</span>
          </div>
          <Link href="/login">
            <Button className="bg-white/10 hover:bg-white/20 text-white border border-white/10 px-6 backdrop-blur-md rounded-full font-semibold transition-all shadow-[0_0_15px_-3px_rgba(255,255,255,0.1)]">
              Console Sign In
            </Button>
          </Link>
        </div>
      </nav>

      {/* Landing Page Content Sections */}
      <HeroSection />
      
      <InfiniteMarquee />
      
      <BentoGrid />
      
      <HowItWorks />

      {/* Footer Minimal */}
      <footer className="relative z-10 border-t border-white/5 py-12 mt-20 backdrop-blur-lg bg-[#020617]/50">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-slate-500 font-medium tracking-wide">
          <div className="flex items-center gap-4">
            <Image src="/logo.png" alt="CivicTwin AI Logo" width={32} height={32} className="opacity-50 grayscale object-contain h-8 w-8" unoptimized />
            <span>&copy; {new Date().getFullYear()} Team DTU 1 - TechGuard ASEAN. All rights reserved.</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6">
            <span className="hover:text-slate-300 cursor-pointer transition-colors">Privacy Policy</span>
            <span className="hover:text-slate-300 cursor-pointer transition-colors">Terms of Service</span>
            <span className="hover:text-slate-300 cursor-pointer transition-colors">System Status</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
