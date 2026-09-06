import React from 'react';
import { Puzzle, Sparkles, CheckCircle2, ArrowRight, Download, Laptop, Smartphone, Zap } from 'lucide-react';

export default function CompanionBanner({ isExtensionLinked, onOpenCompanionModal, onOpenExtensionTab }) {
  if (isExtensionLinked) {
    return (
      <div className="mb-6 p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-glow-emerald backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-black text-white flex items-center gap-2">
              <span>Dual Ecosystem Active: PWA + Companion Chrome Extension Linked</span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono">
                100% Paired
              </span>
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Hover buttons, media sniffing, keyboard shortcuts (Alt+D), and Turso Cloud synchronization are active.
            </p>
          </div>
        </div>

        <button
          onClick={onOpenCompanionModal}
          className="px-3.5 py-1.5 rounded-xl bg-surface-900 hover:bg-surface-800 text-xs font-bold text-slate-300 hover:text-white border border-white/10 flex items-center gap-1.5 flex-shrink-0 transition-colors"
        >
          <span>Extension Settings</span>
          <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
        </button>
      </div>
    );
  }

  return (
    <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-brand-950/90 via-surface-900 to-cyan-950/90 border border-brand-500/40 shadow-glow backdrop-blur-md animate-fadeIn">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-brand-600 to-cyan-500 p-0.5 flex-shrink-0 shadow-glow">
            <div className="w-full h-full bg-surface-950 rounded-[14px] flex items-center justify-center text-cyan-400">
              <Puzzle className="w-6 h-6 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black uppercase tracking-wider">
                Action Recommended
              </span>
              <p className="text-sm font-black text-white">
                Pair with Chrome Companion Extension (Step 2)
              </p>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Unlock on-page 1-click video hover grabbers, background sniffer (<code className="text-cyan-300 font-mono text-[11px]">Alt+D</code>), and cross-device Turso sync.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end flex-shrink-0">
          <button
            onClick={onOpenCompanionModal}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-cyan-600 hover:from-brand-500 hover:to-cyan-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-glow cursor-pointer transition-transform hover:scale-105"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
            <span>Setup Extension (Quick Guide)</span>
          </button>
        </div>

      </div>
    </div>
  );
}
