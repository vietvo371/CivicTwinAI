'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import HeroSection from '@/components/landing/HeroSection';
import BentoGrid from '@/components/landing/BentoGrid';
import HowItWorks from '@/components/landing/HowItWorks';
import InfiniteMarquee from '@/components/landing/InfiniteMarquee';
import Navbar from '@/components/landing/Navbar';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#020617] relative overflow-x-clip font-sans selection:bg-blue-500/30">
      
      {/* Modern Navbar */}
      <Navbar />


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
