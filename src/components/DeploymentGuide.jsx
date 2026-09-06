import React, { useState } from 'react';
import { 
  Server, 
  Layers, 
  Terminal, 
  Copy, 
  CheckCircle2, 
  ExternalLink, 
  Code, 
  Cpu, 
  Globe, 
  ShieldCheck, 
  Sparkles,
  GitBranch
} from 'lucide-react';

export default function DeploymentGuide({ showToast }) {
  const [copiedKey, setCopiedKey] = useState(null);

  const copySnippet = (key, text) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast('Code snippet copied to clipboard!', 'success');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const vercelJson = `{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "https://YOUR_BACKEND_URL.railway.app/api/$1"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}`;

  const dockerfileSnippet = `FROM python:3.11-slim

# Install system ffmpeg & dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \\
    ffmpeg \\
    curl \\
    ca-certificates \\
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./backend/
EXPOSE 8000

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]`;

  const requirementsTxt = `fastapi==0.115.0
uvicorn==0.30.6
yt-dlp>=2024.08.06
static-ffmpeg>=2.5
requests>=2.32.0
beautifulsoup4>=4.12.3
pydantic>=2.8.0`;

  return (
    <div className="space-y-10 animate-fadeIn max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto py-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/30 text-cyan-300 text-xs font-bold uppercase tracking-wider mb-3 shadow-glow">
          <Server className="w-3.5 h-3.5 text-cyan-400" />
          <span>Production Architecture & Hosting</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-black text-white">
          Deploy to <span className="bg-gradient-to-r from-brand-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">Vercel, GitHub & Cloud Backend</span>
        </h2>
        <p className="mt-2 text-slate-400 text-sm">
          Seamless two-tier architecture: Lightweight PWA on Vercel/GitHub Pages connected to a high-speed Python/yt-dlp extraction microservice.
        </p>
      </div>

      {/* Architecture Overview */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
        <h3 className="text-lg font-black text-white flex items-center gap-2">
          <Cpu className="w-5 h-5 text-cyan-400" />
          <span>Dual Architecture Overview</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Frontend Tier */}
          <div className="p-6 rounded-2xl bg-surface-900/80 border border-brand-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-black uppercase">
                Frontend PWA Tier
              </span>
              <span className="text-xs text-slate-400 font-mono">Vercel / GitHub</span>
            </div>
            <h4 className="text-base font-bold text-white">React + Vite + PWA Manifest</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Hosted globally on edge CDNs. Handles the responsive UI, offline cache, Web Share Target, Chrome Extension sync, and audio/video player.
            </p>
            <ul className="text-xs text-slate-300 space-y-1.5 pt-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Zero hosting cost on Vercel Free Tier
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Instant edge SSL & PWA Service Worker
              </li>
            </ul>
          </div>

          {/* Backend Tier */}
          <div className="p-6 rounded-2xl bg-surface-900/80 border border-cyan-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-black uppercase">
                Backend Engine Tier
              </span>
              <span className="text-xs text-slate-400 font-mono">Railway / Render / VPS</span>
            </div>
            <h4 className="text-base font-bold text-white">FastAPI + yt-dlp + FFmpeg</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              High-throughput microservice that extracts video formats, bypasses platform limits, handles stream merging, and creates ZIP archives.
            </p>
            <ul className="text-xs text-slate-300 space-y-1.5 pt-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" /> Bundled with Static FFmpeg
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" /> Deploy with 1-click Docker container
              </li>
            </ul>
          </div>

        </div>
      </div>

      {/* Step 1: Frontend on Vercel */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Globe className="w-5 h-5 text-brand-400" />
              <span>1. Deploy Frontend PWA to Vercel</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Push to GitHub and import repository in Vercel. Add <code className="text-cyan-300">vercel.json</code> to proxy API calls:
            </p>
          </div>

          <button
            onClick={() => copySnippet('vercel', vercelJson)}
            className="px-3 py-1.5 rounded-xl bg-surface-900 hover:bg-surface-800 border border-white/10 text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            {copiedKey === 'vercel' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>Copy vercel.json</span>
          </button>
        </div>

        <pre className="p-4 rounded-2xl bg-surface-950 border border-white/10 font-mono text-xs text-cyan-300 overflow-x-auto">
          <code>{vercelJson}</code>
        </pre>
      </div>

      {/* Step 2: Backend Dockerfile */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Terminal className="w-5 h-5 text-emerald-400" />
              <span>2. Deploy Backend Engine with Docker</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Production Dockerfile with FFmpeg & Python FastAPI ready for Railway, Render, or self-hosted VPS:
            </p>
          </div>

          <button
            onClick={() => copySnippet('docker', dockerfileSnippet)}
            className="px-3 py-1.5 rounded-xl bg-surface-900 hover:bg-surface-800 border border-white/10 text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            {copiedKey === 'docker' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>Copy Dockerfile</span>
          </button>
        </div>

        <pre className="p-4 rounded-2xl bg-surface-950 border border-white/10 font-mono text-xs text-emerald-300 overflow-x-auto">
          <code>{dockerfileSnippet}</code>
        </pre>
      </div>

      {/* Step 3: API Reference Table */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-4">
        <h3 className="text-lg font-black text-white flex items-center gap-2">
          <Code className="w-5 h-5 text-cyan-400" />
          <span>Backend REST API Endpoints</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-slate-400">
                <th className="pb-3 font-bold">Method</th>
                <th className="pb-3 font-bold">Endpoint</th>
                <th className="pb-3 font-bold">Description</th>
                <th className="pb-3 font-bold">Payload / Query</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              <tr>
                <td className="py-3 text-cyan-400 font-bold">POST</td>
                <td className="py-3 text-white">/api/extract</td>
                <td className="py-3 text-slate-300 font-sans">Extracts formats & metadata</td>
                <td className="py-3 text-slate-400">&#123; "url": "..." &#125;</td>
              </tr>
              <tr>
                <td className="py-3 text-emerald-400 font-bold">GET</td>
                <td className="py-3 text-white">/api/download</td>
                <td className="py-3 text-slate-300 font-sans">Streams converted video/audio file</td>
                <td className="py-3 text-slate-400">?url=...&format_id=...</td>
              </tr>
              <tr>
                <td className="py-3 text-cyan-400 font-bold">POST</td>
                <td className="py-3 text-white">/api/scrape-images</td>
                <td className="py-3 text-slate-300 font-sans">Scrapes high-res photos & SVGs</td>
                <td className="py-3 text-slate-400">&#123; "url": "..." &#125;</td>
              </tr>
              <tr>
                <td className="py-3 text-cyan-400 font-bold">POST</td>
                <td className="py-3 text-white">/api/batch-zip</td>
                <td className="py-3 text-slate-300 font-sans">Bundles photos into ZIP</td>
                <td className="py-3 text-slate-400">&#123; "items": [...] &#125;</td>
              </tr>
              <tr>
                <td className="py-3 text-emerald-400 font-bold">GET</td>
                <td className="py-3 text-white">/api/download-extension</td>
                <td className="py-3 text-slate-300 font-sans">Downloads Chrome Extension .zip</td>
                <td className="py-3 text-slate-400">None</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
