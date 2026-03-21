"use client"

import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useTranslation } from '@/lib/i18n';
import { BrainIcon, RadarIcon, ShieldAlertIcon, MapIcon } from '../icons/TheSvgIcons';

export default function BentoGrid() {
  const { t } = useTranslation();

  const features = [
    {
      title: t('landing.predictDontReact'),
      description: t('landing.predictDesc'),
      icon: <BrainIcon className="w-7 h-7 text-blue-400" />,
      className: "md:col-span-2 md:row-span-2",
      gradient: "from-blue-500/10 to-transparent",
      borderHover: "hover:border-blue-500/30",
      image: "/bento-prediction.png",
    },
    {
      title: t('landing.absoluteRealtime'),
      description: t('landing.realtimeDesc'),
      icon: <RadarIcon className="w-7 h-7 text-emerald-400" />,
      className: "md:col-span-1 md:row-span-1",
      gradient: "from-emerald-500/10 to-transparent",
      borderHover: "hover:border-emerald-500/30",
      image: "/bento-realtime.png",
    },
    {
      title: t('landing.emergencyRouting'),
      description: t('landing.emergencyRoutingDesc'),
      icon: <ShieldAlertIcon className="w-7 h-7 text-rose-400" />,
      className: "md:col-span-1 md:row-span-1",
      gradient: "from-rose-500/10 to-transparent",
      borderHover: "hover:border-rose-500/30",
      image: "/bento-emergency.png",
    },
    {
      title: t('landing.fullDigitalTwin'),
      description: t('landing.digitalTwinDesc'),
      icon: <MapIcon className="w-7 h-7 text-purple-400" />,
      className: "md:col-span-3 md:row-span-1",
      gradient: "from-purple-500/10 to-transparent",
      borderHover: "hover:border-purple-500/30",
      image: "/bento-twin.png",
    }
  ];

  return (
    <section id="features" className="relative py-32">
      <div className="container max-w-7xl mx-auto px-6 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold font-heading mb-6 text-white"
          >
            {t('landing.powerOfPrediction')}{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
              {t('landing.prediction')}
            </span>
          </motion.h2>
          <motion.p 
             initial={{ opacity: 0, y: 20 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             transition={{ delay: 0.1 }}
             className="text-lg text-slate-400"
          >
            {t('landing.bentoSubtitle')}
          </motion.p>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:auto-rows-[280px]">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
              className={`group relative rounded-3xl border border-white/10 overflow-hidden backdrop-blur-md transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/5 ${feature.borderHover} ${feature.className}`}
            >
              {/* Background Image */}
              <div className="absolute inset-0">
                <Image 
                  src={feature.image} 
                  alt={feature.title} 
                  fill 
                  className="object-cover opacity-40 group-hover:opacity-60 group-hover:scale-105 transition-all duration-700" 
                  unoptimized 
                />
                {/* Dark overlay gradient from bottom */}
                <div className={`absolute inset-0 bg-gradient-to-t ${feature.gradient} from-[#020617] via-[#020617]/90 to-transparent`} />
              </div>
              
              {/* Content */}
              <div className="relative z-10 flex flex-col h-full p-8">
                <div className="mb-4 p-3 rounded-2xl bg-white/5 w-fit border border-white/10 shadow-lg backdrop-blur-sm">
                  {feature.icon}
                </div>
                <div className="mt-auto">
                    <h3 className="text-xl md:text-2xl font-bold font-heading text-white mb-2 tracking-wide">{feature.title}</h3>
                    <p className="text-slate-400 leading-relaxed text-sm font-medium">{feature.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
