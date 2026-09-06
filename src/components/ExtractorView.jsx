import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Clipboard, 
  ArrowRight, 
  Sparkles, 
  Film, 
  Music, 
  Image as ImageIcon, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  ExternalLink, 
  Eye, 
  Heart, 
  Clock, 
  Zap, 
  FolderArchive, 
  RefreshCw, 
  Share2, 
  ShieldCheck, 
  UploadCloud, 
  Check, 
  ListVideo, 
  Play, 
  Plus, 
  CheckSquare, 
  Square, 
  Trash2,
  SlidersHorizontal,
  Pause,
  RotateCcw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  extractMedia, 
  downloadWithProgress, 
  formatBytes, 
  formatDuration, 
  saveHistoryItem, 
  createBatchZip,
  getDownloadUrl 
} from '../utils/api';

export default function ExtractorView({ initialUrl, onAddToHistory, showToast, onOpenLightbox }) {
  const [url, setUrl] = useState(initialUrl || '');
  const [loading, setLoading] = useState(false);
  const [mediaData, setMediaData] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('video');
  const [isDragging, setIsDragging] = useState(false);

  // Playlist selection state
  const [selectedPlaylistItems, setSelectedPlaylistItems] = useState(new Set());

  // Download state
  const [downloadingItem, setDownloadingItem] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadStatusText, setDownloadStatusText] = useState('');
  const [downloadBytes, setDownloadBytes] = useState(0);

  // Active Download Queue Manager State
  const [downloadQueue, setDownloadQueue] = useState([]);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  const [currentQueueIndex, setCurrentQueueIndex] = useState(0);

  useEffect(() => {
    if (initialUrl && initialUrl.trim()) {
      setUrl(initialUrl);
      handleExtract(initialUrl);
    }
  }, [initialUrl]);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text);
        showToast('Link pasted from clipboard!', 'success');
        handleExtract(text);
      }
    } catch {
      showToast('Clipboard permission needed or paste manually', 'info');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedText = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('text/uri-list');
    if (droppedText) {
      const urlMatch = droppedText.match(/(https?:\/\/[^\s]+)/g);
      const cleanUrl = urlMatch ? urlMatch[0] : droppedText;
      setUrl(cleanUrl);
      handleExtract(cleanUrl);
    }
  };

  const handleExtract = async (overrideUrl) => {
    const targetUrl = (overrideUrl || url).trim();
    if (!targetUrl) {
      showToast('Please enter or paste a valid link', 'error');
      return;
    }

    setLoading(true);
    setError(null);
    setMediaData(null);
    setSelectedPlaylistItems(new Set());

    try {
      const result = await extractMedia(targetUrl);
      setMediaData(result);

      if (result.is_playlist && result.playlist_items) {
        setActiveTab('playlist');
        setSelectedPlaylistItems(new Set(result.playlist_items.map(item => item.id)));
      } else if (result.carousel_items && result.carousel_items.length > 0 && (!result.video_formats || result.video_formats.length === 0)) {
        setActiveTab('carousel');
      } else if (result.video_formats && result.video_formats.length > 0) {
        setActiveTab('video');
      } else if (result.audio_formats && result.audio_formats.length > 0) {
        setActiveTab('audio');
      }

      showToast(`Analyzed: ${result.title.slice(0, 30)}...`, 'success');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Could not parse media from this link. Try another or check the URL.');
      showToast('Failed to extract media', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Add item to active download queue
  const addToQueue = (item) => {
    const queueItem = {
      id: String(Date.now() + Math.random()),
      title: item.title || mediaData?.title || 'Media Stream',
      url: item.url || mediaData?.url,
      thumbnail: item.thumbnail || mediaData?.thumbnail,
      quality: item.quality_label || item.quality || item.resolution || '1080p Full HD',
      type: item.download_type || item.type || 'video',
      status: 'pending', // pending, downloading, completed, error
      progress: 0
    };

    setDownloadQueue(prev => [...prev, queueItem]);
    showToast(`Added to Download Queue: ${queueItem.title.slice(0, 25)}...`, 'info');
  };

  // Add all selected playlist items to queue
  const addPlaylistToQueue = () => {
    if (!mediaData?.playlist_items) return;
    const selected = mediaData.playlist_items.filter(it => selectedPlaylistItems.has(it.id));
    if (selected.length === 0) {
      showToast('No items selected in playlist', 'error');
      return;
    }

    const newItems = selected.map(it => ({
      id: String(Date.now() + Math.random()),
      title: it.title,
      url: it.url,
      thumbnail: it.thumbnail,
      quality: '1080p Full HD',
      type: 'video',
      status: 'pending',
      progress: 0
    }));

    setDownloadQueue(prev => [...prev, ...newItems]);
    showToast(`Added ${newItems.length} playlist items to queue!`, 'success');
  };

  // Process sequential download queue
  const startProcessQueue = async () => {
    if (downloadQueue.length === 0 || isProcessingQueue) return;
    setIsProcessingQueue(true);

    const pendingItems = [...downloadQueue];
    for (let i = 0; i < pendingItems.length; i++) {
      if (pendingItems[i].status === 'completed') continue;

      setCurrentQueueIndex(i);
      setDownloadQueue(prev => prev.map((it, idx) => idx === i ? { ...it, status: 'downloading', progress: 10 } : it));

      try {
        const item = pendingItems[i];
        const filename = `${item.title.slice(0, 40).replace(/[^a-zA-Z0-9_\-]/g, '_')}.${item.type === 'audio' ? 'mp3' : 'mp4'}`;

        await downloadWithProgress(
          item.url,
          'best',
          item.type,
          filename,
          (p) => {
            setDownloadQueue(prev => prev.map((it, idx) => idx === i ? { ...it, progress: p.progress } : it));
          }
        );

        setDownloadQueue(prev => prev.map((it, idx) => idx === i ? { ...it, status: 'completed', progress: 100 } : it));

        saveHistoryItem({
          title: item.title,
          url: item.url,
          thumbnail: item.thumbnail,
          platform: 'Queue Batch',
          quality: item.quality,
          type: item.type,
          size: 'Streamed'
        });
        if (onAddToHistory) onAddToHistory();
      } catch (e) {
        setDownloadQueue(prev => prev.map((it, idx) => idx === i ? { ...it, status: 'error' } : it));
      }
    }

    setIsProcessingQueue(false);
    confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
    showToast('All queued downloads completed successfully!', 'success');
  };

  const handleStartDownload = async (format) => {
    if (!mediaData) return;

    const downloadType = format.download_type || 'video';
    const isAudio = downloadType === 'audio';
    const ext = format.ext || (isAudio ? 'mp3' : 'mp4');
    const filename = `${mediaData.title.slice(0, 50).replace(/[^a-zA-Z0-9_\-]/g, '_')}_${format.resolution || format.quality_label || 'OmniGrab'}.${ext}`;

    setDownloadingItem(format);
    setDownloadProgress(10);
    setDownloadStatusText('Starting download stream...');

    try {
      await downloadWithProgress(
        mediaData.url,
        format.format_id || 'best',
        downloadType,
        filename,
        (p) => {
          setDownloadProgress(p.progress);
          setDownloadStatusText(p.status);
          setDownloadBytes(p.bytes);
        }
      );

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.7 },
        colors: ['#6366f1', '#06b6d4', '#10b981', '#ffffff']
      });

      const histItem = {
        title: mediaData.title,
        url: mediaData.url,
        thumbnail: mediaData.thumbnail,
        platform: mediaData.platform?.name || 'Web',
        quality: format.quality_label || format.resolution || ext.toUpperCase(),
        type: isAudio ? 'audio' : 'video',
        size: formatBytes(downloadBytes || format.filesize || 0),
        filename
      };
      saveHistoryItem(histItem);
      if (onAddToHistory) onAddToHistory(histItem);

      showToast(`Saved ${filename}`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Download started via direct stream window', 'info');
      const directUrl = getDownloadUrl(mediaData.url, format.format_id || 'best', downloadType, filename);
      window.open(directUrl, '_blank');
    } finally {
      setTimeout(() => {
        setDownloadingItem(null);
        setDownloadProgress(0);
      }, 2500);
    }
  };

  const togglePlaylistItem = (id) => {
    const next = new Set(selectedPlaylistItems);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedPlaylistItems(next);
  };

  const toggleSelectAllPlaylist = () => {
    if (!mediaData?.playlist_items) return;
    if (selectedPlaylistItems.size === mediaData.playlist_items.length) {
      setSelectedPlaylistItems(new Set());
    } else {
      setSelectedPlaylistItems(new Set(mediaData.playlist_items.map(it => it.id)));
    }
  };

  const sampleLinks = [
    { name: 'YouTube 4K Demo', url: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ', tag: '🎬 4K Single' },
    { name: 'YouTube Playlist Demo', url: 'https://www.youtube.com/playlist?list=PL_sample_nature_4k', tag: '📚 Full Playlist' },
    { name: 'Instagram Reel Demo', url: 'https://www.instagram.com/reels/C7X1234abcd/', tag: '📱 Insta Reel' },
    { name: 'TikTok Viral Clip', url: 'https://www.tiktok.com/@tiktok/video/7106594312292453678', tag: '🎵 TikTok HQ' },
    { name: 'Twitter / X Clip', url: 'https://x.com/space/status/1780000000000000000', tag: '🐦 Twitter/X' },
    { name: 'Direct MP4 Stream', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', tag: '📁 Direct MP4' },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Hero Section */}
      <div className="relative text-center py-6 sm:py-8 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/30 text-cyan-300 text-xs font-bold uppercase tracking-wider mb-4 shadow-glow">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Universal 4K Videos, Playlists & Reels Engine</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
          Download <span className="bg-gradient-to-r from-brand-400 via-cyan-400 to-indigo-300 bg-clip-text text-transparent">Any Video, Playlist</span> & Photos
        </h1>
        <p className="mt-3 text-slate-400 text-sm sm:text-base font-normal max-w-xl mx-auto">
          Ultra-high speed single video extractor, batch playlist manager, and download queue with real-time Turso Cloud synchronization.
        </p>
      </div>

      {/* Main Input Bar with Drag-and-Drop */}
      <div className="max-w-4xl mx-auto">
        <div 
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`glass-panel-elevated p-3 sm:p-4 rounded-3xl relative overflow-hidden transition-all duration-300 ${
            isDragging ? 'border-cyan-400 shadow-glow-cyan scale-[1.01] bg-brand-950/40' : ''
          }`}
        >
          {isDragging && (
            <div className="absolute inset-0 z-20 bg-brand-950/90 backdrop-blur-md flex items-center justify-center gap-3 text-cyan-300 font-bold animate-fadeIn">
              <UploadCloud className="w-8 h-8 animate-bounce" />
              <span>Drop Video or Playlist Link to Analyze</span>
            </div>
          )}

          <form 
            onSubmit={(e) => { e.preventDefault(); handleExtract(); }}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
          >
            <div className="relative flex-1 flex items-center">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none" />
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste YouTube (Video/Playlist), Instagram Reel, TikTok, Twitter/X, or Web URL..."
                required
                className="w-full pl-12 pr-24 py-4 rounded-2xl glass-input text-white text-sm sm:text-base placeholder-slate-500 outline-none transition-all"
              />
              <button
                type="button"
                onClick={handlePaste}
                className="absolute right-3 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all"
                title="Paste from clipboard"
              >
                <Clipboard className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Paste</span>
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary-gradient px-8 py-4 rounded-2xl text-white font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-glow cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Analyzing Stream...</span>
                </>
              ) : (
                <>
                  <span>Extract Media</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Quick Test Chips */}
          <div className="mt-4 pt-4 border-t border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-slate-300">Quick Test Platforms:</span>
              {sampleLinks.map((sample) => (
                <button
                  key={sample.name}
                  type="button"
                  onClick={() => {
                    setUrl(sample.url);
                    handleExtract(sample.url);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-surface-900 hover:bg-brand-900 border border-brand-500/30 text-cyan-300 hover:text-white text-[11px] font-bold transition-all shadow-sm"
                >
                  {sample.tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ACTIVE DOWNLOAD QUEUE DASHBOARD (If items in queue) */}
      {downloadQueue.length > 0 && (
        <div className="max-w-4xl mx-auto glass-panel p-5 rounded-3xl border border-cyan-500/40 shadow-glow space-y-4 animate-fadeIn">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-black">
                <ListVideo className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Active Download Queue</span>
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-mono">
                    {downloadQueue.filter(i => i.status === 'completed').length} / {downloadQueue.length} Finished
                  </span>
                </h3>
                <p className="text-xs text-slate-400">Sequential background download processing engine</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={startProcessQueue}
                disabled={isProcessingQueue || downloadQueue.every(i => i.status === 'completed')}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-black text-xs flex items-center gap-2 shadow-glow-emerald disabled:opacity-50 transition-all"
              >
                {isProcessingQueue ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing ({currentQueueIndex + 1}/{downloadQueue.length})...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Start Queue Processing</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setDownloadQueue([])}
                disabled={isProcessingQueue}
                className="p-2 rounded-xl bg-surface-900 hover:bg-rose-900/30 text-slate-400 hover:text-rose-400 transition-colors"
                title="Clear Queue"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Queue Items List */}
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {downloadQueue.map((item, idx) => (
              <div 
                key={item.id}
                className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs transition-all ${
                  item.status === 'downloading' ? 'bg-cyan-950/40 border-cyan-500/40 shadow-glow-cyan' :
                  item.status === 'completed' ? 'bg-emerald-950/30 border-emerald-500/30 text-slate-300' :
                  item.status === 'error' ? 'bg-rose-950/30 border-rose-500/30 text-rose-200' :
                  'bg-surface-900/60 border-white/5 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-6 text-center font-mono text-[10px] text-slate-500">#{idx + 1}</span>
                  <div className="w-9 h-9 rounded-lg bg-surface-950 overflow-hidden flex-shrink-0">
                    {item.thumbnail ? <img src={item.thumbnail} alt="" className="w-full h-full object-cover" /> : <Film className="w-5 h-5 text-slate-600 m-2" />}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-white truncate">{item.title}</p>
                    <p className="text-[10px] text-slate-400">{item.quality} • {item.type.toUpperCase()}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  {item.status === 'downloading' && (
                    <span className="font-mono text-cyan-400 font-bold animate-pulse">{item.progress}%</span>
                  )}
                  {item.status === 'completed' && (
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Saved
                    </span>
                  )}
                  {item.status === 'pending' && (
                    <span className="text-[10px] text-slate-500 font-mono">Queued</span>
                  )}
                  {item.status === 'error' && (
                    <span className="text-[10px] text-rose-400 font-bold">Failed</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Message Box */}
      {error && (
        <div className="max-w-4xl mx-auto p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 flex items-start gap-3 text-rose-200 text-sm animate-shake">
          <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold">Extraction Note</p>
            <p className="text-xs text-rose-300/80 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Progress / Downloading Overlay Banner */}
      {downloadingItem && (
        <div className="max-w-4xl mx-auto glass-panel p-5 rounded-3xl border border-cyan-500/40 shadow-glow-cyan animate-pulseSlow">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-400 animate-spin">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Downloading: {downloadingItem.quality_label || 'High Res Media'}</p>
                <p className="text-xs text-cyan-300 font-mono">{downloadStatusText}</p>
              </div>
            </div>
            <span className="text-lg font-black text-cyan-400 font-mono">{downloadProgress}%</span>
          </div>

          <div className="w-full bg-surface-900 h-3 rounded-full overflow-hidden p-0.5 border border-white/10">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-brand-500 via-cyan-400 to-emerald-400 transition-all duration-300"
              style={{ width: `${downloadProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* PLAYLIST SECTION (When is_playlist is true) */}
      {mediaData && mediaData.is_playlist && (
        <div className="max-w-4xl mx-auto glass-panel rounded-3xl overflow-hidden border border-brand-500/30 shadow-glow space-y-6 animate-fadeIn">
          
          {/* Playlist Banner Header */}
          <div className="p-6 bg-gradient-to-r from-surface-900 via-surface-900/80 to-surface-900 border-b border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-surface-950 overflow-hidden border border-white/10 relative flex-shrink-0">
                {mediaData.thumbnail ? <img src={mediaData.thumbnail} alt="" className="w-full h-full object-cover" /> : <ListVideo className="w-8 h-8 text-cyan-400 m-6" />}
                <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/80 text-[9px] font-mono font-bold text-cyan-300">
                  PLAYLIST
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 text-xs font-bold">
                    {mediaData.platform?.name || 'YouTube'} Playlist
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">{mediaData.total_items} Videos</span>
                </div>
                <h2 className="text-xl font-black text-white mt-1">{mediaData.title}</h2>
                <p className="text-xs text-slate-400 mt-0.5">by {mediaData.uploader}</p>
              </div>
            </div>

            {/* Playlist Bulk Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-end">
              <button
                onClick={toggleSelectAllPlaylist}
                className="px-3.5 py-2.5 rounded-xl bg-surface-900 hover:bg-surface-800 border border-white/10 text-slate-300 text-xs font-bold flex items-center gap-1.5"
              >
                {selectedPlaylistItems.size === (mediaData.playlist_items?.length || 0) ? (
                  <CheckSquare className="w-4 h-4 text-cyan-400" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400" />
                )}
                <span>Select All</span>
              </button>

              <button
                onClick={addPlaylistToQueue}
                className="btn-primary-gradient px-5 py-2.5 rounded-xl text-white font-black text-xs flex items-center gap-2 shadow-glow"
              >
                <Plus className="w-4 h-4" />
                <span>Add Selected ({selectedPlaylistItems.size}) to Queue</span>
              </button>
            </div>
          </div>

          {/* Playlist Items Grid / List */}
          <div className="p-6 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Select Videos to Download:</span>
            </h3>

            <div className="space-y-2.5">
              {mediaData.playlist_items?.map((item) => {
                const isSelected = selectedPlaylistItems.has(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => togglePlaylistItem(item.id)}
                    className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-4 cursor-pointer ${
                      isSelected ? 'bg-surface-900/90 border-cyan-400 shadow-glow-cyan' : 'bg-surface-900/50 border-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="text-slate-400 hover:text-white">
                        {isSelected ? <CheckSquare className="w-5 h-5 text-cyan-400" /> : <Square className="w-5 h-5 text-slate-500" />}
                      </div>

                      <div className="w-16 h-10 rounded-lg bg-surface-950 overflow-hidden flex-shrink-0 border border-white/10 relative">
                        <img src={item.thumbnail} alt="" className="w-full h-full object-cover" />
                        <span className="absolute bottom-0.5 right-0.5 px-1 py-0.2 rounded bg-black/80 text-[8px] font-mono text-white">
                          {item.duration}
                        </span>
                      </div>

                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-bold text-white truncate">{item.title}</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">HD 1080p Video • Ready to Queue</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          addToQueue(item);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-bold flex items-center gap-1 shadow-sm"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Queue</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* SINGLE VIDEO SHOWCASE (When is_playlist is false) */}
      {mediaData && !mediaData.is_playlist && (
        <div className="max-w-4xl mx-auto glass-panel rounded-3xl overflow-hidden border border-white/15 shadow-glass animate-fadeIn">
          
          <div className="p-5 sm:p-6 bg-gradient-to-r from-surface-900/90 via-surface-900/60 to-surface-900/90 border-b border-white/10 flex flex-col md:flex-row gap-6 items-start">
            
            <div className="relative w-full md:w-64 aspect-video sm:aspect-[16/10] rounded-2xl overflow-hidden bg-surface-950 flex-shrink-0 border border-white/10 group">
              {mediaData.thumbnail ? (
                <img 
                  src={mediaData.thumbnail} 
                  alt={mediaData.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-600">
                  <Film className="w-12 h-12" />
                </div>
              )}
              
              {mediaData.duration && (
                <span className="absolute bottom-2 right-2 px-2 py-1 rounded-md bg-black/80 backdrop-blur-md text-white text-[11px] font-mono font-bold">
                  {formatDuration(mediaData.duration)}
                </span>
              )}

              <div className="absolute top-2 left-2 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-white text-xs font-bold flex items-center gap-1.5 border border-white/10">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: mediaData.platform?.color || '#6366f1' }}></span>
                <span>{mediaData.platform?.name || 'Media'}</span>
              </div>
            </div>

            <div className="flex-1 min-w-0 space-y-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs font-bold">
                  Single Video Ready
                </span>
                {mediaData.uploader && (
                  <span className="text-xs text-slate-400 font-semibold truncate">
                    by {mediaData.uploader}
                  </span>
                )}
              </div>

              <h2 className="text-lg sm:text-xl font-black text-white leading-snug line-clamp-2">
                {mediaData.title}
              </h2>

              {mediaData.description && (
                <p className="text-xs text-slate-400 line-clamp-2">
                  {mediaData.description}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  onClick={() => addToQueue({ title: mediaData.title, url: mediaData.url, quality: '1080p HD', type: 'video' })}
                  className="px-4 py-1.5 rounded-xl bg-surface-800 hover:bg-surface-700 border border-white/10 text-cyan-300 text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add to Download Queue</span>
                </button>
              </div>
            </div>

          </div>

          {/* Download Tabs Bar */}
          <div className="px-6 pt-4 border-b border-white/10 flex gap-4">
            {mediaData.video_formats && mediaData.video_formats.length > 0 && (
              <button
                onClick={() => setActiveTab('video')}
                className={`pb-3 text-xs sm:text-sm font-black flex items-center gap-2 border-b-2 transition-all ${
                  activeTab === 'video'
                    ? 'border-cyan-400 text-cyan-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Film className="w-4 h-4" />
                <span>Video Formats ({mediaData.video_formats.length})</span>
              </button>
            )}

            {mediaData.audio_formats && mediaData.audio_formats.length > 0 && (
              <button
                onClick={() => setActiveTab('audio')}
                className={`pb-3 text-xs sm:text-sm font-black flex items-center gap-2 border-b-2 transition-all ${
                  activeTab === 'audio'
                    ? 'border-cyan-400 text-cyan-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Music className="w-4 h-4" />
                <span>Audio Only ({mediaData.audio_formats.length})</span>
              </button>
            )}
          </div>

          {/* Tab Content Display */}
          <div className="p-6">
            {activeTab === 'video' && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {mediaData.video_formats.map((fmt, idx) => {
                    const is4K = (fmt.height || 0) >= 2160 || fmt.resolution === '4K';
                    const is1080 = (fmt.height || 0) >= 1080 || fmt.resolution === '1080p';
                    const isHD = (fmt.height || 0) >= 720 || fmt.resolution === '720p';
                    
                    return (
                      <div 
                        key={idx}
                        className="p-4 rounded-2xl bg-surface-900/70 hover:bg-surface-800/80 border border-white/5 hover:border-brand-500/40 transition-all flex items-center justify-between gap-3 group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${
                            is4K ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                            is1080 ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30' :
                            isHD ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' :
                            'bg-slate-800 text-slate-400'
                          }`}>
                            {fmt.resolution || `${fmt.height}p`}
                          </div>
                          
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-white truncate">
                              {fmt.quality_label || `${fmt.resolution} MP4`}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                              <span className="uppercase font-mono">{fmt.ext || 'MP4'}</span>
                              {fmt.filesize && <span>• {formatBytes(fmt.filesize)}</span>}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => addToQueue({ title: mediaData.title, url: mediaData.url, quality: fmt.quality_label, type: 'video' })}
                            className="p-2 rounded-xl bg-surface-800 hover:bg-surface-700 text-slate-300 hover:text-cyan-300"
                            title="Add to queue"
                          >
                            <Plus className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleStartDownload(fmt)}
                            disabled={downloadingItem !== null}
                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-cyan-600 hover:from-brand-500 hover:to-cyan-500 text-white text-xs font-black flex items-center gap-1.5 shadow-glow"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Save</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'audio' && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {mediaData.audio_formats.map((fmt, idx) => (
                    <div 
                      key={idx}
                      className="p-4 rounded-2xl bg-surface-900/70 hover:bg-surface-800/80 border border-white/5 hover:border-cyan-500/40 transition-all flex items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center justify-center font-black text-xs">
                          {fmt.ext ? fmt.ext.toUpperCase() : 'MP3'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-white truncate">
                            {fmt.quality_label || 'High Quality Audio'}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Stereo Audio • {fmt.abr ? `${fmt.abr} kbps` : 'High Fidelity'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => addToQueue({ title: mediaData.title, url: mediaData.url, quality: fmt.quality_label, type: 'audio' })}
                          className="p-2 rounded-xl bg-surface-800 hover:bg-surface-700 text-slate-300 hover:text-cyan-300"
                          title="Add audio to queue"
                        >
                          <Plus className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleStartDownload(fmt)}
                          disabled={downloadingItem !== null}
                          className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-black flex items-center gap-1.5 shadow-glow-cyan"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Save MP3</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
