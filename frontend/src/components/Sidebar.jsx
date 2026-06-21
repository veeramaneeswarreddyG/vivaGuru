import React from 'react';
import { 
  Plus, History, Bookmark, Settings, Sun, Moon, 
  MessageSquare, HelpCircle, BookOpen, GraduationCap, CheckSquare
} from 'lucide-react';

export default function Sidebar({ 
  currentView, 
  onViewChange, 
  theme, 
  toggleTheme, 
  onNewSession,
  sessionsList = [],
  onLoadSession
}) {
  const menuItems = [
    { id: 'chat', label: 'Mentor Chat', icon: MessageSquare },
    { id: 'mock', label: 'Mock Interview', icon: GraduationCap },
    { id: 'review', label: 'Answer Review', icon: CheckSquare },
    { id: 'dashboard', label: 'Job Dashboard', icon: BookOpen },
    { id: 'difficulty', label: 'Calibration', icon: Settings },
  ];

  return (
    <aside className="w-64 border-r border-slate-200 dark:border-darkbg-border bg-[#f6f8fc] dark:bg-darkbg h-screen flex flex-col justify-between py-5 px-4 z-20 flex-shrink-0 select-none">
      
      {/* Top Section */}
      <div className="space-y-6">
        {/* Brand */}
        <div className="flex items-center gap-2 px-2 cursor-pointer" onClick={() => onViewChange('welcome')}>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white font-bold text-sm shadow-md">
            VG
          </div>
          <div>
            <span className="font-extrabold text-base tracking-tight text-slate-800 dark:text-slate-100">
              VivaGuru
            </span>
            <span className="text-[9px] block text-primary font-bold uppercase tracking-wider -mt-1">
              AI Mentor
            </span>
          </div>
        </div>

        {/* New Session Button */}
        <button
          onClick={onNewSession}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-primary hover:bg-primary-dark text-white rounded-vivaguru text-sm font-semibold shadow-lg shadow-primary/10 hover:shadow-primary/20 transition-all duration-200 active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          New Session
        </button>

        {/* Navigation Items */}
        <nav className="space-y-1">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 block mb-2">
            Workspace
          </span>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
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

        {/* Recent Sessions */}
        {sessionsList && sessionsList.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 block">
              Recent Sessions
            </span>
            <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
              {sessionsList.map((s, idx) => (
                <button
                  key={s.session_id || idx}
                  onClick={() => onLoadSession(s.session_id)}
                  className="w-full text-left truncate text-xs py-1.5 px-2.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-[#e9eef6] dark:hover:bg-darkbg-hover hover:text-slate-800 dark:hover:text-slate-200 font-medium block"
                >
                  {s.role}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Section */}
      <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-darkbg-border/60">
        
        {/* Help & Settings */}
        <div className="space-y-0.5">
          <button 
            onClick={() => onViewChange('welcome')}
            className="w-full flex items-center gap-3 py-2 px-3 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-[#e9eef6] dark:hover:bg-darkbg-hover hover:text-slate-800 dark:hover:text-slate-200 transition-all"
          >
            <HelpCircle className="w-4 h-4 text-slate-400" />
            Welcome Screen
          </button>
        </div>

        {/* Theme Toggle & User Info */}
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-600 dark:text-slate-400 shadow-inner">
              VG
            </div>
            <div>
              <span className="text-xs font-bold block text-slate-800 dark:text-slate-200 -mb-0.5">Guest Prep</span>
              <span className="text-[9px] block text-slate-400 font-medium">Free Tier</span>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-[#e9eef6] dark:bg-darkbg-hover hover:bg-[#dadce0] dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
          </button>
        </div>
      </div>
    </aside>
  );
}
