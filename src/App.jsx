import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ExtractorView from './components/ExtractorView';
import ScraperView from './components/ScraperView';
import ExtensionHub from './components/ExtensionHub';
import AndroidPwaGuide from './components/AndroidPwaGuide';
import HistoryQueue from './components/HistoryQueue';
import DeploymentGuide from './components/DeploymentGuide';
import MediaLightbox from './components/MediaLightbox';
import Toast from './components/Toast';
import { checkBackendHealth, getHistory } from './utils/api';
import { 
  Download, 
  Smartphone, 
  Puzzle, 
  Layers, 
  Sparkles, 
  GitBranch, 
  Heart,
  Share2,
  ShieldCheck,
  Zap,
  Globe
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('extract'); // extract, scraper, extension, android, history, deploy
  const [backendStatus, setBackendStatus] = useState(null);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [history, setHistory] = useState([]);
  const [toast, setToast] = useState(null);
  const [lightboxData, setLightboxData] = useState(null);
  const [initialUrl, setInitialUrl] = useState('');

  // Handle URL query parameters (Android Share Target or Chrome Extension redirects)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedUrl = params.get('url') || params.get('text');
    const tabParam = params.get('tab');

    if (tabParam) {
      if (['extract', 'scraper', 'extension', 'android', 'history', 'deploy'].includes(tabParam)) {
        setActiveTab(tabParam);
      }
    }

    if (sharedUrl) {
      // Clean up text if it contains extra message words (e.g., from WhatsApp / YouTube share)
      const urlMatch = sharedUrl.match(/(https?:\/\/[^\s]+)/g);
      const cleanUrl = urlMatch ? urlMatch[0] : sharedUrl;
      setInitialUrl(cleanUrl);
      if (tabParam === 'scraper') {
        setActiveTab('scraper');
      } else {
        setActiveTab('extract');
      }
    }

    // Load initial history
    setHistory(getHistory());

    // Check backend health
    checkBackendHealth().then(status => {
      setBackendStatus(status);
    });

    // PWA Install prompt listener
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const triggerInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      showToast('OmniGrab PWA installed successfully!', 'success');
    }
    setInstallPrompt(null);
  };

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev && prev.message === message ? null : prev));
    }, 4000);
  };

  const handleAddToHistory = (item) => {
    setHistory(getHistory());
  };

  const handleSelectUrlFromHistory = (targetUrl) => {
    setInitialUrl(targetUrl);
    setActiveTab('extract');
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-950 text-slate-100 selection:bg-brand-500 selection:text-white relative">
      
      {/* Background Ambient Glows */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        backendStatus={backendStatus}
        installPrompt={installPrompt}
        triggerInstall={triggerInstall}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'extract' && (
          <ExtractorView
            initialUrl={initialUrl}
            onAddToHistory={handleAddToHistory}
            showToast={showToast}
            onOpenLightbox={(src, title) => setLightboxData({ src, title })}
          />
        )}

        {activeTab === 'scraper' && (
          <ScraperView
            showToast={showToast}
            onOpenLightbox={(src, title) => setLightboxData({ src, title })}
          />
        )}

        {activeTab === 'extension' && (
          <ExtensionHub
            showToast={showToast}
          />
        )}

        {activeTab === 'android' && (
          <AndroidPwaGuide
            installPrompt={installPrompt}
            triggerInstall={triggerInstall}
            showToast={showToast}
          />
        )}

        {activeTab === 'history' && (
          <HistoryQueue
            history={history}
            onClearHistory={() => setHistory([])}
            showToast={showToast}
            onSelectUrl={handleSelectUrlFromHistory}
          />
        )}

        {activeTab === 'deploy' && (
          <DeploymentGuide
            showToast={showToast}
          />
        )}
      </main>

      {/* Bottom Sticky Mobile Navigation */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 glass-panel border-t border-white/10 px-2 py-2 backdrop-blur-xl">
        <div className="flex items-center justify-around">
          {[
            { id: 'extract', label: 'Extract', icon: Download },
            { id: 'scraper', label: 'Scrape', icon: Layers },
            { id: 'extension', label: 'Extension', icon: Puzzle },
            { id: 'android', label: 'Android', icon: Smartphone },
            { id: 'history', label: 'History', icon: Sparkles },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
                  isActive ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-cyan-400 scale-110' : 'text-slate-400'}`} />
                <span className="text-[10px]">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-surface-950/80 mt-16 py-8 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-white">OMNIGRAB PRO</span>
            <span>• Universal Video & Photo Engine</span>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={() => setActiveTab('android')} className="hover:text-cyan-300 transition-colors flex items-center gap-1">
              <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
              <span>Android PWA</span>
            </button>
            <button onClick={() => setActiveTab('extension')} className="hover:text-cyan-300 transition-colors flex items-center gap-1">
              <Puzzle className="w-3.5 h-3.5 text-brand-400" />
              <span>Chrome Extension</span>
            </button>
            <button onClick={() => setActiveTab('deploy')} className="hover:text-cyan-300 transition-colors flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              <span>Vercel / GitHub Docs</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Toast Notification */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Lightbox Modal */}
      {lightboxData && (
        <MediaLightbox
          src={lightboxData.src}
          title={lightboxData.title}
          onClose={() => setLightboxData(null)}
        />
      )}

    </div>
  );
}
