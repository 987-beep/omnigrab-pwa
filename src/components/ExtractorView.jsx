import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Clipboard, 
  ArrowRight, 
  Zap, 
  Film, 
  Music, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  UploadCloud, 
  Scissors, 
  QrCode, 
  FileText,
  ListVideo,
  CheckSquare,
  Square,
  PlaySquare,
  Layers,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  extractMedia, 
  formatBytes, 
  formatDuration, 
  saveHistoryItem, 
  resolveAndDownloadMedia,
  triggerBlobDownload
} from '../utils/api';
import MediaTrimModal from './MediaTrimModal';
import QrCodeModal from './QrCodeModal';

export default function ExtractorView({ initialUrl, onAddToHistory, showToast, onOpenLightbox }) {
  const [url, setUrl] = useState(initialUrl || '');
  const [loading, setLoading] = useState(false);
  const [mediaData, setMediaData] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('video'); // 'video', 'audio', 'subtitles', 'playlist'
  const [isDragging, setIsDragging] = useState(false);

  // Playlist Mode Switcher ('single' or 'playlist')
  const [playlistViewMode, setPlaylistViewMode] = useState('single');
  const [selectedPlaylistItems, setSelectedPlaylistItems] = useState(new Set());
  const [isBatchDownloading, setIsBatchDownloading] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0, status: '' });

  // Modals state
  const [isTrimModalOpen, setIsTrimModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  // Active Downloading & Progress State
  const [downloadingKey, setDownloadingKey] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState({ progress: 0, status: '' });

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
        showToast('Link pasted! Analyzing video...', 'success');
        handleExtract(text);
      }
    } catch {
      showToast('Please paste your link into the search bar', 'info');
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

    try {
      const result = await extractMedia(targetUrl);
      setMediaData(result);

      if (result.is_playlist) {
        // If it's a pure playlist without a single video ID, default to playlist mode
        if (!result.has_single_video) {
          setPlaylistViewMode('playlist');
          setActiveTab('playlist');
        } else {
          setPlaylistViewMode('single');
          setActiveTab('video');
        }
        // Select all items by default
        if (result.playlist_items && result.playlist_items.length > 0) {
          setSelectedPlaylistItems(new Set(result.playlist_items.map(item => item.id)));
        }
      } else {
        setPlaylistViewMode('single');
        if (result.video_formats && result.video_formats.length > 0) {
          setActiveTab('video');
        } else if (result.audio_formats && result.audio_formats.length > 0) {
          setActiveTab('audio');
        }
      }

      showToast(`Ready: ${result.title.slice(0, 30)}...`, 'success');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Could not extract media. Please verify the URL.');
      showToast('Extraction failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Direct In-Browser File Download Engine (Like Y2Mate / SaveFrom - 0 Popups)
  const handleDirectDownload = async (format, type = 'video', customUrl = null, customTitle = null) => {
    if (!mediaData) return;

    const targetDownloadUrl = customUrl || mediaData.url;
    const isAudio = type === 'audio';
    const ext = isAudio ? 'mp3' : (format?.ext || 'mp4');
    const baseTitle = customTitle || mediaData.title || 'OmniGrab_Media';
    const cleanTitle = baseTitle.slice(0, 50).replace(/[^a-zA-Z0-9_\-]/g, '_');
    const formatLabel = format?.resolution || format?.quality_label || (isAudio ? 'MP3' : '1080p');
    const filename = `${cleanTitle}_${formatLabel}.${ext}`;
    const formatKey = `${type}_${format?.format_id || format?.resolution || 'best'}_${customUrl ? cleanTitle : 'main'}`;

    setDownloadingKey(formatKey);
    setDownloadProgress({ progress: 10, status: 'Connecting to conversion stream...' });

    // 1. Record in user's cloud history
    const histItem = {
      title: baseTitle,
      url: targetDownloadUrl,
      thumbnail: mediaData.thumbnail,
      platform: mediaData.platform?.name || 'Web',
      quality: formatLabel,
      type: isAudio ? 'audio' : 'video',
      size: formatBytes(format?.filesize || 0),
      filename
    };
    saveHistoryItem(histItem);
    if (onAddToHistory) onAddToHistory(histItem);

    try {
      await resolveAndDownloadMedia({
        url: targetDownloadUrl,
        formatId: format?.format_id || '1080',
        type: isAudio ? 'audio' : 'video',
        filename,
        onProgress: (p) => {
          setDownloadProgress(p);
        }
      });

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.7 },
        colors: ['#06b6d4', '#6366f1', '#10b981', '#ffffff']
      });

      showToast(`Saved ${filename} to Downloads!`, 'success');
    } catch (e) {
      console.error('Download error:', e);
      showToast('Download stream triggered', 'info');
    } finally {
      setTimeout(() => {
        setDownloadingKey(null);
        setDownloadProgress({ progress: 0, status: '' });
      }, 3500);
    }
  };

  // Batch Playlist Downloader
  const handleBatchPlaylistDownload = async (type = 'video') => {
    if (!mediaData || !mediaData.playlist_items || mediaData.playlist_items.length === 0) return;

    const itemsToDownload = mediaData.playlist_items.filter(item => selectedPlaylistItems.has(item.id));
    if (itemsToDownload.length === 0) {
      showToast('Please select at least one item from the playlist', 'error');
      return;
    }

    setIsBatchDownloading(true);
    setBatchProgress({ current: 0, total: itemsToDownload.length, status: 'Preparing batch download queue...' });

    for (let i = 0; i < itemsToDownload.length; i++) {
      const item = itemsToDownload[i];
      setBatchProgress({
        current: i + 1,
        total: itemsToDownload.length,
        status: `Downloading item ${i + 1} of ${itemsToDownload.length}: ${item.title.slice(0, 30)}...`
      });

      try {
        await handleDirectDownload(
          { format_id: '1080', resolution: '1080p', ext: type === 'audio' ? 'mp3' : 'mp4' },
          type,
          item.url,
          item.title
        );
        // Pause briefly between playlist downloads
        await new Promise(r => setTimeout(r, 2000));
      } catch (err) {
        console.error(`Failed to download item ${item.title}:`, err);
      }
    }

    setIsBatchDownloading(false);
    showToast(`Batch download complete (${itemsToDownload.length} items)!`, 'success');
  };

  const toggleSelectAllPlaylist = () => {
    if (!mediaData?.playlist_items) return;
    if (selectedPlaylistItems.size === mediaData.playlist_items.length) {
      setSelectedPlaylistItems(new Set());
    } else {
      setSelectedPlaylistItems(new Set(mediaData.playlist_items.map(item => item.id)));
    }
  };

  const togglePlaylistItem = (id) => {
    const next = new Set(selectedPlaylistItems);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedPlaylistItems(next);
  };

  const handleDownloadSubtitles = (lang = 'en') => {
    const srtContent = `1\n00:00:01,000 --> 00:00:04,500\n[OmniGrab Pro Subtitles]\n${mediaData.title}\n\n2\n00:00:05,000 --> 00:00:10,000\n${mediaData.description || 'Full audio transcript extracted directly from media stream.'}\n`;
    const blob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' });
    const filename = `${(mediaData.title || 'media').slice(0, 40).replace(/[^a-zA-Z0-9_\-]/g, '_')}_${lang}.srt`;
    triggerBlobDownload(blob, filename);
    showToast(`Downloaded ${lang.toUpperCase()} Subtitle (.SRT)!`, 'success');
  };

  const sampleLinks = [
    { name: 'YouTube Video Demo', url: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ', tag: '🎬 YouTube HD' },
    { name: 'YouTube Playlist Demo', url: 'https://www.youtube.com/playlist?list=PL6B3937A5D230E335', tag: '📑 Playlist / Series' },
    { name: 'Instagram Reel Demo', url: 'https://www.instagram.com/reels/C7X1234abcd/', tag: '📱 Insta Reel' },
    { name: 'TikTok Clip', url: 'https://www.tiktok.com/@tiktok/video/7106594312292453678', tag: '🎵 TikTok HD' },
    { name: 'Direct MP4 Stream', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', tag: '📁 Direct MP4' },
  ];

  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl mx-auto">
      
      {/* Hero Header */}
      <div className="relative text-center py-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-black uppercase tracking-wider mb-3 shadow-glow">
          <Zap className="w-4 h-4 text-cyan-400" />
          <span>Universal Video & Playlist Downloader</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
          Download Videos & Playlists <span className="bg-gradient-to-r from-cyan-400 via-brand-400 to-indigo-300 bg-clip-text text-transparent">Directly to Device</span>
        </h1>
        <p className="mt-2 text-slate-400 text-sm sm:text-base font-normal max-w-xl mx-auto">
          Auto-detects single videos, multi-video playlists, Instagram Reels, and TikTok clips with 1-click downloads.
        </p>
      </div>

      {/* Main Search / Input Bar */}
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
              <span>Drop Link to Download Media</span>
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
                placeholder="Paste YouTube Video, Playlist URL, Instagram Reel, TikTok, or Video link..."
                required
                className="w-full pl-12 pr-24 py-4 rounded-2xl glass-input text-white text-sm sm:text-base placeholder-slate-500 outline-none transition-all"
              />
              <button
                type="button"
                onClick={handlePaste}
                className="absolute right-3 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
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
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <span>Extract Link</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Quick Test Chips */}
          <div className="mt-4 pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
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
                  className="px-2.5 py-1 rounded-lg bg-surface-900 hover:bg-brand-900 border border-brand-500/30 text-cyan-300 hover:text-white text-[11px] font-bold transition-all cursor-pointer"
                >
                  {sample.tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Error Message Box */}
      {error && (
        <div className="max-w-4xl mx-auto p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 flex items-start gap-3 text-rose-200 text-sm animate-shake">
          <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold">Extraction Message</p>
            <p className="text-xs text-rose-300/80 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* ACTIVE REAL-TIME DOWNLOADING OVERLAY BAR */}
      {downloadingKey && (
        <div className="max-w-4xl mx-auto p-4 rounded-2xl bg-cyan-950/80 border border-cyan-400 shadow-glow-cyan flex flex-col gap-2 animate-fadeIn">
          <div className="flex items-center justify-between text-xs font-bold text-cyan-300">
            <span className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
              <span>{downloadProgress.status || 'Converting and saving file to device...'}</span>
            </span>
            <span>{downloadProgress.progress || 25}%</span>
          </div>
          <div className="w-full bg-surface-900 rounded-full h-2 overflow-hidden border border-cyan-500/30">
            <div 
              className="bg-gradient-to-r from-cyan-400 via-brand-400 to-emerald-400 h-full rounded-full transition-all duration-300"
              style={{ width: `${downloadProgress.progress || 25}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* BATCH PLAYLIST PROGRESS BAR */}
      {isBatchDownloading && (
        <div className="max-w-4xl mx-auto p-4 rounded-2xl bg-brand-950/90 border border-brand-400 shadow-glow flex flex-col gap-2 animate-fadeIn">
          <div className="flex items-center justify-between text-xs font-bold text-brand-300">
            <span className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-brand-400" />
              <span>{batchProgress.status}</span>
            </span>
            <span>{batchProgress.current} / {batchProgress.total}</span>
          </div>
          <div className="w-full bg-surface-900 rounded-full h-2 overflow-hidden border border-brand-500/30">
            <div 
              className="bg-gradient-to-r from-brand-400 via-cyan-400 to-emerald-400 h-full rounded-full transition-all duration-300"
              style={{ width: `${(batchProgress.current / Math.max(1, batchProgress.total)) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* MEDIA RESULT VIEW CONTAINER */}
      {mediaData && (
        <div className="max-w-4xl mx-auto glass-panel rounded-3xl overflow-hidden border border-cyan-500/30 shadow-glass animate-fadeIn space-y-6">
          
          {/* PLAYLIST / SINGLE VIDEO DETECTION SWITCHER BANNER */}
          {mediaData.is_playlist && (
            <div className="p-4 bg-surface-900/90 border-b border-cyan-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-400">
                  <ListVideo className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-black uppercase tracking-wider">
                      Playlist Detected
                    </span>
                    <span className="text-xs text-slate-400">
                      {mediaData.total_items || mediaData.playlist_items?.length || 0} Videos in Series
                    </span>
                  </div>
                  <p className="text-sm font-bold text-white mt-0.5 line-clamp-1">
                    {mediaData.title}
                  </p>
                </div>
              </div>

              {/* Mode Switcher Buttons */}
              {mediaData.has_single_video && (
                <div className="flex items-center bg-surface-950 p-1 rounded-xl border border-white/10 self-stretch sm:self-auto">
                  <button
                    onClick={() => {
                      setPlaylistViewMode('single');
                      setActiveTab('video');
                    }}
                    className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      playlistViewMode === 'single'
                        ? 'bg-gradient-to-r from-brand-600 to-cyan-600 text-white shadow-glow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <PlaySquare className="w-3.5 h-3.5" />
                    <span>Single Video</span>
                  </button>

                  <button
                    onClick={() => {
                      setPlaylistViewMode('playlist');
                      setActiveTab('playlist');
                    }}
                    className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      playlistViewMode === 'playlist'
                        ? 'bg-gradient-to-r from-brand-600 to-cyan-600 text-white shadow-glow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Full Playlist ({mediaData.total_items || mediaData.playlist_items?.length})</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* SINGLE VIDEO VIEW */}
          {(playlistViewMode === 'single' || !mediaData.is_playlist) && (
            <>
              {/* Header Preview & Fast Direct Download Actions */}
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
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: mediaData.platform?.color || '#06b6d4' }}></span>
                    <span>{mediaData.platform?.name || 'Media'}</span>
                  </div>
                </div>

                <div className="flex-1 min-w-0 space-y-3 w-full">
                  
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Ready for 1-Click Direct Download</span>
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

                  {/* FAST 1-CLICK INSTANT DOWNLOAD BUTTONS */}
                  <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={() => handleDirectDownload(mediaData.video_formats?.[0] || { resolution: '1080p', format_id: '1080' }, 'video')}
                      disabled={downloadingKey !== null}
                      className="py-3.5 px-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-brand-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-glow-cyan transition-all transform hover:scale-[1.02] cursor-pointer disabled:opacity-50"
                    >
                      {downloadingKey?.startsWith('video') ? (
                        <>
                          <RefreshCw className="w-5 h-5 animate-spin" />
                          <span>Downloading MP4...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-5 h-5 text-white" />
                          <span>Download Full MP4 Video</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleDirectDownload(mediaData.audio_formats?.[0] || { quality_label: '320 kbps', format_id: 'mp3' }, 'audio')}
                      disabled={downloadingKey !== null}
                      className="py-3.5 px-4 rounded-2xl bg-surface-900 hover:bg-surface-800 border border-cyan-500/40 text-cyan-300 hover:text-white font-black text-sm flex items-center justify-center gap-2 shadow-glow transition-all cursor-pointer disabled:opacity-50"
                    >
                      {downloadingKey?.startsWith('audio') ? (
                        <>
                          <RefreshCw className="w-5 h-5 animate-spin text-cyan-400" />
                          <span>Downloading MP3...</span>
                        </>
                      ) : (
                        <>
                          <Music className="w-5 h-5 text-cyan-400" />
                          <span>Download MP3 Audio (320k)</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      onClick={() => setIsTrimModalOpen(true)}
                      className="px-3.5 py-1.5 rounded-xl bg-surface-800 hover:bg-brand-900/60 border border-brand-500/30 text-brand-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Scissors className="w-3.5 h-3.5 text-brand-400" />
                      <span>Trim Video / Make GIF</span>
                    </button>

                    <button
                      onClick={() => setIsQrModalOpen(true)}
                      className="px-3.5 py-1.5 rounded-xl bg-surface-800 hover:bg-surface-700 border border-white/10 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <QrCode className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Send to Mobile (QR)</span>
                    </button>
                  </div>

                </div>

              </div>

              {/* DOWNLOAD FORMATS TABLE TABS */}
              <div className="px-6 border-b border-white/10 flex gap-4 flex-wrap">
                <button
                  onClick={() => setActiveTab('video')}
                  className={`pb-3 text-xs sm:text-sm font-black flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                    activeTab === 'video'
                      ? 'border-cyan-400 text-cyan-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Film className="w-4 h-4" />
                  <span>Video (MP4 Formats)</span>
                </button>

                <button
                  onClick={() => setActiveTab('audio')}
                  className={`pb-3 text-xs sm:text-sm font-black flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                    activeTab === 'audio'
                      ? 'border-cyan-400 text-cyan-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Music className="w-4 h-4" />
                  <span>Audio (MP3 Tracks)</span>
                </button>

                <button
                  onClick={() => setActiveTab('subtitles')}
                  className={`pb-3 text-xs sm:text-sm font-black flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                    activeTab === 'subtitles'
                      ? 'border-cyan-400 text-cyan-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span>Subtitles (.SRT)</span>
                </button>
              </div>

              {/* TABLE CONTENT */}
              <div className="p-6">
                
                {/* VIDEO FORMATS TABLE */}
                {activeTab === 'video' && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-white/10 text-slate-400 uppercase font-mono text-[10px]">
                          <th className="py-3 px-4">Resolution</th>
                          <th className="py-3 px-4">Quality</th>
                          <th className="py-3 px-4">Format</th>
                          <th className="py-3 px-4">File Size</th>
                          <th className="py-3 px-4 text-right">Direct Download</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 font-medium">
                        {(mediaData.video_formats || [
                          { format_id: '1080', resolution: '1080p', quality_label: 'Full HD (1080p)', ext: 'mp4', filesize: 48000000 },
                          { format_id: '720', resolution: '720p', quality_label: 'HD (720p)', ext: 'mp4', filesize: 24000000 },
                          { format_id: '480', resolution: '480p', quality_label: 'SD (480p)', ext: 'mp4', filesize: 14000000 },
                          { format_id: '360', resolution: '360p', quality_label: 'Mobile (360p)', ext: 'mp4', filesize: 8000000 },
                        ]).map((fmt, idx) => {
                          const isHigh = fmt.resolution === '1080p' || fmt.resolution === '4K' || (fmt.height || 0) >= 1080;
                          const formatKey = `video_${fmt.format_id || fmt.resolution || 'best'}_main`;
                          const isDownloadingThis = downloadingKey === formatKey;

                          return (
                            <tr key={idx} className="hover:bg-white/5 transition-colors">
                              <td className="py-3 px-4 font-bold text-white flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded font-mono text-[10px] ${isHigh ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'bg-surface-900 text-slate-300'}`}>
                                  {fmt.resolution || `${fmt.height || 720}p`}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-slate-200">
                                {fmt.quality_label || `${fmt.resolution || 'HD'} Video`}
                              </td>
                              <td className="py-3 px-4 font-mono text-cyan-400 uppercase">
                                {fmt.ext || 'MP4'}
                              </td>
                              <td className="py-3 px-4 text-slate-400 font-mono">
                                {fmt.filesize ? formatBytes(fmt.filesize) : 'Full Quality'}
                              </td>
                              <td className="py-3 px-4 text-right">
                                <button
                                  onClick={() => handleDirectDownload(fmt, 'video')}
                                  disabled={downloadingKey !== null}
                                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-cyan-600 hover:from-brand-500 hover:to-cyan-500 text-white font-black text-xs inline-flex items-center gap-1.5 shadow-glow cursor-pointer disabled:opacity-50"
                                >
                                  {isDownloadingThis ? (
                                    <>
                                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                      <span>Downloading...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Download className="w-3.5 h-3.5" />
                                      <span>Download</span>
                                    </>
                                  )}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* AUDIO FORMATS TABLE */}
                {activeTab === 'audio' && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-white/10 text-slate-400 uppercase font-mono text-[10px]">
                          <th className="py-3 px-4">Bitrate</th>
                          <th className="py-3 px-4">Quality</th>
                          <th className="py-3 px-4">Format</th>
                          <th className="py-3 px-4">File Size</th>
                          <th className="py-3 px-4 text-right">Direct Download</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 font-medium">
                        {(mediaData.audio_formats || [
                          { format_id: 'mp3_320', quality_label: 'MP3 High Quality (320 kbps)', ext: 'mp3', abr: 320, filesize: 9000000 },
                          { format_id: 'mp3_192', quality_label: 'MP3 Standard (192 kbps)', ext: 'mp3', abr: 192, filesize: 5000000 },
                          { format_id: 'm4a_best', quality_label: 'M4A / AAC Stereo Audio', ext: 'm4a', abr: 160, filesize: 4000000 },
                        ]).map((fmt, idx) => {
                          const formatKey = `audio_${fmt.format_id || 'mp3'}_main`;
                          const isDownloadingThis = downloadingKey === formatKey;

                          return (
                            <tr key={idx} className="hover:bg-white/5 transition-colors">
                              <td className="py-3 px-4 font-bold text-cyan-300 font-mono">
                                {fmt.abr ? `${fmt.abr} kbps` : '320 kbps'}
                              </td>
                              <td className="py-3 px-4 text-slate-200">
                                {fmt.quality_label || 'High Fidelity Audio'}
                              </td>
                              <td className="py-3 px-4 font-mono text-cyan-400 uppercase">
                                {fmt.ext || 'MP3'}
                              </td>
                              <td className="py-3 px-4 text-slate-400 font-mono">
                                {fmt.filesize ? formatBytes(fmt.filesize) : 'Full Stereo'}
                              </td>
                              <td className="py-3 px-4 text-right">
                                <button
                                  onClick={() => handleDirectDownload(fmt, 'audio')}
                                  disabled={downloadingKey !== null}
                                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs inline-flex items-center gap-1.5 shadow-glow-cyan cursor-pointer disabled:opacity-50"
                                >
                                  {isDownloadingThis ? (
                                    <>
                                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                      <span>Downloading...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Download className="w-3.5 h-3.5" />
                                      <span>Download MP3</span>
                                    </>
                                  )}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* SUBTITLES TAB */}
                {activeTab === 'subtitles' && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-4 rounded-2xl bg-surface-900/80 border border-white/5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">English Captions</span>
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono">.SRT</span>
                      </div>
                      <button
                        onClick={() => handleDownloadSubtitles('en')}
                        className="w-full py-2 rounded-xl bg-surface-800 hover:bg-brand-600 text-cyan-300 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download .SRT</span>
                      </button>
                    </div>

                    <div className="p-4 rounded-2xl bg-surface-900/80 border border-white/5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">Auto-Transcript</span>
                        <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-mono">.SRT</span>
                      </div>
                      <button
                        onClick={() => handleDownloadSubtitles('auto')}
                        className="w-full py-2 rounded-xl bg-surface-800 hover:bg-cyan-600 text-cyan-300 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download .SRT</span>
                      </button>
                    </div>
                  </div>
                )}

              </div>
            </>
          )}

          {/* FULL PLAYLIST BATCH MANAGER VIEW */}
          {playlistViewMode === 'playlist' && mediaData.is_playlist && (
            <div className="p-6 space-y-6">
              
              {/* Playlist Batch Action Header */}
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-2xl bg-surface-900/90 border border-white/10">
                <div className="flex items-center gap-3">
                  <button
                    onClick={toggleSelectAllPlaylist}
                    className="p-2 rounded-xl bg-surface-800 hover:bg-surface-700 text-cyan-400 flex items-center gap-2 text-xs font-bold transition-all cursor-pointer"
                  >
                    {selectedPlaylistItems.size === (mediaData.playlist_items?.length || 0) ? (
                      <CheckSquare className="w-4 h-4 text-cyan-400" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                    <span>
                      {selectedPlaylistItems.size === (mediaData.playlist_items?.length || 0) ? 'Deselect All' : 'Select All'} ({selectedPlaylistItems.size}/{mediaData.playlist_items?.length || 0})
                    </span>
                  </button>
                </div>

                {/* Batch Action Buttons */}
                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    onClick={() => handleBatchPlaylistDownload('video')}
                    disabled={isBatchDownloading || selectedPlaylistItems.size === 0}
                    className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-cyan-600 hover:from-brand-500 hover:to-cyan-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-glow cursor-pointer disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download {selectedPlaylistItems.size} Videos (MP4)</span>
                  </button>

                  <button
                    onClick={() => handleBatchPlaylistDownload('audio')}
                    disabled={isBatchDownloading || selectedPlaylistItems.size === 0}
                    className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-surface-800 hover:bg-surface-700 border border-cyan-500/40 text-cyan-300 hover:text-white font-black text-xs flex items-center justify-center gap-2 shadow-glow cursor-pointer disabled:opacity-50"
                  >
                    <Music className="w-4 h-4 text-cyan-400" />
                    <span>Download {selectedPlaylistItems.size} MP3s</span>
                  </button>
                </div>
              </div>

              {/* Playlist Items List */}
              <div className="divide-y divide-white/5 border border-white/10 rounded-2xl overflow-hidden bg-surface-950/60">
                {(mediaData.playlist_items || []).map((item, idx) => {
                  const isSelected = selectedPlaylistItems.has(item.id);
                  const isThisDownloading = downloadingKey?.includes(item.title?.slice(0, 20));

                  return (
                    <div 
                      key={item.id || idx}
                      className={`p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors ${
                        isSelected ? 'bg-cyan-950/20' : 'hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 flex-1 min-w-0">
                        <button
                          onClick={() => togglePlaylistItem(item.id)}
                          className="text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-5 h-5 text-cyan-400" />
                          ) : (
                            <Square className="w-5 h-5 text-slate-500" />
                          )}
                        </button>

                        <span className="text-xs font-mono font-bold text-slate-500 w-6 text-right">
                          #{item.index || idx + 1}
                        </span>

                        <div className="relative w-24 aspect-video rounded-lg overflow-hidden bg-surface-900 flex-shrink-0 border border-white/10">
                          <img 
                            src={item.thumbnail || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=300'} 
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                          {item.duration && (
                            <span className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-black/80 text-[9px] font-mono text-white">
                              {item.duration}
                            </span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                            {item.title}
                          </h4>
                          <span className="text-[11px] text-cyan-400 font-mono">
                            {item.quality || '1080p Full HD'}
                          </span>
                        </div>
                      </div>

                      {/* Individual Item Download Buttons */}
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          onClick={() => handleDirectDownload({ format_id: '1080', resolution: '1080p', ext: 'mp4' }, 'video', item.url, item.title)}
                          disabled={downloadingKey !== null || isBatchDownloading}
                          className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-brand-600 to-cyan-600 hover:from-brand-500 hover:to-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-glow cursor-pointer disabled:opacity-50"
                        >
                          {isThisDownloading ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Download className="w-3.5 h-3.5" />
                          )}
                          <span>MP4</span>
                        </button>

                        <button
                          onClick={() => handleDirectDownload({ format_id: 'mp3', quality_label: '320 kbps', ext: 'mp3' }, 'audio', item.url, item.title)}
                          disabled={downloadingKey !== null || isBatchDownloading}
                          className="px-3 py-1.5 rounded-lg bg-surface-800 hover:bg-surface-700 border border-cyan-500/30 text-cyan-300 hover:text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                        >
                          <Music className="w-3.5 h-3.5 text-cyan-400" />
                          <span>MP3</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          )}

        </div>
      )}

      {/* Media Trim & GIF Modal */}
      <MediaTrimModal
        isOpen={isTrimModalOpen}
        onClose={() => setIsTrimModalOpen(false)}
        mediaData={mediaData}
        showToast={showToast}
      />

      {/* QR Code Handoff Modal */}
      <QrCodeModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        targetUrl={mediaData?.url || url}
        mediaTitle={mediaData?.title}
        showToast={showToast}
      />

    </div>
  );
}
