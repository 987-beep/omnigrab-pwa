import React, { useState } from 'react';
import { 
  Server, 
  Terminal, 
  Cpu, 
  Database, 
  ShieldCheck, 
  Code2, 
  ExternalLink, 
  CheckCircle2, 
  Copy, 
  Download, 
  Cloud, 
  Smartphone, 
  Globe, 
  HardDrive,
  Clock,
  Zap,
  Lock,
  Layers,
  Sparkles,
  Key
} from 'lucide-react';

export default function DeploymentGuide({ showToast }) {
  const [copiedCode, setCopiedCode] = useState(null);
  const [activeGuideTab, setActiveGuideTab] = useState('personal'); // 'personal', 'prune', 'hosting', 'api'

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    showToast('Command copied to clipboard!', 'success');
    setTimeout(() => setCopiedCode(null), 2500);
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl mx-auto">
      
      {/* Header Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-brand-500/30 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 text-xs font-bold font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>Personal Private Cloud Architecture</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              OmniGrab Pro Personal System & Operations Guide
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl">
              Complete technical handbook for your single-owner media downloader. Syncs across all your personal devices with zero clutter, direct Turso cloud persistence, and automated 02:00 AM midnight cleanup.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/OmniGrab_Chrome_Extension_V3.zip"
              download="OmniGrab_Chrome_Extension_V3.zip"
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-black flex items-center gap-2 shadow-glow transition-all whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              <span>Get Chrome Extension</span>
            </a>
          </div>
        </div>
      </div>

      {/* Guide Navigation Tabs */}
      <div className="flex items-center gap-2 bg-surface-900 p-1.5 rounded-2xl border border-white/10 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setActiveGuideTab('personal')}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeGuideTab === 'personal' ? 'bg-brand-600 text-white shadow-glow' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Lock className="w-4 h-4 text-emerald-400" />
          <span>100% Private Personal Setup</span>
        </button>

        <button
          onClick={() => setActiveGuideTab('prune')}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeGuideTab === 'prune' ? 'bg-brand-600 text-white shadow-glow' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Clock className="w-4 h-4 text-amber-400" />
          <span>02:00 AM Auto-Prune Engine</span>
        </button>

        <button
          onClick={() => setActiveGuideTab('hosting')}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeGuideTab === 'hosting' ? 'bg-brand-600 text-white shadow-glow' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Globe className="w-4 h-4 text-cyan-400" />
          <span>Hosting & Vercel Config</span>
        </button>

        <button
          onClick={() => setActiveGuideTab('api')}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeGuideTab === 'api' ? 'bg-brand-600 text-white shadow-glow' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Code2 className="w-4 h-4 text-purple-400" />
          <span>API Reference</span>
        </button>
      </div>

      {/* TAB: 100% Private Personal Setup */}
      {activeGuideTab === 'personal' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="glass-panel p-6 rounded-3xl border border-emerald-500/30 space-y-4">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-emerald-400" />
              <span>Dedicated Single-Owner Platform</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              OmniGrab Pro is built for <strong className="text-white">your direct personal use</strong>. There are no public user accounts, no logins, no PINs, and no multi-tenant confusion. Your Turso LibSQL database stores your synced downloads and permanent bookmarks directly for you.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-surface-900 border border-white/5 space-y-2">
                <Smartphone className="w-6 h-6 text-cyan-400" />
                <h4 className="text-xs font-bold text-white">Android PWA</h4>
                <p className="text-[11px] text-slate-400">
                  Tap "Share" on any YouTube, Instagram, or TikTok link on your phone → select OmniGrab Pro to extract in 1 tap.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-surface-900 border border-white/5 space-y-2">
                <Server className="w-6 h-6 text-brand-400" />
                <h4 className="text-xs font-bold text-white">Chrome Extension</h4>
                <p className="text-[11px] text-slate-400">
                  Injects one-click download badges on video players and syncs downloads directly to your Turso cloud database.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-surface-900 border border-white/5 space-y-2">
                <Cloud className="w-6 h-6 text-emerald-400" />
                <h4 className="text-xs font-bold text-white">Turso LibSQL Cloud</h4>
                <p className="text-[11px] text-slate-400">
                  Located in AWS Mumbai (<code className="text-cyan-300 font-mono text-[10px]">ap-south-1</code>) for sub-10ms response times.
                </p>
              </div>
            </div>
          </div>

          {/* Chrome Extension Manual Install */}
          <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Terminal className="w-5 h-5 text-cyan-400" />
              <span>How to Install Companion Chrome Extension (30 Seconds)</span>
            </h3>
            
            <ol className="text-xs text-slate-300 space-y-3 list-decimal list-inside">
              <li>
                Download and extract the ZIP file: <a href="/OmniGrab_Chrome_Extension_V3.zip" download="OmniGrab_Chrome_Extension_V3.zip" className="text-cyan-400 font-bold underline">OmniGrab_Chrome_Extension_V3.zip</a>.
              </li>
              <li>
                In Google Chrome / Brave / Edge, open <code className="bg-surface-900 px-2 py-0.5 rounded text-cyan-300 font-mono">chrome://extensions/</code>.
              </li>
              <li>
                Enable <strong className="text-white">Developer mode</strong> toggle in the top-right corner.
              </li>
              <li>
                Click <strong className="text-white">Load unpacked</strong> and select the extracted extension folder.
              </li>
              <li>
                The OmniGrab Pro badge will now appear on all media websites with 1-click download actions!
              </li>
            </ol>
          </div>
        </div>
      )}

      {/* TAB: 02:00 AM Auto-Prune Engine */}
      {activeGuideTab === 'prune' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="glass-panel p-6 rounded-3xl border border-amber-500/30 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-bold">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Turso Free-Tier Zero Maintenance</span>
            </div>
            <h3 className="text-xl font-black text-white">
              02:00 AM Automated Pruning Architecture
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              To keep your Turso Cloud database well within the free tier forever without manual upkeep, OmniGrab Pro executes an automated cleanup cron job at <strong className="text-amber-300">02:00 AM daily</strong>.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-surface-900 border border-white/5 space-y-2">
                <h4 className="text-xs font-bold text-rose-300 flex items-center gap-2">
                  <span>🗑️ Ephemeral Data (Purged at 02:00 AM)</span>
                </h4>
                <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
                  <li>Download stream records older than 24 hours</li>
                  <li>Temporary thumbnail cache keys</li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-surface-900 border border-white/5 space-y-2">
                <h4 className="text-xs font-bold text-emerald-300 flex items-center gap-2">
                  <span>🛡️ Permanent Data (Preserved Forever)</span>
                </h4>
                <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
                  <li>Saved Bookmarks (`saved_bookmarks`)</li>
                  <li>User settings & custom defaults (`user_settings`)</li>
                </ul>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-surface-950 border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-cyan-300 font-bold">Manual Cleanup Trigger Command:</span>
                <button
                  onClick={() => handleCopy('cron_curl', 'curl -X POST https://omnigrab-pwa.vercel.app/api/cron/midnight-prune')}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                >
                  {copiedCode === 'cron_curl' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy</span>
                </button>
              </div>
              <pre className="text-xs font-mono text-slate-300 bg-surface-900 p-3 rounded-xl overflow-x-auto">
                curl -X POST https://omnigrab-pwa.vercel.app/api/cron/midnight-prune
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* TAB: Hosting & Vercel Config */}
      {activeGuideTab === 'hosting' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Globe className="w-5 h-5 text-cyan-400" />
              <span>Live Vercel & Production Environment</span>
            </h3>
            <p className="text-xs text-slate-300">
              The frontend and serverless edge functions are deployed to Vercel and connected directly to your GitHub repository <code className="text-cyan-300 font-mono">987-beep/omnigrab-pwa</code>.
            </p>

            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-surface-900 border border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Vercel Environment Variables:</span>
                </div>
                <pre className="text-xs font-mono text-cyan-300 bg-surface-950 p-3 rounded-xl overflow-x-auto">
{`TURSO_DATABASE_URL=https://webextention-axuile.aws-ap-south-1.turso.io/v2/pipeline
TURSO_AUTH_TOKEN=eyJhbGciOiJFZERTQ...`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: API Reference */}
      {activeGuideTab === 'api' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="glass-panel p-6 rounded-3xl border border-purple-500/30 space-y-4">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Code2 className="w-5 h-5 text-purple-400" />
              <span>Unified Backend Endpoints</span>
            </h3>
            
            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 rounded-xl bg-surface-900 border border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-emerald-400 font-bold">POST</span> <span className="text-white">/api/extract</span>
                </div>
                <span className="text-slate-400 text-[11px]">Extract video/photo formats</span>
              </div>

              <div className="p-3 rounded-xl bg-surface-900 border border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-cyan-400 font-bold">GET</span> <span className="text-white">/api/turso/history</span>
                </div>
                <span className="text-slate-400 text-[11px]">Fetch cloud download items</span>
              </div>

              <div className="p-3 rounded-xl bg-surface-900 border border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-emerald-400 font-bold">POST</span> <span className="text-white">/api/turso/history</span>
                </div>
                <span className="text-slate-400 text-[11px]">Log new completed download</span>
              </div>

              <div className="p-3 rounded-xl bg-surface-900 border border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-amber-400 font-bold">GET/POST</span> <span className="text-white">/api/turso/bookmarks</span>
                </div>
                <span className="text-slate-400 text-[11px]">Manage permanent bookmarks</span>
              </div>

              <div className="p-3 rounded-xl bg-surface-900 border border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-rose-400 font-bold">POST</span> <span className="text-white">/api/cron/midnight-prune</span>
                </div>
                <span className="text-slate-400 text-[11px]">02:00 AM storage saver trigger</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
