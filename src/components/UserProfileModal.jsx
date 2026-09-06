import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Lock, 
  Key, 
  Trash2, 
  CheckCircle2, 
  Smartphone, 
  Laptop, 
  Sparkles, 
  QrCode, 
  X,
  Clock,
  ArrowRight,
  Database,
  Layers,
  Palette
} from 'lucide-react';
import { 
  getLocalProfiles, 
  saveLocalProfiles, 
  getActiveUserProfile, 
  setActiveUserProfile, 
  createNewUserProfile, 
  updateUserProfile, 
  deleteUserProfile,
  getColorClasses 
} from '../utils/userManagement';
import { syncUserProfileToTurso } from '../utils/api';

const AVATAR_OPTIONS = ['⚡', '💼', '🌟', '🎬', '🚀', '💎', '🎧', '🎮', '🛡️', '👑', '🔥', '🌈', '🦊', '🦉', '🎯', '🪐'];
const COLOR_OPTIONS = [
  { id: 'cyan', label: 'Neon Cyan', bg: 'bg-cyan-500' },
  { id: 'purple', label: 'Electric Purple', bg: 'bg-purple-500' },
  { id: 'emerald', label: 'Emerald Green', bg: 'bg-emerald-500' },
  { id: 'amber', label: 'Amber Gold', bg: 'bg-amber-500' },
  { id: 'rose', label: 'Vibrant Rose', bg: 'bg-rose-500' }
];

