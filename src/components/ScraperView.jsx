import React, { useState } from 'react';
import { 
  Image as ImageIcon, 
  Search, 
  Download, 
  FolderArchive, 
  CheckSquare, 
  Square, 
  Sparkles, 
  Filter, 
  Eye, 
  RefreshCw,
  ExternalLink,
  Layers
} from 'lucide-react';
import { scrapePageImages, createBatchZip } from '../utils/api';
import confetti from 'canvas-confetti';

export default function ScraperView({ showToast, onOpenLightbox }) {
  const [url, setUrl] = useState('');
  const [includeSvg, setIncludeSvg] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scrapeResult, setScrapeResult] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [filterType, setFilterType] = useState('ALL');
  const [downloadingZip, setDownloadingZip] = useState(false);

  const handleScrape = async (e) => {
    if (e) e.preventDefault();
    const targetUrl = url.trim();
    if (!targetUrl) {
      showToast('Please enter a website URL', 'error');
      return;
    }

    setLoading(true);
    setScrapeResult(null);
    setSelectedIds(new Set());

    try {
      const data = await scrapePageImages(targetUrl, includeSvg);
      setScrapeResult(data);
      // Select all by default
      setSelectedIds(new Set(data.images.map(img => img.id)));
      showToast(`Found ${data.images.length} high-resolution photos!`, 'success');
    } catch (err) {
      showToast(err.message || 'Failed to scrape images from page', 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (!scrapeResult) return;
    if (selectedIds.size === filteredImages.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredImages.map(img => img.id)));
    }
  };

  const handleDownloadSelectedZip = async () => {
    if (!scrapeResult || selectedIds.size === 0) return;

    setDownloadingZip(true);
    try {
      const itemsToZip = scrapeResult.images
        .filter(img => selectedIds.has(img.id))
        .map((img, idx) => ({
          url: img.src,
          filename: `photo_${idx+1}_${img.alt.slice(0, 20).replace(/[^a-zA-Z0-9_\-]/g, '_') || 'asset'}.${(img.type || 'jpg').toLowerCase()}`
        }));

      await createBatchZip(itemsToZip, `${(scrapeResult.page_title || 'Website').slice(0, 30)}_Photos.zip`);
      confetti({ particleCount: 70, spread: 70, origin: { y: 0.7 } });
      showToast(`Exported ${itemsToZip.length} photos as ZIP archive!`, 'success');
    } catch (err) {
      showToast('Failed to generate ZIP archive', 'error');
    } finally {
      setDownloadingZip(false);
    }
  };

  const sampleSites = [
    { name: 'Unsplash Photography', url: 'https://unsplash.com/t/wallpapers' },
    { name: 'Wikipedia Nature', url: 'https://en.wikipedia.org/wiki/Aurora' },
    { name: 'NASA Astronomy', url: 'https://www.nasa.gov/' },
  ];

  const filteredImages = (scrapeResult?.images || []).filter(img => {
    if (filterType === 'ALL') return true;
    if (filterType === 'FEATURED') return img.type === 'featured';
    if (filterType === 'SVG') return img.type === 'SVG';
    if (filterType === 'JPG/PNG') return ['JPG', 'JPEG', 'PNG', 'WEBP'].includes(img.type);
    return true;
  });

  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl mx-auto">
      
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto py-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold uppercase tracking-wider mb-3 shadow-glow-cyan">
          <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
          <span>Deep Web Image & Photo Extractor</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-black text-white">
          Extract All <span className="bg-gradient-to-r from-cyan-400 via-brand-400 to-emerald-400 bg-clip-text text-transparent">Photos & Media</span> From Any Page
        </h2>
        <p className="mt-2 text-slate-400 text-sm">
          Scrapes responsive <code className="text-cyan-300">srcset</code>, CSS background images, social preview cards, and high-res gallery assets with 1-click batch ZIP export.
        </p>
      </div>

      {/* Input Form */}
      <div className="glass-panel-elevated p-4 rounded-3xl">
        <form onSubmit={handleScrape} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter any website URL (e.g. https://unsplash.com, blog, store)..."
              required
              className="w-full pl-12 pr-4 py-4 rounded-2xl glass-input text-white text-sm sm:text-base outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary-gradient px-8 py-4 rounded-2xl text-white font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-glow cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Crawling Website...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Scrape All Photos</span>
              </>
            )}
          </button>
        </form>

        {/* Filters & Options */}
        <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
              <input 
                type="checkbox" 
                checked={includeSvg} 
                onChange={(e) => setIncludeSvg(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-surface-900 text-brand-500 focus:ring-brand-500"
              />
              <span>Include Vector SVGs & Icons</span>
            </label>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500">Sample Sites:</span>
            {sampleSites.map(s => (
              <button
                key={s.name}
                type="button"
                onClick={() => { setUrl(s.url); }}
                className="px-2.5 py-1 rounded-lg bg-surface-900 border border-white/5 text-cyan-300 hover:text-white text-[11px] font-semibold"
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Scrape Result Gallery */}
      {scrapeResult && (
        <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-6 animate-fadeIn">
          
          {/* Gallery Action Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <span>{scrapeResult.page_title || 'Website Media'}</span>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-mono">
                  {scrapeResult.total_count} assets
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5 truncate max-w-md">
                {scrapeResult.url}
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Type Filter */}
              <div className="flex items-center gap-1 bg-surface-900 p-1 rounded-xl border border-white/5 text-xs font-bold">
                {['ALL', 'JPG/PNG', 'FEATURED', 'SVG'].map(t => (
                  <button
                    key={t}
                    onClick={() => setFilterType(t)}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      filterType === t ? 'bg-brand-600 text-white shadow-glow' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Select All Toggle */}
              <button
                onClick={toggleSelectAll}
                className="px-3 py-2 rounded-xl bg-surface-900 hover:bg-surface-800 border border-white/10 text-slate-300 text-xs font-bold flex items-center gap-1.5"
              >
                {selectedIds.size === filteredImages.length ? <CheckSquare className="w-4 h-4 text-cyan-400" /> : <Square className="w-4 h-4 text-slate-400" />}
                <span>{selectedIds.size === filteredImages.length ? 'Deselect All' : 'Select All'}</span>
              </button>

              {/* Batch Zip Download CTA */}
              <button
                onClick={handleDownloadSelectedZip}
                disabled={selectedIds.size === 0 || downloadingZip}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white text-xs font-black flex items-center gap-2 shadow-glow-emerald disabled:opacity-40 transition-all"
              >
                {downloadingZip ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Packing ZIP ({selectedIds.size})...</span>
                  </>
                ) : (
                  <>
                    <FolderArchive className="w-4 h-4" />
                    <span>Download ZIP ({selectedIds.size})</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Images Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {filteredImages.map((img) => {
              const isSelected = selectedIds.has(img.id);
              return (
                <div
                  key={img.id}
                  className={`group relative rounded-2xl overflow-hidden bg-surface-950 border transition-all duration-200 aspect-square ${
                    isSelected ? 'border-cyan-400 shadow-glow-cyan' : 'border-white/10 hover:border-white/30'
                  }`}
                >
                  <img
                    src={img.src}
                    alt={img.alt}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onClick={() => onOpenLightbox && onOpenLightbox(img.src, img.alt)}
                  />

                  {/* Selection Checkbox */}
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleSelect(img.id); }}
                    className="absolute top-2 left-2 z-10 p-1.5 rounded-lg bg-black/70 backdrop-blur-md text-white hover:scale-110 transition-transform"
                  >
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-cyan-400" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </button>

                  {/* Type Badge */}
                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur-md text-cyan-300 text-[9px] font-black uppercase font-mono">
                    {img.type}
                  </span>

                  {/* Hover Actions */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2.5">
                    <p className="text-[10px] text-slate-200 font-semibold line-clamp-1 mb-2">
                      {img.alt}
                    </p>
                    <div className="flex gap-1">
                      <button
                        onClick={() => onOpenLightbox && onOpenLightbox(img.src, img.alt)}
                        className="flex-1 py-1 rounded bg-white/20 hover:bg-white/30 text-white text-[10px] font-bold flex items-center justify-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Preview</span>
                      </button>
                      <a
                        href={img.src}
                        download={`omnigrab_asset_${img.id}.${(img.type || 'jpg').toLowerCase()}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-bold flex items-center justify-center gap-1"
                      >
                        <Download className="w-3 h-3" />
                        <span>Save</span>
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

    </div>
  );
}
