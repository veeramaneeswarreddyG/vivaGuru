import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, AlertCircle } from 'lucide-react';

export default function VoiceVisualizer({ onTranscript, statusState = 'idle' }) {
  const [recognizing, setRecognizing] = useState(false);
  const [currentState, setCurrentState] = useState('idle'); // idle, listening, processing, completed
  const [errorMsg, setErrorMsg] = useState('');
  
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Sync external status state if provided
    if (statusState && statusState !== currentState) {
      setCurrentState(statusState);
    }
  }, [statusState]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setErrorMsg("Web Speech API is not supported in this browser. Try Chrome or Edge.");
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'en-US';

    rec.onstart = () => {
      setRecognizing(true);
      setCurrentState('listening');
      setErrorMsg('');
    };

    rec.onerror = (event) => {
      console.error(event.error);
      if (event.error === 'not-allowed') {
        setErrorMsg("Microphone access denied. Enable permissions in settings.");
      } else {
        setErrorMsg(`Speech recognition error: ${event.error}`);
      }
      setRecognizing(false);
      setCurrentState('idle');
    };

    rec.onend = () => {
      setRecognizing(false);
      // Only set to completed if we didn't hit an error and are processing
    };

    rec.onresult = (event) => {
      const transcriptText = event.results[0][0].transcript;
      if (transcriptText) {
        setCurrentState('processing');
        // Simulate a tiny processing delay for visual satisfaction
        setTimeout(() => {
          onTranscript(transcriptText);
          setCurrentState('completed');
          setTimeout(() => setCurrentState('idle'), 1500);
        }, 800);
      } else {
        setCurrentState('idle');
      }
    };

    recognitionRef.current = rec;
  }, [onTranscript]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (recognizing) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error(e);
      }
    }
  };

  // State specific colors/styles
  const stateStyles = {
    idle: {
      btn: 'bg-primary hover:bg-primary-dark text-white border-primary/20 hover:shadow-primary/20',
      label: 'Tap to speak',
      pulse: false
    },
    listening: {
      btn: 'bg-red-500 hover:bg-red-600 text-white border-red-300/30 shadow-red-500/20 pulse-active',
      label: 'Listening... Speak now',
      pulse: true
    },
    processing: {
      btn: 'bg-secondary text-white border-secondary/20 shadow-secondary/20',
      label: 'Analyzing voice...',
      pulse: false
    },
    completed: {
      btn: 'bg-success text-white border-success/20 shadow-success/20',
      label: 'Speech processed!',
      pulse: false
    }
  };

  const activeStyle = stateStyles[currentState] || stateStyles.idle;

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="relative flex items-center justify-center">
        {/* Glowing aura */}
        <AnimatePresence>
          {activeStyle.pulse && (
            <>
              <motion.div
                initial={{ scale: 0.8, opacity: 0.5 }}
                animate={{ scale: 2, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
                className="absolute w-16 h-16 rounded-full bg-red-500/30 filter blur-sm"
              />
              <motion.div
                initial={{ scale: 0.8, opacity: 0.6 }}
                animate={{ scale: 1.5, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5, delay: 0.5, repeat: Infinity, ease: 'easeOut' }}
                className="absolute w-16 h-16 rounded-full bg-primary/20 filter blur-md"
              />
            </>
          )}
        </AnimatePresence>

        <button
          onClick={toggleListening}
          disabled={currentState === 'processing'}
          className={`relative z-10 w-14 h-14 rounded-full flex items-center justify-center border shadow-lg transition-all duration-300 transform active:scale-95 ${activeStyle.btn}`}
        >
          {currentState === 'listening' ? (
            <Mic className="w-6 h-6 animate-pulse" />
          ) : currentState === 'processing' ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Mic className="w-6 h-6" />
          )}
        </button>
      </div>

      <p className="mt-2 text-xs font-medium tracking-wide text-slate-500 dark:text-slate-400">
        {activeStyle.label}
      </p>

      {errorMsg && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-danger bg-danger/10 border border-danger/20 px-3 py-1.5 rounded-full">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
}
