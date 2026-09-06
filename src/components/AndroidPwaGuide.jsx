import React, { useState } from 'react';
import { 
  Smartphone, 
  Share2, 
  Download, 
  Bell, 
  CheckCircle2, 
  Zap, 
  Layers, 
  Sparkles, 
  WifiOff, 
  ArrowRight,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { sendLocalNotification } from '../utils/api';
import confetti from 'canvas-confetti';

export default function AndroidPwaGuide({ installPrompt, triggerInstall, showToast }) {
  const [notificationState, setNotificationState] = useState('default');
  const [testSharedUrl, setTestSharedUrl] = useState('https://www.youtube.com/watch?v=aqz-KE-bpKQ');

  const handleRequestNotification = async () => {
    if (!('Notification' in window)) {
      showToast('Notifications not supported in this browser', 'error');
      return;
    }

    try {
      const perm = await Notification.requestPermission();
      setNotificationState(perm);
      if (perm === 'granted') {
        sendLocalNotification('OmniGrab Background Sync Ready', 'You will receive alerts when long background downloads complete!');
        confetti({ particleCount: 50, spread: 60 });
        showToast('Background notifications enabled!', 'success');
      } else {
        showToast('Notification permission denied', 'info');
      }
    } catch {
      showToast('Error requesting notification permission', 'error');
    }
  };

  const handleTestShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'OmniGrab Pro Downloader',
        text: 'Download 4K Videos & Photos with OmniGrab',
        url: window.location.href,
      }).catch(() => {});
    } else {
      showToast('Native Web Share simulated! OmniGrab intercepts shared links automatically.', 'info');
    }
  };

  return (
    <div className="space-y-10 animate-fadeIn max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto py-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/30 text-cyan-300 text-xs font-bold uppercase tracking-wider mb-3 shadow-glow">
          <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
          <span>Android PWA & Web Share Target</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-black text-white">
          Direct <span className="bg-gradient-to-r from-cyan-400 via-brand-400 to-emerald-400 bg-clip-text text-transparent">Android System Share</span> & Background Downloads
        </h2>
        <p className="mt-2 text-slate-400 text-sm">
          Install OmniGrab directly to your home screen to enable 1-tap sharing from any Android app, offline caching, and background task processing.
        </p>
      </div>

      {/* PWA Install Action Card */}
      <div className="glass-panel-elevated p-6 sm:p-8 rounded-3xl border border-cyan-500/30 shadow-glow-cyan relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          
          <div className="space-y-3 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-black uppercase">
                Progressive Web App
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-mono font-bold">
                Android Ready
              </span>
            </div>

            <h3 className="text-2xl font-black text-white">
              Install OmniGrab Pro on Android / Desktop
            </h3>

            <p className="text-slate-300 text-sm leading-relaxed">
              Functions like a native Android APK: runs fullscreen without address bars, integrates with the system share sheet, and syncs downloads in the background.
            </p>

            <div className="flex items-center gap-4 text-xs text-slate-400 pt-2">
              <span className="flex items-center gap-1 text-emerald-400 font-bold">
                <CheckCircle2 className="w-4 h-4" /> 0MB Storage Overhead
              </span>
              <span className="flex items-center gap-1 text-cyan-400 font-bold">
                <CheckCircle2 className="w-4 h-4" /> Auto-Updates
              </span>
            </div>
          </div>

          <div className="flex flex-col items-center gap-3 w-full md:w-auto">
            {installPrompt ? (
              <button
                onClick={triggerInstall}
                className="btn-primary-gradient w-full sm:w-auto px-8 py-5 rounded-2xl text-white font-black text-base flex items-center justify-center gap-3 shadow-glow cursor-pointer"
              >
                <Download className="w-5 h-5 text-cyan-300" />
                <span>Install OmniGrab App</span>
              </button>
            ) : (
              <button
                onClick={() => showToast('In Android Chrome: Tap 3 dots (⋮) -> "Add to Home screen" or "Install app"', 'info')}
                className="btn-primary-gradient w-full sm:w-auto px-8 py-5 rounded-2xl text-white font-black text-base flex items-center justify-center gap-3 shadow-glow cursor-pointer"
              >
                <Smartphone className="w-5 h-5 text-cyan-300" />
                <span>Install via Chrome Menu (⋮)</span>
              </button>
            )}

            <p className="text-[11px] text-slate-400 font-mono">
              Chrome, Edge, Samsung Internet, Firefox
            </p>
          </div>

        </div>
      </div>

      {/* How Direct Share Target Works on Android */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
        <div>
          <h3 className="text-lg font-black text-white flex items-center gap-2">
            <Share2 className="w-5 h-5 text-cyan-400" />
            <span>How Direct Android Sharing Works (Web Share Target API)</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Once installed as a PWA, OmniGrab registers with the Android OS. You never need to copy-paste links manually:
          </p>
        </div>

        {/* 3 Step Flow Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          <div className="p-5 rounded-2xl bg-surface-900/80 border border-white/5 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/20 text-brand-300 flex items-center justify-center font-black">
              1
            </div>
            <h4 className="font-bold text-white text-sm">Tap Share in Any App</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              When watching a video in YouTube, Instagram Reels, TikTok, or browsing in Chrome, tap the native <strong className="text-white">"Share"</strong> icon.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-surface-900/80 border border-white/5 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-black">
              2
            </div>
            <h4 className="font-bold text-white text-sm">Select "OmniGrab"</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              OmniGrab will appear directly in your Android system share grid alongside WhatsApp and Telegram.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-surface-900/80 border border-white/5 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-black">
              3
            </div>
            <h4 className="font-bold text-white text-sm">Instant 1-Tap Download</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              OmniGrab opens instantly with formats preloaded (4K, 1080p, MP3) and begins downloading in the background.
            </p>
          </div>

        </div>

        {/* Interactive Share Test */}
        <div className="p-4 rounded-2xl bg-surface-900/50 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/20 text-brand-300 flex items-center justify-center">
              <Zap className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Test Native System Share Sheet</p>
              <p className="text-[11px] text-slate-400">Trigger the native mobile share sheet to test OS integration</p>
            </div>
          </div>

          <button
            onClick={handleTestShare}
            className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs flex items-center gap-2 shadow-glow"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Trigger Share Sheet</span>
          </button>
        </div>
      </div>

      {/* Background Notifications & Sync Hub */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-400" />
              <span>Background Notifications & Offline Sync</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Receive native notifications when high-res 4K files or large photo ZIP bundles finish packing in the background:
            </p>
          </div>

          <button
            onClick={handleRequestNotification}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-brand-500 hover:from-amber-400 hover:to-brand-400 text-white font-black text-xs flex items-center gap-2 shadow-glow flex-shrink-0"
          >
            <Bell className="w-4 h-4" />
            <span>Enable Push Notifications</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          
          <div className="p-4 rounded-2xl bg-surface-900/60 border border-white/5 flex items-start gap-3">
            <WifiOff className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-1" />
            <div>
              <p className="text-xs font-bold text-white">Service Worker Offline Cache</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                The PWA service worker caches all static assets, UI templates, and download history so you can manage your queue even without an internet connection.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-surface-900/60 border border-white/5 flex items-start gap-3">
            <RefreshCw className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-1" />
            <div>
              <p className="text-xs font-bold text-white">Background Sync API</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Queued downloads automatically resume when network connectivity is restored or when returning to the app.
              </p>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
