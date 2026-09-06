import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Terminal, 
  Download, 
  Smartphone, 
  Puzzle, 
  Clock, 
  Zap, 
  Lock, 
  CheckCircle2, 
  Copy, 
  Layers, 
  Film, 
  Music, 
  Sparkles,
  BookOpen,
  HelpCircle,
  QrCode
} from 'lucide-react';

export default function DeploymentGuide({ showToast }) {
  const [activeGuideTab, setActiveGuideTab] = useState('how-to'); // 'how-to', 'privacy', 'prune', 'extension'

  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl mx-auto">
      
      {/* Header Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-brand-500/30 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 text-xs font-bold font-mono">
              <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
              <span>User Manual & Privacy Handbook</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              OmniGrab Pro User Guide & Features
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl">
              Everything you need to know about downloading videos, audio tracks, Android 1-tap sharing, and your private Google Cloud storage.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/OmniGrab_Chrome_Extension_V3.zip"
              download="OmniGrab_Chrome_Extension_V3.zip"
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-black flex items-center gap-2 shadow-glow transition-all whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              <span>Get Chrome Extension</span>
            </a>
          </div>
        </div>
      </div>

      {/* Guide Navigation Tabs */}
      <div className="flex items-center gap-2 bg-surface-900 p-1.5 rounded-2xl border border-white/10 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setActiveGuideTab('how-to')}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeGuideTab === 'how-to' ? 'bg-brand-600 text-white shadow-glow' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Film className="w-4 h-4 text-cyan-400" />
          <span>How to Download</span>
        </button>

        <button
          onClick={() => setActiveGuideTab('privacy')}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeGuideTab === 'privacy' ? 'bg-brand-600 text-white shadow-glow' : 'text-slate-400 hover:text-white'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Google Account Vault & Privacy</span>
        </button>

        <button
          onClick={() => setActiveGuideTab('prune')}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeGuideTab === 'prune' ? 'bg-brand-600 text-white shadow-glow' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Clock className="w-4 h-4 text-amber-400" />
          <span>02:00 AM Storage Saver</span>
        </button>

        <button
          onClick={() => setActiveGuideTab('extension')}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeGuideTab === 'extension' ? 'bg-brand-600 text-white shadow-glow' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Puzzle className="w-4 h-4 text-purple-400" />
          <span>Companion Extension Setup</span>
        </button>
      </div>

      {/* TAB 1: HOW TO DOWNLOAD */}
      {activeGuideTab === 'how-to' && (
        <div className="space-y-6 animate-fadeIn">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass-panel p-5 rounded-2xl border border-cyan-500/20 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-black">
                1
              </div>
              <h4 className="text-sm font-bold text-white">Copy Any Link</h4>
              <p className="text-xs text-slate-400">
                Copy the URL of any video or audio from YouTube, Instagram Reels, TikTok, Twitter/X, Pinterest, or Facebook.
              </p>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-brand-500/20 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-brand-500/20 text-brand-300 flex items-center justify-center font-black">
                2
              </div>
              <h4 className="text-sm font-bold text-white">Paste & Extract</h4>
              <p className="text-xs text-slate-400">
                Paste the link into the Universal Extractor search bar and tap <strong className="text-white">Extract Video</strong>.
              </p>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-emerald-500/20 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-black">
                3
              </div>
              <h4 className="text-sm font-bold text-white">Direct Download</h4>
              <p className="text-xs text-slate-400">
                Choose <strong className="text-white">Download Full MP4</strong> or <strong className="text-white">Download MP3 Audio</strong> to save directly to your device storage.
              </p>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              <span>Supported Media Platforms</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-surface-900 border border-white/5 font-bold text-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span>YouTube (4K / HD)</span>
              </div>
              <div className="p-3 rounded-xl bg-surface-900 border border-white/5 font-bold text-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-pink-500" />
                <span>Instagram Reels</span>
              </div>
              <div className="p-3 rounded-xl bg-surface-900 border border-white/5 font-bold text-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                <span>TikTok (No Watermark)</span>
              </div>
              <div className="p-3 rounded-xl bg-surface-900 border border-white/5 font-bold text-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                <span>Twitter / X Clips</span>
              </div>
              <div className="p-3 rounded-xl bg-surface-900 border border-white/5 font-bold text-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
                <span>Pinterest Video Pins</span>
              </div>
              <div className="p-3 rounded-xl bg-surface-900 border border-white/5 font-bold text-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                <span>Reddit Media</span>
              </div>
              <div className="p-3 rounded-xl bg-surface-900 border border-white/5 font-bold text-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                <span>Facebook Videos</span>
              </div>
              <div className="p-3 rounded-xl bg-surface-900 border border-white/5 font-bold text-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span>Direct MP4 / MP3</span>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: GOOGLE ACCOUNT VAULT & PRIVACY */}
      {activeGuideTab === 'privacy' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="glass-panel p-6 rounded-3xl border border-emerald-500/30 space-y-4">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>Zero-Leakage Personal Cloud Vault</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              When you sign in with your Google Account, all your downloads and bookmarks synchronize strictly under your unique Google Account identity. No other user can ever view, access, or delete your data.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-surface-900 border border-white/5 space-y-2">
                <Lock className="w-5 h-5 text-cyan-400" />
                <h4 className="text-xs font-bold text-white">100% Private Cloud Vault</h4>
                <p className="text-[11px] text-slate-400">
                  Your downloads history is locked to your Google email. Your personal data is never shared with third parties or other accounts.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-surface-900 border border-white/5 space-y-2">
                <Smartphone className="w-5 h-5 text-emerald-400" />
                <h4 className="text-xs font-bold text-white">Cross-Device Synchronization</h4>
                <p className="text-[11px] text-slate-400">
                  Sign in with the same Google account on your Android phone, laptop, and desktop to sync your saved bookmarks seamlessly.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: 02:00 AM STORAGE SAVER */}
      {activeGuideTab === 'prune' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="glass-panel p-6 rounded-3xl border border-amber-500/30 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-bold">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Automated Storage Saver</span>
            </div>
            <h3 className="text-xl font-black text-white">
              02:00 AM Midnight Storage Auto-Pruning
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              To keep your cloud storage clean and ultra-fast, OmniGrab Pro executes an automated cleanup at <strong className="text-amber-300">02:00 AM daily</strong>.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-surface-900 border border-white/5 space-y-2">
                <h4 className="text-xs font-bold text-rose-300 flex items-center gap-2">
                  <span>🗑️ Ephemeral Data (Cleaned at 02:00 AM)</span>
                </h4>
                <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
                  <li>Download stream logs older than 24 hours</li>
                  <li>Temporary thumbnail cache keys</li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-surface-900 border border-white/5 space-y-2">
                <h4 className="text-xs font-bold text-emerald-300 flex items-center gap-2">
                  <span>🛡️ Permanent Data (Preserved Forever)</span>
                </h4>
                <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
                  <li>All Google Account Profiles</li>
                  <li>Saved Cloud Bookmarks</li>
                  <li>Custom User Settings</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: COMPANION EXTENSION SETUP */}
      {activeGuideTab === 'extension' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Terminal className="w-5 h-5 text-cyan-400" />
              <span>How to Install Companion Chrome Extension (30 Seconds)</span>
            </h3>
            
            <ol className="text-xs text-slate-300 space-y-3 list-decimal list-inside">
              <li>
                Download and extract the extension ZIP package: <a href="/OmniGrab_Chrome_Extension_V3.zip" download="OmniGrab_Chrome_Extension_V3.zip" className="text-cyan-400 font-bold underline">OmniGrab_Chrome_Extension_V3.zip</a>.
              </li>
              <li>
                In Google Chrome, Brave, Edge, or Opera, navigate to <code className="bg-surface-900 px-2 py-0.5 rounded text-cyan-300 font-mono">chrome://extensions/</code>.
              </li>
              <li>
                Turn on the <strong className="text-white">Developer mode</strong> toggle in the top-right corner.
              </li>
              <li>
                Click <strong className="text-white">Load unpacked</strong> and select the extracted folder.
              </li>
              <li>
                The OmniGrab Pro 1-click download pill will now appear automatically on video players across the web!
              </li>
            </ol>
          </div>
        </div>
      )}

    </div>
  );
}
