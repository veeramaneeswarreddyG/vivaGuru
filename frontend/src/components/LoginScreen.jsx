import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, Lock, User, ArrowRight, ShieldAlert, Sparkles, 
  Eye, EyeOff, ShieldCheck, Database, Cpu, 
  RefreshCw, CheckCircle2, KeyRound, ExternalLink, HelpCircle
} from 'lucide-react';
import Logo from './Logo';
import { API_BASE_URL } from '../config';

export default function LoginScreen({ onLoginSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  
  // Form states
  const [email, setEmail] = useState(() => localStorage.getItem('vivaGuru_rememberedEmail') || '');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(() => !!localStorage.getItem('vivaGuru_rememberedEmail'));
  
  // UI states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Compute password strength
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, text: 'Not Set', color: 'bg-slate-200 dark:bg-slate-700', textColor: 'text-slate-400' };
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 8) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    
    if (score <= 1) return { score, text: 'Weak Strength', color: 'bg-danger dark:bg-danger-light', textColor: 'text-danger dark:text-danger-light' };
    if (score <= 3) return { score, text: 'Moderate Strength', color: 'bg-warning dark:bg-warning-light', textColor: 'text-warning dark:text-warning-light' };
    return { score, text: 'High Strength', color: 'bg-success dark:bg-success-light', textColor: 'text-success dark:text-success-light' };
  };

  const strength = getPasswordStrength(password);

  const validateForm = () => {
    if (!email) {
      setErrorMsg('Please fill in your email address.');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMsg('Please enter a valid email address.');
      return false;
    }

    if (isForgotPassword) return true;

    if (!password) {
      setErrorMsg('Please enter your password.');
      return false;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return false;
    }

    if (isSignUp) {
      if (!username) {
        setErrorMsg('Please choose a username.');
        return false;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Passwords do not match.');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!validateForm()) return;

    setIsLoading(true);

    if (isForgotPassword) {
      // Simulate Forgot password dispatch
      setTimeout(() => {
        setIsLoading(false);
        setSuccessMsg(`A neural recovery key has been dispatched to ${email}. Please check your inbox within 15 minutes.`);
        setIsForgotPassword(false);
        setPassword('');
        setConfirmPassword('');
      }, 2000);
      return;
    }

    const endpoint = isSignUp ? '/api/auth/register' : '/api/auth/login';
    const payload = isSignUp ? { email, username, password } : { email, password };

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        let errorMsg = 'Authentication failed';
        try {
          const data = await response.json();
          errorMsg = data.error || errorMsg;
        } catch (_) {
          errorMsg = `Server error (${response.status}): The database or server configuration might be incorrect.`;
        }
        throw new Error(errorMsg);
      }

      const data = await response.json();

      if (isSignUp) {
        setSuccessMsg('Neural profile instantiated! You can now log in.');
        setIsSignUp(false);
        setPassword('');
        setConfirmPassword('');
      } else {
        // Handle remember me logic
        if (rememberMe) {
          localStorage.setItem('vivaGuru_rememberedEmail', email);
        } else {
          localStorage.removeItem('vivaGuru_rememberedEmail');
        }
        onLoginSuccess(data.user);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Calibration server offline. Check connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMockSocial = (provider) => {
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess({
        email: `guest_${provider.toLowerCase()}@vivaguru.ai`,
        username: `Guest_${provider}`
      });
    }, 1500);
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between p-6 bg-white dark:bg-darkbg text-slate-800 dark:text-slate-100 relative overflow-y-auto select-none py-10 sm:py-16">
      
      {/* Background radial orbs */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.25] dark:opacity-[0.12] pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 dark:bg-primary/5 rounded-full filter blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 dark:bg-secondary/5 rounded-full filter blur-[120px] pointer-events-none animate-pulse" />

      {/* Top Header */}
      <div className="w-full max-w-md mx-auto flex items-center justify-between mb-8 select-none z-10">
        <div className="flex items-center gap-2.5">
          <Logo size="md" />
          <span className="font-extrabold text-lg tracking-tight text-slate-800 dark:text-slate-100">
            VivaGuru
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-primary mt-[1px]" />
          Built for your next interview
        </div>
      </div>

      {/* Central Authentication Card */}
      <div className="w-full max-w-md mx-auto my-auto z-10 py-4">
        
        <div className="glass-premium rounded-vivaguru border border-slate-200/50 dark:border-white/5 shadow-2xl p-6 sm:p-8 bg-white/80 dark:bg-darkbg-card/75 backdrop-blur-2xl relative overflow-hidden">
          {/* Neon Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-primary" />

          {/* Title / Description */}
          <div className="mb-6">
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2">
              {isForgotPassword ? (
                <>
                  <KeyRound className="w-5.5 h-5.5 text-primary" />
                  Reset Neural Link
                </>
              ) : isSignUp ? (
                <>
                  <Sparkles className="w-5.5 h-5.5 text-secondary" />
                  Initialize Profile
                </>
              ) : (
                <>
                  <Database className="w-5.5 h-5.5 text-primary" />
                  Access Dashboard
                </>
              )}
            </h2>
            <p className="text-xs text-slate-550 dark:text-slate-400 mt-1">
              {isForgotPassword 
                ? 'Request a secure verification handshake code.'
                : isSignUp 
                ? 'Create your credentials to calibrate your interview profile.' 
                : 'Sync with the interview analysis pipeline.'}
            </p>
          </div>

          {/* Mode Tab Switches */}
          {!isForgotPassword && (
            <div className="flex border-b border-slate-200/50 dark:border-darkbg-border/50 pb-4 mb-6">
              <button
                type="button"
                onClick={() => { setIsSignUp(false); setErrorMsg(''); setSuccessMsg(''); }}
                className={`flex-1 text-center py-2 text-xs font-extrabold tracking-wider transition-colors relative cursor-pointer uppercase ${
                  !isSignUp ? 'text-primary dark:text-primary-light font-black' : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                SIGN IN
                {!isSignUp && (
                  <motion.div 
                    layoutId="activeTabBar" 
                    className="absolute bottom-[-17px] left-0 right-0 h-[2.5px] bg-primary dark:bg-primary-light rounded-full" 
                  />
                )}
              </button>
              <button
                type="button"
                onClick={() => { setIsSignUp(true); setErrorMsg(''); setSuccessMsg(''); }}
                className={`flex-1 text-center py-2 text-xs font-extrabold tracking-wider transition-colors relative cursor-pointer uppercase ${
                  isSignUp ? 'text-primary dark:text-primary-light font-black' : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                CREATE PROFILE
                {isSignUp && (
                  <motion.div 
                    layoutId="activeTabBar" 
                    className="absolute bottom-[-17px] left-0 right-0 h-[2.5px] bg-primary dark:bg-primary-light rounded-full" 
                  />
                )}
              </button>
            </div>
          )}

          {/* Notifications panel */}
          <AnimatePresence mode="wait">
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-3 mb-4 bg-danger/10 border border-danger/25 text-danger dark:text-red-400 text-xs font-semibold rounded-xl flex items-start gap-2.5"
              >
                <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </motion.div>
            )}
            {successMsg && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-3 mb-4 bg-success/10 border border-success/25 text-success dark:text-green-400 text-xs font-semibold rounded-xl flex items-start gap-2.5"
              >
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider block">
                Email Address
              </label>
              <div className={`flex items-center rounded-xl bg-slate-50 dark:bg-darkbg border px-3 py-2.5 transition-all duration-200 ${
                focusedField === 'email' 
                  ? 'border-primary ring-2 ring-primary/10 bg-white dark:bg-black/20' 
                  : 'border-slate-350/50 dark:border-darkbg-border/60'
              }`}>
                <Mail className="w-4 h-4 text-slate-400 flex-shrink-0 mr-2.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="example@vivaguru.ai"
                  required
                  className="w-full bg-transparent border-0 outline-none text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-0 p-0"
                />
              </div>
            </div>

            {/* Username Field (Sign Up Only) */}
            {!isForgotPassword && isSignUp && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-1.5"
              >
                <label className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider block">
                  Username
                </label>
                <div className={`flex items-center rounded-xl bg-slate-50 dark:bg-darkbg border px-3 py-2.5 transition-all duration-200 ${
                  focusedField === 'username' 
                    ? 'border-primary ring-2 ring-primary/10 bg-white dark:bg-black/20' 
                    : 'border-slate-350/50 dark:border-darkbg-border/60'
                }`}>
                  <User className="w-4 h-4 text-slate-400 flex-shrink-0 mr-2.5" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onFocus={() => setFocusedField('username')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="CalibrationID"
                    required={isSignUp}
                    className="w-full bg-transparent border-0 outline-none text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-0 p-0"
                  />
                </div>
              </motion.div>
            )}

            {/* Password Field */}
            {!isForgotPassword && (
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider block">
                    Password
                  </label>
                  {!isSignUp && (
                    <button
                      type="button"
                      onClick={() => { setIsForgotPassword(true); setErrorMsg(''); setSuccessMsg(''); }}
                      className="text-[10px] text-primary dark:text-primary-light hover:underline font-bold tracking-tight cursor-pointer"
                    >
                      FORGOT PASSWORD?
                    </button>
                  )}
                </div>
                <div className={`flex items-center rounded-xl bg-slate-55 dark:bg-darkbg border px-3 py-2.5 transition-all duration-200 ${
                  focusedField === 'password' 
                    ? 'border-primary ring-2 ring-primary/10 bg-white dark:bg-black/20' 
                    : 'border-slate-350/50 dark:border-darkbg-border/60'
                }`}>
                  <Lock className="w-4 h-4 text-slate-400 flex-shrink-0 mr-2.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-transparent border-0 outline-none text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-0 p-0"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 p-0.5"
                  >
                    {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                  </button>
                </div>

                {/* Password Strength Indicator (Sign Up Only) */}
                {isSignUp && password && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-1 mt-1 px-1"
                  >
                    <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-wider">
                      <span className="text-slate-450">Security Calibration</span>
                      <span className={strength.textColor}>{strength.text}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200 dark:bg-darkbg-border rounded-full overflow-hidden flex gap-0.5">
                      <div className={`h-full flex-1 transition-all duration-300 ${strength.score >= 1 ? strength.color : 'bg-transparent'}`} />
                      <div className={`h-full flex-1 transition-all duration-300 ${strength.score >= 2 ? strength.color : 'bg-transparent'}`} />
                      <div className={`h-full flex-1 transition-all duration-300 ${strength.score >= 3 ? strength.color : 'bg-transparent'}`} />
                      <div className={`h-full flex-1 transition-all duration-300 ${strength.score >= 4 ? strength.color : 'bg-transparent'}`} />
                    </div>
                    <p className="text-[9px] text-slate-400 leading-normal">
                      Include at least 8 characters, a number, and a special character.
                    </p>
                  </motion.div>
                )}
              </div>
            )}

            {/* Confirm Password Field (Sign Up Only) */}
            {!isForgotPassword && isSignUp && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-1.5"
              >
                <label className="text-[10px] font-bold text-slate-455 dark:text-slate-500 uppercase tracking-wider block">
                  Verify Password
                </label>
                <div className={`flex items-center rounded-xl bg-slate-55 dark:bg-darkbg border px-3 py-2.5 transition-all duration-200 ${
                  focusedField === 'confirmPassword' 
                    ? 'border-primary ring-2 ring-primary/10 bg-white dark:bg-black/20' 
                    : 'border-slate-355/50 dark:border-darkbg-border/60'
                }`}>
                  <Lock className="w-4 h-4 text-slate-400 flex-shrink-0 mr-2.5" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onFocus={() => setFocusedField('confirmPassword')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="••••••••"
                    required={isSignUp}
                    className="w-full bg-transparent border-0 outline-none text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-0 p-0"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 p-0.5"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Remember Me / Cancel toggles */}
            <div className="flex items-center justify-between pt-1">
              {isForgotPassword ? (
                <button
                  type="button"
                  onClick={() => { setIsForgotPassword(false); setErrorMsg(''); setSuccessMsg(''); }}
                  className="text-xs text-slate-550 dark:text-slate-455 hover:text-slate-800 dark:hover:text-slate-200 font-bold flex items-center gap-1 cursor-pointer"
                >
                  Cancel reset
                </button>
              ) : (
                <label className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 dark:border-darkbg-border text-primary focus:ring-primary/20 cursor-pointer"
                  />
                  Remember Me
                </label>
              )}
            </div>

            {/* Submit Action Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-primary hover:bg-primary-dark active:scale-[0.98] disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-primary/15 transition-all cursor-pointer select-none"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Syncing Handshake...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-1.5">
                  <span>
                    {isForgotPassword 
                      ? 'Request Recovery Link' 
                      : isSignUp 
                      ? 'Instantiate Profile' 
                      : 'Access Calibration Hub'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </button>

          </form>

          {/* Social logins section */}
          {!isForgotPassword && (
            <>
              <div className="flex items-center gap-2 my-5">
                <hr className="flex-1 border-slate-200/50 dark:border-darkbg-border/60" />
                <span className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  OR ACCESS VIA IDENTITY KEY
                </span>
                <hr className="flex-1 border-slate-200/50 dark:border-darkbg-border/60" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleMockSocial('Google')}
                  disabled={isLoading}
                  className="flex items-center justify-center gap-2 py-2 px-3 border border-slate-200/60 dark:border-darkbg-border/60 hover:bg-slate-50 dark:hover:bg-darkbg-hover rounded-xl text-xs font-bold text-slate-600 dark:text-slate-350 transition-all duration-200 cursor-pointer active:scale-[0.97]"
                >
                  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                    <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.54 14.98 1 12 1 7.35 1 3.37 3.65 1.48 7.52l3.88 3.01C6.28 7.37 8.91 5.04 12 5.04z" />
                    <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.34H12v4.44h6.45c-.28 1.47-1.11 2.71-2.36 3.55l3.66 2.84c2.14-1.97 3.74-4.87 3.74-8.49z" />
                    <path fill="#FBBC05" d="M5.36 14.53c-.24-.72-.38-1.5-.38-2.3s.14-1.58.38-2.3L1.48 6.92C.53 8.87 0 11.06 0 13.4s.53 4.53 1.48 6.48l3.88-3.35z" />
                    <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.66-2.84c-1.01.68-2.31 1.09-4.3 1.09-3.09 0-5.72-2.33-6.64-5.48L1.48 16.2C3.37 20.07 7.35 23 12 23z" />
                  </svg>
                  <span>Google ID</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleMockSocial('GitHub')}
                  disabled={isLoading}
                  className="flex items-center justify-center gap-2 py-2 px-3 border border-slate-200/60 dark:border-darkbg-border/60 hover:bg-slate-50 dark:hover:bg-darkbg-hover rounded-xl text-xs font-bold text-slate-600 dark:text-slate-350 transition-all duration-200 cursor-pointer active:scale-[0.97]"
                >
                  <svg className="w-4 h-4 fill-slate-700 dark:fill-slate-300 flex-shrink-0" viewBox="0 0 24 24">
                    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                  </svg>
                  <span>GitHub Key</span>
                </button>
              </div>
            </>
          )}

        </div>
      </div>

      {/* Small Bottom Info Link */}
      <div className="w-full max-w-md mx-auto mt-8 select-none text-[10px] text-slate-450 dark:text-slate-500 font-semibold flex items-center justify-center gap-4 z-10">
        <a href="#terms" onClick={(e) => e.preventDefault()} className="hover:text-primary flex items-center gap-1">
          Handshake Terms <ExternalLink className="w-2.5 h-2.5" />
        </a>
        <span className="text-slate-300 dark:text-darkbg-border">•</span>
        <a href="#help" onClick={(e) => e.preventDefault()} className="hover:text-primary flex items-center gap-1">
          System Guide <HelpCircle className="w-2.5 h-2.5" />
        </a>
      </div>

    </div>
  );
}
