import React, { useState } from 'react';
import { 
  Plus, Sun, Moon, MessageSquare, HelpCircle, BookOpen, 
  GraduationCap, CheckSquare, X, LogOut, ChevronLeft, ChevronRight
} from 'lucide-react';

export default function Sidebar({ 
  currentView, 
  onViewChange, 
  theme, 
  toggleTheme, 
  onNewSession,
  sessionsList = [],
  onLoadSession,
  isMobile = false,
  onClose,
  user = null,
  onSignOut
}) {
  // Check localStorage for collapsed preference
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (isMobile) return false;
    return localStorage.getItem('vivaGuru_sidebarCollapsed') === 'true';
  });

  const toggleCollapse = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    localStorage.setItem('vivaGuru_sidebarCollapsed', String(nextState));
  };

  const menuItems = [
    { id: 'chat', label: 'AI Chat', icon: MessageSquare },
    { id: 'mock', label: 'Mock Interview', icon: GraduationCap },
    { id: 'review', label: 'Answer Review', icon: CheckSquare },
    { id: 'dashboard', label: 'Job Dashboard', icon: BookOpen },
  ];

  const desktopWidthClass = isCollapsed ? 'w-20 px-2' : 'w-64 px-4';
  const sidebarClass = isMobile 
    ? 'w-full h-full py-5 px-4' 
    : `${desktopWidthClass} hidden md:flex transition-all duration-300`;

  return (
    <aside className={`${sidebarClass} border-r border-slate-200 dark:border-darkbg-border bg-[#f6f8fc] dark:bg-darkbg h-full flex flex-col justify-between py-4 z-20 flex-shrink-0 select-none overflow-hidden`}>
      
      {/* Top Section - Scrollable Wrapper */}
      <div className="flex-1 overflow-y-auto space-y-6 pr-1 scrollbar-thin mb-2">
        
        {/* Brand / Logo section */}
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-4">
            <div 
              onClick={() => onViewChange('welcome')}
              className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white font-extrabold text-sm shadow-md cursor-pointer relative group"
            >
              VG
              <div className="absolute left-full ml-3 px-2 py-1 bg-slate-900 text-white text-[10px] font-bold rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-md z-30">
                VivaGuru Welcome
              </div>
            </div>
            <button 
              type="button" 
              onClick={toggleCollapse} 
              className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-darkbg-hover text-slate-500 dark:text-slate-400 cursor-pointer"
              title="Expand Sidebar"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => onViewChange('welcome')}>
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white font-bold text-sm shadow-md">
                VG
              </div>
              <div>
                <span className="font-extrabold text-base tracking-tight text-slate-800 dark:text-slate-100">
                  VivaGuru
                </span>
                <span className="text-[9px] block text-primary font-bold uppercase tracking-wider -mt-1">
                  AI Prep
                </span>
              </div>
            </div>
            {!isMobile && (
              <button 
                type="button" 
                onClick={toggleCollapse} 
                className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-darkbg-hover text-slate-500 dark:text-slate-400 cursor-pointer"
                title="Collapse Sidebar"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            {isMobile && (
              <button 
                type="button" 
                onClick={onClose} 
                className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-darkbg-hover text-slate-500 dark:text-slate-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* New Session Button */}
        {isCollapsed ? (
          <button
            onClick={onNewSession}
            className="w-11 h-11 flex items-center justify-center bg-primary hover:bg-primary-dark text-white rounded-xl shadow-lg shadow-primary/10 hover:shadow-primary/20 transition-all duration-200 active:scale-[0.98] mx-auto relative group"
          >
            <Plus className="w-5 h-5" />
            <div className="absolute left-full ml-3 px-2 py-1 bg-slate-900 text-white text-[10px] font-bold rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-md z-30">
              New session
            </div>
          </button>
        ) : (
          <button
            onClick={onNewSession}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-primary hover:bg-primary-dark text-white rounded-vivaguru text-sm font-semibold shadow-lg shadow-primary/10 hover:shadow-primary/20 transition-all duration-200 active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            New Session
          </button>
        )}

        {/* Navigation Items */}
        <nav className={`space-y-1 ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
          {!isCollapsed && (
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 block mb-2">
              Workspace
            </span>
          )}
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            
            return isCollapsed ? (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`w-11 h-11 flex items-center justify-center rounded-xl transition-all duration-150 relative group ${
                  isActive 
                    ? 'bg-primary/15 text-primary-dark dark:bg-primary/15 dark:text-primary-light font-semibold' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-[#e9eef6] dark:hover:bg-darkbg-hover hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-primary-dark dark:text-primary-light' : 'text-slate-400'}`} />
                <div className="absolute left-full ml-3 px-2 py-1 bg-slate-900 text-white text-[10px] font-bold rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-md z-30">
                  {item.label}
                </div>
              </button>
            ) : (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`w-full flex items-center gap-3 py-2.5 px-3 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive 
                    ? 'bg-primary/15 text-primary-dark dark:bg-primary/15 dark:text-primary-light font-semibold' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-[#e9eef6] dark:hover:bg-darkbg-hover hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-primary-dark dark:text-primary-light' : 'text-slate-400'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Recent Sessions history (Expanded only) */}
        {!isCollapsed && sessionsList && sessionsList.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 block">
              Recent Sessions
            </span>
            <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
              {sessionsList.map((s, idx) => (
                <button
                  key={s.session_id || idx}
                  onClick={() => onLoadSession(s.session_id)}
                  className="w-full text-left py-2 px-2.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-450 hover:bg-[#e9eef6] dark:hover:bg-darkbg-hover hover:text-slate-900 dark:hover:text-slate-200 transition-all truncate block cursor-pointer"
                >
                  {s.role}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Section - Pinned Wrapper */}
      <div className={`space-y-4 pt-4 border-t border-slate-200 dark:border-darkbg-border/60 ${isCollapsed ? 'flex flex-col items-center' : ''} flex-shrink-0`}>
        
        {/* Help / Settings / Sign Out */}
        <div className={`space-y-1.5 ${isCollapsed ? 'w-full flex flex-col items-center' : 'w-full'}`}>
          {isCollapsed ? (
            <>
              <button 
                type="button"
                onClick={() => onViewChange('welcome')}
                className="w-11 h-11 flex items-center justify-center rounded-xl text-slate-500 dark:text-slate-400 hover:bg-[#e9eef6] dark:hover:bg-darkbg-hover hover:text-slate-800 dark:hover:text-slate-200 transition-all cursor-pointer relative group"
              >
                <HelpCircle className="w-5 h-5 text-slate-400" />
                <div className="absolute left-full ml-3 px-2 py-1 bg-slate-900 text-white text-[10px] font-bold rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-md z-30">
                  Welcome Screen
                </div>
              </button>

              {user && (
                <button 
                  type="button"
                  onClick={onSignOut}
                  className="w-11 h-11 flex items-center justify-center rounded-xl text-red-500 hover:bg-red-500/10 dark:hover:bg-red-500/20 transition-all cursor-pointer relative group"
                >
                  <LogOut className="w-5 h-5 text-red-500" />
                  <div className="absolute left-full ml-3 px-2 py-1 bg-slate-900 text-white text-[10px] font-bold rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-md z-30">
                    Sign Out
                  </div>
                </button>
              )}
            </>
          ) : (
            <>
              <button 
                type="button"
                onClick={() => onViewChange('welcome')}
                className="w-full flex items-center gap-3 py-2 px-3 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-[#e9eef6] dark:hover:bg-darkbg-hover hover:text-slate-800 dark:hover:text-slate-200 transition-all cursor-pointer"
              >
                <HelpCircle className="w-4 h-4 text-slate-400" />
                Welcome Screen
              </button>

              {user && (
                <button 
                  type="button"
                  onClick={onSignOut}
                  className="w-full flex items-center gap-3 py-2 px-3 rounded-xl text-xs font-semibold text-red-500 hover:bg-red-500/10 dark:hover:bg-red-500/20 transition-all cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-red-500" />
                  Sign Out
                </button>
              )}
            </>
          )}
        </div>

        {/* Theme Toggle & User Info */}
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-3 pt-2">
            <div 
              className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-650 dark:text-slate-400 shadow-inner flex-shrink-0 relative group cursor-help"
            >
              {user?.username ? user.username.slice(0, 2).toUpperCase() : 'VG'}
              <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-900 text-white text-[10px] font-bold rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-md z-30 space-y-0.5">
                <span className="block text-slate-200">{user?.username || 'Guest'}</span>
                <span className="block text-[8px] text-slate-450 font-normal">{user?.email || 'Free Tier'}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-[#e9eef6] dark:bg-darkbg-hover hover:bg-[#dadce0] dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer relative group"
            >
              {theme === 'dark' ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
              <div className="absolute left-full ml-3 px-2 py-1 bg-slate-900 text-white text-[10px] font-bold rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-md z-30">
                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </div>
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between px-2 pt-2 border-t border-slate-200/50 dark:border-darkbg-border/30">
            <div className="flex items-center gap-2 max-w-[70%]">
              <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-600 dark:text-slate-400 shadow-inner flex-shrink-0">
                {user?.username ? user.username.slice(0, 2).toUpperCase() : 'VG'}
              </div>
              <div className="truncate">
                <span className="text-xs font-bold block text-slate-800 dark:text-slate-200 -mb-0.5 truncate">
                  {user?.username || 'Guest Prep'}
                </span>
                <span className="text-[9px] block text-slate-400 font-medium truncate">
                  {user?.email || 'Free Tier'}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-[#e9eef6] dark:bg-darkbg-hover hover:bg-[#dadce0] dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
              title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            >
              {theme === 'dark' ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
            </button>
          </div>
        )}

      </div>
    </aside>
  );
}
