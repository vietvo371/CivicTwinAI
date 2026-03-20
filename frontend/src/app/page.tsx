'use client';

/* eslint-disable react-hooks/set-state-in-effect */

import Link from 'next/link';
import { ShieldCheck, Map, Activity, Brain, Radio, ArrowRight, Server, Cpu, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import Image from 'next/image';

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState({ nodes: 1420, accuracy: 94.2, inferences: 843 });

  useEffect(() => {
    setMounted(true);
    // Ticking stats effect
    const interval = setInterval(() => {
      setStats(prev => ({
        nodes: prev.nodes + Math.floor(Math.random() * 3) - 1,
        accuracy: Math.min(99.9, Math.max(90.0, prev.accuracy + (Math.random() * 0.2 - 0.1))),
        inferences: prev.inferences + Math.floor(Math.random() * 15),
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#020617] relative overflow-hidden font-sans selection:bg-blue-500/30">
      {/* Dynamic Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)] opacity-20" />
      
      {/* Background Ambient Glowing Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-600/10 blur-[120px] mix-blend-screen pointer-events-none animate-pulse duration-10000" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-purple-600/10 blur-[130px] mix-blend-screen pointer-events-none" />
      <div className="absolute top-[40%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[30vw] rounded-[100%] bg-emerald-500/5 blur-[120px] mix-blend-screen pointer-events-none" />

      {/* Modern Navbar */}
      <nav className="relative z-50 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between border-b border-white/5">
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

      {/* Floating Badges */}
      <div className="absolute top-[25%] left-[8%] hidden xl:flex flex-col gap-1 p-3 rounded-2xl bg-slate-900/60 border border-slate-700/80 backdrop-blur-md shadow-2xl animate-bounce" style={{ animationDuration: '4s' }}>
        <div className="flex items-center gap-2">
          <Server className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-mono text-slate-300">Nodes Active</span>
        </div>
        <span className="text-lg font-bold text-white font-mono">{stats.nodes.toLocaleString()}</span>
      </div>

      <div className="absolute top-[40%] right-[8%] hidden xl:flex flex-col gap-1 p-3 rounded-2xl bg-slate-900/60 border border-slate-700/80 backdrop-blur-md shadow-2xl animate-bounce" style={{ animationDuration: '5s', animationDelay: '1s' }}>
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-mono text-slate-300">Model Precision</span>
        </div>
        <span className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 font-mono">{stats.accuracy.toFixed(2)}%</span>
      </div>

      <div className="absolute bottom-[20%] left-[12%] hidden xl:flex flex-col gap-1 p-3 rounded-2xl bg-slate-900/60 border border-slate-700/80 backdrop-blur-md shadow-2xl animate-bounce" style={{ animationDuration: '6s', animationDelay: '2s' }}>
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-mono text-slate-300">Inferences / Sec</span>
        </div>
        <span className="text-lg font-bold text-blue-400 font-mono">{(stats.inferences / 10).toFixed(1)}k</span>
      </div>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-20 flex flex-col items-center text-center">
        {/* Glowing Badge */}
        <div className="group relative inline-flex items-center gap-2 px-5 py-2 rounded-full bg-slate-900/80 border border-blue-500/30 text-blue-300 text-sm font-semibold mb-12 shadow-[0_0_30px_-5px_rgba(59,130,246,0.3)] backdrop-blur-md cursor-pointer overflow-hidden transition-all hover:border-blue-400/50">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500 shadow-[0_0_10px_2px_rgba(59,130,246,0.5)]"></span>
          </span>
          <span className="relative">Core Engine Iteration 2.0.4 Online</span>
        </div>
        
        {/* Main Typed Headline */}
        <h1 className="text-6xl md:text-8xl lg:text-[7rem] font-black text-white tracking-tighter mb-8 font-heading leading-[1.05] drop-shadow-2xl">
          Intelligence Meets <br />
          <span className="relative inline-block mt-2">
            <span className="absolute -inset-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 blur-2xl opacity-40"></span>
            <span className="relative text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400">
              Urban Mobility.
            </span>
          </span>
        </h1>
        
        <p className="text-xl md:text-2xl text-slate-400 max-w-3xl mb-14 font-medium leading-relaxed">
          The autonomous digital twin syncing real-world traffic flows into neural space. Detect. Predict. Mitigate. Instantly.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-6 w-full sm:w-auto">
          <Link href="/map" className="w-full sm:w-auto group relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl blur opacity-60 group-hover:opacity-100 transition duration-300" />
            <Button size="lg" className="relative w-full sm:w-auto bg-[#020617] hover:bg-slate-900 border border-slate-800 text-white h-16 px-10 text-lg font-bold rounded-2xl transition-transform hover:scale-[1.02] active:scale-95">
              <Map className="w-5 h-5 mr-3 text-cyan-400" />
              Access Public Map
              <ArrowRight className="w-5 h-5 ml-3 opacity-60 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          
          <Link href="/login" className="w-full sm:w-auto group">
            <Button size="lg" variant="outline" className="w-full sm:w-auto h-16 px-10 text-lg font-bold rounded-2xl border-slate-700 bg-slate-800/30 hover:bg-slate-800 hover:border-slate-500 text-white backdrop-blur-xl transition-all hover:scale-[1.02] active:scale-95 shadow-[0_0_20px_-5px_rgba(0,0,0,0.5)]">
               <ShieldCheck className="w-5 h-5 mr-3 text-purple-400" />
               Operator Console
            </Button>
          </Link>
        </div>

        {/* Separator / Spacer */}
        <div className="w-full max-w-lg h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent mt-32 mb-20 opacity-70" />

        {/* Feature Grid Ultra */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full text-left relative z-20">
          {[
            {
              icon: Activity,
              wrapperClass: "from-blue-500/20",
              iconBg: "bg-blue-500/10 border-blue-500/20",
              iconColor: "text-blue-400",
              title: "Hyper-Real Ingestion",
              desc: "100k+ events/sec pipeline capturing high-fidelity edge metrics and vehicle signatures instantly."
            },
            {
              icon: Brain,
              wrapperClass: "from-emerald-500/20",
              iconBg: "bg-emerald-500/10 border-emerald-500/20",
              iconColor: "text-emerald-400",
              title: "Cognitive Forecasting",
              desc: "Graph Neural Networks identifying non-linear congestion propagations before physical gridlocks occur."
            },
            {
              icon: Cpu,
              wrapperClass: "from-purple-500/20",
              iconBg: "bg-purple-500/10 border-purple-500/20",
              iconColor: "text-purple-400",
              title: "Autonomous Mitigation",
              desc: "Dynamic adaptive traffic signal algorithms and self-correcting macro-routing recommendations."
            }
          ].map((feature, idx) => (
            <div key={idx} className="group relative p-[1px] rounded-3xl overflow-hidden bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-800">
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.wrapperClass} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              <div className="relative h-full bg-[#020617]/90 backdrop-blur-2xl p-8 rounded-[23px] transition-transform duration-500 group-hover:bg-slate-900/40">
                <div className={`w-14 h-14 rounded-2xl ${feature.iconBg} border flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 transition-transform duration-500`}>
                  <feature.icon className={`w-7 h-7 ${feature.iconColor}`} />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3 font-heading tracking-tight">{feature.title}</h3>
                <p className="text-slate-400 leading-relaxed font-medium">
                  {feature.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer Minimal */}
      <footer className="relative z-10 border-t border-white/5 py-8 mt-10 backdrop-blur-lg bg-[#020617]/50">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-slate-500 font-medium tracking-wide">
          <span>&copy; {new Date().getFullYear()} CivicTwin AI Labs. Code injected by Antigravity.</span>
          <div className="flex items-center gap-6">
            <span className="hover:text-slate-300 cursor-pointer transition-colors">Privacy Policy</span>
            <span className="hover:text-slate-300 cursor-pointer transition-colors">Terms of Service</span>
            <span className="hover:text-slate-300 cursor-pointer transition-colors">System Status</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
