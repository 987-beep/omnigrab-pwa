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
  GitBranch,
  Lock,
  KeyRound,
  Trash2,
  Bookmark,
  Calendar,
  EyeOff,
  Database,
  Smartphone,
  Laptop
} from 'lucide-react';

export default function DeploymentGuide({ showToast }) {
  const [activeTab, setActiveTab] = useState('privacy'); // privacy, ownership, cleanup, deploy, api
  const [copiedKey, setCopiedKey] = useState(null);

  const copySnippet = (key, text) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast('Copied to clipboard!', 'success');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const vercelJson = `{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "crons": [
    {
      "path": "/api/cron/cleanup",
      "schedule": "0 2 * * *"
    }
  ],
  "rewrites": [
    {
      "source": "/api/health",
      "destination": "/api/health"
    },
    {
      "source": "/api/extract",
      "destination": "/api/extract"
    },
    {
      "source": "/api/cron/cleanup",
      "destination": "/api/cron/cleanup"
    },
    {
      "source": "/api/turso/(.*)",
      "destination": "/api/turso?action=$1"
    },
    {
      "source": "/api/scrape-images",
      "destination": "/api/scrape-images"
    },
    {
      "source": "/api/batch-zip",
      "destination": "/api/batch-zip"
    },
    {
      "source": "/api/download-extension",
      "destination": "/api/download-extension"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}`;

  const dockerfileSnippet = `FROM python:3.11-slim

# Install system ffmpeg & curl
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

  return (
    <div className="space-y-10 animate-fadeIn max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto py-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/30 text-cyan-300 text-xs font-bold uppercase tracking-wider mb-3 shadow-glow">
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
          <span>Complete Privacy, Security & Ownership Master Guide</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-black text-white">
          Total Privacy & <span className="bg-gradient-to-r from-cyan-400 via-brand-400 to-emerald-400 bg-clip-text text-transparent">Build Ownership Control</span>
        </h2>
        <p className="mt-2 text-slate-400 text-sm">
          Guaranteed zero-leakage data isolation, automated 02:00 AM midnight storage auto-pruning, and 100% private self-hosted deployment.
        </p>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center justify-center gap-2 bg-surface-950 p-1.5 rounded-2xl border border-white/10 text-xs font-bold flex-wrap">
        <button
          onClick={() => setActiveTab('privacy')}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'privacy' ? 'bg-gradient-to-r from-brand-600 to-cyan-600 text-white shadow-glow' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Lock className="w-4 h-4 text-cyan-300" />
          <span>1. Zero-Leakage Privacy</span>
        </button>

        <button
          onClick={() => setActiveTab('ownership')}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'ownership' ? 'bg-gradient-to-r from-brand-600 to-cyan-600 text-white shadow-glow' : 'text-slate-400 hover:text-white'
          }`}
        >
          <GitBranch className="w-4 h-4 text-emerald-300" />
          <span>2. 100% Private Build</span>
        </button>

        <button
          onClick={() => setActiveTab('cleanup')}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'cleanup' ? 'bg-gradient-to-r from-brand-600 to-cyan-600 text-white shadow-glow' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Calendar className="w-4 h-4 text-amber-300" />
          <span>3. 02:00 AM Auto-Prune</span>
        </button>

        <button
          onClick={() => setActiveTab('deploy')}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'deploy' ? 'bg-gradient-to-r from-brand-600 to-cyan-600 text-white shadow-glow' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Server className="w-4 h-4 text-purple-300" />
          <span>4. Hosting & Vercel</span>
        </button>

        <button
          onClick={() => setActiveTab('api')}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'api' ? 'bg-gradient-to-r from-brand-600 to-cyan-600 text-white shadow-glow' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Code className="w-4 h-4 text-cyan-300" />
          <span>5. API Docs</span>
        </button>
      </div>

      {/* TAB 1: ZERO-LEAKAGE PRIVACY ARCHITECTURE */}
      {activeTab === 'privacy' && (
        <div className="space-y-6 animate-fadeIn">
          
          <div className="glass-panel-elevated p-6 sm:p-8 rounded-3xl border border-emerald-500/30 shadow-glow space-y-4">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black uppercase">
                Cryptographic Tenant Isolation
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-surface-900 text-slate-300 text-xs font-mono">
                No Data Leakage
              </span>
            </div>

            <h3 className="text-2xl font-black text-white">
              How OmniGrab Guarantees No One Can Ever Access Your Data
            </h3>

            <p className="text-slate-300 text-sm leading-relaxed">
              OmniGrab is engineered from the ground up with <strong>Zero-Knowledge Multi-User Tenant Vaults</strong>. Even if dozens of people use your deployed OmniGrab web app simultaneously, no user can ever see, scrape, or delete another person’s downloads, device IDs, or bookmarks.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              
              <div className="p-4 rounded-2xl bg-surface-900/80 border border-white/5 space-y-2">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold">
                  1
                </div>
                <h4 className="font-bold text-white text-sm">Client-Side UUID</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Every device generates a unique cryptographic User ID (e.g. <code className="text-cyan-300 font-mono">usr_8f3a9e...</code>) in sandboxed browser storage.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-surface-900/80 border border-white/5 space-y-2">
                <div className="w-9 h-9 rounded-xl bg-brand-500/20 text-brand-300 flex items-center justify-center font-bold">
                  2
                </div>
                <h4 className="font-bold text-white text-sm">Strict SQL Scoping</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Every Turso query enforces <code className="text-cyan-300 font-mono">WHERE user_id = ?</code>. Users cannot query or delete records outside their own tenant.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-surface-900/80 border border-white/5 space-y-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold">
                  3
                </div>
                <h4 className="font-bold text-white text-sm">Private Vault PIN</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  You can pair your own phone, tablet, and laptop with a private 6-digit Sync PIN (<code className="text-emerald-300 font-mono">VAULT-XXXX</code>) without sharing data with anyone else.
                </p>
              </div>

            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-3">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <EyeOff className="w-5 h-5 text-rose-400" />
                <span>Zero Third-Party Telemetry</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                OmniGrab contains <strong>0% third-party trackers</strong>. No Google Analytics, no Facebook Pixels, no remote telemetry, and no ad SDKs. Your IP address, search queries, and URLs are never sent to third-party ad networks.
              </p>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-3">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Database className="w-5 h-5 text-cyan-400" />
                <span>Encrypted LibSQL Pipeline</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                All communications with your Turso LibSQL database in AWS Mumbai (<code className="text-cyan-300">aws-ap-south-1</code>) are encrypted end-to-end via TLS 1.3 with cryptographic Ed25519 Bearer tokens.
              </p>
            </div>

          </div>

        </div>
      )}

      {/* TAB 2: TOTAL BUILD OWNERSHIP */}
      {activeTab === 'ownership' && (
        <div className="space-y-6 animate-fadeIn">
          
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-brand-500/30 space-y-5">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-black uppercase">
                Self-Hosted Independence
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-mono font-bold">
                100% In Your Hands
              </span>
            </div>

            <h3 className="text-2xl font-black text-white">
              How to Ensure the Website & Code Never Leaves Your Control
            </h3>

            <p className="text-slate-300 text-sm leading-relaxed">
              Your entire OmniGrab application is self-contained. Here is the step-by-step checklist to ensure your codebase, database credentials, and extension remain 100% private to you:
            </p>

            <div className="space-y-3 pt-2">
              
              <div className="p-4 rounded-2xl bg-surface-900/80 border border-white/5 flex items-start gap-3.5">
                <span className="w-7 h-7 rounded-lg bg-brand-600 text-white font-black text-xs flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                <div>
                  <h4 className="font-bold text-white text-sm">Keep Your GitHub Repository Private</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    In your GitHub repo (<strong className="text-white">987-beep/omnigrab-pwa</strong>), go to <strong>Settings ➔ Danger Zone ➔ Change repository visibility ➔ Set to Private</strong>. Only you will have access to the source code.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-surface-900/80 border border-white/5 flex items-start gap-3.5">
                <span className="w-7 h-7 rounded-lg bg-cyan-600 text-white font-black text-xs flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                <div>
                  <h4 className="font-bold text-white text-sm">Store Database Secrets in Vercel Environment Variables</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    In your Vercel Project Dashboard ➔ <strong>Settings ➔ Environment Variables</strong>, save <code className="text-cyan-300 font-mono">TURSO_DB_URL</code> and <code className="text-cyan-300 font-mono">TURSO_AUTH_TOKEN</code> as encrypted production environment variables so they are never exposed in public code.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-surface-900/80 border border-white/5 flex items-start gap-3.5">
                <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-black text-xs flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                <div>
                  <h4 className="font-bold text-white text-sm">Private Developer Chrome Extension</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Do not submit the extension publicly to the Chrome Web Store if you want to keep it strictly for private use. Instead, keep the pre-packaged <code className="text-emerald-300">OmniGrab_Chrome_Extension_V3.zip</code> loaded unpacked in <code className="text-cyan-300 font-mono">chrome://extensions</code> on your personal computers.
                  </p>
                </div>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* TAB 3: 02:00 AM AUTO-PRUNE ENGINE */}
      {activeTab === 'cleanup' && (
        <div className="space-y-6 animate-fadeIn">
          
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-amber-500/30 space-y-5">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-black uppercase">
                Storage Optimization Engine
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-mono font-bold">
                Daily at 02:00 AM
              </span>
            </div>

            <h3 className="text-2xl font-black text-white">
              02:00 AM Midnight Storage Auto-Pruning System
            </h3>

            <p className="text-slate-300 text-sm leading-relaxed">
              To prevent your Turso cloud database from exceeding free-tier limits or accumulating temporary download bloat, OmniGrab runs an automated pruning job every day at 02:00 AM.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              
              <div className="p-5 rounded-2xl bg-rose-950/20 border border-rose-500/30 space-y-2.5">
                <div className="flex items-center gap-2 font-bold text-rose-300 text-sm">
                  <Trash2 className="w-4 h-4 text-rose-400" />
                  <span>Purged at 02:00 AM Midnight</span>
                </div>
                <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                  <li><strong className="text-white">Download logs</strong> (<code className="text-rose-300">downloads_history</code>) older than 24 hours</li>
                  <li>Temporary scraped image buffers & session tokens</li>
                  <li>Completed queue items & stream metadata</li>
                </ul>
              </div>

              <div className="p-5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-2.5">
                <div className="flex items-center gap-2 font-bold text-emerald-300 text-sm">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>PRESERVED FOREVER (Never Deleted)</span>
                </div>
                <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                  <li><strong className="text-white">Saved Bookmarks</strong> (<code className="text-emerald-300">saved_bookmarks</code>)</li>
                  <li><strong className="text-white">User Accounts & Vault Keys</strong> (<code className="text-emerald-300">user_vaults</code>)</li>
                  <li><strong className="text-white">Settings & Extension Preferences</strong> (<code className="text-emerald-300">user_settings</code>)</li>
                </ul>
              </div>

            </div>

            <div className="p-4 rounded-2xl bg-surface-900/80 border border-white/5 space-y-2">
              <h4 className="font-bold text-white text-xs">How the 2:00 AM Cleanup is Executed:</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                1. <strong>Vercel Cron Trigger</strong>: Scheduled in <code className="text-cyan-300 font-mono">vercel.json</code> via <code className="text-cyan-300 font-mono">/api/cron/cleanup</code>.<br />
                2. <strong>Python Backend Loop</strong>: Runs inside FastAPI background worker at 02:00 UTC.<br />
                3. <strong>Lazy Self-Maintenance</strong>: Every Turso database call checks if today's 2:00 AM maintenance was run; if not, it automatically runs in the background.
              </p>
            </div>

          </div>

        </div>
      )}

      {/* TAB 4: DEPLOYMENT GUIDE */}
      {activeTab === 'deploy' && (
        <div className="space-y-6 animate-fadeIn">
          
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Globe className="w-5 h-5 text-brand-400" />
                  <span>1. Vercel Configuration (vercel.json)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Pre-configured with Serverless API rewrites and 02:00 AM Cron Schedule:
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

          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-emerald-400" />
                  <span>2. Self-Hosted Docker Container (Infomaniak / VPS)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Production Dockerfile with FFmpeg & Python FastAPI:
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

        </div>
      )}

      {/* TAB 5: BACKEND REST API ENDPOINTS */}
      {activeTab === 'api' && (
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-4 animate-fadeIn">
          <h3 className="text-lg font-black text-white flex items-center gap-2">
            <Code className="w-5 h-5 text-cyan-400" />
            <span>Backend REST API Reference with User Isolation</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-slate-400">
                  <th className="pb-3 font-bold">Method</th>
                  <th className="pb-3 font-bold">Endpoint</th>
                  <th className="pb-3 font-bold">Privacy / Isolation</th>
                  <th className="pb-3 font-bold">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                <tr>
                  <td className="py-3 text-cyan-400 font-bold">POST</td>
                  <td className="py-3 text-white">/api/extract</td>
                  <td className="py-3 text-emerald-400">Stateless</td>
                  <td className="py-3 text-slate-300 font-sans">Extracts 4K video streams & playlists</td>
                </tr>
                <tr>
                  <td className="py-3 text-emerald-400 font-bold">GET</td>
                  <td className="py-3 text-white">/api/turso/history</td>
                  <td className="py-3 text-emerald-400">X-User-ID Scoped</td>
                  <td className="py-3 text-slate-300 font-sans">Fetches user's private download history</td>
                </tr>
                <tr>
                  <td className="py-3 text-cyan-400 font-bold">POST</td>
                  <td className="py-3 text-white">/api/turso/bookmarks</td>
                  <td className="py-3 text-emerald-400">X-User-ID Scoped</td>
                  <td className="py-3 text-slate-300 font-sans">Saves permanent cloud bookmark (never pruned)</td>
                </tr>
                <tr>
                  <td className="py-3 text-amber-400 font-bold">POST</td>
                  <td className="py-3 text-white">/api/cron/cleanup</td>
                  <td className="py-3 text-amber-300">02:00 AM Cron</td>
                  <td className="py-3 text-slate-300 font-sans">Purges temporary download logs</td>
                </tr>
                <tr>
                  <td className="py-3 text-purple-400 font-bold">POST</td>
                  <td className="py-3 text-white">/api/turso/vault/sync</td>
                  <td className="py-3 text-purple-300">PIN Protected</td>
                  <td className="py-3 text-slate-300 font-sans">Pairs multi-device private user vaults</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
