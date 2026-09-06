import React, { useState } from 'react';
import { 
  Puzzle, 
  Download, 
  CheckCircle2, 
  Smartphone, 
  Laptop, 
  ShieldCheck, 
  ExternalLink, 
  Zap, 
  X, 
  ArrowRight,
  FolderArchive,
  RefreshCw,
  HelpCircle,
  Sparkles
} from 'lucide-react';

export default function CompanionSetupModal({ isOpen, onClose, isExtensionLinked, onMarkExtensionPaired, showToast }) {
  const [activeDeviceTab, setActiveDeviceTab] = useState('desktop'); // desktop, android_kiwi, android_share
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [checkingBridge, setCheckingBridge] = useState(false);

  if (!isOpen) return null;

  const handleDownloadExtension = async () => {
    setDownloadingZip(true);
    try {
      const resp = await fetch('/api/download-extension');
      if (!resp.ok) throw new Error('Could not download extension zip');
      const blob = await resp.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'OmniGrab_Chrome_Extension_V3.zip';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      if (showToast) showToast('Downloaded OmniGrab Chrome Extension (Manifest V3)!', 'success');
    } catch {
      if (showToast) showToast('Failed to download extension package', 'error');
    } finally {
      setDownloadingZip(false);
    }
  };

  const verifyBridge = () => {
    setCheckingBridge(true);
    setTimeout(() => {
      const active = document.documentElement.getAttribute('data-omnigrab-extension-active') === 'true';
      if (active) {
        if (showToast) showToast('🟢 Chrome Extension Bridge is Live & Active!', 'success');
        onMarkExtensionPaired(true);
      } else {
        if (showToast) showToast('Extension bridge not detected yet. Ensure the unpacked folder is loaded in chrome://extensions', 'info');
      }
      setCheckingBridge(false);
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-3xl glass-panel-elevated rounded-3xl border border-cyan-500/40 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow Header */}
        <div className="bg-gradient-to-r from-brand-900/90 via-surface-900 to-cyan-950/90 p-6 sm:p-7 border-b border-white/10 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl bg-surface-800/80 hover:bg-surface-700 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Required Dual Setup (Step 2 of 2)</span>
            </span>
            {isExtensionLinked ? (
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Extension Paired
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold animate-pulse">
                ⚡ Setup Action Required
              </span>
            )}
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Link Your <span className="bg-gradient-to-r from-cyan-400 via-brand-400 to-emerald-400 bg-clip-text text-transparent">Chrome Companion Extension</span>
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl">
            You installed the OmniGrab PWA! Now pair the Chrome Companion Extension to enable 1-click video sniffing, on-page hover download pills, and cross-device Turso Cloud sync.
          </p>

          {/* 2-Step Progress Indicator */}
          <div className="mt-5 grid grid-cols-2 gap-3 pt-3 border-t border-white/10 text-xs">
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-surface-950/60 border border-emerald-500/40 text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <div className="leading-tight">
                <p className="font-bold">Step 1: PWA Ready</p>
                <p className="text-[10px] text-slate-400">Offline & Share Target</p>
              </div>
            </div>

            <div className={`flex items-center gap-2 p-2.5 rounded-xl border leading-tight ${
              isExtensionLinked 
                ? 'bg-surface-950/60 border-emerald-500/40 text-emerald-300' 
                : 'bg-brand-950/60 border-brand-500/50 text-cyan-300 animate-pulse'
            }`}>
              <Puzzle className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              <div className="leading-tight">
                <p className="font-bold">{isExtensionLinked ? 'Step 2: Extension Paired' : 'Step 2: Link Extension'}</p>
                <p className="text-[10px] text-slate-400">{isExtensionLinked ? 'Bridge Live & Active' : 'Setup required on device'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Modal Body */}
        <div className="p-6 sm:p-7 overflow-y-auto space-y-6 flex-1 text-slate-200">
          
          {/* Quick Device Selector Tabs */}
          <div className="flex items-center gap-2 bg-surface-950 p-1.5 rounded-2xl border border-white/10 text-xs font-bold">
            <button
              onClick={() => setActiveDeviceTab('desktop')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl transition-all ${
                activeDeviceTab === 'desktop'
                  ? 'bg-gradient-to-r from-brand-600 to-cyan-600 text-white shadow-glow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Laptop className="w-4 h-4" />
              <span>PC / Mac / Laptop (Chrome, Brave, Edge)</span>
            </button>

            <button
              onClick={() => setActiveDeviceTab('android_kiwi')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl transition-all ${
                activeDeviceTab === 'android_kiwi'
                  ? 'bg-gradient-to-r from-brand-600 to-cyan-600 text-white shadow-glow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>Android (Kiwi Browser / Extensions)</span>
            </button>

            <button
              onClick={() => setActiveDeviceTab('android_share')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl transition-all ${
                activeDeviceTab === 'android_share'
                  ? 'bg-gradient-to-r from-brand-600 to-cyan-600 text-white shadow-glow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>Android Share Sheet Mode</span>
            </button>
          </div>

          {/* TAB 1: DESKTOP SETUP */}
          {activeDeviceTab === 'desktop' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-4 rounded-2xl bg-surface-900/80 border border-white/10 space-y-3">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-brand-500 text-white flex items-center justify-center text-xs font-black">1</span>
                  <span>Download the Extension Package</span>
                </h4>
                <p className="text-xs text-slate-300">
                  Download the Manifest V3 companion archive and extract (unzip) it into a folder on your computer.
                </p>
                <button
                  onClick={handleDownloadExtension}
                  disabled={downloadingZip}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-brand-600 via-brand-500 to-cyan-500 hover:from-brand-500 hover:to-cyan-400 text-white font-black text-sm flex items-center justify-center gap-2 shadow-glow transition-all"
                >
                  <FolderArchive className="w-4 h-4" />
                  <span>{downloadingZip ? 'Preparing ZIP...' : '📥 Download OmniGrab_Chrome_Extension_V3.zip'}</span>
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-surface-900/80 border border-white/10 space-y-3">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-cyan-500 text-surface-950 flex items-center justify-center text-xs font-black">2</span>
                  <span>Open Extensions Page & Enable Developer Mode</span>
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Open a new browser tab and navigate to <code className="px-2 py-0.5 rounded bg-black/60 text-cyan-300 font-mono text-xs">chrome://extensions</code> (or <code className="px-2 py-0.5 rounded bg-black/60 text-cyan-300 font-mono text-xs">edge://extensions</code> / <code className="px-2 py-0.5 rounded bg-black/60 text-cyan-300 font-mono text-xs">brave://extensions</code>). In the top-right corner, toggle on <strong className="text-white">Developer Mode</strong>.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-surface-900/80 border border-white/10 space-y-3">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-emerald-500 text-surface-950 flex items-center justify-center text-xs font-black">3</span>
                  <span>Click "Load Unpacked" & Select Folder</span>
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Click the <strong className="text-white">"Load unpacked"</strong> button in the top-left corner and select the extracted extension folder. You will instantly see the OmniGrab Pro extension active!
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: ANDROID KIWI BROWSER */}
          {activeDeviceTab === 'android_kiwi' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-4 rounded-2xl bg-surface-900/80 border border-white/10 space-y-2.5">
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold">Android Chrome Extension Support</span>
                <h4 className="font-bold text-white text-sm">How to run Chrome Extensions on Android</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Android Chrome does not natively support desktop extensions, but browsers like <strong className="text-white">Kiwi Browser</strong>, <strong className="text-white">Lemur Browser</strong>, or <strong className="text-white">Yandex Browser</strong> (all free on Google Play) support full Chrome extensions!
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-surface-900/60 border border-white/5 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-xs text-white">
                    <span className="w-5 h-5 rounded bg-brand-600 text-white flex items-center justify-center text-[10px]">1</span>
                    <span>Download Extension ZIP</span>
                  </div>
                  <button
                    onClick={handleDownloadExtension}
                    className="w-full py-2.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-glow"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Extension .ZIP</span>
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-surface-900/60 border border-white/5 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-xs text-white">
                    <span className="w-5 h-5 rounded bg-cyan-500 text-surface-950 flex items-center justify-center text-[10px]">2</span>
                    <span>Install in Kiwi / Lemur</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-tight">
                    In Kiwi Browser, tap 3 dots (⋮) ➔ <strong className="text-white">Extensions</strong> ➔ toggle <strong className="text-white">Developer Mode</strong> ➔ tap <strong className="text-white">+(from .zip/.crx)</strong> and select the downloaded ZIP file.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ANDROID SHARE TARGET */}
          {activeDeviceTab === 'android_share' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm text-white">
                  <Zap className="w-4 h-4 text-emerald-400" />
                  <span>Native Android App Integration (Share Target API)</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  If you use native Android apps like YouTube, Instagram, or TikTok instead of a browser, you don't even need the extension! Your installed OmniGrab PWA receives shared links directly from the Android System Share Sheet.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-surface-900/80 border border-white/5 space-y-2">
                <p className="text-xs font-bold text-white">How to use on Android:</p>
                <ol className="list-decimal list-inside text-xs text-slate-400 space-y-1 leading-relaxed">
                  <li>In YouTube, Instagram, or TikTok, tap the <strong className="text-white">"Share"</strong> icon.</li>
                  <li>Select <strong className="text-white">"OmniGrab"</strong> from the app grid.</li>
                  <li>OmniGrab automatically opens with 4K/1080p/MP3 formats ready to download!</li>
                </ol>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Controls */}
        <div className="bg-surface-950 p-5 sm:p-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={verifyBridge}
            disabled={checkingBridge}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-surface-900 hover:bg-surface-800 text-slate-200 hover:text-white font-bold text-xs border border-white/10 flex items-center justify-center gap-2 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${checkingBridge ? 'animate-spin' : ''}`} />
            <span>{checkingBridge ? 'Verifying Bridge...' : 'Test Live Connection'}</span>
          </button>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => {
                onMarkExtensionPaired(true);
                onClose();
                if (showToast) showToast('Companion Extension marked as paired!', 'success');
              }}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-glow cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>I've Setup the Extension</span>
            </button>

            <button
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-3 rounded-xl bg-surface-900 hover:bg-surface-800 text-slate-400 hover:text-slate-200 font-bold text-xs"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
