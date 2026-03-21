"use client"

import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useTranslation } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRightIcon, ActivityIcon, ZapIcon, ScanTextIcon, LayersIcon } from 'lucide-react';
import { RadarIcon } from '../icons/TheSvgIcons';

export default function HeroSection() {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });
  
  const yBg = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacityText = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scaleText = useTransform(scrollYProgress, [0, 0.5], [1, 0.9]);

  return (
    <section 
      ref={containerRef}
      className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-20 pb-32"
    >
      {/* Background Deep Tech Beams */}
      <motion.div style={{ y: yBg }} className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[20%] left-[50%] -translate-x-1/2 w-[70vw] h-[70vw] lg:w-[40vw] lg:h-[40vw] bg-emerald-500/10 rounded-full blur-[120px] mix-blend-screen" />
        <div className="absolute top-[40%] left-[30%] w-[50vw] h-[50vw] bg-blue-500/10 rounded-full blur-[100px] mix-blend-screen" />
        <div className="absolute top-[10%] right-[20%] w-[40vw] h-[40vw] bg-purple-500/10 rounded-full blur-[100px] mix-blend-screen" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
      </motion.div>

      {/* Main Content */}
      <div className="relative z-10 container max-w-6xl mx-auto px-6 text-center">
        
        {/* Pill Badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-8 uppercase tracking-widest backdrop-blur-md"
        >
          <ZapIcon className="w-4 h-4 text-emerald-400" />
          <span>{t('landing.badgeText')}</span>
        </motion.div>

        {/* Big Bold Headline */}
        <motion.h1 
          style={{ opacity: opacityText, scale: scaleText }}
          className="text-5xl md:text-7xl lg:text-[84px] font-extrabold tracking-tight font-heading leading-tight md:leading-[1.1] text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-slate-500"
        >
          {t('landing.heroLine1')}<br/>
          <motion.span 
            initial={{ opacity: 0, filter: "blur(10px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            transition={{ duration: 1, delay: 0.3 }}
            className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400"
          >
            {t('landing.heroLine2')}
          </motion.span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-8 max-w-2xl mx-auto text-lg md:text-xl text-slate-400 font-medium leading-relaxed"
        >
          {t('landing.heroSubtitle')}
        </motion.p>

        {/* Call To Actions */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
            {/* Primary CTA */}
            <Link href="/map">
              <Button size="lg" className="h-14 px-8 text-base font-semibold bg-white text-slate-900 border-none hover:bg-slate-200 transition-all rounded-full shadow-[0_0_30px_-5px_rgba(255,255,255,0.3)] hover:shadow-[0_0_40px_-5px_rgba(255,255,255,0.4)]">
                {t('landing.viewLiveMap')}
              </Button>
            </Link>
          
          <button onClick={() => {
            document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
          }} className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 font-bold tracking-wide transition-all backdrop-blur-md flex items-center justify-center gap-2">
            {t('landing.exploreFeatures')}
            <RadarIcon className="w-5 h-5" />
          </button>
        </motion.div>

        {/* Live Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto"
        >
          {[
            { value: "60min", label: t('landing.predictionAhead'), color: "text-blue-400" },
            { value: "<1s", label: t('landing.responseTime'), color: "text-emerald-400" },
            { value: "100k+", label: t('landing.eventsPerSecond'), color: "text-purple-400" },
            { value: "1:1", label: t('landing.digitalTwinScale'), color: "text-amber-400" },
          ].map((stat, i) => (
            <div key={i} className="text-center p-4 rounded-2xl bg-white/[0.03] border border-white/5">
              <div className={`text-3xl md:text-4xl font-black font-heading ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-slate-500 mt-1 font-medium uppercase tracking-wider">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
