import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SiriOrb from './SiriOrb';

const STATUS_MESSAGES = [
  "Reading document...",
  "Identifying requirements...",
  "Extracting skills...",
  "Understanding role...",
  "Building interview profile...",
  "Preparing preparation roadmap..."
];

export default function AnalysisScreen() {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((prevIndex) => (prevIndex + 1) % STATUS_MESSAGES.length);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] max-w-xl mx-auto px-6 text-center">
      
      {/* Siri Orb in processing state */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1 }}
        className="mb-12"
      >
        <SiriOrb state="processing" size="large" />
      </motion.div>

      {/* Rotating Status Messages */}
      <div className="h-10 flex items-center justify-center overflow-hidden mb-3">
        <AnimatePresence mode="wait">
          <motion.p
            key={msgIndex}
            initial={{ opacity: 0, y: 15, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -15, filter: 'blur(4px)' }}
            transition={{ duration: 0.6 }}
            className="text-lg font-semibold tracking-wide text-primary dark:text-primary-light"
          >
            {STATUS_MESSAGES[msgIndex]}
          </motion.p>
        </AnimatePresence>
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: 1 }}
        className="text-xs tracking-widest uppercase text-slate-400 dark:text-slate-500 font-medium"
      >
        VivaGuru neural parser active
      </motion.p>
    </div>
  );
}
