import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Award, Briefcase, Cpu, ShieldAlert, ChevronRight, BookOpen } from 'lucide-react';

export default function DashboardScreen({ sessionData, recommendations, onProceed }) {
  const { role, experience_level, skills, focus_areas, readiness_score } = sessionData;
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    // Animate score from 0 to final score on load
    const duration = 1200; // ms
    const steps = 60;
    const stepTime = duration / steps;
    let currentStep = 0;
    
    const timer = setInterval(() => {
      currentStep++;
      const val = Math.min(readiness_score, Math.round((readiness_score / steps) * currentStep));
      setAnimatedScore(val);
      if (currentStep >= steps) clearInterval(timer);
    }, stepTime);

    return () => clearInterval(timer);
  }, [readiness_score]);

  // SVG parameters for readiness circle
  const radius = 55;
  const circ = 2 * Math.PI * radius;
  const strokeDashoffset = circ - (animatedScore / 100) * circ;

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8 select-none">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10 pb-6 border-b border-slate-200 dark:border-darkbg-border">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
            Interview Profile
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Analyzing readiness metrics and target competencies for your target role.
          </p>
        </div>
        <button
          onClick={() => onProceed()}
          className="flex items-center gap-1.5 px-6 py-3 bg-primary text-white rounded-vivaguru text-sm font-semibold hover:bg-primary-dark shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all duration-200 active:scale-95 self-stretch sm:self-auto text-center justify-center"
        >
          Select Preparation Level
          <ChevronRight className="w-4.5 h-4.5" />
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        
        {/* Left Side: Profile Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="lg:col-span-2 space-y-6"
        >
          {/* Role details */}
          <div className="gradient-border-card p-6 rounded-vivaguru glass shadow-xl flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary dark:text-primary-light flex-shrink-0">
              <Briefcase className="w-7 h-7" />
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{role}</h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-darkbg-hover text-slate-600 dark:text-slate-400 font-medium">
                  {experience_level}
                </span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                AI analyzed target profile based on job description.
              </p>
            </div>
          </div>

          {/* Required Skills & Focus Areas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Skills Card */}
            <div className="gradient-border-card p-6 rounded-vivaguru glass shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <Cpu className="w-5 h-5 text-primary" />
                <h4 className="text-base font-bold text-slate-800 dark:text-slate-100">Key Competencies</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {Array.isArray(skills) && skills.map((skill, index) => (
                  <span 
                    key={index} 
                    className="text-xs px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-darkbg-hover border border-slate-200/50 dark:border-darkbg-border text-slate-700 dark:text-slate-300 font-medium transition-colors hover:border-primary/30"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Focus Areas Card */}
            <div className="gradient-border-card p-6 rounded-vivaguru glass shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <Award className="w-5 h-5 text-secondary" />
                <h4 className="text-base font-bold text-slate-800 dark:text-slate-100">Interview Focus</h4>
              </div>
              <ul className="space-y-3">
                {Array.isArray(focus_areas) && focus_areas.map((area, index) => (
                  <li key={index} className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary mt-2 flex-shrink-0" />
                    <span>{area}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Right Side: Readiness Score Gauge */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="gradient-border-card p-6 rounded-vivaguru glass shadow-xl flex flex-col items-center justify-center text-center"
        >
          <h4 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-6">Readiness Assessment</h4>
          
          <div className="relative flex items-center justify-center mb-6">
            {/* SVG Ring */}
            <svg className="w-36 h-36 transform -rotate-90">
              <circle
                cx="72"
                cy="72"
                r={radius}
                className="stroke-slate-200 dark:stroke-darkbg-border"
                strokeWidth="10"
                fill="transparent"
              />
              <motion.circle
                cx="72"
                cy="72"
                r={radius}
                className="stroke-primary"
                strokeWidth="10"
                fill="transparent"
                strokeDasharray={circ}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                transition={{ duration: 1, ease: "easeInOut" }}
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
                {animatedScore}%
              </span>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mt-0.5">
                Ready
              </span>
            </div>
          </div>

          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            {animatedScore < 70 ? 'Requires Preparation' : animatedScore < 85 ? 'Solid Foundation' : 'Exemplary Fit'}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[220px] leading-relaxed">
            Your profile matches the job description parameters closely. Complete mock sessions to increase score.
          </p>
        </motion.div>
      </div>

      {/* Recommendations Section */}
      {recommendations && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {/* FAQ Card */}
          <div className="gradient-border-card p-6 rounded-vivaguru glass shadow-xl md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-primary" />
              <h4 className="text-base font-bold text-slate-800 dark:text-slate-100">Key Preparation Questions</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.isArray(recommendations.faq) && recommendations.faq.map((q, idx) => (
                <div 
                  key={idx} 
                  className="p-3.5 rounded-xl bg-slate-50/50 dark:bg-darkbg-card/40 border border-slate-200/40 dark:border-darkbg-border text-xs text-slate-600 dark:text-slate-300 font-medium hover:border-primary/20 hover:bg-slate-50 dark:hover:bg-darkbg-hover transition-all duration-200 cursor-pointer"
                  onClick={() => onProceed(q)}
                >
                  {q}
                </div>
              ))}
            </div>
          </div>

          {/* Prep Checklist */}
          <div className="gradient-border-card p-6 rounded-vivaguru glass shadow-xl">
            <div className="flex items-center gap-2 mb-4">
              <ShieldAlert className="w-5 h-5 text-warning" />
              <h4 className="text-base font-bold text-slate-800 dark:text-slate-100">Roadmap Steps</h4>
            </div>
            <ul className="space-y-3">
              {Array.isArray(recommendations.preparation_areas) && recommendations.preparation_areas.map((step, idx) => (
                <li key={idx} className="flex gap-2.5 text-xs text-slate-600 dark:text-slate-300 leading-normal">
                  <span className="w-5 h-5 rounded-full bg-warning/10 text-warning flex items-center justify-center flex-shrink-0 font-bold">
                    {idx + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      )}

    </div>
  );
}
