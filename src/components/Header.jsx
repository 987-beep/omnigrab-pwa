import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Smartphone, 
  Puzzle, 
  BookOpen, 
  User, 
  CheckCircle2, 
  Menu, 
  X,
  Sparkles
} from 'lucide-react';
import { getGoogleUser } from '../utils/googleAuth';

export default function Header({ 
  activeTab, 
  setActiveTab, 
  installPrompt, 
  triggerInstall,
  onOpenGoogleModal 
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [googleUser, setGoogleUser] = useState(getGoogleUser());

  useEffect(() => {
    const handleAuth = () => {
      setGoogleUser(getGoogleUser());
    };
    window.addEventListener('omnigrab-auth-changed', handleAuth);
    return () => window.removeEventListener('omnigrab-auth-changed', handleAuth);
  }, []);

  const navItems = [
    { id: 'extract', label: 'Universal Extractor', icon: Download },
    { id: 'android', label: 'Android PWA App', icon: Smartphone },
    { id: 'extension', label: 'Chrome Extension', icon: Puzzle },
    { id: 'deploy', label: 'User Guide', icon: BookOpen },
  ];

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-white/10 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setActiveTab('extract')}>
            <div className="relative">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-brand-600 via-brand-500 to-cyan-400 p-[2px] shadow-glow group-hover:scale-105 transition-all duration-300">
                <div className="w-full h-full bg-surface-950 rounded-[14px] flex items-center justify-center">
                  <Download className="w-5 h-5 text-cyan-400 group-hover:text-white transition-colors" />
                </div>
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-surface-950"></span>
              </span>
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  OMNIGRAB<span className="text-cyan-400 ml-1">PRO</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                Universal Video, Photo & Audio Downloader
              </p>
            </div>
          </div>

          {/* Desktop Navigation: Universal Extractor, Android PWA, Chrome Extension, User Guide */}
          <nav className="hidden md:flex items-center gap-2 p-1.5 rounded-2xl bg-surface-900/80 border border-white/5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-brand-600 to-cyan-600 text-white shadow-glow'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-cyan-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Section: Google Account Button / Profile Button */}
          <div className="flex items-center gap-3">
            
            {/* Google Account Button */}
            <button
              onClick={onOpenGoogleModal}
              className={`flex items-center gap-2.5 px-3.5 py-2 rounded-2xl border transition-all cursor-pointer shadow-glow ${
                googleUser.isLoggedIn
                  ? 'bg-emerald-950/40 border-emerald-500/40 hover:bg-emerald-900/40 text-emerald-200'
                  : 'bg-surface-900 hover:bg-surface-800 border-white/10 hover:border-cyan-500/40 text-white'
              }`}
              title={googleUser.isLoggedIn ? `Google Account: ${googleUser.email}` : 'Sign In with Google'}
            >
              {googleUser.isLoggedIn ? (
                <>
                  <div className="w-7 h-7 rounded-xl overflow-hidden border border-emerald-400/50 flex-shrink-0">
                    <img src={googleUser.picture} alt={googleUser.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="text-left hidden sm:block">
                    <div className="text-xs font-black text-white flex items-center gap-1">
                      <span>{googleUser.name}</span>
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    </div>
                    <div className="text-[9px] text-cyan-300 font-mono truncate max-w-[120px]">
                      {googleUser.email}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Google G Logo */}
                  <div className="w-6 h-6 rounded-lg bg-white p-1 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <svg viewBox="0 0 24 24" width="14" height="14">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                  </div>
                  <span className="text-xs font-black text-white">Google Account</span>
                </>
              )}
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2.5 rounded-xl bg-surface-900 border border-white/10 text-slate-300 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/10 grid grid-cols-2 gap-2 animate-fadeIn">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-2 p-3 rounded-xl font-black text-xs transition-all ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-glow'
                      : 'bg-surface-900 text-slate-300 border border-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4 text-cyan-400" />
                  <span>{item.label}</span>
                </button>
              );
            })}

            {/* Google Account Mobile Button */}
            <button
              onClick={() => {
                onOpenGoogleModal();
                setMobileMenuOpen(false);
              }}
              className="col-span-2 flex items-center justify-between p-3 rounded-xl bg-surface-900 border border-white/10 text-white font-bold text-xs"
            >
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-cyan-400" />
                <span>{googleUser.isLoggedIn ? `Google Account (${googleUser.name})` : 'Sign In with Google'}</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                googleUser.isLoggedIn ? 'bg-emerald-500/20 text-emerald-300' : 'bg-cyan-500/20 text-cyan-300'
              }`}>
                {googleUser.isLoggedIn ? 'Connected' : 'Sign In'}
              </span>
            </button>
          </div>
        )}

      </div>
    </header>
  );
}
