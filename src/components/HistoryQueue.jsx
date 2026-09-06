import React, { useState } from 'react';
import { 
  Clock, 
  Trash2, 
  Download, 
  ExternalLink, 
  Film, 
  Music, 
  Image as ImageIcon, 
  Sparkles,
  HardDrive,
  Copy,
  CheckCircle2,
  Share2
} from 'lucide-react';
import { clearHistory, formatBytes } from '../utils/api';

export default function HistoryQueue({ history, onClearHistory, showToast, onSelectUrl }) {
  const [filter, setFilter] = useState('ALL');
  const [copiedId, setCopiedId] = useState(null);

  const handleCopy = (id, link) => {
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    showToast('Link copied to clipboard!', 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredHistory = history.filter(item => {
    if (filter === 'ALL') return true;
    if (filter === 'VIDEO') return item.type === 'video';
    if (filter === 'AUDIO') return item.type === 'audio';
    if (filter === 'PHOTO') return item.type === 'image' || item.type === 'photo';
    return true;
  });

  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4 border-b border-white/10">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
            <Clock className="w-6 h-6 text-cyan-400" />
            <span>Downloads & Offline Queue</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Locally persisted history of saved 4K streams, reels, MP3 tracks, and ZIP archives.
          </p>
        </div>

        {history.length > 0 && (
          <button
            onClick={() => {
              if (window.confirm('Clear all download history?')) {
                clearHistory();
                onClearHistory();
                showToast('History cleared', 'info');
              }
            }}
            className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="glass-panel p-4 rounded-2xl border border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-500/20 text-cyan-400 flex items-center justify-center font-black">
            <Download className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Total Files Saved</p>
            <p className="text-xl font-black text-white font-mono">{history.length}</p>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-black">
            <Film className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Videos & Reels</p>
            <p className="text-xl font-black text-white font-mono">
              {history.filter(h => h.type === 'video').length}
            </p>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-black">
            <HardDrive className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Storage Cache</p>
            <p className="text-xl font-black text-white font-mono">Ready & Synced</p>
          </div>
        </div>

      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        {['ALL', 'VIDEO', 'AUDIO', 'PHOTO'].map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filter === t 
                ? 'bg-gradient-to-r from-brand-600 to-cyan-600 text-white shadow-glow' 
                : 'glass-panel text-slate-400 hover:text-white'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* History Items List */}
      {filteredHistory.length === 0 ? (
        <div className="glass-panel p-12 rounded-3xl text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-surface-900 border border-white/10 text-slate-500 mx-auto flex items-center justify-center">
            <Clock className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-white">No Downloads in History Yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Extract and download any video, reel or photo from the Universal Extractor or Chrome Extension to track your downloads here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredHistory.map((item) => (
            <div
              key={item.id}
              className="glass-panel p-4 rounded-2xl border border-white/5 hover:border-brand-500/40 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
            >
              <div className="flex items-center gap-4 min-w-0">
                {/* Thumb / Icon */}
                <div className="w-14 h-14 rounded-xl bg-surface-950 border border-white/10 overflow-hidden flex-shrink-0 flex items-center justify-center">
                  {item.thumbnail ? (
                    <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
                  ) : item.type === 'audio' ? (
                    <Music className="w-6 h-6 text-cyan-400" />
                  ) : (
                    <Film className="w-6 h-6 text-brand-400" />
                  )}
                </div>

                {/* Details */}
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-white truncate group-hover:text-cyan-300 transition-colors">
                    {item.title}
                  </h4>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1">
                    <span className="px-2 py-0.5 rounded bg-surface-900 border border-white/5 text-[10px] font-bold text-slate-300">
                      {item.platform || 'Web'}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-brand-950 text-cyan-300 border border-brand-500/30 text-[10px] font-mono font-bold">
                      {item.quality || 'HD'}
                    </span>
                    {item.size && <span>• {item.size}</span>}
                    {item.timestamp && <span>• {new Date(item.timestamp).toLocaleDateString()}</span>}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={() => handleCopy(item.id, item.url)}
                  className="p-2.5 rounded-xl bg-surface-900 hover:bg-surface-800 border border-white/10 text-slate-400 hover:text-white transition-colors"
                  title="Copy link"
                >
                  {copiedId === item.id ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => onSelectUrl(item.url)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-cyan-600 hover:from-brand-500 hover:to-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-glow"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Re-Extract</span>
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}