export default function UserProfileModal({ isOpen, onClose, showToast, onUserSwitched }) {
  const [activeTab, setActiveTab] = useState('profiles'); // 'profiles', 'create', 'pair'
  const [profiles, setProfiles] = useState(getLocalProfiles());
  const activeUser = getActiveUserProfile();

  // New Profile Form State
  const [newName, setNewName] = useState('');
  const [newAvatar, setNewAvatar] = useState('⚡');
  const [newColor, setNewColor] = useState('cyan');
  const [newRole, setNewRole] = useState('Member');
  const [newPin, setNewPin] = useState('');

  // Pin Unlock Prompt State
  const [pinPromptUser, setPinPromptUser] = useState(null);
  const [enteredPin, setEnteredPin] = useState('');

  if (!isOpen) return null;

  const handleSwitchProfile = (profile) => {
    if (profile.id === activeUser.id) {
      showToast(`Already active as ${profile.name}`, 'info');
      return;
    }

    if (profile.vaultPin && profile.vaultPin.trim() !== '') {
      setPinPromptUser(profile);
      setEnteredPin('');
      return;
    }

    applySwitch(profile);
  };

  const applySwitch = (profile) => {
    setActiveUserProfile(profile.id);
    showToast(`Switched profile to ${profile.name}!`, 'success');
    if (onUserSwitched) onUserSwitched(profile);
    onClose();
  };

  const handlePinSubmit = (e) => {
    e.preventDefault();
    if (!pinPromptUser) return;
    if (enteredPin === pinPromptUser.vaultPin) {
      applySwitch(pinPromptUser);
      setPinPromptUser(null);
    } else {
      showToast('Incorrect PIN! Access denied.', 'error');
    }
  };

  const handleCreateProfile = async (e) => {
    e.preventDefault();
    if (!newName.trim()) {
      showToast('Please enter a profile name', 'error');
      return;
    }

    const created = createNewUserProfile({
      name: newName.trim(),
      avatar: newAvatar,
      color: newColor,
      role: newRole,
      vaultPin: newPin.trim()
    });

    // Sync to Turso cloud
    await syncUserProfileToTurso(created);

    setProfiles(getLocalProfiles());
    showToast(`Created profile "${created.name}"!`, 'success');
    setActiveUserProfile(created.id);
    if (onUserSwitched) onUserSwitched(created);
    
    // Reset Form
    setNewName('');
    setNewPin('');
    setActiveTab('profiles');
  };

  const handleDelete = (id, name) => {
    if (profiles.length <= 1) {
      showToast('Cannot delete the last remaining profile.', 'error');
      return;
    }
    if (window.confirm(`Are you sure you want to delete profile "${name}"?`)) {
      try {
        const remaining = deleteUserProfile(id);
        setProfiles(remaining);
        showToast(`Profile "${name}" deleted.`, 'info');
        if (onUserSwitched) onUserSwitched(getActiveUserProfile());
      } catch (err) {
        showToast(err.message, 'error');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="glass-panel w-full max-w-2xl rounded-3xl border border-brand-500/30 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-surface-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-cyan-500 p-[1.5px] flex items-center justify-center">
              <div className="w-full h-full bg-surface-950 rounded-[10px] flex items-center justify-center">
                <Users className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <span>Multi-User Profile Manager</span>
                <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold">
                  TURSO ISOLATED
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Switch profiles, create family vaults, or pair multiple devices.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-surface-900 hover:bg-surface-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-white/5 bg-surface-950/40">
          <button
            onClick={() => setActiveTab('profiles')}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'profiles'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Profiles ({profiles.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('create')}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'create'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Add New User</span>
          </button>

          <button
            onClick={() => setActiveTab('pair')}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'pair'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Pair Device / Extension</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* TAB 1: PROFILES LIST */}
          {activeTab === 'profiles' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {profiles.map((p) => {
                  const isActive = p.id === activeUser.id;
                  const colors = getColorClasses(p.color);

                  return (
                    <div
                      key={p.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 relative ${
                        isActive
                          ? `${colors.bg} ${colors.border} shadow-glow`
                          : 'glass-panel border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-surface-900 border border-white/10 flex items-center justify-center text-2xl shadow-inner">
                            {p.avatar || '⚡'}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h4 className="text-sm font-black text-white">{p.name}</h4>
                              {p.vaultPin && <Lock className="w-3.5 h-3.5 text-amber-400" />}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${colors.badge}`}>
                                {p.role}
                              </span>
                              <span className="text-[10px] font-mono text-slate-400 truncate max-w-[80px]">
                                {p.id}
                              </span>
                            </div>
                          </div>
                        </div>

                        {isActive ? (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>Active</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => handleDelete(p.id, p.name)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-surface-900 transition-colors"
                            title="Delete profile"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400">
                          {p.vaultPin ? 'Protected by PIN' : 'Unrestricted Access'}
                        </span>

                        {!isActive && (
                          <button
                            onClick={() => handleSwitchProfile(p)}
                            className="px-3 py-1.5 rounded-xl bg-surface-900 hover:bg-brand-600 hover:text-white text-cyan-300 font-bold text-xs border border-white/10 transition-all flex items-center gap-1"
                          >
                            <span>Switch</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* PIN Prompt Modal Overlay */}
              {pinPromptUser && (
                <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300 flex items-center gap-2">
                      <Lock className="w-4 h-4 text-amber-400" />
                      <span>Enter 4-Digit PIN for "{pinPromptUser.name}"</span>
                    </span>
                    <button
                      onClick={() => setPinPromptUser(null)}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>
                  <form onSubmit={handlePinSubmit} className="flex gap-2">
                    <input
                      type="password"
                      maxLength={6}
                      autoFocus
                      placeholder="Enter Profile PIN"
                      value={enteredPin}
                      onChange={(e) => setEnteredPin(e.target.value)}
                      className="flex-1 bg-surface-950 border border-amber-500/40 rounded-xl px-4 py-2 text-sm text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-surface-950 font-black text-xs"
                    >
                      Unlock & Switch
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CREATE PROFILE */}
          {activeTab === 'create' && (
            <form onSubmit={handleCreateProfile} className="space-y-4">
              
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Profile / User Name</label>
                <input
                  type="text"
                  placeholder="e.g. Work Vault, Sarah, Family Lounge..."
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-surface-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Choose Avatar Icon</label>
                <div className="flex flex-wrap gap-2">
                  {AVATAR_OPTIONS.map((av) => (
                    <button
                      key={av}
                      type="button"
                      onClick={() => setNewAvatar(av)}
                      className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${
                        newAvatar === av
                          ? 'bg-brand-600 border-2 border-cyan-400 scale-110 shadow-glow'
                          : 'bg-surface-900 hover:bg-surface-800 border border-white/10'
                      }`}
                    >
                      {av}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Theme Color Accent</label>
                <div className="flex gap-3">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setNewColor(c.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all ${
                        newColor === c.id
                          ? 'bg-surface-900 border-white text-white shadow-glow'
                          : 'bg-surface-950 border-white/10 text-slate-400'
                      }`}
                    >
                      <span className={`w-3.5 h-3.5 rounded-full ${c.bg}`} />
                      <span>{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Role Type</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full bg-surface-900 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="Owner">Owner (Full Admin)</option>
                    <option value="Member">Member (Standard User)</option>
                    <option value="Shared">Shared / Family (Collaborative)</option>
                    <option value="Guest">Guest (Temporary)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Optional PIN Lock
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    placeholder="e.g. 1234 (Leave blank if open)"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    className="w-full bg-surface-900 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-500 font-mono focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-600 to-cyan-600 hover:from-brand-500 hover:to-cyan-500 text-white font-black text-sm shadow-glow flex items-center justify-center gap-2 mt-4"
              >
                <UserPlus className="w-4 h-4" />
                <span>Create & Switch to Profile</span>
              </button>
            </form>
          )}

          {/* TAB 3: PAIR DEVICE / EXTENSION */}
          {activeTab === 'pair' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-surface-900 border border-white/10 flex flex-col sm:flex-row items-center gap-6">
                
                {/* QR Code */}
                <div className="bg-surface-950 p-3 rounded-2xl border border-cyan-500/30 shadow-glow-cyan flex-shrink-0">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`${window.location.origin}?user_id=${activeUser.id}`)}&margin=10&color=06b6d4&bgcolor=090d16`}
                    alt="Scan to pair device"
                    className="w-32 h-32 rounded-xl object-contain"
                  />
                </div>

                <div className="space-y-2 text-center sm:text-left">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold">
                    <Smartphone className="w-3 h-3 text-cyan-400" />
                    <span>Instant Camera Scan</span>
                  </div>
                  <h4 className="text-base font-bold text-white">
                    Link Phone or Extension to "{activeUser.name}"
                  </h4>
                  <p className="text-xs text-slate-400">
                    Scan with iPhone/Android camera to open OmniGrab PWA directly logged into this user account.
                  </p>
                  <div className="pt-2 flex items-center gap-2 font-mono text-xs">
                    <span className="text-slate-400">User Sync ID:</span>
                    <span className="px-2 py-1 rounded bg-surface-950 text-cyan-300 font-bold border border-white/10">
                      {activeUser.id}
                    </span>
                  </div>
                </div>

              </div>

              <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 text-xs text-slate-300 space-y-1">
                <div className="font-bold text-amber-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>02:00 AM Storage Saver Multi-User Protection:</span>
                </div>
                <p>
                  Downloads are purged at 02:00 AM to save Turso storage, but all user profiles, PIN locks, bookmarks, and device pairings are <strong>preserved permanently</strong>.
                </p>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
