import React from 'react';
import { CheckCircle2, AlertCircle, Info, Sparkles, X } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  if (!toast) return null;

  const { message, type } = toast;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />;
      default:
        return <Sparkles className="w-5 h-5 text-cyan-400 flex-shrink-0" />;
    }
  };

  const getBorder = () => {
    switch (type) {
      case 'success':
        return 'border-emerald-500/40 shadow-glow-emerald';
      case 'error':
        return 'border-rose-500/40';
      default:
        return 'border-cyan-500/40 shadow-glow-cyan';
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slideUp">
      <div className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-surface-900/95 backdrop-blur-xl border ${getBorder()} shadow-2xl text-white text-xs sm:text-sm font-semibold max-w-md`}>
        {getIcon()}
        <span className="flex-1 leading-snug">{message}</span>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
