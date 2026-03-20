"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full max-w-7xl mx-auto px-6 py-4 flex items-center justify-between border-b border-white/10 bg-[#020617]/80 backdrop-blur-xl transition-all">
      <Link href="/">
        <div className="flex items-center gap-4 group cursor-pointer mr-2">
          {/* Transparent User Logo */}
          <div className="relative transition-transform duration-500 group-hover:scale-105">
            <Image
              src="/logo.png"
              alt="CivicTwin AI Logo"
              width={56}
              height={56}
              className="object-contain w-14 h-14 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]"
              unoptimized
            />
          </div>
          {/* Project Name */}
          <span className="text-3xl font-bold tracking-tight text-white font-heading">
            CivicTwin
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
              AI
            </span>
          </span>
        </div>
      </Link>
      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-6 mr-4 text-sm font-medium text-slate-400">
          <Link href="/map" className="hover:text-blue-400 cursor-pointer transition-colors"> Live Map</Link>
          <Link href="/#features" className="hover:text-blue-400 cursor-pointer transition-colors">Technology</Link>
          <span className="hover:text-blue-400 cursor-pointer transition-colors">System Status</span>
        </div>
        <Link href="/login">
          <Button className="bg-white/10 hover:bg-white/20 text-white border border-white/10 px-6 backdrop-blur-md rounded-full font-semibold transition-all shadow-[0_0_15px_-3px_rgba(255,255,255,0.1)]">
            Console Sign In
          </Button>
        </Link>
      </div>
    </nav>
  );
}
