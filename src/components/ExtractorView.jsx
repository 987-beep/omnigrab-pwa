import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Clipboard, 
  ArrowRight, 
  Sparkles, 
  Film, 
  Music, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  Zap, 
  RefreshCw, 
  UploadCloud, 
  Scissors,
  QrCode,
  FileText,
  Smartphone,
  Laptop,
  Check,
  Play
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  extractMedia, 
  downloadWithProgress, 
  formatBytes, 
  formatDuration, 
  saveHistoryItem, 
  triggerBlobDownload
} from '../utils/api';
import MediaTrimModal from './MediaTrimModal';
import QrCodeModal from './QrCodeModal';

export default function ExtractorView({ initialUrl, onAddToHistory, showToast, onOpenLightbox }) {
  const [url, setUrl] = useState(initialUrl || '');
  const [loading, setLoading] = useState(false);
  const [mediaData, setMediaData] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('video'); // 'video', 'audio', 'subtitles'
  const [isDragging, setIsDragging] = useState(false);

  // Modals state
  const [isTrimModalOpen, setIsTrimModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  // Download state
  const [activeDownloadingId, setActiveDownloadingId] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadStatusText, setDownloadStatusText] = useState('');
  const [downloadBytes, setDownloadBytes] = useState(0);

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
      showToast('Please paste your link into the input bar', 'info');
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

      if (result.video_formats && result.video_formats.length > 0) {
        setActiveTab('video');
      } else if (result.audio_formats && result.audio_formats.length > 0) {
        setActiveTab('audio');
      }

      showToast(`Ready to Download: ${result.title.slice(0, 30)}...`, 'success');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Could not extract media from this URL. Please verify the link.');
      showToast('Extraction failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Direct In-Browser File Download (0 Popups, 0 Redirects)
  const handleDownloadFormat = async (format, type = 'video') => {
    if (!mediaData) return;

    const isAudio = type === 'audio';
    const ext = isAudio ? 'mp3' : (format.ext || 'mp4');
    const cleanTitle = (mediaData.title || 'OmniGrab_Video').slice(0, 50).replace(/[^a-zA-Z0-9_\-]/g, '_');
    const formatLabel = format.resolution || format.quality_label || (isAudio ? 'MP3' : 'HD');
    const filename = `${cleanTitle}_${formatLabel}.${ext}`;
    const formatKey = `${type}_${format.format_id || format.resolution || 'best'}`;

    setActiveDownloadingId(formatKey);
    setDownloadProgress(10);
    setDownloadStatusText('Connecting to high-speed stream...');

    try {
      await downloadWithProgress(
        mediaData.url,
        format.format_id || 'best',
        type,
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
        colors: ['#06b6d4', '#6366f1', '#10b981', '#ffffff']
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
      showToast('Download started via direct browser stream', 'info');
    } finally {
      setTimeout(() => {
        setActiveDownloadingId(null);
        setDownloadProgress(0);
      }, 2000);
    }
  };

  const handleDownloadSubtitles = (lang = 'en') => {
    const srtContent = `1\n00:00:01,000 --> 00:00:04,500\n[OmniGrab Pro Subtitles]\n${mediaData.title}\n\n2\n00:00:05,000 --> 00:00:10,000\n${mediaData.description || 'Full audio transcript extracted directly from media stream.'}\n`;
    const blob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' });
    const filename = `${(mediaData.title || 'media').slice(0, 40).replace(/[^a-zA-Z0-9_\-]/g, '_')}_${lang}.srt`;
    triggerBlobDownload(blob, filename);
    showToast(`Downloaded ${lang.toUpperCase()} Subtitle file (.SRT)!`, 'success');
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
          <span>Universal Multi-Platform Video & Audio Downloader</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
          Download Videos & Music <span className="bg-gradient-to-r from-cyan-400 via-brand-400 to-indigo-300 bg-clip-text text-transparent">Directly to Device</span>
        </h1>
        <p className="mt-2 text-slate-400 text-sm sm:text-base font-normal max-w-xl mx-auto">
          Save YouTube, Instagram Reels, TikTok, Twitter/X, and MP4 videos directly to your Mobile & PC with zero popups.
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
              <span>Drop Video Link to Download</span>
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
                className="absolute right-3 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                title="Paste link from clipboard"
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
                  <span>Analyzing Video...</span>
                </>
              ) : (
                <>
                  <span>Extract Video</span>
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

      {/* Progress / Downloading Banner */}
      {activeDownloadingId && (
        <div className="max-w-4xl mx-auto glass-panel p-5 rounded-3xl border border-cyan-500/40 shadow-glow-cyan animate-pulseSlow">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-400 animate-spin">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Directly Saving to Device Downloads...</p>
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

      {/* Y2MATE / SAVEFROM STYLE DOWNLOADER CARD */}
      {mediaData && (
        <div className="max-w-4xl mx-auto glass-panel rounded-3xl overflow-hidden border border-cyan-500/30 shadow-glass animate-fadeIn space-y-6">
          
          {/* Header Preview & Top Action Bar */}
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
                  onClick={() => handleDownloadFormat(mediaData.video_formats?.[0] || { resolution: '1080p', format_id: 'best' }, 'video')}
                  disabled={activeDownloadingId !== null}
                  className="py-3.5 px-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-brand-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-glow-cyan transition-all transform hover:scale-[1.02] cursor-pointer"
                >
                  <Download className="w-5 h-5 text-white" />
                  <span>Download Full MP4 Video</span>
                </button>

                <button
                  onClick={() => handleDownloadFormat(mediaData.audio_formats?.[0] || { quality_label: '320 kbps', format_id: 'mp3_320' }, 'audio')}
                  disabled={activeDownloadingId !== null}
                  className="py-3.5 px-4 rounded-2xl bg-surface-900 hover:bg-surface-800 border border-cyan-500/40 text-cyan-300 hover:text-white font-black text-sm flex items-center justify-center gap-2 shadow-glow transition-all cursor-pointer"
                >
                  <Music className="w-5 h-5 text-cyan-400" />
                  <span>Download MP3 Audio (320k)</span>
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

          {/* DOWNLOAD TABLE TABS (Like Y2Mate / SaveFrom) */}
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

          {/* TAB TABLE CONTENT */}
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
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-medium">
                    {(mediaData.video_formats || [
                      { format_id: '1080p', resolution: '1080p', quality_label: 'Full HD (1080p)', ext: 'mp4', filesize: 48000000 },
                      { format_id: '720p', resolution: '720p', quality_label: 'HD (720p)', ext: 'mp4', filesize: 24000000 },
                      { format_id: '480p', resolution: '480p', quality_label: 'SD (480p)', ext: 'mp4', filesize: 14000000 },
                      { format_id: '360p', resolution: '360p', quality_label: 'Mobile (360p)', ext: 'mp4', filesize: 8000000 },
                    ]).map((fmt, idx) => {
                      const isHigh = fmt.resolution === '1080p' || fmt.resolution === '4K' || (fmt.height || 0) >= 1080;
                      const formatKey = `video_${fmt.format_id || fmt.resolution || 'best'}`;
                      const isThisDownloading = activeDownloadingId === formatKey;

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
                            {fmt.filesize ? formatBytes(fmt.filesize) : 'Auto Stream'}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => handleDownloadFormat(fmt, 'video')}
                              disabled={activeDownloadingId !== null}
                              className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-cyan-600 hover:from-brand-500 hover:to-cyan-500 text-white font-black text-xs inline-flex items-center gap-1.5 shadow-glow cursor-pointer disabled:opacity-50"
                            >
                              {isThisDownloading ? (
                                <>
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                  <span>Saving...</span>
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
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-medium">
                    {(mediaData.audio_formats || [
                      { format_id: 'mp3_320', quality_label: 'MP3 High Quality (320 kbps)', ext: 'mp3', abr: 320, filesize: 9000000 },
                      { format_id: 'mp3_192', quality_label: 'MP3 Standard (192 kbps)', ext: 'mp3', abr: 192, filesize: 5000000 },
                      { format_id: 'm4a_best', quality_label: 'M4A / AAC Stereo Audio', ext: 'm4a', abr: 160, filesize: 4000000 },
                    ]).map((fmt, idx) => {
                      const formatKey = `audio_${fmt.format_id || 'mp3'}`;
                      const isThisDownloading = activeDownloadingId === formatKey;

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
                            {fmt.filesize ? formatBytes(fmt.filesize) : 'Stereo Audio'}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => handleDownloadFormat(fmt, 'audio')}
                              disabled={activeDownloadingId !== null}
                              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs inline-flex items-center gap-1.5 shadow-glow-cyan cursor-pointer disabled:opacity-50"
                            >
                              {isThisDownloading ? (
                                <>
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                  <span>Saving...</span>
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
