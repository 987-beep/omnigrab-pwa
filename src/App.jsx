import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ExtractorView from './components/ExtractorView';
import ExtensionHub from './components/ExtensionHub';
import AndroidPwaGuide from './components/AndroidPwaGuide';
import DeploymentGuide from './components/DeploymentGuide';
import MediaLightbox from './components/MediaLightbox';
import Toast from './components/Toast';
import CompanionSetupModal from './components/CompanionSetupModal';
import GoogleAccountModal from './components/GoogleAccountModal';
import { checkBackendHealth, getHistory } from './utils/api';
import { getGoogleUser } from './utils/googleAuth';
import { 
  Download, 
  Smartphone, 
  Puzzle, 
  BookOpen, 
  User, 
  Sparkles, 
  Globe, 
  ShieldCheck,
  Zap
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function App() {
  const [activeTab, setActiveTab] = useState('extract'); // extract, android, extension, deploy
  const [installPrompt, setInstallPrompt] = useState(null);
  const [toast, setToast] = useState(null);
  const [lightboxData, setLightboxData] = useState(null);
  const [initialUrl, setInitialUrl] = useState('');
  
  // Google Account Modal State
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [googleUser, setGoogleUser] = useState(getGoogleUser());

  // Companion Extension Pairing State
  const [isExtensionLinked, setIsExtensionLinked] = useState(() => {
    return localStorage.getItem('omnigrab_extension_paired') === 'true';
  });
  const [isCompanionModalOpen, setIsCompanionModalOpen] = useState(false);

  // Handle URL query parameters (Android Share Target or Chrome Extension redirects)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedUrl = params.get('url') || params.get('text');
    const tabParam = params.get('tab');

    if (tabParam) {
      if (['extract', 'android', 'extension', 'deploy'].includes(tabParam)) {
        setActiveTab(tabParam);
      }
    }

    if (sharedUrl) {
      const urlMatch = sharedUrl.match(/(https?:\/\/[^\s]+)/g);
      const cleanUrl = urlMatch ? urlMatch[0] : sharedUrl;
      setInitialUrl(cleanUrl);
      setActiveTab('extract');
    }

    // PWA Install prompt listener
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    // When PWA is installed on any device: Trigger the Companion Extension setup prompt!
    const handleAppInstalled = () => {
      showToast('🎉 OmniGrab PWA Installed! Please link your Chrome Companion Extension.', 'success');
      confetti({ particleCount: 80, spread: 80 });
      setTimeout(() => {
        setIsCompanionModalOpen(true);
      }, 1000);
    };

    // Extension bridge message listener
    const handleMessage = (e) => {
      if (e.data && e.data.type === 'OMNIGRAB_EXTENSION_READY') {
        setIsExtensionLinked(true);
        localStorage.setItem('omnigrab_extension_paired', 'true');
      }
    };

    const handleAuthChange = () => {
      setGoogleUser(getGoogleUser());
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('message', handleMessage);
    window.addEventListener('omnigrab-auth-changed', handleAuthChange);

    if (document.documentElement.getAttribute('data-omnigrab-extension-active') === 'true') {
      setIsExtensionLinked(true);
      localStorage.setItem('omnigrab_extension_paired', 'true');
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('omnigrab-auth-changed', handleAuthChange);
    };
  }, []);

  const triggerInstall = async () => {
    if (!installPrompt) {
      setIsCompanionModalOpen(true);
      return;
    }
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      showToast('OmniGrab PWA installed! Next step: Pair Companion Extension.', 'success');
      confetti({ particleCount: 70, spread: 70 });
      setTimeout(() => {
        setIsCompanionModalOpen(true);
      }, 1000);
    }
    setInstallPrompt(null);
  };

  const handleMarkExtensionPaired = (paired) => {
    setIsExtensionLinked(paired);
    if (paired) {
      localStorage.setItem('omnigrab_extension_paired', 'true');
    } else {
      localStorage.removeItem('omnigrab_extension_paired');
    }
  };

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev && prev.message === message ? null : prev));
    }, 4000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-950 text-slate-100 selection:bg-brand-500 selection:text-white relative">
      
      {/* Background Ambient Glows */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Clean Top Bar Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        installPrompt={installPrompt}
        triggerInstall={triggerInstall}
        onOpenGoogleModal={() => setIsGoogleModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {activeTab === 'extract' && (
          <ExtractorView
            initialUrl={initialUrl}
            showToast={showToast}
            onOpenLightbox={(src, title) => setLightboxData({ src, title })}
            onOpenCompanionModal={() => setIsCompanionModalOpen(true)}
            isExtensionLinked={isExtensionLinked}
          />
        )}

        {activeTab === 'android' && (
          <AndroidPwaGuide
            installPrompt={installPrompt}
            triggerInstall={triggerInstall}
            showToast={showToast}
            isExtensionLinked={isExtensionLinked}
            onOpenCompanionModal={() => setIsCompanionModalOpen(true)}
          />
        )}

        {activeTab === 'extension' && (
          <ExtensionHub
            showToast={showToast}
            isExtensionLinked={isExtensionLinked}
            onMarkExtensionPaired={handleMarkExtensionPaired}
            onOpenCompanionModal={() => setIsCompanionModalOpen(true)}
          />
        )}

        {activeTab === 'deploy' && (
          <DeploymentGuide
            showToast={showToast}
          />
        )}

      </main>

      {/* Bottom Sticky Mobile Navigation */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 glass-panel border-t border-white/10 px-2 py-2 backdrop-blur-xl">
        <div className="flex items-center justify-around">
          {[
            { id: 'extract', label: 'Extractor', icon: Download },
            { id: 'android', label: 'Android PWA', icon: Smartphone },
            { id: 'extension', label: 'Extension', icon: Puzzle },
            { id: 'deploy', label: 'Guide', icon: BookOpen },
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

          <button
            onClick={() => setIsGoogleModalOpen(true)}
            className="flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-slate-400 hover:text-white"
          >
            <User className="w-5 h-5 text-cyan-400" />
            <span className="text-[10px]">Account</span>
          </button>
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
            <button onClick={() => setIsGoogleModalOpen(true)} className="hover:text-cyan-300 transition-colors flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-cyan-400" />
              <span>Google Account</span>
            </button>
            <button onClick={() => setActiveTab('android')} className="hover:text-cyan-300 transition-colors flex items-center gap-1">
              <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
              <span>Android PWA</span>
            </button>
            <button onClick={() => setActiveTab('extension')} className="hover:text-cyan-300 transition-colors flex items-center gap-1">
              <Puzzle className="w-3.5 h-3.5 text-brand-400" />
              <span>Chrome Extension</span>
            </button>
            <button onClick={() => setActiveTab('deploy')} className="hover:text-cyan-300 transition-colors flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
              <span>User Guide</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Google Account Modal */}
      <GoogleAccountModal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
        showToast={showToast}
        onAuthChange={(user) => setGoogleUser(user)}
      />

      {/* Companion Extension Setup Modal */}
      <CompanionSetupModal
        isOpen={isCompanionModalOpen}
        onClose={() => setIsCompanionModalOpen(false)}
        isExtensionLinked={isExtensionLinked}
        onMarkExtensionPaired={handleMarkExtensionPaired}
        showToast={showToast}
      />

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
