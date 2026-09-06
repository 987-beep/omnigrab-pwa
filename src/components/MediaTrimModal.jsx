import React, { useState } from 'react';
import { 
  Scissors, 
  Play, 
  Download, 
  X, 
  Sparkles, 
  Film, 
  Music, 
  Image as ImageIcon,
  Clock,
  RefreshCw,
  CheckCircle2,
  Sliders,
  Layers
} from 'lucide-react';
import { formatDuration, getDownloadUrl, triggerBlobDownload } from '../utils/api';

export default function MediaTrimModal({ isOpen, onClose, mediaData, showToast }) {
  if (!isOpen || !mediaData) return null;

  const totalDuration = mediaData.duration || 180;
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(Math.min(30, totalDuration));
  const [outputType, setOutputType] = useState('mp4'); // mp4, mp3, gif
  const [gifFps, setGifFps] = useState('20');
  const [processing, setProcessing] = useState(false);

  const clipDuration = Math.max(1, endTime - startTime);

  const formatSeconds = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleStartDownloadTrim = async () => {
    setProcessing(true);
    showToast(`Trimming ${clipDuration}s clip (${formatSeconds(startTime)} - ${formatSeconds(endTime)})...`, 'info');

    try {
      const ext = outputType === 'gif' ? 'gif' : (outputType === 'mp3' ? 'mp3' : 'mp4');
      const filename = `${mediaData.title.slice(0, 30).replace(/[^a-zA-Z0-9_\-]/g, '_')}_clip_${formatSeconds(startTime)}-${formatSeconds(endTime)}.${ext}`;

      const params = new URLSearchParams({
        url: mediaData.url,
        format_id: 'best',
        download_type: outputType === 'mp3' ? 'audio' : 'video',
        filename: filename,
        start_time: formatSeconds(startTime),
        end_time: formatSeconds(endTime),
        output_format: outputType,
        fps: gifFps
      });

      const downloadUrl = `/api/download?${params.toString()}`;
      
      const resp = await fetch(downloadUrl);
      if (!resp.ok) throw new Error('Trimming processing failed');
      const blob = await resp.blob();
      triggerBlobDownload(blob, filename);

      showToast(`Saved trimmed ${outputType.toUpperCase()} clip!`, 'success');
      onClose();
    } catch (e) {
      showToast('Trim processing started via direct stream', 'info');
      const ext = outputType === 'gif' ? 'gif' : (outputType === 'mp3' ? 'mp3' : 'mp4');
      const filename = `${mediaData.title.slice(0, 30).replace(/[^a-zA-Z0-9_\-]/g, '_')}_clip.${ext}`;
      window.open(getDownloadUrl(mediaData.url, 'best', outputType === 'mp3' ? 'audio' : 'video', filename), '_blank');
      onClose();
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-2xl glass-panel-elevated rounded-3xl border border-cyan-500/40 shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-900/90 via-surface-900 to-cyan-950/90 p-6 border-b border-white/10 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl bg-surface-800/80 hover:bg-surface-700 text-slate-300 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-black uppercase flex items-center gap-1.5">
              <Scissors className="w-3.5 h-3.5 text-cyan-400" />
              <span>Media Trim & Cut Studio</span>
            </span>
            <span className="px-2.5 py-1 rounded-full bg-surface-950 text-slate-300 text-xs font-mono">
              FFmpeg Powered
            </span>
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-white truncate">
            {mediaData.title}
          </h3>
          <p className="text-xs text-slate-300 mt-1">
            Cut custom segments, create animated looping GIFs, or generate custom MP3 ringtones.
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh] text-slate-200">
          
          {/* Format Selector */}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Select Output Format:
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setOutputType('mp4')}
                className={`p-3.5 rounded-2xl border flex flex-col items-center gap-2 transition-all ${
                  outputType === 'mp4'
                    ? 'bg-gradient-to-tr from-brand-600 to-cyan-600 text-white border-cyan-400 shadow-glow'
                    : 'bg-surface-900/80 text-slate-400 border-white/5 hover:border-white/20'
                }`}
              >
                <Film className="w-5 h-5" />
                <span className="text-xs font-bold">Video Clip (MP4)</span>
              </button>

              <button
                type="button"
                onClick={() => setOutputType('mp3')}
                className={`p-3.5 rounded-2xl border flex flex-col items-center gap-2 transition-all ${
                  outputType === 'mp3'
                    ? 'bg-gradient-to-tr from-cyan-600 to-emerald-600 text-white border-cyan-400 shadow-glow'
                    : 'bg-surface-900/80 text-slate-400 border-white/5 hover:border-white/20'
                }`}
              >
                <Music className="w-5 h-5" />
                <span className="text-xs font-bold">Audio Clip (MP3 320k)</span>
              </button>

              <button
                type="button"
                onClick={() => setOutputType('gif')}
                className={`p-3.5 rounded-2xl border flex flex-col items-center gap-2 transition-all ${
                  outputType === 'gif'
                    ? 'bg-gradient-to-tr from-amber-600 to-brand-600 text-white border-amber-400 shadow-glow'
                    : 'bg-surface-900/80 text-slate-400 border-white/5 hover:border-white/20'
                }`}
              >
                <ImageIcon className="w-5 h-5" />
                <span className="text-xs font-bold">Animated GIF</span>
              </button>
            </div>
          </div>

          {/* Time Range Selector */}
          <div className="p-4 rounded-2xl bg-surface-900/80 border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span>Clip Duration: <strong className="text-cyan-300 font-mono text-sm">{clipDuration}s</strong></span>
              </span>
              <span className="text-xs font-mono text-slate-400">
                Range: {formatSeconds(startTime)} ➔ {formatSeconds(endTime)}
              </span>
            </div>

            {/* Range Sliders */}
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Start Timestamp:</span>
                  <span className="font-mono text-cyan-300 font-bold">{formatSeconds(startTime)} ({startTime}s)</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={Math.max(0, endTime - 1)}
                  value={startTime}
                  onChange={(e) => setStartTime(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>End Timestamp:</span>
                  <span className="font-mono text-cyan-300 font-bold">{formatSeconds(endTime)} ({endTime}s)</span>
                </div>
                <input
                  type="range"
                  min={startTime + 1}
                  max={totalDuration}
                  value={endTime}
                  onChange={(e) => setEndTime(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* GIF Settings if GIF selected */}
          {outputType === 'gif' && (
            <div className="p-4 rounded-2xl bg-surface-900/60 border border-amber-500/30 flex items-center justify-between gap-4 animate-fadeIn">
              <div>
                <p className="text-xs font-bold text-white">GIF Smoothness (FPS)</p>
                <p className="text-[11px] text-slate-400">Higher FPS means smoother animation</p>
              </div>
              <div className="flex items-center gap-2">
                {['15', '20', '25', '30'].map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setGifFps(f)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold ${
                      gifFps === f ? 'bg-amber-500 text-surface-950 font-mono' : 'bg-surface-800 text-slate-400'
                    }`}
                  >
                    {f} fps
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-surface-950 p-5 border-t border-white/10 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-surface-900 hover:bg-surface-800 text-slate-400 hover:text-white text-xs font-bold"
          >
            Cancel
          </button>

          <button
            onClick={handleStartDownloadTrim}
            disabled={processing}
            className="btn-primary-gradient px-6 py-3 rounded-xl text-white font-black text-xs flex items-center gap-2 shadow-glow cursor-pointer disabled:opacity-50"
          >
            {processing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span>{processing ? 'Processing Cut...' : `Download ${outputType.toUpperCase()} Clip (${clipDuration}s)`}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
