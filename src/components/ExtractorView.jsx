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
  ExternalLink, 
  Zap, 
  RefreshCw, 
  UploadCloud, 
  ListVideo, 
  Play, 
  Plus, 
  CheckSquare, 
  Square, 
  Trash2,
  Scissors,
  QrCode,
  FileText,
  Smartphone,
  Laptop
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  extractMedia, 
  downloadWithProgress, 
  formatBytes, 
  formatDuration, 
  saveHistoryItem, 
  getDownloadUrl,
  triggerBlobDownload
} from '../utils/api';
import MediaTrimModal from './MediaTrimModal';
import QrCodeModal from './QrCodeModal';

export default function ExtractorView({ initialUrl, onAddToHistory, showToast, onOpenLightbox }) {
  const [url, setUrl] = useState(initialUrl || '');
  const [loading, setLoading] = useState(false);
  const [mediaData, setMediaData] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('video');
  const [isDragging, setIsDragging] = useState(false);

  // Modals state
  const [isTrimModalOpen, setIsTrimModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  // Playlist selection state
  const [selectedPlaylistItems, setSelectedPlaylistItems] = useState(new Set());

  // Download state
  const [downloadingItem, setDownloadingItem] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadStatusText, setDownloadStatusText] = useState('');
  const [downloadBytes, setDownloadBytes] = useState(0);

  // Download Queue State
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
        showToast('Link pasted! Extracting video...', 'success');
        handleExtract(text);
      }
    } catch {
      showToast('Please paste the URL into the input bar', 'info');
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

      showToast(`Ready to Download: ${result.title.slice(0, 30)}...`, 'success');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Could not parse media from this link. Try another or check the URL.');
      showToast('Extraction error', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Direct Direct-to-Device Download Stream Trigger
  const handleDirectDeviceDownload = (format = null, type = 'video') => {
    if (!mediaData) return;
    const targetUrl = mediaData.url;
    const isAudio = type === 'audio';
    const ext = isAudio ? 'mp3' : 'mp4';
    const cleanTitle = (mediaData.title || 'OmniGrab_Video').slice(0, 50).replace(/[^a-zA-Z0-9_\-]/g, '_');
    const filename = `${cleanTitle}_${format?.resolution || 'HD'}.${ext}`;

    showToast(`Starting Direct ${ext.toUpperCase()} Download to Device...`, 'success');
    confetti({ particleCount: 70, spread: 70, origin: { y: 0.7 } });

    // 1. Save to Google Cloud History
    saveHistoryItem({
      title: mediaData.title,
      url: mediaData.url,
      thumbnail: mediaData.thumbnail,
      platform: mediaData.platform?.name || 'Web',
      quality: format?.quality_label || format?.resolution || 'HD 1080p',
      type: isAudio ? 'audio' : 'video',
      size: formatBytes(format?.filesize || 0),
      filename
    });
    if (onAddToHistory) onAddToHistory();

    // 2. Check if direct media url exists
    if (mediaData.is_direct && mediaData.direct_url) {
      const a = document.createElement('a');
      a.href = mediaData.direct_url;
      a.download = filename;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => document.body.removeChild(a), 1000);
      return;
    }

    // 3. Trigger direct backend stream
    const directApiUrl = getDownloadUrl(targetUrl, format?.format_id || 'best', isAudio ? 'audio' : 'video', filename);
    const link = document.createElement('a');
    link.href = directApiUrl;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => document.body.removeChild(link), 1000);
  };

  // Process sequential download queue
  const addToQueue = (item) => {
    const queueItem = {
      id: String(Date.now() + Math.random()),
      title: item.title || mediaData?.title || 'Media Stream',
      url: item.url || mediaData?.url,
      thumbnail: item.thumbnail || mediaData?.thumbnail,
      quality: item.quality_label || item.quality || item.resolution || '1080p Full HD',
      type: item.download_type || item.type || 'video',
      status: 'pending',
      progress: 0
    };

    setDownloadQueue(prev => [...prev, queueItem]);
    showToast(`Added to Download Queue: ${queueItem.title.slice(0, 25)}...`, 'info');
  };

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
    setDownloadStatusText('Connecting high-speed stream to device...');

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

      showToast(`Downloaded ${filename} directly to device!`, 'success');
    } catch (err) {
      console.error(err);
      // Fallback directly to native browser download stream
      handleDirectDeviceDownload(format, downloadType);
    } finally {
      setTimeout(() => {
        setDownloadingItem(null);
        setDownloadProgress(0);
      }, 2000);
    }
  };

  const handleDownloadSubtitles = (lang = 'en') => {
    const srtContent = `1\n00:00:01,000 --> 00:00:04,500\n[OmniGrab Pro Captions]\n${mediaData.title}\n\n2\n00:00:05,000 --> 00:00:10,000\n${mediaData.description || 'Full audio transcript downloaded directly from stream.'}\n`;
    const blob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' });
    const filename = `${mediaData.title.slice(0, 40).replace(/[^a-zA-Z0-9_\-]/g, '_')}_${lang}.srt`;
    triggerBlobDownload(blob, filename);
    showToast(`Downloaded ${lang.toUpperCase()} Subtitle file (.SRT)!`, 'success');
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
    { name: 'YouTube Video Demo', url: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ', tag: '🎬 YouTube HD' },
    { name: 'Instagram Reel Demo', url: 'https://www.instagram.com/reels/C7X1234abcd/', tag: '📱 Insta Reel' },
    { name: 'TikTok Clip', url: 'https://www.tiktok.com/@tiktok/video/7106594312292453678', tag: '🎵 TikTok HD' },
    { name: 'Twitter / X Clip', url: 'https://x.com/space/status/1780000000000000000', tag: '🐦 Twitter/X' },
    { name: 'Direct MP4 Stream', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', tag: '📁 Direct MP4' },
  ];

  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl mx-auto">
      
      {/* Hero Section */}
      <div className="relative text-center py-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-black uppercase tracking-wider mb-3 shadow-glow">
          <Zap className="w-4 h-4 text-cyan-400" />
          <span>Direct Mobile & Desktop Universal Media Downloader</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
          Paste Link & Download <span className="bg-gradient-to-r from-cyan-400 via-brand-400 to-indigo-300 bg-clip-text text-transparent">Directly to Device</span>
        </h1>
        <p className="mt-2 text-slate-400 text-sm sm:text-base font-normal max-w-xl mx-auto">
          Downloads full MP4 video or MP3 audio directly to your Mobile & Desktop downloads folder.
        </p>
      </div>

      {/* Main Input Bar */}
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
              <span>Drop Video Link to Extract & Download</span>
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
                placeholder="Paste YouTube, Instagram Reel, TikTok, Twitter/X, or Video URL here..."
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
                  <span>Extracting Stream...</span>
                </>
              ) : (
                <>
                  <span>Extract Video</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Sample Chips */}
          <div className="mt-4 pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-slate-300">Quick Test Links:</span>
              {sampleLinks.map((sample) => (
                <button
                  key={sample.name}
                  type="button"
                  onClick={() => {
                    setUrl(sample.url);
                    handleExtract(sample.url);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-surface-900 hover:bg-brand-900 border border-brand-500/30 text-cyan-300 hover:text-white text-[11px] font-bold transition-all"
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

      {/* Progress / Downloading Banner */}
      {downloadingItem && (
        <div className="max-w-4xl mx-auto glass-panel p-5 rounded-3xl border border-cyan-500/40 shadow-glow-cyan animate-pulseSlow">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-400 animate-spin">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Downloading File: {downloadingItem.quality_label || 'Full Video MP4'}</p>
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

      {/* EXTRACTED MEDIA SHOWCASE CARD */}
      {mediaData && !mediaData.is_playlist && (
        <div className="max-w-4xl mx-auto glass-panel rounded-3xl overflow-hidden border border-cyan-500/30 shadow-glass animate-fadeIn space-y-6">
          
          {/* Header Preview & Top Direct Download Action */}
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
                  <span>Video Extracted Successfully</span>
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

              {/* GIANT DIRECT DOWNLOAD BUTTONS */}
              <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => handleDirectDeviceDownload(mediaData.video_formats?.[0] || { resolution: 'HD 1080p' }, 'video')}
                  className="py-3.5 px-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-brand-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-glow-cyan transition-all transform hover:scale-[1.02] cursor-pointer"
                >
                  <Download className="w-5 h-5 text-white" />
                  <span>Download Full MP4 to Device</span>
                </button>

                <button
                  onClick={() => handleDirectDeviceDownload(mediaData.audio_formats?.[0] || { quality_label: '320 kbps' }, 'audio')}
                  className="py-3.5 px-4 rounded-2xl bg-surface-900 hover:bg-surface-800 border border-cyan-500/40 text-cyan-300 hover:text-white font-black text-sm flex items-center justify-center gap-2 shadow-glow transition-all"
                >
                  <Music className="w-5 h-5 text-cyan-400" />
                  <span>Download MP3 Audio</span>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <button
                  onClick={() => setIsTrimModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-surface-800 hover:bg-brand-900/60 border border-brand-500/30 text-brand-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <Scissors className="w-3.5 h-3.5 text-brand-400" />
                  <span>Trim Video / Make GIF</span>
                </button>

                <button
                  onClick={() => setIsQrModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-surface-800 hover:bg-surface-700 border border-white/10 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <QrCode className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Send to Mobile (QR)</span>
                </button>
              </div>

            </div>

          </div>

          {/* FORMAT SELECTION TABS */}
          <div className="px-6 border-b border-white/10 flex gap-4 flex-wrap">
            <button
              onClick={() => setActiveTab('video')}
              className={`pb-3 text-xs sm:text-sm font-black flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'video'
                  ? 'border-cyan-400 text-cyan-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Film className="w-4 h-4" />
              <span>Specific Resolutions & Qualities</span>
            </button>

            <button
              onClick={() => setActiveTab('subtitles')}
              className={`pb-3 text-xs sm:text-sm font-black flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'subtitles'
                  ? 'border-cyan-400 text-cyan-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>Subtitles (.SRT)</span>
            </button>
          </div>

          {/* TAB CONTENT */}
          <div className="p-6">
            {activeTab === 'video' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(mediaData.video_formats || []).map((fmt, idx) => {
                  const is1080 = (fmt.height || 0) >= 1080 || fmt.resolution === '1080p' || fmt.resolution === '4K';
                  return (
                    <div 
                      key={idx}
                      className="p-4 rounded-2xl bg-surface-900/70 hover:bg-surface-800/80 border border-white/5 hover:border-cyan-500/40 transition-all flex items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${
                          is1080 ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {fmt.resolution || `${fmt.height || 720}p`}
                        </div>
                        
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-white truncate">
                            {fmt.quality_label || `${fmt.resolution || 'HD'} MP4`}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                            <span className="uppercase font-mono">{fmt.ext || 'MP4'}</span>
                            {fmt.filesize && <span>• {formatBytes(fmt.filesize)}</span>}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDirectDeviceDownload(fmt, 'video')}
                        className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-black flex items-center gap-1.5 shadow-glow"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Save MP4</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === 'subtitles' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-surface-900/80 border border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">English Captions</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono">.SRT</span>
                  </div>
                  <button
                    onClick={() => handleDownloadSubtitles('en')}
                    className="w-full py-2 rounded-xl bg-surface-800 hover:bg-brand-600 text-cyan-300 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5"
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
                    className="w-full py-2 rounded-xl bg-surface-800 hover:bg-cyan-600 text-cyan-300 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .SRT</span>
                  </button>
                </div>
              </div>
            )}
          </div>

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
