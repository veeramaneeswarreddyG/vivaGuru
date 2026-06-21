import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckSquare, ShieldCheck, AlertTriangle, Lightbulb, 
  Send, RefreshCw, Mic, Sparkles, BookOpen, Copy, Check
} from 'lucide-react';
import VoiceVisualizer from './VoiceVisualizer';
import SiriOrb from './SiriOrb';

export default function ReviewScreen({ sessionData, recommendations }) {
  const { role } = sessionData;

  const [question, setQuestion] = useState('');
  const [answerText, setAnswerText] = useState('');
  const [showVoice, setShowVoice] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const [evaluation, setEvaluation] = useState(null);

  const handleReview = async () => {
    if (!question.trim() || !answerText.trim() || isLoading) return;

    setIsLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/api/review/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: question.trim(), answer: answerText.trim() })
      });
      if (!response.ok) throw new Error('Failed to review answer.');

      const data = await response.json();
      setEvaluation(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const selectFAQ = (faqText) => {
    setQuestion(faqText);
    setEvaluation(null);
  };

  const handleVoiceTranscript = (text) => {
    setAnswerText(text);
    setShowVoice(false);
  };

  const copyBetterVersion = () => {
    if (!evaluation || !evaluation.better_version) return;
    navigator.clipboard.writeText(evaluation.better_version);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderMetric = (label, score, colorClass) => (
    <div className="space-y-1">
      <div className="flex justify-between text-xs font-semibold">
        <span className="text-slate-600 dark:text-slate-400">{label}</span>
        <span className="text-slate-800 dark:text-slate-200">{score}%</span>
      </div>
      <div className="w-full bg-slate-100 dark:bg-darkbg-border h-2 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`h-full rounded-full ${colorClass}`}
        />
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 select-none">
      
      {/* Header */}
      <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-200 dark:border-darkbg-border">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
          <CheckSquare className="w-5.5 h-5.5" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Answer Review</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Submit your answer to specific questions and receive grading, missing concepts, and rewritten examples.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left column: Submit Area */}
        <div className="lg:col-span-2 space-y-6">
          <div className="gradient-border-card p-6 rounded-vivaguru glass shadow-lg space-y-4">
            
            {/* Question Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Interview Question
              </label>
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="e.g. Explain Bias Variance Tradeoff"
                className="w-full rounded-xl bg-slate-50 dark:bg-darkbg-card p-3 border border-slate-300/60 dark:border-white/5 text-sm text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-primary/40 focus:border-primary/40"
              />
            </div>

            {/* Answer Text Area */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Your Response
              </label>
              
              <div className="rounded-xl border border-slate-300/60 dark:border-white/5 overflow-hidden flex flex-col bg-slate-50 dark:bg-darkbg-card shadow-sm focus-within:ring-1 focus-within:ring-primary/40 focus-within:border-primary/40">
                <textarea
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  placeholder="Write or speak your answer details here..."
                  rows={6}
                  className="w-full p-4 bg-transparent outline-none border-0 text-sm leading-relaxed text-slate-800 dark:text-slate-100 resize-none placeholder-slate-400 dark:placeholder-slate-550 focus:ring-0"
                />
                
                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200/50 dark:border-darkbg-border/50 bg-slate-100/40 dark:bg-darkbg-card/30">
                  <button
                    type="button"
                    onClick={() => setShowVoice(!showVoice)}
                    className={`p-2 rounded-lg hover:bg-slate-200/60 dark:hover:bg-darkbg-hover transition-colors cursor-pointer ${
                      showVoice ? 'text-primary' : 'text-slate-400 hover:text-slate-600'
                    }`}
                    title="Voice input"
                  >
                    <Mic className="w-5 h-5" />
                  </button>
                  
                  <div className="flex items-center gap-3">
                    {evaluation && (
                      <button
                        type="button"
                        onClick={() => { setQuestion(''); setAnswerText(''); setEvaluation(null); }}
                        className="px-4 py-2 border border-slate-300 dark:border-darkbg-border text-slate-600 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-100 dark:hover:bg-darkbg-hover transition-all cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleReview}
                      disabled={!question.trim() || !answerText.trim() || isLoading}
                      className="px-5 py-2 bg-primary hover:bg-primary-dark disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-550 text-white rounded-xl text-xs font-semibold shadow-md transition-all duration-200 hover:scale-[1.01] active:scale-95 flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>{isLoading ? 'Analyzing...' : 'Evaluate Answer'}</span>
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Voice Dictation overlay */}
            <AnimatePresence>
              {showVoice && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="glass-premium max-w-sm mx-auto rounded-vivaguru p-5 shadow-2xl border border-primary/10"
                >
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Voice input
                    </h4>
                    <button onClick={() => setShowVoice(false)} className="text-xs text-slate-400">Close</button>
                  </div>
                  <VoiceVisualizer onTranscript={handleVoiceTranscript} />
                </motion.div>
              )}
            </AnimatePresence>

          </div>

          {/* Evaluating Indicator */}
          <AnimatePresence>
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center p-12 glass rounded-vivaguru"
              >
                <SiriOrb state="processing" size="medium" className="mb-4" />
                <span className="text-xs font-semibold tracking-wider text-slate-500 dark:text-slate-400 animate-pulse uppercase">
                  Analyzing Answer...
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results Details */}
          {evaluation && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="gradient-border-card p-6 rounded-vivaguru glass shadow-xl space-y-6"
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-darkbg-border pb-4">
                <div>
                  <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100">Review Output</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Granular performance grading against keyword rubrics.</p>
                </div>
                <div className="flex flex-col items-center justify-center w-14 h-14 rounded-full border-2 border-primary/20 bg-primary/5 text-primary">
                  <span className="text-lg font-extrabold">{evaluation.score}</span>
                  <span className="text-[7px] uppercase tracking-wider font-semibold -mt-1">Score</span>
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {renderMetric("Communication", evaluation.communication, "bg-primary")}
                {renderMetric("Confidence", evaluation.confidence, "bg-secondary")}
                {renderMetric("Technical Fit", evaluation.technical_accuracy, "bg-success")}
                {renderMetric("Structure", evaluation.structure, "bg-warning")}
              </div>

              {/* Bullet Lists */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200 dark:border-darkbg-border/60">
                <div>
                  <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-warning" /> Missing Concepts
                  </h5>
                  <ul className="space-y-1.5 pl-5 list-disc text-xs text-slate-600 dark:text-slate-405 leading-normal">
                    {evaluation.missing_concepts.map((c, idx) => (
                      <li key={idx}>{c}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 text-primary" /> Key Improvements
                  </h5>
                  <ul className="space-y-1.5 pl-5 list-disc text-xs text-slate-600 dark:text-slate-405 leading-normal">
                    {evaluation.improvements.map((c, idx) => (
                      <li key={idx}>{c}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Rewritten Answer block */}
              {evaluation.better_version && (
                <div className="space-y-2 pt-4 border-t border-slate-200 dark:border-darkbg-border/60">
                  <div className="flex justify-between items-center">
                    <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-primary" /> Optimized Answer Recommendation
                    </h5>
                    <button 
                      onClick={copyBetterVersion}
                      className="text-[10px] flex items-center gap-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold border border-slate-200 dark:border-darkbg-border px-2 py-1 rounded-md"
                    >
                      {copied ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-darkbg-card border border-slate-200/50 dark:border-darkbg-border rounded-xl text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed italic">
                    {evaluation.better_version}
                  </div>
                </div>
              )}

              {/* Feedback Text */}
              <div className="p-4 bg-primary/5 rounded-xl border border-primary/15">
                <p className="text-xs text-slate-750 dark:text-slate-300 leading-relaxed font-semibold">
                  {evaluation.feedback}
                </p>
              </div>

            </motion.div>
          )}

        </div>

        {/* Right column: FAQ Quick select list */}
        <div className="space-y-6">
          <div className="gradient-border-card p-5 rounded-vivaguru glass shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-4.5 h-4.5 text-primary" />
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Select from FAQs
              </h4>
            </div>
            
            {recommendations && recommendations.faq && recommendations.faq.length > 0 ? (
              <div className="space-y-2.5">
                {recommendations.faq.map((qText, idx) => (
                  <button
                    key={idx}
                    onClick={() => selectFAQ(qText)}
                    className="w-full text-left p-3 rounded-xl bg-slate-50/40 dark:bg-darkbg-card/40 border border-slate-200/50 dark:border-darkbg-border hover:border-primary/20 hover:bg-slate-50 dark:hover:bg-darkbg-hover text-xs font-medium text-slate-600 dark:text-slate-300 transition-all leading-normal block"
                  >
                    {qText}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
                Upload a Job Description first to see custom FAQ recommendations.
              </p>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
