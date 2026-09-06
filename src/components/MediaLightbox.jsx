import React, { useEffect } from 'react';
import { X, Download, ExternalLink, ZoomIn } from 'lucide-react';

export default function MediaLightbox({ src, title, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!src) return null;

  const isVideo = src.match(/\.(mp4|webm|mov)(\?.*)?$/i);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white z-50 transition-transform hover:scale-110"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Content Container */}
      <div className="relative max-w-5xl max-h-[85vh] flex flex-col items-center">
        {isVideo ? (
          <video
            src={src}
            controls
            autoPlay
            className="max-h-[75vh] w-auto max-w-full rounded-2xl shadow-2xl border border-white/10"
          />
        ) : (
          <img
            src={src}
            alt={title || 'Fullscreen Preview'}
            className="max-h-[75vh] w-auto max-w-full object-contain rounded-2xl shadow-2xl border border-white/10"
          />
        )}

        {/* Footer Bar */}
        <div className="mt-4 flex items-center justify-between w-full px-4 text-xs text-slate-300">
          <span className="truncate max-w-md font-semibold text-white">
            {title || 'Media Preview'}
          </span>

          <div className="flex items-center gap-2">
            <a
              href={src}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open Original</span>
            </a>

            <a
              href={src}
              download={title ? `${title.slice(0, 30)}.jpg` : 'omnigrab_photo.jpg'}
              className="px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-surface-950 font-black flex items-center gap-1.5 shadow-glow-cyan"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
