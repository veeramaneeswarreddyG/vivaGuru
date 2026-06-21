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
        const response = await fetch(`http://127.0.0.1:8000/api/session/${data.session_id}`);
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

      const response = await fetch('http://127.0.0.1:8000/api/upload-jd', {
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
        const detailsResp = await fetch(`http://127.0.0.1:8000/api/session/${data.session_id}`);
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
      await fetch(`http://127.0.0.1:8000/api/session/${sessionData.session_id}/difficulty`, {
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
      const response = await fetch(`http://127.0.0.1:8000/api/session/${session_id}`);
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
      const response = await fetch('http://127.0.0.1:8000/api/chat', {
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

  return (
    <div className="flex h-screen w-screen overflow-hidden text-slate-800 dark:text-slate-100">
      
      {/* Background orbs */}
      <AnimatedBackground />

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
        />
      )}

      {/* Main View Area */}
      <main className="flex-1 h-screen overflow-y-auto relative">
        <ErrorBoundary>
          {currentView === 'welcome' && (
            <WelcomeScreen 
              onUploadSuccess={handleUploadSuccess} 
              onContinueWithoutPDF={handleContinueWithoutPDF}
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

    </div>
  );
}
