import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { UploadCloud, FileText, ArrowRight, AlertCircle, LogOut, Sparkles } from 'lucide-react';

export default function WelcomeScreen({ onUploadSuccess, onContinueWithoutPDF, userName = '', onSignOut }) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('empty'); // empty, selected, uploading, error
  const [errorMessage, setErrorMessage] = useState('');
  
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const validateFile = (selectedFile) => {
    const validTypes = [
      'application/pdf',
      'text/plain',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    const extension = selectedFile.name.split('.').pop().toLowerCase();
    
    if (validTypes.includes(selectedFile.type) || ['pdf', 'txt', 'docx'].includes(extension)) {
      return true;
    }
    return false;
  };

  const processFile = (selectedFile) => {
    if (!validateFile(selectedFile)) {
      setStatus('error');
      setErrorMessage('Unsupported file type. Please upload a PDF, DOCX, or TXT file.');
      return;
    }

    setFile(selectedFile);
    setStatus('selected');
    setErrorMessage('');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current.click();
  };

  const handleSubmit = async () => {
    if (!file) return;

    setStatus('uploading');
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      // Direct call to FastAPI backend
      const response = await fetch('http://127.0.0.1:8000/api/upload-jd', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to analyze job description.');
      }

      const data = await response.json();
      onUploadSuccess(data, userName.trim());
    } catch (err) {
      console.error(err);
      setStatus('error');
      setErrorMessage(err.message || 'An error occurred during file upload.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center max-w-4xl mx-auto min-h-[80vh] px-4 py-8 pt-16 sm:pt-20 sm:px-6 text-center select-none relative w-full">
      
      {/* Top Header inside WelcomeScreen */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between w-full z-10 px-4 py-3 select-none">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white font-bold text-sm shadow-md">
            VG
          </div>
          <span className="font-extrabold text-base tracking-tight text-slate-800 dark:text-slate-100">
            VivaGuru
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 hidden sm:inline">
            Active Profile: <span className="text-slate-850 dark:text-slate-200 font-bold">{userName}</span>
          </span>
          {onSignOut && (
            <button
              onClick={onSignOut}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-350 dark:border-darkbg-border hover:bg-slate-100 dark:hover:bg-darkbg-hover rounded-xl text-xs font-bold text-red-500 dark:text-red-400 transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-red-500" />
              <span>Sign Out</span>
            </button>
          )}
        </div>
      </div>

      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="mb-8 flex flex-col items-center"
      >
        <motion.div 
          animate={{ 
            rotate: [0, 8, -8, 0],
            scale: [1, 1.05, 0.95, 1]
          }}
          transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
          className="mb-3 text-secondary dark:text-secondary-light p-2 bg-secondary/10 rounded-2xl shadow-inner"
        >
          <Sparkles className="w-8 h-8" />
        </motion.div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-[#4285F4] via-[#a87ffb] to-indigo-500 bg-clip-text text-transparent mb-3">
          VivaGuru
        </h1>
        <p className="text-lg sm:text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-200 max-w-2xl mx-auto leading-normal">
          Built for your next interview
        </p>
        <p className="text-xs sm:text-sm md:text-base text-slate-500 dark:text-slate-450 max-w-lg mx-auto mt-2 leading-relaxed">
          AI-powered interview preparation tailored to your role, skills, and experience level.
        </p>
      </motion.div>

      {/* Upload card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="w-full max-w-xl mb-6"
      >
        <div 
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`glass-premium p-6 sm:p-10 rounded-vivaguru border transition-all duration-300 relative overflow-hidden ${
            dragActive 
              ? 'border-primary bg-primary/5 shadow-xl scale-[1.01]' 
              : status === 'error'
              ? 'border-danger/40 bg-danger/5'
              : 'border-slate-200/80 dark:border-darkbg-border/60 hover:border-[#8ab4f8]/50 shadow-xl'
          }`}
        >
          {/* Top colored line like Google cards */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#4285F4] via-[#a87ffb] to-[#34A853]" />

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.docx,.txt"
            onChange={handleFileChange}
          />

          {status === 'empty' && (
            <div className="flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 dark:bg-[#4285f4]/15 flex items-center justify-center text-primary dark:text-[#8ab4f8] mb-4 shadow-inner">
                <UploadCloud className="w-8 h-8 animate-pulse" />
              </div>
              <p className="text-base font-bold text-slate-800 dark:text-slate-200">
                Drag and drop your Job Description
              </p>
              <p className="text-xs text-slate-450 dark:text-slate-500 mt-1.5 mb-5">
                Supports PDF, DOCX, and TXT up to 10MB
              </p>
              <button
                onClick={onButtonClick}
                className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-dark shadow-md shadow-primary/20 transition-all duration-200 hover:scale-[1.02] cursor-pointer"
              >
                Browse Files
              </button>
            </div>
          )}

          {status === 'selected' && (
            <div className="flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center text-success mb-4">
                <FileText className="w-8 h-8" />
              </div>
              <p className="text-base font-bold text-slate-800 dark:text-slate-200 truncate max-w-sm">
                {file.name}
              </p>
              <p className="text-xs text-slate-450 dark:text-slate-500 mt-1 mb-6">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setStatus('empty')}
                  className="px-4 py-2 border border-slate-300 dark:border-darkbg-border text-slate-650 dark:text-slate-350 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-darkbg-hover transition-all duration-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-5 py-2 bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white rounded-xl text-sm font-semibold shadow-md transition-all duration-200 flex items-center gap-1.5 hover:scale-[1.02] cursor-pointer"
                >
                  Start AI Analysis
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {status === 'uploading' && (
            <div className="flex flex-col items-center justify-center py-6 space-y-4">
              {/* Premium Google-style Animated Geometric Calibrator */}
              <div className="relative w-20 h-20 mb-2 flex items-center justify-center">
                {/* Rotating Outer Blue Orbit */}
                <motion.svg
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: "linear" }}
                  className="absolute w-20 h-20 text-primary/20 dark:text-primary-light/20"
                  viewBox="0 0 100 100"
                >
                  <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray="30 25" />
                  <circle cx="94" cy="50" r="4.5" className="fill-[#4285F4] dark:fill-[#8ab4f8]" />
                </motion.svg>

                {/* Counter-rotating Inner Red/Yellow Orbit */}
                <motion.svg
                  animate={{ rotate: -360 }}
                  transition={{ duration: 2.8, repeat: Infinity, ease: "linear" }}
                  className="absolute w-14 h-14 text-danger/25 dark:text-danger-light/20"
                  viewBox="0 0 100 100"
                >
                  <circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray="20 20" />
                  <circle cx="12" cy="50" r="4" className="fill-[#EA4335] dark:fill-[#f28b82]" />
                </motion.svg>

                {/* Staggered Green and Yellow Orbiting Dots */}
                <motion.svg
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4.5, repeat: Infinity, ease: "linear" }}
                  className="absolute w-20 h-20"
                  viewBox="0 0 100 100"
                >
                  <circle cx="50" cy="6" r="4" className="fill-[#FBBC05] dark:fill-[#fdd663]" />
                  <circle cx="50" cy="94" r="4" className="fill-[#34A853] dark:fill-[#81c995]" />
                </motion.svg>

                {/* Pulsing Central Gemini Purple Spark */}
                <motion.div
                  animate={{
                    scale: [0.85, 1.15, 0.85],
                    opacity: [0.75, 1, 0.75]
                  }}
                  transition={{
                    duration: 1.6,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute text-secondary dark:text-secondary-light"
                >
                  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C12 2 12 8 8 12C12 12 12 16 12 22C12 22 12 16 16 12C12 12 12 8 12 2Z" />
                  </svg>
                </motion.div>
              </div>

              <div className="text-center">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Calibrating Profile
                </p>
                <p className="text-xs text-slate-450 dark:text-slate-500 mt-1 max-w-[280px] leading-relaxed animate-pulse">
                  Extracting core roles and building readiness index...
                </p>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-danger/10 flex items-center justify-center text-danger mb-4">
                <AlertCircle className="w-8 h-8" />
              </div>
              <p className="text-base font-semibold text-slate-800 dark:text-slate-200">
                Analysis Failed
              </p>
              <p className="text-xs text-danger mt-1 mb-6 max-w-sm">
                {errorMessage}
              </p>
              <button
                onClick={() => setStatus('empty')}
                className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-dark shadow-lg shadow-primary/20 transition-all duration-200 hover:scale-[1.02]"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Alternative proceed */}
      {status !== 'uploading' && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          onClick={() => onContinueWithoutPDF(userName.trim())}
          className="text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-primary-light transition-colors duration-200 border-b border-transparent hover:border-primary"
        >
          Continue Without Job Description
        </motion.button>
      )}
    </div>
  );
}
