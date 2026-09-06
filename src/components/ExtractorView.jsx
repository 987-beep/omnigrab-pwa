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
  ListVideo
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
  const [activeTab, setActiveTab] = useState('video'); // video, audio, carousel, playlist
  const [isDragging, setIsDragging] = useState(false);

  // Download state
  const [downloadingItem, setDownloadingItem] = useState(null);
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

    try {
      const result = await extractMedia(targetUrl);
      setMediaData(result);

      if (result.carousel_items && result.carousel_items.length > 0 && (!result.video_formats || result.video_formats.length === 0)) {
        setActiveTab('carousel');
      } else if (result.video_formats && result.video_formats.length > 0) {
        setActiveTab('video');
      } else if (result.audio_formats && result.audio_formats.length > 0) {
        setActiveTab('audio');
      }

      showToast(`Extracted: ${result.title.slice(0, 30)}...`, 'success');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Could not parse media from this link. Try another or check the URL.');
      showToast('Failed to extract media', 'error');
    } finally {
      setLoading(false);
    }
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
      // Trigger native chrome extension if installed
      if (document.documentElement.getAttribute('data-omnigrab-extension-active') === 'true') {
        window.postMessage({
          type: 'OMNIGRAB_PWA_DOWNLOAD',
          url: mediaData.url,
          mediaType: isAudio ? 'Audio' : 'Video'
        }, '*');
      }

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
      showToast('Download interrupted. Falling back to direct stream...', 'error');
      const directUrl = getDownloadUrl(mediaData.url, format.format_id || 'best', downloadType, filename);
      window.open(directUrl, '_blank');
    } finally {
      setTimeout(() => {
        setDownloadingItem(null);
        setDownloadProgress(0);
      }, 2500);
    }
  };

  const handleBatchDownloadCarousel = async () => {
    if (!mediaData || !mediaData.carousel_items || mediaData.carousel_items.length === 0) return;

    setDownloadProgress(20);
    setDownloadStatusText('Packaging photos into high-res ZIP...');
    setDownloadingItem({ quality_label: 'Batch ZIP Archive' });

    try {
      const items = mediaData.carousel_items.map((it, idx) => ({
        url: it.url || it.thumbnail,
        filename: `${mediaData.title.slice(0, 30).replace(/[^a-zA-Z0-9_\-]/g, '_')}_photo_${idx+1}.${it.ext || 'jpg'}`
      }));

      await createBatchZip(items, `${mediaData.title.slice(0, 30)}_Photos.zip`);

      confetti({ particleCount: 60, spread: 60, origin: { y: 0.7 } });
      showToast('Batch photo ZIP downloaded successfully!', 'success');
    } catch (e) {
      showToast('Batch zip failed. Please download images individually.', 'error');
    } finally {
      setTimeout(() => {
        setDownloadingItem(null);
        setDownloadProgress(0);
      }, 2000);
    }
  };

  const sampleLinks = [
    { name: 'YouTube 4K Demo', url: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ', tag: '4K HDR' },
    { name: 'Instagram Reel Demo', url: 'https://www.instagram.com/reels/C7X1234abcd/', tag: 'Reels' },
    { name: 'TikTok Viral Clip', url: 'https://www.tiktok.com/@tiktok/video/7106594312292453678', tag: 'No Watermark' },
    { name: 'Direct MP4 Stream', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', tag: 'Direct' },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Hero Section */}
      <div className="relative text-center py-6 sm:py-8 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/30 text-cyan-300 text-xs font-bold uppercase tracking-wider mb-4 shadow-glow">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Universal High-Speed Media Extractor</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
          Download <span className="bg-gradient-to-r from-brand-400 via-cyan-400 to-indigo-300 bg-clip-text text-transparent">Any Video, Photo</span> & Audio
        </h1>
        <p className="mt-3 text-slate-400 text-sm sm:text-base font-normal max-w-xl mx-auto">
          Ultra-high speed 4K, 1080p Full HD, Instagram Reels, TikTok with no watermark, Twitter/X, and photo carousels in one click.
        </p>
      </div>

      {/* Main Glassmorphic Input Bar with Drag-and-Drop Zone */}
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
              <span>Drop Video or Photo Link to Extract Instantly</span>
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
                placeholder="Paste video, reel, post, image, or website URL here..."
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

          {/* Quick Supported Chips */}
          <div className="mt-4 pt-4 border-t border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-slate-300">Platforms:</span>
              {['YouTube 4K', 'Instagram Reels', 'TikTok HQ', 'Twitter/X', 'Pinterest', 'Reddit', 'Facebook', 'Direct Streams'].map((tag) => (
                <span key={tag} className="px-2 py-0.5 rounded-md bg-surface-900 border border-white/5 text-[11px] text-slate-300 font-medium">
                  {tag}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-slate-500 text-[11px]">Test:</span>
              {sampleLinks.map((sample) => (
                <button
                  key={sample.name}
                  type="button"
                  onClick={() => {
                    setUrl(sample.url);
                    handleExtract(sample.url);
                  }}
                  className="px-2 py-0.5 rounded-md bg-brand-950/60 hover:bg-brand-900 border border-brand-500/30 text-cyan-300 text-[10px] font-bold transition-all"
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
            <p className="font-bold">Extraction Error</p>
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

      {/* Extraction Result Showcase Card */}
      {mediaData && (
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
                  Ready to Save
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

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                {mediaData.views && (
                  <span className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5 text-slate-500" />
                    <span>{Number(mediaData.views).toLocaleString()} views</span>
                  </span>
                )}
                {mediaData.likes && (
                  <span className="flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5 text-rose-500" />
                    <span>{Number(mediaData.likes).toLocaleString()} likes</span>
                  </span>
                )}
                <a 
                  href={mediaData.url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
                >
                  <span>Original Link</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
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

            {mediaData.carousel_items && mediaData.carousel_items.length > 0 && (
              <button
                onClick={() => setActiveTab('carousel')}
                className={`pb-3 text-xs sm:text-sm font-black flex items-center gap-2 border-b-2 transition-all ${
                  activeTab === 'carousel'
                    ? 'border-cyan-400 text-cyan-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <ImageIcon className="w-4 h-4" />
                <span>Photos & Gallery ({mediaData.carousel_items.length})</span>
              </button>
            )}
          </div>

          {/* Tab Content Display */}
          <div className="p-6">
            
            {activeTab === 'video' && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {mediaData.video_formats.map((fmt, idx) => {
                    const is4K = (fmt.height || 0) >= 2160;
                    const is1080 = (fmt.height || 0) >= 1080;
                    const isHD = (fmt.height || 0) >= 720;
                    
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
                              {fmt.fps && <span>• {fmt.fps} FPS</span>}
                              {fmt.filesize && <span>• {formatBytes(fmt.filesize)}</span>}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleStartDownload(fmt)}
                          disabled={downloadingItem !== null}
                          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-cyan-600 hover:from-brand-500 hover:to-cyan-500 text-white text-xs font-black flex items-center gap-1.5 shadow-glow group-hover:scale-105 transition-all flex-shrink-0"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Save</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'audio' && (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-brand-500/10 border border-brand-500/20 text-xs text-brand-300 flex items-center gap-2 mb-4">
                  <Music className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                  <span>Converts high-fidelity audio directly into standard MP3 or M4A format on download.</span>
                </div>

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
                            Audio Stream • {fmt.abr ? `${fmt.abr} kbps` : 'Stereo Audio'}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleStartDownload(fmt)}
                        disabled={downloadingItem !== null}
                        className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-black flex items-center gap-1.5 shadow-glow-cyan transition-all flex-shrink-0"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Save MP3</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'carousel' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <p className="text-xs text-slate-400">
                    Found <span className="font-bold text-white">{mediaData.carousel_items.length}</span> high-resolution images/items:
                  </p>
                  
                  <button
                    onClick={handleBatchDownloadCarousel}
                    disabled={downloadingItem !== null}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white text-xs font-black flex items-center gap-2 shadow-glow-emerald transition-all"
                  >
                    <FolderArchive className="w-4 h-4" />
                    <span>Download All as ZIP</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {mediaData.carousel_items.map((item, idx) => (
                    <div 
                      key={idx}
                      className="group relative rounded-2xl overflow-hidden bg-surface-950 border border-white/10 aspect-square"
                    >
                      <img 
                        src={item.thumbnail || item.url} 
                        alt={item.title || `Photo ${idx+1}`}
                        className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-300 cursor-pointer"
                        onClick={() => onOpenLightbox && onOpenLightbox(item.url || item.thumbnail, item.title)}
                      />
                      
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                        <span className="text-[10px] font-bold text-white/80 self-end px-2 py-0.5 rounded bg-black/60">
                          #{idx + 1}
                        </span>
                        
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => onOpenLightbox && onOpenLightbox(item.url || item.thumbnail, item.title)}
                            className="flex-1 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-[11px] font-bold flex items-center justify-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            <span>View</span>
                          </button>
                          
                          <a
                            href={item.url || item.thumbnail}
                            download={`photo_${idx+1}.jpg`}
                            className="flex-1 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-bold flex items-center justify-center gap-1"
                          >
                            <Download className="w-3 h-3" />
                            <span>Save</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>
      )}

      {/* Highlights Grid */}
      <div className="max-w-5xl mx-auto pt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-2">
          <div className="w-10 h-10 rounded-xl bg-brand-500/20 text-brand-300 flex items-center justify-center font-bold">
            <Zap className="w-5 h-5 text-cyan-400" />
          </div>
          <h3 className="text-sm font-bold text-white">Direct Android Background Share</h3>
          <p className="text-xs text-slate-400">
            Share any link directly from YouTube, Instagram, or TikTok into OmniGrab PWA using the native Android share sheet.
          </p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-2">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold">
            <Film className="w-5 h-5 text-cyan-400" />
          </div>
          <h3 className="text-sm font-bold text-white">4K & 1080p Stream Multiplexing</h3>
          <p className="text-xs text-slate-400">
            Powered by high-performance static FFmpeg and yt-dlp engines to automatically merge video and audio tracks at maximum bitrates.
          </p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <h3 className="text-sm font-bold text-white">Chrome Companion Extension</h3>
          <p className="text-xs text-slate-400">
            Hover over any on-page video or image across the web to download immediately without leaving your browser tab.
          </p>
        </div>

      </div>

    </div>
  );
}
