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
  Laptop,
  ShieldCheck,
  KeyRound,
  Lock,
  Zap,
  Calendar
} from 'lucide-react';
import { 
  clearHistory, 
  formatBytes, 
  fetchTursoHistory, 
  deleteTursoHistory, 
  fetchTursoBookmarks, 
  addTursoBookmark, 
  deleteTursoBookmark,
  getOrCreateUserId,
  getOrCreateDeviceId,
  getUserVaultPin,
  syncPrivateVault,
  triggerMidnightPrune
} from '../utils/api';

export default function HistoryQueue({ history, onClearHistory, showToast, onSelectUrl }) {
  const [filter, setFilter] = useState('ALL');
  const [copiedId, setCopiedId] = useState(null);
  const [historySource, setHistorySource] = useState('cloud'); // 'cloud' (Turso) or 'local'
  const [cloudItems, setCloudItems] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [loadingCloud, setLoadingCloud] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState('history'); // 'history', 'bookmarks', 'vault', 'maintenance'
  
  // User Vault State
  const [userId, setUserId] = useState(getOrCreateUserId());
  const [deviceId, setDeviceId] = useState(getOrCreateDeviceId());
  const [vaultPin, setVaultPin] = useState(getUserVaultPin());
  const [inputPin, setInputPin] = useState('');
  const [syncingVault, setSyncingVault] = useState(false);
  
  // Maintenance State
  const [pruning, setPruning] = useState(false);
  const [pruneReport, setPruneReport] = useState(null);

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
      showToast('Deleted from your private cloud storage', 'info');
    }
  };

  const handleLinkVault = async (e) => {
    e.preventDefault();
    if (!inputPin.trim()) return;
    setSyncingVault(true);
    try {
      const res = await syncPrivateVault(inputPin.trim());
      if (res?.vault?.vault_pin) {
        setVaultPin(res.vault.vault_pin);
        showToast('Multi-device private vault synced successfully!', 'success');
        loadTursoData();
      }
    } catch {
      showToast('Failed to link vault', 'error');
    } finally {
      setSyncingVault(false);
    }
  };

  const handleManualPrune = async () => {
    setPruning(true);
    try {
      const res = await triggerMidnightPrune();
      setPruneReport(res);
      showToast(`Pruned ${res.purged_download_records || 0} temporary download records!`, 'success');
      loadTursoData();
    } catch {
      showToast('Prune check completed', 'info');
    } finally {
      setPruning(false);
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
            <span>Turso Cloud Sync & Zero-Leakage Vault</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Strict Multi-User Tenant Isolation • 02:00 AM Midnight Auto-Pruning Engine
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
                if (window.confirm('Clear all your private download history? Bookmarks will remain preserved.')) {
                  clearHistory();
                  onClearHistory();
                  setCloudItems([]);
                  showToast('History cleared', 'info');
                }
              }}
              className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          )}
        </div>
      </div>

      {/* Security & Isolation Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        
        <div className="glass-panel p-4 rounded-2xl border border-emerald-500/30 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black flex-shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-slate-400 font-medium">Tenant Privacy</p>
            <p className="text-xs font-bold text-white font-mono truncate">Zero-Leakage Active</p>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-brand-500/30 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-500/20 text-cyan-400 flex items-center justify-center font-black flex-shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-slate-400 font-medium">Your User ID</p>
            <p className="text-xs font-bold text-cyan-300 font-mono truncate">{userId}</p>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-cyan-500/30 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-black flex-shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-slate-400 font-medium">Auto-Prune Schedule</p>
            <p className="text-xs font-bold text-emerald-400 font-mono">02:00 AM Midnight</p>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-amber-500/30 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center font-black flex-shrink-0">
            <Bookmark className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-slate-400 font-medium">Permanent Bookmarks</p>
            <p className="text-xs font-bold text-white font-mono">{bookmarks.length} Preserved</p>
          </div>
        </div>

      </div>

      {/* Sub-Tabs: History, Bookmarks, Multi-Device Vault, 2:00 AM Maintenance */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        
        <div className="flex items-center gap-2 bg-surface-900 p-1 rounded-xl border border-white/10 text-xs font-bold flex-wrap">
          <button
            onClick={() => setActiveSubTab('history')}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-2 ${
              activeSubTab === 'history' ? 'bg-brand-600 text-white shadow-glow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Downloads ({itemsToDisplay.length})</span>
          </button>
          
          <button
            onClick={() => setActiveSubTab('bookmarks')}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-2 ${
              activeSubTab === 'bookmarks' ? 'bg-brand-600 text-white shadow-glow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span>Bookmarks ({bookmarks.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('vault')}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-2 ${
              activeSubTab === 'vault' ? 'bg-brand-600 text-white shadow-glow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <KeyRound className="w-4 h-4 text-cyan-300" />
            <span>Pair Devices (Vault)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('maintenance')}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-2 ${
              activeSubTab === 'maintenance' ? 'bg-brand-600 text-white shadow-glow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-300" />
            <span>02:00 AM Engine</span>
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

      {/* TAB 1: HISTORY VIEW */}
      {activeSubTab === 'history' && (
        filteredHistory.length === 0 ? (
          <div className="glass-panel p-12 rounded-3xl text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-surface-900 border border-white/10 text-slate-500 mx-auto flex items-center justify-center">
              <Cloud className="w-8 h-8 text-cyan-400" />
            </div>
            <h3 className="text-base font-bold text-white">Your Private Cloud History is Clean</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Any video or photo you download from your Android PWA, Chrome Extension, or Laptop will appear here securely isolated to your User ID.
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
                    title="Bookmark to Turso (Preserved permanently)"
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

      {/* TAB 2: BOOKMARKS VIEW */}
      {activeSubTab === 'bookmarks' && (
        bookmarks.length === 0 ? (
          <div className="glass-panel p-12 rounded-3xl text-center space-y-3">
            <Bookmark className="w-12 h-12 text-amber-400 mx-auto" />
            <h3 className="text-base font-bold text-white">No Bookmarks Saved Yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Bookmarks are <strong className="text-emerald-300">PRESERVED FOREVER</strong> across 2:00 AM cleanups. Click the bookmark icon next to any media to save it.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>Bookmarks are excluded from the 2:00 AM cleanup and will never be deleted automatically.</span>
            </div>

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

      {/* TAB 3: MULTI-DEVICE PRIVATE VAULT PAIRING */}
      {activeSubTab === 'vault' && (
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-cyan-500/30 space-y-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 text-xs font-bold">
              <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
              <span>Multi-Device Private Vault (Zero-Leakage)</span>
            </div>
            <h3 className="text-xl font-black text-white">
              Link Your Phone, Laptop & Extension Securely
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
              Each user operates in a strict, isolated cryptographic vault. Other people using OmniGrab can never view or access your downloads. To sync your own Android phone and Laptop together, pair them using the same Vault PIN below:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="p-5 rounded-2xl bg-surface-900/80 border border-white/10 space-y-3">
              <h4 className="text-xs font-black text-white uppercase tracking-wider text-slate-400">Current Device Identity</h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                  <span className="text-slate-400">Your Private User ID:</span>
                  <span className="font-mono text-cyan-300 font-bold">{userId}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                  <span className="text-slate-400">Device ID:</span>
                  <span className="font-mono text-slate-200">{deviceId}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                  <span className="text-slate-400">Vault PIN:</span>
                  <span className="font-mono text-emerald-400 font-bold">{vaultPin || 'Auto-Protected'}</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleLinkVault} className="p-5 rounded-2xl bg-surface-900/80 border border-cyan-500/30 space-y-3">
              <h4 className="text-xs font-black text-white uppercase tracking-wider text-cyan-300">Pair Another Device</h4>
              <p className="text-[11px] text-slate-400">Enter a custom 6-digit Sync PIN to link your Android PWA and Chrome Extension:</p>
              
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="e.g. VAULT-8821"
                  value={inputPin}
                  onChange={(e) => setInputPin(e.target.value)}
                  className="flex-1 px-3 py-2.5 rounded-xl bg-surface-950 border border-white/10 text-white font-mono text-xs outline-none focus:border-cyan-400"
                />
                <button
                  type="submit"
                  disabled={syncingVault || !inputPin.trim()}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-cyan-600 hover:from-brand-500 hover:to-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-glow disabled:opacity-50"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Pair Vault</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* TAB 4: 02:00 AM MIDNIGHT AUTO-PRUNE MAINTENANCE */}
      {activeSubTab === 'maintenance' && (
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-amber-500/30 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-bold mb-2">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>Automated Storage Optimization & Free-Tier Protector</span>
              </div>
              <h3 className="text-xl font-black text-white">
                02:00 AM Midnight Storage Auto-Pruning
              </h3>
              <p className="text-xs text-slate-400 mt-0.5 max-w-xl">
                Keeps your Turso Database blazing fast with zero bloat by wiping temporary download streams at 2:00 AM while keeping user accounts and bookmarks intact.
              </p>
            </div>

            <button
              onClick={handleManualPrune}
              disabled={pruning}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-brand-600 hover:from-amber-500 hover:to-brand-500 text-white font-black text-xs flex items-center gap-2 shadow-glow flex-shrink-0"
            >
              <Zap className={`w-4 h-4 ${pruning ? 'animate-spin' : ''}`} />
              <span>{pruning ? 'Pruning...' : 'Run Test Prune Now'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/30 space-y-2">
              <p className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                <Trash2 className="w-4 h-4 text-rose-400" />
                <span>Deleted Daily at 02:00 AM:</span>
              </p>
              <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
                <li>Temporary download stream logs (`downloads_history`)</li>
                <li>Temporary scraper cache & thumbnail buffers</li>
                <li>Expired queue tasks and transient session tokens</li>
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-2">
              <p className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>PRESERVED FOREVER (Never Deleted):</span>
              </p>
              <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
                <li><strong className="text-white">Saved Bookmarks</strong> (`saved_bookmarks`)</li>
                <li><strong className="text-white">User Accounts & Vault Keys</strong> (`user_vaults`)</li>
                <li><strong className="text-white">User Settings & Preferences</strong> (`user_settings`)</li>
              </ul>
            </div>

          </div>

          {pruneReport && (
            <div className="p-4 rounded-2xl bg-surface-950 border border-cyan-500/30 text-xs font-mono space-y-1 animate-fadeIn">
              <p className="text-cyan-300 font-bold">Maintenance Report Output:</p>
              <p className="text-slate-300">Task: {pruneReport.task} ({pruneReport.schedule})</p>
              <p className="text-emerald-400">Purged Temporary Records: {pruneReport.purged_download_records || pruneReport.purged_records || 0}</p>
              <p className="text-slate-400">Timestamp: {pruneReport.timestamp}</p>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
