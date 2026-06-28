import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GraduationCap, Mic, Send, AlertTriangle, ShieldCheck, 
  ChevronRight, Award, UserCheck, MessageSquare, RefreshCw
} from 'lucide-react';
import VoiceVisualizer from './VoiceVisualizer';
import SiriOrb from './SiriOrb';
import Logo from './Logo';
import { API_BASE_URL } from '../config';

export default function MockScreen({ sessionData }) {
  const { session_id, role } = sessionData;

  const [gameState, setGameState] = useState('welcome'); // welcome, question, evaluating, question_feedback, final_feedback
  const [mockId, setMockId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [answerText, setAnswerText] = useState('');
  const [showVoice, setShowVoice] = useState(false);
  
  // Feedbacks
  const [lastEvaluation, setLastEvaluation] = useState(null);
  const [finalFeedback, setFinalFeedback] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');

  const startMock = async () => {
    setIsLoading(true);
    setLoadingMsg('Preparing mock profile...');
    try {
      const response = await fetch(`${API_BASE_URL}/api/mock/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id })
      });
      if (!response.ok) throw new Error('Failed to start mock session.');
      
      const data = await response.json();
      setCurrentQuestion(data.first_question);
      setCurrentIndex(0);
      setGameState('question');
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!answerText.trim() || isLoading) return;
    
    setIsLoading(true);
    setLoadingMsg('Analyzing response quality...');
    setGameState('evaluating');
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/mock/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id, answer: answerText.trim() })
      });
      if (!response.ok) throw new Error('Failed to submit answer.');
      
      const data = await response.json();
      setLastEvaluation(data.evaluation);
      setAnswerText('');
      
      if (data.is_completed) {
        setFinalFeedback(data.final_feedback);
        setGameState('final_feedback');
      } else {
        // Prepare next question trigger on next click
        setQuestions({ next: data.next_question, index: data.current_index, total: data.total_questions });
        setGameState('question_feedback');
      }
    } catch (e) {
      console.error(e);
      setGameState('question'); // Revert on failure
    } finally {
      setIsLoading(false);
    }
  };

  const nextQuestion = () => {
    setCurrentQuestion(questions.next);
    setCurrentIndex(questions.index);
    setGameState('question');
  };

  const handleVoiceTranscript = (text) => {
    setAnswerText(text);
    setShowVoice(false);
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
          <GraduationCap className="w-5.5 h-5.5" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Mock Interview</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Interactive interview simulator acting as your interviewer for {role} roles.
          </p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        
        {/* Welcome Mode */}
        {gameState === 'welcome' && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="gradient-border-card p-5 sm:p-8 rounded-vivaguru glass shadow-xl text-center max-w-xl mx-auto py-8 sm:py-12"
          >
            <div className="flex justify-center mb-6">
              <Logo size="lg" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">
              Start Your {role} Mock Interview
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto mb-8">
              VivaGuru will ask a sequence of 5 role-specific questions. Submit your answer via text or voice, and receive instant grading against standard rubrics.
            </p>
            <button
              onClick={startMock}
              disabled={isLoading}
              className="px-6 py-3 bg-primary text-white rounded-vivaguru text-sm font-semibold hover:bg-primary-dark shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all duration-200 inline-flex items-center gap-2"
            >
              {isLoading ? 'Loading...' : 'Begin Simulation'}
              <ChevronRight className="w-4.5 h-4.5" />
            </button>
          </motion.div>
        )}

        {/* Question Mode */}
        {gameState === 'question' && (
          <motion.div
            key="question"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6 max-w-2xl mx-auto"
          >
            <div className="flex justify-between items-center text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              <span>Question {currentIndex + 1} of 5</span>
              <span>VivaGuru Active</span>
            </div>

            <div className="gradient-border-card p-6 rounded-vivaguru glass shadow-xl min-h-[120px] flex items-center">
              <p className="text-xl font-bold text-slate-800 dark:text-slate-100 leading-relaxed">
                "{currentQuestion}"
              </p>
            </div>

            {/* Answer Box */}
            <div className="rounded-vivaguru border border-slate-200 dark:border-[#2e3032] overflow-hidden flex flex-col bg-white/70 dark:bg-[#1e1f20]/75 backdrop-blur-xl shadow-lg focus-within:ring-1 focus-within:ring-primary/45 focus-within:border-primary/45">
              <textarea
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                placeholder="Type or speak your answer here..."
                rows={5}
                className="w-full p-4 bg-transparent outline-none border-0 text-sm leading-relaxed text-slate-800 dark:text-slate-100 resize-none placeholder-slate-500"
              />
              
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200/50 dark:border-[#2e3032]/60 bg-slate-50/50 dark:bg-[#1e1f20]/30">
                <button
                  type="button"
                  onClick={() => setShowVoice(!showVoice)}
                  className={`p-2 rounded-lg hover:bg-[#e9eef6] dark:hover:bg-darkbg-hover transition-colors cursor-pointer ${
                    showVoice ? 'text-primary' : 'text-slate-450 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                  title="Voice input"
                >
                  <Mic className="w-5 h-5" />
                </button>
                <button
                  onClick={submitAnswer}
                  disabled={!answerText.trim()}
                  className="px-4 py-2 bg-primary hover:bg-primary-dark disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-455 dark:disabled:text-slate-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all duration-200 hover:scale-[1.02] active:scale-95 flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Submit Answer</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
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
          </motion.div>
        )}

        {/* Evaluating Screen */}
        {gameState === 'evaluating' && (
          <motion.div
            key="evaluating"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-16"
          >
            <SiriOrb state="processing" size="medium" className="mb-6" />
            <span className="text-sm font-semibold tracking-wider text-slate-500 dark:text-slate-400 animate-pulse uppercase">
              {loadingMsg}
            </span>
          </motion.div>
        )}

        {/* Question Feedback Mode */}
        {gameState === 'question_feedback' && lastEvaluation && (
          <motion.div
            key="feedback"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6 max-w-2xl mx-auto"
          >
            <div className="flex justify-between items-center text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              <span>Question {currentIndex} Feedback</span>
              <span className="text-success flex items-center gap-1">
                <ShieldCheck className="w-4.5 h-4.5" /> Evaluated
              </span>
            </div>

            <div className="gradient-border-card p-6 rounded-vivaguru glass shadow-xl">
              <div className="flex items-center justify-between mb-6 border-b border-slate-200 dark:border-darkbg-border pb-4">
                <div>
                  <h4 className="text-base font-bold text-slate-800 dark:text-slate-100">Grading Output</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Response analysis based on structural heuristics.</p>
                </div>
                <div className="flex flex-col items-center justify-center w-14 h-14 rounded-full border-2 border-primary/20 bg-primary/5 text-primary">
                  <span className="text-lg font-extrabold">{lastEvaluation.score}</span>
                  <span className="text-[7px] uppercase tracking-wider font-semibold -mt-1">Score</span>
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {renderMetric("Communication Skills", lastEvaluation.communication, "bg-primary")}
                {renderMetric("Confidence Indicator", lastEvaluation.confidence, "bg-secondary")}
                {renderMetric("Technical Accuracy", lastEvaluation.technical_accuracy, "bg-success")}
                {renderMetric("Response Structure", lastEvaluation.structure, "bg-warning")}
              </div>

              {/* Details */}
              <div className="space-y-4">
                {/* Missing Concepts */}
                <div>
                  <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-warning" /> Missing Concepts
                  </h5>
                  <ul className="space-y-1.5 pl-5 list-disc text-xs text-slate-600 dark:text-slate-400 leading-normal">
                    {lastEvaluation.missing_concepts.map((c, idx) => (
                      <li key={idx}>{c}</li>
                    ))}
                  </ul>
                </div>

                {/* Improvements */}
                <div>
                  <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 text-primary" /> Key Improvements
                  </h5>
                  <ul className="space-y-1.5 pl-5 list-disc text-xs text-slate-600 dark:text-slate-400 leading-normal">
                    {lastEvaluation.improvements.map((c, idx) => (
                      <li key={idx}>{c}</li>
                    ))}
                  </ul>
                </div>

                {/* General Feedback */}
                <div className="p-3.5 bg-slate-50 dark:bg-darkbg-card rounded-xl border border-slate-200/40 dark:border-darkbg-border">
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                    {lastEvaluation.feedback}
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={nextQuestion}
              className="w-full py-3 bg-primary hover:bg-primary-dark text-white rounded-vivaguru text-sm font-semibold shadow-lg shadow-primary/20 hover:scale-[1.01] transition-all duration-200 active:scale-95 flex items-center justify-center gap-1"
            >
              Proceed to Next Question
              <ChevronRight className="w-4.5 h-4.5" />
            </button>
          </motion.div>
        )}

        {/* Final Feedback Mode */}
        {gameState === 'final_feedback' && finalFeedback && (
          <motion.div
            key="final"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-6 max-w-2xl mx-auto"
          >
            <div className="flex justify-between items-center text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              <span>Interview Complete</span>
              <span className="text-primary flex items-center gap-1">
                <Award className="w-4.5 h-4.5" /> Certified Profile
              </span>
            </div>

            <div className="gradient-border-card p-6 rounded-vivaguru glass shadow-xl text-center">
              <div className="w-16 h-16 rounded-full border-4 border-primary/20 bg-primary/5 flex items-center justify-center text-primary mx-auto mb-4">
                <Award className="w-8 h-8" />
              </div>
              
              <h3 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
                Overall Score: {finalFeedback.score}%
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 leading-relaxed">
                You successfully completed the simulated session for {role}.
              </p>

              {/* Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto my-6 text-left border-t border-b border-slate-200 dark:border-darkbg-border/60 py-6">
                {renderMetric("Aggregate Communication", finalFeedback.communication, "bg-primary")}
                {renderMetric("Aggregate Confidence", finalFeedback.confidence, "bg-secondary")}
                {renderMetric("Aggregate Technical Fit", finalFeedback.technical_accuracy, "bg-success")}
                {renderMetric("Aggregate Response Structure", finalFeedback.structure, "bg-warning")}
              </div>

              {/* Strengths & Improvements */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left mb-6">
                <div>
                  <h4 className="text-xs font-bold text-success uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4" /> Top Strengths
                  </h4>
                  <ul className="space-y-1.5 pl-5 list-disc text-xs text-slate-600 dark:text-slate-400 leading-normal">
                    {finalFeedback.strengths.map((s, idx) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-warning uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" /> Focus Areas
                  </h4>
                  <ul className="space-y-1.5 pl-5 list-disc text-xs text-slate-600 dark:text-slate-400 leading-normal">
                    {finalFeedback.improvements.map((s, idx) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* General Feedback */}
              <div className="p-4 bg-slate-50 dark:bg-darkbg-card rounded-xl border border-slate-200/40 dark:border-darkbg-border text-left">
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                  {finalFeedback.general_feedback}
                </p>
              </div>
            </div>

            <button
              onClick={() => setGameState('welcome')}
              className="w-full py-3 border border-slate-300 dark:border-darkbg-border text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-darkbg-hover rounded-vivaguru text-sm font-semibold transition-all duration-200 active:scale-95 flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Retake Mock Interview
            </button>
          </motion.div>
        )}

      </AnimatePresence>

    </div>
  );
}
