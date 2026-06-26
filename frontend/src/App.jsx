import React, { useState, useEffect } from 'react';
import AnimatedBackground from './components/AnimatedBackground';
import Sidebar from './components/Sidebar';
import WelcomeScreen from './components/WelcomeScreen';
import AnalysisScreen from './components/AnalysisScreen';
import DashboardScreen from './components/DashboardScreen';
import DifficultySelector from './components/DifficultySelector';
import ChatScreen from './components/ChatScreen';
import MockScreen from './components/MockScreen';
import ReviewScreen from './components/ReviewScreen';
import ErrorBoundary from './components/ErrorBoundary';
import LoginScreen from './components/LoginScreen';
import Logo from './components/Logo';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, Plus, Sun, Moon, MessageSquare, 
  GraduationCap, CheckSquare, BookOpen, Settings, LogOut
} from 'lucide-react';

export default function App() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });

  const [currentView, setCurrentView] = useState('welcome');
  const [sessionData, setSessionData] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [messages, setMessages] = useState([]);
  const [sessionsList, setSessionsList] = useState([]);
  
  // API loader states
  const [chatLoading, setChatLoading] = useState(false);
  const [chatLoadingMsg, setChatLoadingMsg] = useState('Thinking...');
  const [userName, setUserName] = useState(() => localStorage.getItem('vivaGuru_userName') || '');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [user, setUser] = useState(() => {
    try {
      const u = localStorage.getItem('vivaGuru_user');
      return u ? JSON.parse(u) : null;
    } catch (e) {
      return null;
    }
  });

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    localStorage.setItem('vivaGuru_user', JSON.stringify(userData));
    setUserName(userData.username);
    localStorage.setItem('vivaGuru_userName', userData.username);
    setCurrentView('welcome');
  };

  const handleSignOut = () => {
    setUser(null);
    localStorage.removeItem('vivaGuru_user');
    localStorage.removeItem('vivaGuru_userName');
    setUserName('');
    setSessionData(null);
    setRecommendations(null);
    setMessages([]);
    setMobileSidebarOpen(false);
    setCurrentView('welcome');
  };

  // Theme configuration
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Load sessions list from localStorage on mount
  useEffect(() => {
    const list = localStorage.getItem('sessionsList');
    if (list) {
      try {
        setSessionsList(JSON.parse(list));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const saveSessionToHistory = (newSession) => {
    const exists = sessionsList.some(s => s.session_id === newSession.session_id);
    if (!exists) {
      const updatedList = [newSession, ...sessionsList].slice(0, 5); // Keep last 5 sessions
      setSessionsList(updatedList);
      localStorage.setItem('sessionsList', JSON.stringify(updatedList));
    }
  };

  const handleUploadSuccess = (data, name = '') => {
    if (name) {
      setUserName(name);
      localStorage.setItem('vivaGuru_userName', name);
    }
    setCurrentView('analysis');
    
    // Simulate Siri neural analysis timing for premium visual experience
    setTimeout(async () => {
      setSessionData(data);
      saveSessionToHistory(data);
      
      // Fetch recommendations and messages from backend
      try {
        const response = await fetch(`http://127.0.0.1:8001/api/session/${data.session_id}`);
        if (response.ok) {
          const res = await response.json();
          setRecommendations(res.recommendations);
          setMessages(res.messages || []);
        }
      } catch (e) {
        console.error(e);
      }
      
      setCurrentView('dashboard');
    }, 4500); // Gives enough time to rotate through a few status messages
  };

  const handleContinueWithoutPDF = async (name = '') => {
    if (name) {
      setUserName(name);
      localStorage.setItem('vivaGuru_userName', name);
    }
    setCurrentView('analysis');
    
    try {
      const formData = new FormData();
      formData.append('text_fallback', ''); // empty triggers general profile fallback

      const response = await fetch('http://127.0.0.1:8001/api/upload-jd', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to proceed.');

      const data = await response.json();
      
      // Simulate Siri analysis timing
      setTimeout(async () => {
        setSessionData(data);
        saveSessionToHistory(data);

        // Fetch details
        const detailsResp = await fetch(`http://127.0.0.1:8001/api/session/${data.session_id}`);
        if (detailsResp.ok) {
          const res = await detailsResp.json();
          setRecommendations(res.recommendations);
          setMessages(res.messages || []);
        }
        
        setCurrentView('dashboard');
      }, 2500);
    } catch (e) {
      console.error(e);
      setCurrentView('welcome');
    }
  };

  const handleSelectDifficulty = async (level, proceed = false) => {
    if (!sessionData) return;
    
    // Update local state
    const updatedSession = { ...sessionData, difficulty: level };
    setSessionData(updatedSession);

    try {
      await fetch(`http://127.0.0.1:8001/api/session/${sessionData.session_id}/difficulty`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ difficulty: level })
      });
    } catch (e) {
      console.error(e);
    }

    if (proceed) {
      setCurrentView('chat');
    }
  };

  const handleLoadSession = async (session_id) => {
    try {
      const response = await fetch(`http://127.0.0.1:8001/api/session/${session_id}`);
      if (response.ok) {
        const res = await response.json();
        setSessionData(res.session);
        setRecommendations(res.recommendations);
        setMessages(res.messages || []);
        setCurrentView('chat');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleNewSession = () => {
    setSessionData(null);
    setRecommendations(null);
    setMessages([]);
    setCurrentView('welcome');
  };

  const handleSendMessage = async (text) => {
    if (!sessionData) return;

    // Instantly show user message in list
    const userMsg = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    
    setChatLoading(true);
    setChatLoadingMsg('Thinking...');
    
    // Cycle typing indicator text for premium feel
    const msgs = ['Thinking...', 'Analyzing query...', 'Building Response...'];
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % msgs.length;
      setChatLoadingMsg(msgs[idx]);
    }, 1500);

    try {
      const response = await fetch('http://127.0.0.1:8001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionData.session_id, message: text })
      });

      if (!response.ok) throw new Error('API failure.');
      
      const data = await response.json();
      
      // Append response
      const assistantMsg = { 
        role: 'assistant', 
        content: data, 
        difficulty: sessionData.difficulty,
        follow_ups: data.follow_up_questions 
      };
      
      setMessages(prev => [...prev, assistantMsg]);
    } catch (e) {
      console.error(e);
    } finally {
      clearInterval(interval);
      setChatLoading(false);
    }
  };

  // Helper dashboard navigation callback
  const handleDashboardProceed = (qText = null) => {
    if (qText && typeof qText === 'string') {
      setCurrentView('chat');
      // Execute query on next tick
      setTimeout(() => handleSendMessage(qText), 200);
    } else {
      setCurrentView('difficulty');
    }
  };
  const mobileMenuItems = [
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'mock', label: 'Mock', icon: GraduationCap },
    { id: 'review', label: 'Review', icon: CheckSquare },
    { id: 'dashboard', label: 'Dashboard', icon: BookOpen },
    { id: 'difficulty', label: 'Calibrate', icon: Settings },
  ];

  return (
    <div className="flex h-dvh w-screen overflow-hidden text-slate-800 dark:text-slate-100 animate-fade-in">
      
      {/* Background orbs */}
      <AnimatedBackground isChat={currentView === 'chat'} />

      {!user ? (
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
      ) : (
        <>
          {/* Sidebar (Render only if session exists and not loading welcome/analysis) */}
          {sessionData && currentView !== 'welcome' && currentView !== 'analysis' && (
            <Sidebar
              currentView={currentView}
              onViewChange={setCurrentView}
              theme={theme}
              toggleTheme={toggleTheme}
              onNewSession={handleNewSession}
              sessionsList={sessionsList}
              onLoadSession={handleLoadSession}
              user={user}
              onSignOut={handleSignOut}
            />
          )}

          {/* Mobile sliding Sidebar drawer */}
          <AnimatePresence>
            {mobileSidebarOpen && sessionData && currentView !== 'welcome' && currentView !== 'analysis' && (
              <div className="fixed inset-0 z-50 md:hidden flex">
                {/* Backdrop overlay */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.5 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setMobileSidebarOpen(false)}
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                />

                {/* Drawer container */}
                <motion.div
                  initial={{ x: '-100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '-100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                  className="relative w-72 h-full bg-[#f6f8fc] dark:bg-darkbg flex flex-col shadow-2xl z-10"
                >
                  <Sidebar
                    currentView={currentView}
                    onViewChange={(view) => {
                      setCurrentView(view);
                      setMobileSidebarOpen(false);
                    }}
                    theme={theme}
                    toggleTheme={toggleTheme}
                    onNewSession={() => {
                      handleNewSession();
                      setMobileSidebarOpen(false);
                    }}
                    sessionsList={sessionsList}
                    onLoadSession={(sid) => {
                      handleLoadSession(sid);
                      setMobileSidebarOpen(false);
                    }}
                    isMobile={true}
                    onClose={() => setMobileSidebarOpen(false)}
                    user={user}
                    onSignOut={handleSignOut}
                  />
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Right Pane container */}
          <div className="flex-grow flex flex-col h-full overflow-hidden relative">
            
            {/* Mobile Top Header */}
            {sessionData && currentView !== 'welcome' && currentView !== 'analysis' && (
              <div className="md:hidden flex items-center justify-between px-4 py-3 bg-[#f6f8fc] dark:bg-darkbg border-b border-slate-200 dark:border-darkbg-border/60 z-30 select-none">
                <div className="flex items-center gap-3">
                  <button 
                    type="button"
                    onClick={() => setMobileSidebarOpen(true)}
                    className="p-1.5 rounded-xl bg-[#e9eef6] dark:bg-darkbg-hover hover:bg-[#dadce0] dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
                  >
                    <Menu className="w-5 h-5" />
                  </button>
                  <span className="font-extrabold text-base tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <Logo size="sm" />
                    VivaGuru
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleNewSession}
                    title="New Chat Session"
                    className="p-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary dark:text-primary-light transition-colors cursor-pointer"
                  >
                    <Plus className="w-4.5 h-4.5" />
                  </button>
                  <button
                    type="button"
                    onClick={toggleTheme}
                    className="p-2 rounded-xl bg-[#e9eef6] dark:bg-darkbg-hover hover:bg-[#dadce0] dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
                  >
                    {theme === 'dark' ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    title="Sign Out"
                    className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4.5 h-4.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Main View Area */}
            <main className={`flex-1 relative ${currentView === 'chat' ? 'h-full overflow-hidden' : 'overflow-y-auto'}`}>
              <ErrorBoundary>
                {currentView === 'welcome' && (
                  <WelcomeScreen 
                    onUploadSuccess={handleUploadSuccess} 
                    onContinueWithoutPDF={handleContinueWithoutPDF}
                    userName={userName}
                    onSignOut={handleSignOut}
                  />
                )}
                
                {currentView === 'analysis' && <AnalysisScreen />}

                {currentView === 'dashboard' && sessionData && (
                  <DashboardScreen 
                    sessionData={sessionData} 
                    recommendations={recommendations}
                    onProceed={handleDashboardProceed}
                  />
                )}

                {currentView === 'difficulty' && sessionData && (
                  <DifficultySelector
                    currentDifficulty={sessionData.difficulty}
                    onSelect={handleSelectDifficulty}
                  />
                )}

                {currentView === 'chat' && sessionData && (
                  <ChatScreen
                    sessionData={sessionData}
                    messages={messages}
                    onSendMessage={handleSendMessage}
                    isLoading={chatLoading}
                    loadingMessage={chatLoadingMsg}
                    onNewSession={handleNewSession}
                    userName={userName}
                  />
                )}

                {currentView === 'mock' && sessionData && (
                  <MockScreen sessionData={sessionData} />
                )}

                {currentView === 'review' && sessionData && (
                  <ReviewScreen sessionData={sessionData} recommendations={recommendations} />
                )}
              </ErrorBoundary>
            </main>

            {/* Mobile Bottom Navigation Bar */}
            {sessionData && currentView !== 'welcome' && currentView !== 'analysis' && (
              <div className="md:hidden flex items-center justify-around bg-[#f6f8fc] dark:bg-darkbg border-t border-slate-200 dark:border-darkbg-border/60 py-2.5 px-1 z-30 select-none">
                {mobileMenuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setCurrentView(item.id)}
                      className={`flex flex-col items-center gap-1.5 py-1 px-3 rounded-xl transition-all duration-150 cursor-pointer ${
                        isActive 
                          ? 'text-primary dark:text-primary-light font-semibold scale-105' 
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-[9px] font-bold tracking-tight uppercase">
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

    </div>
  );
}
