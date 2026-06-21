import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { UploadCloud, FileText, ArrowRight, AlertCircle, LogOut } from 'lucide-react';

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
        className="mb-8"
      >
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-primary via-secondary to-indigo-500 bg-clip-text text-transparent mb-4">
          VivaGuru
        </h1>
        <p className="text-lg sm:text-xl md:text-2xl font-medium text-slate-700 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Built for your next interview
        </p>
        <p className="text-xs sm:text-sm md:text-base text-slate-500 dark:text-slate-400 max-w-lg mx-auto mt-2 leading-relaxed">
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
          className={`glass-premium p-6 sm:p-10 rounded-vivaguru border-2 border-dashed transition-all duration-300 relative ${
            dragActive 
              ? 'border-primary bg-primary/5 shadow-xl scale-[1.02]' 
              : status === 'error'
              ? 'border-danger/40 bg-danger/5'
              : 'border-slate-300 dark:border-slate-700 hover:border-primary/50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.docx,.txt"
            onChange={handleFileChange}
          />

          {status === 'empty' && (
            <div className="flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary dark:text-primary-light mb-4 shadow-inner">
                <UploadCloud className="w-8 h-8" />
              </div>
              <p className="text-base font-semibold text-slate-800 dark:text-slate-200">
                Drag and drop your Job Description
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 mb-5">
                Supports PDF, DOCX, and TXT up to 10MB
              </p>
              <button
                onClick={onButtonClick}
                className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-dark shadow-lg shadow-primary/20 transition-all duration-200 hover:scale-[1.02]"
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
              <p className="text-base font-semibold text-slate-800 dark:text-slate-200 truncate max-w-sm">
                {file.name}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 mb-6">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setStatus('empty')}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-medium hover:bg-slate-50 dark:hover:bg-darkbg-hover transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-5 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-dark shadow-lg shadow-primary/20 transition-all duration-200 flex items-center gap-1 hover:scale-[1.02]"
                >
                  Start AI Analysis
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {status === 'uploading' && (
            <div className="flex flex-col items-center justify-center py-6">
              {/* Spinning/pulsing indicators handled in parent, show placeholder text here */}
              <p className="text-slate-500 dark:text-slate-400 text-sm animate-pulse">
                Initiating upload pipeline...
              </p>
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
