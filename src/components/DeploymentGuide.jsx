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
  Key,
  Users,
  QrCode,
  Send
} from 'lucide-react';

export default function DeploymentGuide({ showToast }) {
  const [copiedCode, setCopiedCode] = useState(null);
  const [activeGuideTab, setActiveGuideTab] = useState('multiuser'); // 'multiuser', 'prune', 'hosting', 'api'

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
              <Users className="w-3.5 h-3.5 text-cyan-400" />
              <span>Multi-User Cloud Architecture</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              OmniGrab Pro Multi-User System Handbook
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl">
              Engineered for seamless multi-tenant isolation, instant user profile switching, cross-profile media transfers, and automated 02:00 AM midnight cleanup.
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
          onClick={() => setActiveGuideTab('multiuser')}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeGuideTab === 'multiuser' ? 'bg-brand-600 text-white shadow-glow' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4 text-cyan-400" />
          <span>Multi-User & Profile Vaults</span>
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
          <Globe className="w-4 h-4 text-emerald-400" />
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

      {/* TAB: Multi-User & Profile Vaults */}
      {activeGuideTab === 'multiuser' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="glass-panel p-6 rounded-3xl border border-cyan-500/30 space-y-4">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
              <span>Multi-Tenant Partitioned Architecture</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              OmniGrab Pro provides true <strong className="text-white">Multi-User Isolation</strong>. Each user profile operates with its own cryptographically unique identity, isolated downloads history, private bookmarks, and optional PIN security.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-surface-900 border border-white/5 space-y-2">
                <Users className="w-6 h-6 text-cyan-400" />
                <h4 className="text-xs font-bold text-white">Unlimited Profiles</h4>
                <p className="text-[11px] text-slate-400">
                  Create dedicated profiles for Personal, Work, Family members, or Teams with custom avatars and color accents.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-surface-900 border border-white/5 space-y-2">
                <Lock className="w-6 h-6 text-amber-400" />
                <h4 className="text-xs font-bold text-white">PIN Protection</h4>
                <p className="text-[11px] text-slate-400">
                  Set optional 4-digit PIN locks on private profiles to prevent other users on shared devices from accessing them.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-surface-900 border border-white/5 space-y-2">
                <Send className="w-6 h-6 text-emerald-400" />
                <h4 className="text-xs font-bold text-white">Cross-User Transfers</h4>
                <p className="text-[11px] text-slate-400">
                  Transfer any downloaded video or photo directly from your profile into another user's vault with 1 click.
                </p>
              </div>
            </div>
          </div>

          {/* Device Linking & QR Scan */}
          <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <QrCode className="w-5 h-5 text-cyan-400" />
              <span>Instant Cross-Device Pairing</span>
            </h3>
            
            <p className="text-xs text-slate-300">
              Each user profile generates a scannable QR code and Pairing ID. Scanning the QR code with your phone camera or entering the ID in the Chrome Extension links that device directly into that user profile.
            </p>
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
              02:00 AM Multi-User Storage Pruning
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              To keep your Turso Cloud database well within the free tier forever without manual upkeep, OmniGrab Pro executes an automated cleanup cron job at <strong className="text-amber-300">02:00 AM daily</strong> across all user profiles.
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
                  <li>All User Profiles (`user_profiles`)</li>
                  <li>User Vaults & PINs (`user_vaults`)</li>
                  <li>Saved Bookmarks (`saved_bookmarks`)</li>
                  <li>User Settings (`user_settings`)</li>
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
              <span>Multi-User API Endpoints</span>
            </h3>
            
            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 rounded-xl bg-surface-900 border border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-cyan-400 font-bold">GET/POST</span> <span className="text-white">/api/turso/profiles</span>
                </div>
                <span className="text-slate-400 text-[11px]">Manage user profiles & roles</span>
              </div>

              <div className="p-3 rounded-xl bg-surface-900 border border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-emerald-400 font-bold">POST</span> <span className="text-white">/api/turso/transfer</span>
                </div>
                <span className="text-slate-400 text-[11px]">Cross-profile media transfer</span>
              </div>

              <div className="p-3 rounded-xl bg-surface-900 border border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-cyan-400 font-bold">GET/POST</span> <span className="text-white">/api/turso/history</span>
                </div>
                <span className="text-slate-400 text-[11px]">User-scoped download history</span>
              </div>

              <div className="p-3 rounded-xl bg-surface-900 border border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-amber-400 font-bold">GET/POST</span> <span className="text-white">/api/turso/bookmarks</span>
                </div>
                <span className="text-slate-400 text-[11px]">User-scoped saved bookmarks</span>
              </div>

              <div className="p-3 rounded-xl bg-surface-900 border border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-rose-400 font-bold">POST</span> <span className="text-white">/api/cron/midnight-prune</span>
                </div>
                <span className="text-slate-400 text-[11px]">02:00 AM multi-user storage cleanup</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
