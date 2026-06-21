import React from 'react';
import { motion } from 'framer-motion';
import { Star, Sparkles, Zap, Flame, ShieldCheck } from 'lucide-react';

const DIFFICULTIES = [
  {
    level: 'Lite',
    icon: Star,
    iconColor: 'text-success',
    badgeBg: 'bg-success/10 text-success',
    target: 'Beginners & Career Switchers',
    style: 'Simple explanations, analogy-driven, basic examples, and clear definitions.',
    features: ['Analogies & Metaphors', 'No technical jargon', 'Real-world comparisons']
  },
  {
    level: 'Medium',
    icon: Sparkles,
    iconColor: 'text-primary-light',
    badgeBg: 'bg-primary/10 text-primary-light',
    target: 'Internships & College Grads',
    style: 'Structured interview formulations, core concept definitions, and clear examples.',
    features: ['Structured response formats', 'Standard interview flow', 'Clear coding examples']
  },
  {
    level: 'Hardcore',
    icon: Zap,
    iconColor: 'text-secondary-light',
    badgeBg: 'bg-secondary/10 text-secondary-light',
    target: 'Professional Tech Interviews',
    style: 'Deep technical explanation, architecture overlays, complexity classes (Big O), and workflows.',
    features: ['System architecture models', 'Big O time/space analysis', 'Technical algorithms']
  },
  {
    level: 'Critical',
    icon: Flame,
    iconColor: 'text-warning',
    badgeBg: 'bg-warning/10 text-warning',
    target: 'Senior & Staff Engineering',
    style: 'High-availability trade-offs, failure modes, scale optimizations, and production telemetry.',
    features: ['CAP Theorem trade-offs', 'Distributed systems edge-cases', 'Telemetry & monitoring']
  }
];

export default function DifficultySelector({ onSelect, currentDifficulty = 'Medium' }) {
  return (
    <div className="max-w-[1200px] mx-auto px-6 py-10 select-none text-center">
      
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10"
      >
        <span className="text-xs font-semibold uppercase tracking-widest text-primary dark:text-primary-light">
          Response Calibration
        </span>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight mt-1 mb-3">
          Select Answer Depth
        </h2>
        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
          Calibrate VivaGuru's preparation response patterns to match your target interview level.
        </p>
      </motion.div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto mb-10">
        {DIFFICULTIES.map((diff, index) => {
          const Icon = diff.icon;
          const isSelected = currentDifficulty === diff.level;
          
          return (
            <motion.div
              key={diff.level}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ 
                y: -6, 
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
              }}
              onClick={() => onSelect(diff.level)}
              className={`gradient-border-card p-6 rounded-vivaguru glass cursor-pointer text-left flex flex-col justify-between transition-all duration-300 relative ${
                isSelected 
                  ? 'ring-2 ring-primary ring-offset-2 dark:ring-offset-darkbg border-transparent shadow-xl' 
                  : 'shadow-md border border-slate-200/50 dark:border-darkbg-border'
              }`}
            >
              {isSelected && (
                <div className="absolute top-3 right-3 text-primary dark:text-primary-light">
                  <ShieldCheck className="w-5 h-5 fill-primary/10" />
                </div>
              )}

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center bg-slate-100 dark:bg-darkbg-hover ${diff.iconColor}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                    {diff.level}
                  </h3>
                </div>

                <span className={`inline-block text-[10px] font-bold tracking-wide uppercase px-2.5 py-0.5 rounded-full mb-4 ${diff.badgeBg}`}>
                  {diff.target}
                </span>

                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
                  {diff.style}
                </p>
              </div>

              <div>
                <div className="border-t border-slate-100 dark:border-darkbg-border/50 pt-4 mt-auto">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2">
                    Key Formats
                  </span>
                  <ul className="space-y-1.5">
                    {diff.features.map((feat, idx) => (
                      <li key={idx} className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                        <span className="w-1 h-1 rounded-full bg-slate-400 dark:bg-slate-500" />
                        {feat}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        onClick={() => onSelect(currentDifficulty, true)}
        className="px-8 py-3 bg-primary text-white rounded-vivaguru text-sm font-semibold hover:bg-primary-dark shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all duration-200 active:scale-95 inline-flex items-center gap-1"
      >
        Confirm Calibration
        <ShieldCheck className="w-4 h-4" />
      </motion.button>

    </div>
  );
}
