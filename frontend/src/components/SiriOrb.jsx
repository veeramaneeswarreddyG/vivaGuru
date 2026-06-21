import React from 'react';
import { motion } from 'framer-motion';

export default function SiriOrb({ state = 'idle', size = 'medium' }) {
  // Size map
  const sizeClasses = {
    small: 'w-24 h-24',
    medium: 'w-44 h-44',
    large: 'w-64 h-64'
  };

  // State configurations for framer motion variants
  // States: 'idle', 'listening', 'processing', 'speaking'
  const layer1Variants = {
    idle: {
      scale: [1, 1.05, 1],
      borderRadius: ["42% 58% 70% 30% / 45% 45% 55% 55%", "70% 30% 52% 48% / 60% 40% 60% 40%", "42% 58% 70% 30% / 45% 45% 55% 55%"],
      rotate: [0, 90, 180],
      transition: { duration: 6, repeat: Infinity, ease: "easeInOut" }
    },
    listening: {
      scale: [1.05, 1.25, 1.05],
      borderRadius: ["30% 70% 40% 60% / 50% 60% 40% 50%", "60% 40% 60% 40% / 40% 60% 50% 60%", "30% 70% 40% 60% / 50% 60% 40% 50%"],
      rotate: [0, 180, 360],
      transition: { duration: 2, repeat: Infinity, ease: "linear" }
    },
    processing: {
      scale: [1, 1.1, 1],
      borderRadius: ["50%", "45% 55% 45% 55% / 55% 45% 55% 45%", "50%"],
      rotate: [0, 360],
      transition: { duration: 1.5, repeat: Infinity, ease: "linear" }
    },
    speaking: {
      scale: [1.1, 1.3, 1.05, 1.25, 1.1],
      borderRadius: ["35% 65% 55% 45% / 45% 55% 45% 55%", "65% 35% 45% 55% / 55% 45% 55% 45%", "35% 65% 55% 45% / 45% 55% 45% 55%"],
      rotate: [0, 120, 240],
      transition: { duration: 1, repeat: Infinity, ease: "easeInOut" }
    }
  };

  const layer2Variants = {
    idle: {
      scale: [1, 1.08, 1],
      borderRadius: ["50% 50% 30% 70% / 50% 60% 40% 50%", "40% 60% 60% 40% / 60% 30% 70% 40%", "50% 50% 30% 70% / 50% 60% 40% 50%"],
      rotate: [180, 270, 360],
      transition: { duration: 8, repeat: Infinity, ease: "easeInOut" }
    },
    listening: {
      scale: [1.1, 1.35, 1.1],
      borderRadius: ["50% 50% 30% 70% / 50% 60% 40% 50%", "40% 60% 60% 40% / 60% 30% 70% 40%", "50% 50% 30% 70% / 50% 60% 40% 50%"],
      rotate: [360, 180, 0],
      transition: { duration: 2.5, repeat: Infinity, ease: "linear" }
    },
    processing: {
      scale: [1.05, 1.15, 1.05],
      borderRadius: ["50%", "55% 45% 55% 45% / 45% 55% 45% 55%", "50%"],
      rotate: [360, 0],
      transition: { duration: 2, repeat: Infinity, ease: "linear" }
    },
    speaking: {
      scale: [1.15, 1.35, 1.1, 1.3, 1.15],
      borderRadius: ["50% 50% 30% 70% / 50% 60% 40% 50%", "40% 60% 60% 40% / 60% 30% 70% 40%", "50% 50% 30% 70% / 50% 60% 40% 50%"],
      rotate: [120, 240, 360],
      transition: { duration: 1.2, repeat: Infinity, ease: "easeInOut" }
    }
  };

  const layer3Variants = {
    idle: {
      scale: [1, 1.12, 1],
      borderRadius: ["70% 30% 50% 50% / 30% 30% 70% 70%", "50% 50% 70% 30% / 70% 60% 40% 30%", "70% 30% 50% 50% / 30% 30% 70% 70%"],
      rotate: [360, 240, 120],
      transition: { duration: 10, repeat: Infinity, ease: "easeInOut" }
    },
    listening: {
      scale: [1.15, 1.4, 1.15],
      borderRadius: ["70% 30% 50% 50% / 30% 30% 70% 70%", "50% 50% 70% 30% / 70% 60% 40% 30%", "70% 30% 50% 50% / 30% 30% 70% 70%"],
      rotate: [180, 0, 180],
      transition: { duration: 3, repeat: Infinity, ease: "linear" }
    },
    processing: {
      scale: [1.02, 1.12, 1.02],
      borderRadius: ["50%", "48% 52% 48% 52% / 52% 48% 52% 48%", "50%"],
      rotate: [0, -360],
      transition: { duration: 1.8, repeat: Infinity, ease: "linear" }
    },
    speaking: {
      scale: [1.2, 1.45, 1.15, 1.35, 1.2],
      borderRadius: ["70% 30% 50% 50% / 30% 30% 70% 70%", "50% 50% 70% 30% / 70% 60% 40% 30%", "70% 30% 50% 50% / 30% 30% 70% 70%"],
      rotate: [240, 120, 0],
      transition: { duration: 1.4, repeat: Infinity, ease: "easeInOut" }
    }
  };

  // Color mappings based on states
  const colors = {
    idle: {
      l1: 'from-primary/40 to-secondary/30',
      l2: 'from-secondary/30 to-purple-500/20',
      l3: 'from-indigo-500/30 to-primary/40'
    },
    listening: {
      l1: 'from-red-500/50 to-primary/40',
      l2: 'from-primary/40 to-secondary/50',
      l3: 'from-secondary/50 to-red-400/40'
    },
    processing: {
      l1: 'from-primary/50 to-secondary/40',
      l2: 'from-purple-500/40 to-blue-500/40',
      l3: 'from-blue-500/30 to-primary/50'
    },
    speaking: {
      l1: 'from-primary/60 to-secondary/50',
      l2: 'from-secondary/50 to-green-400/40',
      l3: 'from-green-500/30 to-primary/60'
    }
  };

  const activeColor = colors[state] || colors.idle;

  return (
    <div className="relative flex items-center justify-center pointer-events-none">
      <div className={`relative ${sizeClasses[size]} flex items-center justify-center`}>
        {/* Layer 3: Outer Ring */}
        <motion.div
          animate={state}
          variants={layer3Variants}
          className={`absolute inset-0 bg-gradient-to-tr ${activeColor.l3} orb-glow`}
        />

        {/* Layer 2: Mid Ring */}
        <motion.div
          animate={state}
          variants={layer2Variants}
          className={`absolute inset-[10%] bg-gradient-to-br ${activeColor.l2} orb-glow`}
        />

        {/* Layer 1: Inner Core */}
        <motion.div
          animate={state}
          variants={layer1Variants}
          className={`absolute inset-[20%] bg-gradient-to-r ${activeColor.l1} filter blur-[30px] opacity-90`}
        />
        
        {/* Core highlight dot */}
        <div className="absolute w-6 h-6 rounded-full bg-white dark:bg-slate-200 opacity-20 filter blur-[8px]" />
      </div>
    </div>
  );
}
