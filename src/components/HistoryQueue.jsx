import React, { useState, useEffect } from 'react';
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
  Share2,
  Database,
  Cloud,
  Bookmark,
  RefreshCw,
  Smartphone,
  Laptop
} from 'lucide-react';
import { clearHistory, formatBytes, fetchTursoHistory, deleteTursoHistory, fetchTursoBookmarks, addTursoBookmark, deleteTursoBookmark } from '../utils/api';

export default function HistoryQueue({ history, onClearHistory, showToast, onSelectUrl }) {
  const [filter, setFilter] = useState('ALL');
  const [copiedId, setCopiedId] = useState(null);
  const [historySource, setHistorySource] = useState('cloud'); // 'cloud' (Turso) or 'local'
  const [cloudItems, setCloudItems] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [loadingCloud, setLoadingCloud] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState('history'); // 'history' or 'bookmarks'

  const loadTursoData = async () => {
    setLoadingCloud(true);
    try {
      const items = await fetchTursoHistory();
      setCloudItems(items);
      const bmarks = await fetchTursoBookmarks();
      setBookmarks(bmarks);
    } catch (e) {
      console.error('Turso fetch err:', e);
    } finally {
      setLoadingCloud(false);
    }
  };

  useEffect(() => {
    loadTursoData();
  }, []);

  const handleCopy = (id, link) => {
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    showToast('Link copied to clipboard!', 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleBookmark = async (item) => {
    try {
      await addTursoBookmark({
        url: item.url,
        title: item.title,
        thumbnail: item.thumbnail,
        platform: item.platform || 'Web',
        notes: `Saved from ${item.quality || 'HD'}`
      });
      showToast('Saved to Turso Cloud Bookmarks!', 'success');
      loadTursoData();
    } catch {
      showToast('Failed to bookmark', 'error');
    }
  };

  const handleDeleteItem = async (id) => {
    if (historySource === 'cloud') {
      await deleteTursoHistory(id);
      setCloudItems(prev => prev.filter(i => i.id !== id));
      showToast('Deleted from Turso Cloud Database', 'info');
    }
  };

  const itemsToDisplay = (historySource === 'cloud' && cloudItems.length > 0) ? cloudItems : history;

  const filteredHistory = itemsToDisplay.filter(item => {
    const mType = (item.media_type || item.type || '').toLowerCase();
    if (filter === 'ALL') return true;
    if (filter === 'VIDEO') return mType === 'video';
    if (filter === 'AUDIO') return mType === 'audio';
    if (filter === 'PHOTO') return mType === 'image' || mType === 'photo';
    return true;
  });

  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4 border-b border-white/10">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
            <Cloud className="w-6 h-6 text-cyan-400" />
            <span>Turso Cloud Sync & Downloads Queue</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Synchronized across all your devices (Android PWA, Chrome Extension, Desktop) via Turso LibSQL Database.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadTursoData}
            disabled={loadingCloud}
            className="px-3 py-2 rounded-xl bg-surface-900 hover:bg-surface-800 border border-white/10 text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-all"
            title="Sync with Turso Cloud"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${loadingCloud ? 'animate-spin' : ''}`} />
            <span>Sync Cloud</span>
          </button>

          {itemsToDisplay.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('Clear all download history?')) {
                  clearHistory();
                  onClearHistory();
                  setCloudItems([]);
                  showToast('History cleared', 'info');
                }
              }}
              className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All</span>
            </button>
          )}
        </div>
      </div>

      {/* Cloud DB Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="glass-panel p-4 rounded-2xl border border-brand-500/30 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-500/20 text-cyan-400 flex items-center justify-center font-black">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Turso Cloud Database</p>
            <p className="text-lg font-black text-white font-mono flex items-center gap-1.5">
              <span>Connected</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            </p>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-black">
            <Cloud className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Multi-Device Items</p>
            <p className="text-lg font-black text-white font-mono">
              {cloudItems.length > 0 ? cloudItems.length : history.length} Synced
            </p>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-black">
            <Bookmark className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Saved Bookmarks</p>
            <p className="text-lg font-black text-white font-mono">{bookmarks.length}</p>
          </div>
        </div>

      </div>

      {/* Sub-Tabs: History vs Bookmarks */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        
        <div className="flex items-center gap-2 bg-surface-900 p-1 rounded-xl border border-white/10 text-xs font-bold">
          <button
            onClick={() => setActiveSubTab('history')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
              activeSubTab === 'history' ? 'bg-brand-600 text-white shadow-glow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Downloads History ({itemsToDisplay.length})</span>
          </button>
          
          <button
            onClick={() => setActiveSubTab('bookmarks')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
              activeSubTab === 'bookmarks' ? 'bg-brand-600 text-white shadow-glow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span>Saved Bookmarks ({bookmarks.length})</span>
          </button>
        </div>

        {/* Filter Chips */}
        {activeSubTab === 'history' && (
          <div className="flex items-center gap-1.5">
            {['ALL', 'VIDEO', 'AUDIO', 'PHOTO'].map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  filter === t 
                    ? 'bg-cyan-500 text-surface-950 shadow-glow-cyan' 
                    : 'glass-panel text-slate-400 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        )}

      </div>

      {/* HISTORY VIEW */}
      {activeSubTab === 'history' && (
        filteredHistory.length === 0 ? (
          <div className="glass-panel p-12 rounded-3xl text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-surface-900 border border-white/10 text-slate-500 mx-auto flex items-center justify-center">
              <Cloud className="w-8 h-8 text-cyan-400" />
            </div>
            <h3 className="text-base font-bold text-white">No Cloud History Yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Any video or photo you download from Android PWA, Chrome Extension, or Desktop will automatically appear here in your Turso Cloud database.
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
                  <div className="w-14 h-14 rounded-xl bg-surface-950 border border-white/10 overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {item.thumbnail ? (
                      <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
                    ) : item.media_type === 'audio' || item.type === 'audio' ? (
                      <Music className="w-6 h-6 text-cyan-400" />
                    ) : (
                      <Film className="w-6 h-6 text-brand-400" />
                    )}
                  </div>

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
                      {item.device_source && (
                        <span className="px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/20 text-[10px] font-medium flex items-center gap-1">
                          {item.device_source.includes('Android') ? <Smartphone className="w-3 h-3" /> : <Laptop className="w-3 h-3" />}
                          {item.device_source}
                        </span>
                      )}
                      {item.created_at && <span>• {new Date(item.created_at).toLocaleDateString()}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    onClick={() => handleBookmark(item)}
                    className="p-2.5 rounded-xl bg-surface-900 hover:bg-surface-800 border border-white/10 text-slate-400 hover:text-amber-300 transition-colors"
                    title="Bookmark to Turso"
                  >
                    <Bookmark className="w-4 h-4" />
                  </button>

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
                    <span>Extract</span>
                  </button>

                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-2.5 rounded-xl bg-surface-900 hover:bg-rose-900/30 border border-white/10 text-slate-500 hover:text-rose-400 transition-colors"
                    title="Delete item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            ))}
          </div>
        )
      )}

      {/* BOOKMARKS VIEW */}
      {activeSubTab === 'bookmarks' && (
        bookmarks.length === 0 ? (
          <div className="glass-panel p-12 rounded-3xl text-center space-y-3">
            <Bookmark className="w-12 h-12 text-amber-400 mx-auto" />
            <h3 className="text-base font-bold text-white">No Cloud Bookmarks Saved Yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Click the bookmark icon next to any extracted media or history item to save it permanently in your Turso Cloud Database.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {bookmarks.map((bm) => (
              <div
                key={bm.id}
                className="glass-panel p-4 rounded-2xl border border-white/5 hover:border-amber-500/40 transition-all flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0">
                    <Bookmark className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-white truncate">{bm.title}</h4>
                    <p className="text-xs text-slate-400 truncate">{bm.url}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onSelectUrl(bm.url)}
                    className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>

                  <button
                    onClick={async () => {
                      await deleteTursoBookmark(bm.id);
                      setBookmarks(prev => prev.filter(b => b.id !== bm.id));
                      showToast('Bookmark deleted', 'info');
                    }}
                    className="p-2 rounded-xl bg-surface-900 hover:bg-rose-900/30 text-slate-400 hover:text-rose-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

    </div>
  );
}
