import React from 'react';
import { 
  QrCode, 
  X, 
  Smartphone, 
  Sparkles, 
  Copy, 
  ExternalLink,
  CheckCircle2,
  Share2
} from 'lucide-react';

export default function QrCodeModal({ isOpen, onClose, targetUrl, mediaTitle, showToast }) {
  if (!isOpen) return null;

  const currentOrigin = window.location.origin;
  const shareLink = `${currentOrigin}/?url=${encodeURIComponent(targetUrl)}`;
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(shareLink)}&margin=10&color=06b6d4&bgcolor=090d16`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    showToast('Direct Handoff Link copied!', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-md glass-panel-elevated rounded-3xl border border-cyan-500/40 shadow-2xl overflow-hidden flex flex-col text-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-900/90 via-surface-900 to-cyan-950/90 p-6 border-b border-white/10 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl bg-surface-800/80 hover:bg-surface-700 text-slate-300 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-black uppercase mb-2">
            <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
            <span>Instant Mobile Handoff</span>
          </div>

          <h3 className="text-xl font-black text-white">
            Scan to Open on Phone
          </h3>
          <p className="text-xs text-slate-300 mt-0.5 truncate">
            {mediaTitle || 'Transfer media to mobile device'}
          </p>
        </div>

        {/* QR Display */}
        <div className="p-6 space-y-5 flex flex-col items-center">
          <div className="p-4 rounded-2xl bg-surface-950 border border-cyan-500/30 shadow-glow-cyan">
            <img 
              src={qrApiUrl} 
              alt="Scan QR code" 
              className="w-56 h-56 rounded-xl object-contain"
            />
          </div>

          <div className="space-y-1 text-xs text-slate-300 max-w-xs">
            <p className="font-bold text-white">How it works:</p>
            <p className="text-slate-400">
              Open your iPhone or Android camera, point it at this QR code, and tap the notification to open this video instantly in OmniGrab PWA!
            </p>
          </div>

          <button
            onClick={handleCopyLink}
            className="w-full py-3 rounded-xl bg-surface-900 hover:bg-surface-800 border border-white/10 text-cyan-300 hover:text-white text-xs font-bold flex items-center justify-center gap-2 transition-all"
          >
            <Copy className="w-4 h-4" />
            <span>Copy Handoff URL</span>
          </button>
        </div>

        {/* Footer */}
        <div className="bg-surface-950 p-4 border-t border-white/10 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-surface-900 hover:bg-surface-800 text-slate-300 hover:text-white text-xs font-bold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
