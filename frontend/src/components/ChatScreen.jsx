import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Mic, BookOpen, 
  GraduationCap, Cpu, AlertTriangle, Lightbulb, Plus
} from 'lucide-react';
import VoiceVisualizer from './VoiceVisualizer';
import Logo from './Logo';

// Helper to parse basic Markdown formatting (bold, inline code, list items, paragraphs, custom VDL highlights, dividers)
const renderMarkdown = (text) => {
  if (!text) return null;
  
  // Normalize inline lists (space-hyphen-space, space-bullet-space, or space-number-dot-space) into newlines for readability
  let normalized = text
    .replace(/(?:\s+|:\s*)[-•]\s+/g, '\n- ')
    .replace(/(?:\s+|:\s*)(\d+\.)\s+/g, '\n$1 ');

  // Split by double newlines to handle paragraphs
  const paragraphs = normalized.split(/\n\n+/);
  
  const parseInlineMarkdown = (inlineText) => {
    const parts = inlineText.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={idx} className="font-extrabold text-slate-900 dark:text-slate-100">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={idx} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-darkbg-hover font-mono text-xs text-primary dark:text-primary-light">{part.slice(1, -1)}</code>;
      }
      return part;
    });
  };

  return paragraphs.map((para, pIdx) => {
    const trimmedPara = para.trim();
    
    // 1. Check if the paragraph is a divider line (like ━━━━ or ───)
    if (/^[━─═\-_]+$/.test(trimmedPara) || trimmedPara.includes('━━━') || trimmedPara.includes('───')) {
      return <hr key={pIdx} className="border-slate-200/60 dark:border-darkbg-border/60 my-4" />;
    }

    // 2. Check if it's a list block
    const lines = para.split('\n');
    const isBulletList = lines.every(line => line.trim().startsWith('- ') || line.trim().startsWith('* ') || line.trim().startsWith('• '));
    if (isBulletList && lines.length > 0) {
      return (
        <ul key={pIdx} className="list-disc pl-5 space-y-2.5 my-4 text-xs sm:text-sm text-slate-650 dark:text-slate-300">
          {lines.map((line, lIdx) => {
            const cleanLine = line.trim().replace(/^[\s-*•]+/, '');
            return (
              <li key={lIdx} className="leading-relaxed">
                {parseInlineMarkdown(cleanLine)}
              </li>
            );
          })}
        </ul>
      );
    }

    const isNumberedList = lines.every(line => /^\d+\.\s+/.test(line.trim()) || /^[①②③④⑤⑥⑦⑧⑨⑩]\s+/.test(line.trim()));
    if (isNumberedList && lines.length > 0) {
      return (
        <ol key={pIdx} className="list-decimal pl-5 space-y-2.5 my-4 text-xs sm:text-sm text-slate-655 dark:text-slate-300">
          {lines.map((line, lIdx) => {
            const cleanLine = line.trim().replace(/^\d+\.\s+/, '').replace(/^[①②③④⑤⑥⑦⑧⑨⑩]\s+/, '');
            return (
              <li key={lIdx} className="leading-relaxed">
                {parseInlineMarkdown(cleanLine)}
              </li>
            );
          })}
        </ol>
      );
    }

    // 3. Check for VDL Highlight Boxes
    // 💡 Insight, ⚠️ Mistake, 🔥 Tip, 📝 Takeaway, 🎤 Interviewer
    if (trimmedPara.startsWith('💡') || trimmedPara.startsWith('⚠️') || trimmedPara.startsWith('🔥') || trimmedPara.startsWith('📝') || trimmedPara.startsWith('🎤')) {
      let boxColor = "border-primary/20 bg-primary/5 text-primary-dark dark:text-primary-light";
      let title = "";
      let content = trimmedPara;

      if (trimmedPara.startsWith('💡')) {
        boxColor = "border-primary/30 bg-primary/5 dark:bg-primary/5 text-slate-800 dark:text-slate-200";
        title = "💡 Interview Insight";
        content = trimmedPara.slice(2).trim();
      } else if (trimmedPara.startsWith('⚠️')) {
        boxColor = "border-danger/30 bg-danger/5 dark:bg-danger/5 text-slate-800 dark:text-slate-200";
        title = "⚠️ Common Mistake";
        content = trimmedPara.slice(2).trim();
      } else if (trimmedPara.startsWith('🔥')) {
        boxColor = "border-secondary/30 bg-secondary/5 dark:bg-secondary/5 text-slate-800 dark:text-slate-200";
        title = "🔥 Pro Tip";
        content = trimmedPara.slice(2).trim();
      } else if (trimmedPara.startsWith('📝')) {
        boxColor = "border-success/30 bg-success/5 dark:bg-success/5 text-slate-800 dark:text-slate-200";
        title = "📝 Key Takeaway";
        content = trimmedPara.slice(2).trim();
      } else if (trimmedPara.startsWith('🎤')) {
        boxColor = "border-warning/30 bg-warning/5 dark:bg-warning/5 text-slate-800 dark:text-slate-200";
        title = "🎤 What the Interviewer Wants";
        content = trimmedPara.slice(2).trim();
      }

      return (
        <div key={pIdx} className={`my-4 p-4 rounded-xl border ${boxColor} text-xs sm:text-sm shadow-inner`}>
          <div className="font-bold mb-1">{title}</div>
          <div>{parseInlineMarkdown(content)}</div>
        </div>
      );
    }

    // 4. Handle inline lines (timeline structures, single breaks)
    if (lines.length > 1) {
      return (
        <div key={pIdx} className="text-xs sm:text-sm text-slate-650 dark:text-slate-300 leading-relaxed mb-4 last:mb-0 space-y-2">
          {lines.map((line, lIdx) => {
            const trimmed = line.trim();
            const isBullet = trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ');
            const isNumbered = /^\d+\.\s+/.test(trimmed) || /^[①②③④⑤⑥⑦⑧⑨⑩]/.test(trimmed);

            if (isBullet) {
              return (
                <span key={lIdx} className="block pl-4 relative text-slate-600 dark:text-slate-300">
                  <span className="absolute left-1">•</span>
                  {parseInlineMarkdown(trimmed.replace(/^[\s-*•]+/, ''))}
                </span>
              );
            }
            if (isNumbered) {
              const numMatch = trimmed.match(/^(\d+\.|[①②③④⑤⑥⑦⑧⑨⑩])/);
              const prefix = numMatch ? numMatch[1] : '';
              return (
                <span key={lIdx} className="block pl-5 relative text-slate-600 dark:text-slate-300">
                  <span className="absolute left-1 text-slate-400 font-semibold">{prefix}</span>
                  {parseInlineMarkdown(trimmed.replace(/^\d+\.\s+/, '').replace(/^[①②③④⑤⑥⑦⑧⑨⑩]/, ''))}
                </span>
              );
            }

            return (
              <span key={lIdx} className="block">
                {parseInlineMarkdown(line)}
              </span>
            );
          })}
        </div>
      );
    }

    return (
      <p key={pIdx} className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-3 last:mb-0">
        {parseInlineMarkdown(para)}
      </p>
    );
  });
};

