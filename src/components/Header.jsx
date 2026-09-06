import React, { useState } from 'react';
import { 
  Download, 
  Sparkles, 
  Layers, 
  Image as ImageIcon, 
  Puzzle, 
  Smartphone, 
  Clock, 
  Server, 
  Database,
  CheckCircle2, 
  AlertCircle,
  Share2,
  ExternalLink,
  Menu,
  X,
  Cloud,
  Zap,
  Users,
  UserCheck,
  ChevronDown
} from 'lucide-react';
import { getActiveUserProfile, getColorClasses } from '../utils/userManagement';

export default function Header({ 
  activeTab, 
  setActiveTab, 
  backendStatus, 
  installPrompt, 
  triggerInstall,
  isExtensionLinked,
  onOpenCompanionModal,
  onOpenUserModal 
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const activeUser = getActiveUserProfile();
  const colorStyles = getColorClasses(activeUser?.color);

  const tabs = [
    { id: 'extract', label: 'Universal Extractor', icon: Download, badge: '4K / Reels' },
    { id: 'scraper', label: 'Photo & Asset Scraper', icon: ImageIcon, badge: 'Batch ZIP' },
    { id: 'extension', label: 'Chrome Extension', icon: Puzzle, badge: 'V3 Ready' },
    { id: 'android', label: 'Android PWA & Share', icon: Smartphone, badge: 'Background' },
    { id: 'history', label: 'Turso Cloud & Queue', icon: Cloud, badge: 'Synced' },
    { id: 'deploy', label: 'Deploy & API', icon: Server, badge: 'Vercel / Git' },
  ];

  const tursoConnected = backendStatus?.turso?.status === 'connected';

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-white/10 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setActiveTab('extract')}>
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 via-brand-500 to-cyan-400 p-[2px] shadow-glow group-hover:scale-105 transition-all duration-300">
                <div className="w-full h-full bg-surface-950 rounded-[14px] flex items-center justify-center">
                  <Download className="w-6 h-6 text-cyan-400 group-hover:text-white transition-colors" />
                </div>
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-surface-950"></span>
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  OMNIGRAB<span className="text-cyan-400 ml-1">PRO</span>
                </span>
                <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md bg-brand-500/20 text-brand-300 border border-brand-500/30">
                  MULTI-USER
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium hidden sm:block">
                Universal Multi-Device Cloud Downloader
              </p>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-1.5 p-1.5 rounded-2xl bg-surface-900/80 border border-white/5">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-brand-600 to-cyan-600 text-white shadow-glow'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                      isActive ? 'bg-black/30 text-cyan-200' : 'bg-brand-950 text-brand-300 border border-brand-500/30'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Status Indicators & User Switcher */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Multi-User Profile Switcher Badge */}
            <button
              onClick={onOpenUserModal}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl border transition-all cursor-pointer ${colorStyles.bg} ${colorStyles.border} hover:scale-105 shadow-glow`}
              title="Click to Switch Profile, Add Family User, or View Tenant Vault"
            >
              <div className="w-6 h-6 rounded-lg bg-surface-950 flex items-center justify-center text-sm shadow-inner">
                {activeUser.avatar || '⚡'}
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-xs font-black text-white flex items-center gap-1">
                  <span>{activeUser.name}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </div>
                <div className="text-[9px] text-slate-300 font-mono">
                  {activeUser.role} Profile
                </div>
              </div>
            </button>

            {/* Companion Extension Pairing Status Pill */}
            <button
              onClick={onOpenCompanionModal}
              className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                isExtensionLinked
                  ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300 hover:bg-emerald-900/40'
                  : 'bg-gradient-to-r from-brand-900/80 to-amber-950/80 border-amber-500/40 text-amber-300 shadow-glow hover:scale-105'
              }`}
              title="Click to view Companion Extension Setup and Status"
            >
              <Puzzle className={`w-3.5 h-3.5 ${isExtensionLinked ? 'text-emerald-400' : 'text-amber-400 animate-spin'}`} />
              <span className="font-mono text-[11px]">
                {isExtensionLinked ? 'Extension: Paired' : 'Setup Extension'}
              </span>
            </button>

            {/* Turso Cloud Status Badge */}
            <div 
              className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold ${
                tursoConnected
                  ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400'
                  : 'bg-amber-950/40 border-amber-500/30 text-amber-400'
              }`}
              title={`Turso LibSQL Cloud DB (${backendStatus?.turso?.provider || 'AWS ap-south-1'})`}
            >
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-mono text-[11px]">
                {tursoConnected ? 'Turso: Synced' : 'Turso: Standby'}
              </span>
            </div>

            {/* PWA Install Button */}
            {installPrompt && (
              <button
                onClick={triggerInstall}
                className="hidden sm:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-brand-500 hover:from-cyan-400 hover:to-brand-400 text-white font-bold text-xs shadow-glow-cyan transition-all transform hover:scale-105"
              >
                <Smartphone className="w-4 h-4" />
                <span>Install PWA</span>
              </button>
            )}

            {/* Mobile Hamburger Menu */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-surface-900 border border-white/10 text-slate-300 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-white/10 grid grid-cols-2 gap-2 animate-fadeIn">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex flex-col items-start gap-1 p-3 rounded-xl text-left font-bold text-xs transition-all ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-glow'
                      : 'bg-surface-900/90 text-slate-300 border border-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <Icon className="w-4 h-4 text-cyan-400" />
                    {tab.badge && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-black/40 text-cyan-300">
                        {tab.badge}
                      </span>
                    )}
                  </div>
                  <span>{tab.label}</span>
                </button>
              );
            })}

            {/* Mobile Profile Switcher Button */}
            <button
              onClick={() => {
                onOpenUserModal();
                setMobileMenuOpen(false);
              }}
              className="col-span-2 flex items-center justify-between p-3 rounded-xl bg-surface-900 border border-white/10 text-cyan-200 font-bold text-xs"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{activeUser.avatar || '⚡'}</span>
                <div>
                  <div className="text-white font-bold">{activeUser.name}</div>
                  <div className="text-[10px] text-slate-400">{activeUser.role} Account</div>
                </div>
              </div>
              <span className="text-[10px] px-2 py-1 rounded bg-brand-600 text-white font-bold">
                Switch Profile
              </span>
            </button>

            {/* Mobile Companion Setup Button */}
            <button
              onClick={() => {
                onOpenCompanionModal();
                setMobileMenuOpen(false);
              }}
              className="col-span-2 flex items-center justify-between p-3 rounded-xl bg-brand-950/80 border border-brand-500/40 text-cyan-200 font-bold text-xs"
            >
              <div className="flex items-center gap-2">
                <Puzzle className="w-4 h-4 text-cyan-400" />
                <span>Companion Chrome Extension</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                isExtensionLinked ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
              }`}>
                {isExtensionLinked ? 'Paired' : 'Setup Required'}
              </span>
            </button>
            
            {installPrompt && (
              <button
                onClick={() => {
                  triggerInstall();
                  setMobileMenuOpen(false);
                }}
                className="col-span-2 flex items-center justify-center gap-2 p-3 rounded-xl bg-gradient-to-r from-brand-600 to-cyan-600 text-white font-bold text-xs shadow-glow"
              >
                <Smartphone className="w-4 h-4" />
                <span>Install OmniGrab PWA on this Device</span>
              </button>
            )}
          </div>
        )}

      </div>
    </header>
  );
}
