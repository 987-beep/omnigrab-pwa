import React, { useState, useEffect } from 'react';
import { 
  Puzzle, 
  Download, 
  CheckCircle2, 
  Sparkles, 
  ExternalLink, 
  Settings, 
  Play, 
  MousePointer, 
  ShieldCheck, 
  Copy,
  Layers,
  Zap,
  FolderArchive,
  Globe,
  UploadCloud,
  FileText,
  Image as ImageIcon,
  Check,
  Smartphone
} from 'lucide-react';

export default function ExtensionHub({ showToast }) {
  const [copiedKey, setCopiedKey] = useState(null);
  const [activeDemoTab, setActiveDemoTab] = useState('youtube');
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [extensionDetected, setExtensionDetected] = useState(false);
  const [extVersion, setExtVersion] = useState('2.5.0');
  const [activeStoreTab, setActiveStoreTab] = useState('checklist'); // checklist, assets, permissions

  useEffect(() => {
    // Check if extension content script injected presence
    const handleMessage = (e) => {
      if (e.data && e.data.type === 'OMNIGRAB_EXTENSION_READY') {
        setExtensionDetected(true);
        if (e.data.version) setExtVersion(e.data.version);
      }
    };

    window.addEventListener('message', handleMessage);

    // Initial attribute check
    if (document.documentElement.getAttribute('data-omnigrab-extension-active') === 'true') {
      setExtensionDetected(true);
    }

    return () => window.removeEventListener('message', handleMessage);
  }, []);

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
      showToast('Downloaded OmniGrab Chrome Extension (Manifest V3)!', 'success');
    } catch (e) {
      showToast('Failed to download extension package', 'error');
    } finally {
      setDownloadingZip(false);
    }
  };

  const copyText = (key, text) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast('Copied to clipboard!', 'success');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const permissionJustifications = {
    activeTab: "Required to sniff video streams, high-resolution photos, and audio elements on the tab the user actively clicks.",
    downloads: "Used solely to trigger native browser saving of the video/photo/audio files to the user's downloads folder.",
    storage: "Stores user preferences locally on the browser (e.g. backend server URL and download quality defaults). Zero external tracking.",
    contextMenus: "Adds right-click options ('Download Video/Photo with OmniGrab') when clicking media links or images on webpages."
  };

  return (
    <div className="space-y-10 animate-fadeIn max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto py-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/30 text-cyan-300 text-xs font-bold uppercase tracking-wider mb-3 shadow-glow">
          <Puzzle className="w-3.5 h-3.5 text-cyan-400" />
          <span>Chrome Manifest V3 Companion & Web Store Kit</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-black text-white">
          Download Media <span className="bg-gradient-to-r from-brand-400 via-cyan-400 to-indigo-300 bg-clip-text text-transparent">Directly On Webpages</span>
        </h2>
        <p className="mt-2 text-slate-400 text-sm">
          Injects floating download badges on videos across YouTube, Instagram, and TikTok with 2-way real-time sync with this PWA application.
        </p>
      </div>

      {/* Extension Live Connection Banner */}
      <div className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-center justify-between gap-4 ${
        extensionDetected
          ? 'bg-emerald-950/40 border-emerald-500/40 shadow-glow-emerald text-emerald-200'
          : 'bg-surface-900/60 border-white/10 text-slate-300'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            extensionDetected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-surface-800 text-slate-400'
          }`}>
            <Zap className={`w-5 h-5 ${extensionDetected ? 'animate-pulse' : ''}`} />
          </div>
          <div>
            <p className="text-sm font-bold text-white flex items-center gap-2">
              <span>{extensionDetected ? '🟢 Chrome Extension Bridge: Connected & Synced' : '⚪ Chrome Extension Bridge: Standby'}</span>
              {extensionDetected && (
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono">
                  v{extVersion}
                </span>
              )}
            </p>
            <p className="text-xs text-slate-400">
              {extensionDetected 
                ? 'Your browser has OmniGrab extension installed. On-page downloads and context menus are live!'
                : 'Install the extension below or unpack in chrome://extensions to enable 1-click on-page download pills.'}
            </p>
          </div>
        </div>

        <button
          onClick={handleDownloadExtension}
          disabled={downloadingZip}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-cyan-600 hover:from-brand-500 hover:to-cyan-500 text-white font-bold text-xs flex items-center gap-2 shadow-glow flex-shrink-0"
        >
          <FolderArchive className="w-4 h-4" />
          <span>{downloadingZip ? 'Packing...' : 'Get Extension (.ZIP)'}</span>
        </button>
      </div>

      {/* Main Download Extension Card */}
      <div className="glass-panel-elevated p-6 sm:p-8 rounded-3xl border border-brand-500/30 shadow-glow relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          
          <div className="space-y-4 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-black uppercase tracking-wider">
                Manifest V3 Compliant
              </span>
              <span className="px-3 py-1 rounded-full bg-surface-900 text-slate-300 border border-white/10 text-xs font-mono">
                Store-Ready
              </span>
            </div>

            <h3 className="text-2xl font-black text-white">
              OmniGrab Pro Chrome Companion
            </h3>

            <p className="text-slate-300 text-sm leading-relaxed">
              Equip your browser with real-time media sniffing, hovering 1-click download pills on video players, right-click context menu integration, and keyboard shortcuts (<code className="text-cyan-300 font-mono">Alt + D</code> / <code className="text-cyan-300 font-mono">Alt + S</code>).
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <span>On-Page Floating Badges</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <span>Active Tab Media Sniffer</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <span>Alt + D Keyboard Shortcut</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <span>Zero Data Collection (Privacy Safe)</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-3 w-full lg:w-auto">
            <button
              onClick={handleDownloadExtension}
              disabled={downloadingZip}
              className="btn-primary-gradient w-full sm:w-auto px-8 py-5 rounded-2xl text-white font-black text-base flex items-center justify-center gap-3 shadow-glow cursor-pointer disabled:opacity-50"
            >
              <FolderArchive className="w-6 h-6 text-cyan-300" />
              <span>{downloadingZip ? 'Packing Extension...' : 'Download Extension (.ZIP)'}</span>
            </button>
            <p className="text-[11px] text-slate-400 text-center font-mono">
              Ready to unpack & load in chrome://extensions
            </p>
          </div>

        </div>
      </div>

      {/* GOOGLE CHROME WEB STORE PUBLISHING KIT */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-cyan-500/30 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 text-xs font-bold mb-2">
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span>Official Chrome Web Store Publishing Kit</span>
            </div>
            <h3 className="text-xl font-black text-white">
              How to Publish OmniGrab on Google Chrome Web Store
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Everything you need to publish your extension publicly on the official Chrome Web Store:
            </p>
          </div>

          <div className="flex items-center gap-2 bg-surface-900 p-1 rounded-xl border border-white/10 text-xs font-bold">
            <button
              onClick={() => setActiveStoreTab('checklist')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeStoreTab === 'checklist' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Checklist & Steps
            </button>
            <button
              onClick={() => setActiveStoreTab('assets')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeStoreTab === 'assets' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Store Promo Assets
            </button>
            <button
              onClick={() => setActiveStoreTab('permissions')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeStoreTab === 'permissions' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Permission Justifications
            </button>
          </div>
        </div>

        {/* TAB 1: CHECKLIST */}
        {activeStoreTab === 'checklist' && (
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div className="p-5 rounded-2xl bg-surface-900/70 border border-white/5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="w-7 h-7 rounded-lg bg-brand-600 text-white text-xs font-black flex items-center justify-center">1</span>
                  <a 
                    href="https://chrome.google.com/webstore/devconsole" 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                  >
                    <span>Developer Dashboard</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <h4 className="font-bold text-white text-sm">Register Developer Account</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Go to the Chrome Developer Dashboard and sign in with your Google Account. Pay the one-time $5 developer registration fee.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-surface-900/70 border border-white/5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="w-7 h-7 rounded-lg bg-brand-600 text-white text-xs font-black flex items-center justify-center">2</span>
                  <button
                    onClick={handleDownloadExtension}
                    className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                  >
                    <span>Download Clean .ZIP</span>
                    <Download className="w-3 h-3" />
                  </button>
                </div>
                <h4 className="font-bold text-white text-sm">Upload Extension ZIP</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Click <strong>"New Item"</strong> in the dashboard and upload <code className="text-cyan-300">OmniGrab_Chrome_Extension_V3.zip</code>. The manifest is pre-validated for Manifest V3.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-surface-900/70 border border-white/5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="w-7 h-7 rounded-lg bg-brand-600 text-white text-xs font-black flex items-center justify-center">3</span>
                  <a 
                    href="/privacy-policy.html" 
                    target="_blank" 
                    className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                  >
                    <span>View Privacy Policy</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <h4 className="font-bold text-white text-sm">Privacy Policy & Permissions</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Provide your privacy policy URL (use your deployed Vercel domain <code className="text-cyan-300">/privacy-policy.html</code>) and paste the permission justifications from the tab above.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-surface-900/70 border border-white/5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="w-7 h-7 rounded-lg bg-brand-600 text-white text-xs font-black flex items-center justify-center">4</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">~24h Review</span>
                </div>
                <h4 className="font-bold text-white text-sm">Submit for Review</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Upload the store promo images (from the Promo Assets tab) and click <strong>"Submit for review"</strong>. Google typically approves in 24-48 hours.
                </p>
              </div>

            </div>
          </div>
        )}

        {/* TAB 2: STORE PROMO ASSETS */}
        {activeStoreTab === 'assets' && (
          <div className="space-y-4 pt-2">
            <p className="text-xs text-slate-400">
              Google Chrome Web Store requires specific image dimensions for store cards. We have pre-generated all required promo tiles for you:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              <div className="p-4 rounded-2xl bg-surface-900/80 border border-white/5 space-y-3">
                <div className="aspect-[440/280] rounded-xl bg-surface-950 overflow-hidden border border-white/10 relative">
                  <img src="/store-assets/promo_small_440x280.png" alt="Small Promo" className="w-full h-full object-cover" />
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/80 text-[10px] font-mono font-bold text-cyan-300">
                    440 x 280
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Small Promo Tile</span>
                  <a href="/store-assets/promo_small_440x280.png" download="promo_small_440x280.png" className="p-1.5 rounded-lg bg-surface-800 hover:bg-brand-600 text-cyan-300 hover:text-white">
                    <Download className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-surface-900/80 border border-white/5 space-y-3">
                <div className="aspect-[440/280] rounded-xl bg-surface-950 overflow-hidden border border-white/10 relative">
                  <img src="/store-assets/promo_large_920x680.png" alt="Large Promo" className="w-full h-full object-cover" />
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/80 text-[10px] font-mono font-bold text-cyan-300">
                    920 x 680
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Large Promo Tile</span>
                  <a href="/store-assets/promo_large_920x680.png" download="promo_large_920x680.png" className="p-1.5 rounded-lg bg-surface-800 hover:bg-brand-600 text-cyan-300 hover:text-white">
                    <Download className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-surface-900/80 border border-white/5 space-y-3">
                <div className="aspect-[440/280] rounded-xl bg-surface-950 overflow-hidden border border-white/10 relative">
                  <img src="/store-assets/promo_marquee_1400x560.png" alt="Marquee" className="w-full h-full object-cover" />
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/80 text-[10px] font-mono font-bold text-cyan-300">
                    1400 x 560
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Marquee Banner</span>
                  <a href="/store-assets/promo_marquee_1400x560.png" download="promo_marquee_1400x560.png" className="p-1.5 rounded-lg bg-surface-800 hover:bg-brand-600 text-cyan-300 hover:text-white">
                    <Download className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 3: PERMISSIONS JUSTIFICATION */}
        {activeStoreTab === 'permissions' && (
          <div className="space-y-3 pt-2">
            <p className="text-xs text-slate-400">
              Copy and paste these exact justifications into the Chrome Developer Dashboard when submitting:
            </p>

            <div className="space-y-2.5">
              {Object.entries(permissionJustifications).map(([perm, just]) => (
                <div key={perm} className="p-3.5 rounded-xl bg-surface-900/80 border border-white/5 flex items-start justify-between gap-3">
                  <div>
                    <span className="px-2 py-0.5 rounded bg-brand-950 text-cyan-300 border border-brand-500/30 text-[11px] font-mono font-bold">
                      {perm}
                    </span>
                    <p className="text-xs text-slate-300 mt-1">{just}</p>
                  </div>
                  <button
                    onClick={() => copyText(perm, just)}
                    className="p-2 rounded-lg bg-surface-800 hover:bg-surface-700 text-slate-400 hover:text-white transition-colors flex-shrink-0"
                    title="Copy justification"
                  >
                    {copiedKey === perm ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Interactive Live Simulation / Playground */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <MousePointer className="w-5 h-5 text-cyan-400" />
              <span>Interactive Extension Demo Playground</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Hover over the mock video player below to see how the OmniGrab floating download pill appears on any webpage:
            </p>
          </div>

          <div className="flex items-center gap-2 bg-surface-900 p-1 rounded-xl border border-white/10 text-xs font-bold">
            <button
              onClick={() => setActiveDemoTab('youtube')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeDemoTab === 'youtube' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              YouTube Player
            </button>
            <button
              onClick={() => setActiveDemoTab('instagram')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeDemoTab === 'instagram' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Instagram Reel
            </button>
          </div>
        </div>

        <div className="relative rounded-2xl overflow-hidden bg-surface-950 border border-white/15 aspect-video max-w-2xl mx-auto group shadow-2xl flex items-center justify-center">
          <div className="text-center space-y-2 p-6">
            <div className="w-16 h-16 rounded-full bg-brand-500/20 border border-brand-500/40 text-cyan-400 mx-auto flex items-center justify-center group-hover:scale-110 transition-transform">
              <Play className="w-8 h-8 fill-current ml-1" />
            </div>
            <p className="text-sm font-bold text-white">
              {activeDemoTab === 'youtube' ? 'Cinematic 4K Nature Video Player' : 'Viral Instagram Travel Reel'}
            </p>
            <p className="text-xs text-slate-500">Hover over this box to reveal the injected OmniGrab button</p>
          </div>

          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transform -translate-y-2 group-hover:translate-y-0 transition-all duration-300">
            <button 
              onClick={() => showToast('Injected button clicked! OmniGrab begins direct download.', 'success')}
              className="px-4 py-2 rounded-full bg-gradient-to-r from-brand-600 to-cyan-500 text-white text-xs font-black flex items-center gap-2 shadow-glow cursor-pointer border border-white/30 hover:scale-105 transition-transform"
            >
              <Zap className="w-3.5 h-3.5 fill-current text-amber-300" />
              <span>Download 1080p MP4</span>
            </button>
          </div>

          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-3">
              <Play className="w-4 h-4 text-white" />
              <span className="font-mono text-white text-[11px]">01:24 / 04:50</span>
            </div>
            <span className="px-2 py-0.5 rounded bg-white/10 text-cyan-300 text-[10px] font-mono font-bold">
              4K ULTRA HD
            </span>
          </div>
        </div>
      </div>

    </div>
  );
}