// Section Accordion Component with Smooth height expand drawer for VDL Progressive Disclosure
const SectionAccordion = ({ sec, contentText, renderMarkdown }) => {
  const [isOpen, setIsOpen] = useState(sec.key === 'concept_explanation'); // definition open by default
  const Icon = sec.icon;

  return (
    <div className="border border-slate-200/50 dark:border-darkbg-border/50 rounded-xl bg-slate-50/50 dark:bg-darkbg-card/30 overflow-hidden shadow-sm transition-all duration-200">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-100/50 dark:hover:bg-darkbg-hover/30 transition-colors cursor-pointer select-none"
      >
        <div className="flex items-center gap-2.5">
          <div className={`p-1.5 rounded-lg bg-slate-100 dark:bg-darkbg-hover ${sec.color} flex items-center justify-center`}>
            <Icon className="w-4 h-4" />
          </div>
          <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
            {sec.label}
          </span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-slate-400 dark:text-slate-500"
        >
          <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
          </svg>
        </motion.div>
      </button>
      
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            <div className="p-4 pt-1 border-t border-slate-100 dark:border-darkbg-border/30 text-slate-700 dark:text-slate-300">
              {renderMarkdown(contentText)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function ChatScreen({ 
  sessionData, 
  messages = [], 
  onSendMessage, 
  isLoading, 
  loadingMessage = 'Thinking...',
  onNewSession,
  userName = ''
}) {
  const [inputValue, setInputValue] = useState('');
  const [showVoice, setShowVoice] = useState(false);
  
  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const textareaRef = useRef(null);

  // Helper to scroll to bottom
  const scrollToBottom = (behavior = 'smooth') => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior
      });
    }
  };

  // Auto-expand textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(200, textareaRef.current.scrollHeight)}px`;
    }
  }, [inputValue]);

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollToBottom('smooth');
    const t1 = setTimeout(() => scrollToBottom('smooth'), 50);
    const t2 = setTimeout(() => scrollToBottom('smooth'), 150);
    const t3 = setTimeout(() => scrollToBottom('smooth'), 300);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [messages.length, isLoading]);

  // Monitor size changes (like accordion opening/closing) to adjust scroll dynamically
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(() => {
      const threshold = 220; // px
      const isCloseToBottom = container.scrollHeight - container.scrollTop - container.clientHeight <= threshold;
      if (isCloseToBottom) {
        scrollToBottom('smooth');
      }
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    
    onSendMessage(inputValue.trim());
    setInputValue('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleVoiceTranscript = (text) => {
    setInputValue(text);
    setShowVoice(false);
  };

  const sectionConfig = [
    { key: 'concept_explanation', label: 'Concept Explanation', icon: BookOpen, color: 'text-primary' },
    { key: 'interview_explanation', label: 'How to Explain in Interviews', icon: GraduationCap, color: 'text-secondary' },
    { key: 'real_world_example', label: 'Real World Example', icon: Cpu, color: 'text-success' },
    { key: 'common_mistakes', label: 'Common Mistakes to Avoid', icon: AlertTriangle, color: 'text-danger' },
    { key: 'interview_tip', label: 'Interview Tip', icon: Lightbulb, color: 'text-warning' }
  ];

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto px-3 py-3 sm:px-4 sm:py-6 relative overflow-hidden flex-grow">
      
      {/* Chat Header Bar */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-darkbg-border/60 pb-3 mb-4 flex-shrink-0 select-none">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
            {sessionData.role}
          </span>
          <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-light tracking-wider">
            {sessionData.difficulty || 'Medium'} Depth
          </span>
        </div>
        
        <button
          type="button"
          onClick={onNewSession}
          title="Start New Session"
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-darkbg-border text-slate-500 hover:text-slate-850 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-[#e9eef6] dark:hover:bg-darkbg-hover text-xs font-semibold transition-all duration-200 active:scale-95 cursor-pointer shadow-sm animate-pulse"
        >
          <Plus className="w-3.5 h-3.5 text-primary dark:text-primary-light" />
          <span>New Chat</span>
        </button>
      </div>

      {messages.length === 0 && !isLoading ? (
        /* Empty State: Centered Greeting & Pill Input Bar */
        <div className="flex-1 flex flex-col items-center justify-center px-2 pb-16 sm:pb-24">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-2xl text-center space-y-6"
          >
            {/* Greeting */}
            <div className="space-y-1 sm:space-y-2">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
                Hello, <span className="gradient-primary-text">{userName || 'there'}</span>.
              </h2>
              <p className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-slate-500 via-slate-650 to-slate-500 dark:from-slate-400 dark:via-slate-350 dark:to-slate-400 bg-clip-text text-transparent max-w-lg mx-auto leading-normal">
                How would you like to calibrate your interview skills today?
              </p>
            </div>

            {/* Pill Search Input Bar */}
            <motion.div layoutId="google-ai-search-bar" className="google-ai-input-wrapper shadow-2xl w-full max-w-xl mx-auto">
              <form
                onSubmit={handleSubmit}
                className="google-ai-input-inner bg-white dark:bg-[#1e1f20] flex items-center px-3 py-2 gap-2"
              >
                {/* + Button (left) */}
                <button
                  type="button"
                  className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-200/80 dark:bg-white/10 hover:bg-slate-300/80 dark:hover:bg-white/20 flex items-center justify-center text-slate-500 dark:text-slate-300 transition-all duration-200 cursor-pointer"
                  title="Attach or add"
                >
                  <Plus className="w-4 h-4" />
                </button>

                {/* Textarea (center) */}
                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything"
                  className="flex-grow bg-transparent border-0 outline-none focus:ring-0 text-sm py-1.5 px-1 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-500 resize-none max-h-40 min-h-[36px] leading-relaxed"
                />

                {/* Mic Button (right) */}
                <button
                  type="button"
                  onClick={() => setShowVoice(!showVoice)}
                  className={`flex-shrink-0 p-2 rounded-full hover:bg-slate-200/60 dark:hover:bg-white/10 transition-all duration-200 cursor-pointer ${
                    showVoice
                      ? 'text-primary dark:text-primary-light'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                  title="Voice input"
                >
                  <Mic className="w-5 h-5" />
                </button>

                {/* Send Button */}
                <AnimatePresence>
                  {inputValue.trim() && (
                    <motion.button
                      type="submit"
                      initial={{ opacity: 0, scale: 0.7 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.7 }}
                      transition={{ duration: 0.18 }}
                      className="flex-shrink-0 w-8 h-8 rounded-full bg-primary hover:bg-primary-dark flex items-center justify-center text-white shadow-md transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95"
                      title="Send"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </motion.button>
                  )}
                </AnimatePresence>
              </form>
            </motion.div>

            {/* Google AI style Suggestion Prompts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl w-full mt-10 select-none">
              {[
                { text: "Simulate a mock behavioral round", desc: "Practice behavioral questions using the STAR method.", icon: GraduationCap, color: "text-[#00A88F]" },
                { text: "Explain coding interview patterns", desc: "Overview of Sliding Window, Two Pointers, and DFS/BFS.", icon: Cpu, color: "text-[#2A1B3D]" },
                { text: "Help me analyze a target job description", desc: "Upload a PDF or paste text to calibrate preparation metrics.", icon: BookOpen, color: "text-[#40E0D0]" },
                { text: "Give me tips for system design rounds", desc: "Best practices for scalability, databases, and rate limiting.", icon: Lightbulb, color: "text-[#00A88F]" }
              ].map((chip, idx) => {
                const ChipIcon = chip.icon;
                return (
                  <motion.div
                    key={idx}
                    whileHover={{ scale: 1.01, translateY: -2 }}
                    onClick={() => {
                      if (chip.text.includes("analyze")) {
                        onNewSession(); // Redirects to Welcome upload page!
                      } else {
                        onSendMessage(chip.text);
                      }
                    }}
                    className="glass-premium p-4 rounded-vivaguru border border-slate-200/50 dark:border-darkbg-border/50 hover:border-[#8ab4f8]/50 hover:bg-[#e9eef6]/30 dark:hover:bg-white/5 text-left transition-all duration-200 cursor-pointer shadow-md flex items-start gap-3 w-full"
                  >
                    <div className={`p-2 rounded-xl bg-slate-100 dark:bg-white/5 ${chip.color} flex-shrink-0 mt-0.5 shadow-inner`}>
                      <ChipIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {chip.text}
                      </h4>
                      <p className="text-[10px] text-slate-455 dark:text-slate-500 mt-0.5 leading-normal">
                        {chip.desc}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Voice Recognition Dialog */}
          <AnimatePresence>
            {showVoice && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                className="glass-premium max-w-sm w-full mx-auto rounded-vivaguru p-5 shadow-2xl mt-6 border border-primary/10"
              >
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Voice Dictation
                  </h4>
                  <button
                    onClick={() => setShowVoice(false)}
                    className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    Close
                  </button>
                </div>
                <VoiceVisualizer onTranscript={handleVoiceTranscript} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        /* Active State: Message List + Bottom Input Bar */
        <div className="flex-1 flex flex-col min-h-0 relative">
          {/* Messages Scroll Area */}
          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto pr-2 space-y-8 pb-4">
            {messages.map((msg, index) => {
              const isUser = msg.role === 'user';
              
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className={`flex gap-3 sm:gap-4 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="flex-shrink-0 mt-1">
                      <Logo size="sm" />
                    </div>
                  )}
                  
                  <div className={`${isUser ? 'max-w-[90%] sm:max-w-[85%] bg-primary text-white rounded-2xl px-4 py-3 shadow-md' : 'w-full'}`}>
                    {isUser ? (
                      <p className="text-sm font-medium whitespace-pre-wrap leading-relaxed">
                        {msg.content}
                      </p>
                    ) : typeof msg.content === 'string' ? (
                      <div className="text-sm leading-relaxed text-slate-800 dark:text-slate-200 glass p-4 rounded-xl shadow-md border border-slate-200/50 dark:border-darkbg-border/50 bg-white dark:bg-darkbg-card">
                        {renderMarkdown(msg.content)}
                      </div>
                    ) : (
                      // AI Response Structured Layout
                      <div className="glass-premium p-4 sm:p-6 rounded-2xl border border-slate-200/60 dark:border-darkbg-border/60 bg-white/70 dark:bg-darkbg-card/70 backdrop-blur-xl shadow-xl space-y-6">
                        
                        {/* Header block inside bubble */}
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-darkbg-border/50 pb-3">
                          <h4 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                            {msg.content?.title || 'AI Response'}
                          </h4>
                          {msg.difficulty && (
                            <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-light tracking-wider">
                              {msg.difficulty} Depth
                            </span>
                          )}
                        </div>

                        {/* Content block: Accordion Cards */}
                        <div className="space-y-3">
                          {sectionConfig.map((sec) => {
                            const contentText = msg.content?.[sec.key];
                            if (!contentText) return null;

                            return (
                              <SectionAccordion
                                key={sec.key}
                                sec={sec}
                                contentText={contentText}
                                renderMarkdown={renderMarkdown}
                              />
                            );
                          })}
                        </div>

                        {/* Dynamic Follow-up Suggestions */}
                        {Array.isArray(msg.follow_ups) && msg.follow_ups.length > 0 && (
                          <div className="pt-4 border-t border-slate-100 dark:border-darkbg-border/50">
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2">
                              Explore Further
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {msg.follow_ups.map((followQ, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => onSendMessage(followQ)}
                                  className="text-xs px-3.5 py-1.5 rounded-full bg-slate-50 hover:bg-[#e9eef6] dark:bg-darkbg-card border border-slate-200 dark:border-darkbg-border text-slate-600 dark:text-slate-355 font-medium hover:border-primary/40 hover:text-primary dark:hover:text-primary-light hover:shadow-sm transition-all duration-200 text-left cursor-pointer"
                                >
                                  {followQ}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {isUser && (
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-200 dark:bg-darkbg-hover flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-xs flex-shrink-0 mt-1 shadow-inner">
                      U
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Google AI Thinking Bubble */}
          <AnimatePresence>
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 14, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, y: 8 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="flex gap-3 sm:gap-4 justify-start items-end mt-2 mb-4 relative z-10"
              >
                {/* VG Avatar */}
                <div className="flex-shrink-0 mb-0.5">
                  <Logo size="sm" />
                </div>

                {/* Google AI style leaf-shaped thinking bubble */}
                <div className="google-ai-thinking-wrapper">
                  <div className="google-ai-thinking-inner bg-[#f0f4f9] dark:bg-[#1e1f20]">
                    <span className="ai-dot" />
                    <span className="ai-dot" />
                    <span className="ai-dot" />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

            {/* Bottom spacer to push content above the absolute search bar */}
            <div className="h-28 flex-shrink-0" />
            <div ref={messagesEndRef} />

          {/* Voice Recognition Dialog overlay (absolute at bottom when active) */}
          <AnimatePresence>
            {showVoice && (
              <div className="absolute bottom-20 left-4 right-4 bg-transparent z-20">
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.95 }}
                  className="glass-premium max-w-sm mx-auto rounded-vivaguru p-5 shadow-2xl border border-primary/10"
                >
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Voice Dictation
                    </h4>
                    <button
                      onClick={() => setShowVoice(false)}
                      className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                  <VoiceVisualizer onTranscript={handleVoiceTranscript} />
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Input Form at Bottom — Google AI style */}
          <div className="absolute bottom-4 left-2 right-2 sm:bottom-6 sm:left-4 sm:right-4 bg-transparent select-none z-10">
            <motion.div layoutId="google-ai-search-bar" className="google-ai-input-wrapper shadow-2xl">
              <form
                onSubmit={handleSubmit}
                className="google-ai-input-inner bg-white dark:bg-[#1e1f20] flex items-center px-3 py-2 gap-2"
              >
                {/* + Button (left) */}
                <button
                  type="button"
                  className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-200/80 dark:bg-white/10 hover:bg-slate-300/80 dark:hover:bg-white/20 flex items-center justify-center text-slate-500 dark:text-slate-300 transition-all duration-200 cursor-pointer"
                  title="Attach or add"
                >
                  <Plus className="w-4 h-4" />
                </button>

                {/* Textarea (center) */}
                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything"
                  className="flex-grow bg-transparent border-0 outline-none focus:ring-0 text-sm py-1.5 px-1 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-500 resize-none max-h-40 min-h-[36px] leading-relaxed"
                  disabled={isLoading}
                />

                {/* Mic Button (right) */}
                <button
                  type="button"
                  onClick={() => setShowVoice(!showVoice)}
                  className={`flex-shrink-0 p-2 rounded-full hover:bg-slate-200/60 dark:hover:bg-white/10 transition-all duration-200 cursor-pointer ${
                    showVoice
                      ? 'text-primary dark:text-primary-light'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                  title="Voice input"
                >
                  <Mic className="w-5 h-5" />
                </button>

                {/* Send Button — only shown when input has text */}
                <AnimatePresence>
                  {inputValue.trim() && (
                    <motion.button
                      type="submit"
                      initial={{ opacity: 0, scale: 0.7 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.7 }}
                      transition={{ duration: 0.18 }}
                      disabled={isLoading}
                      className="flex-shrink-0 w-8 h-8 rounded-full bg-primary hover:bg-primary-dark disabled:bg-slate-300 dark:disabled:bg-slate-700 flex items-center justify-center text-white shadow-md transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95"
                      title="Send"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </motion.button>
                  )}
                </AnimatePresence>
              </form>
            </motion.div>
          </div>
        </div>
      )}

    </div>
  );
}
