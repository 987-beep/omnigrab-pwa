// Multi-User Management & Tenant Vault Sync for OmniGrab Pro

const ACTIVE_USER_KEY = 'omnigrab_active_user_id';
const PROFILES_STORAGE_KEY = 'omnigrab_user_profiles_v3';

export const DEFAULT_PROFILES = [
  {
    id: 'usr_owner_01',
    name: 'Personal Account',
    avatar: '⚡',
    color: 'cyan',
    role: 'Owner',
    vaultPin: '',
    createdAt: new Date().toISOString()
  },
  {
    id: 'usr_work_02',
    name: 'Work & Research',
    avatar: '💼',
    color: 'purple',
    role: 'Member',
    vaultPin: '',
    createdAt: new Date().toISOString()
  },
  {
    id: 'usr_family_03',
    name: 'Shared Family Vault',
    avatar: '🌟',
    color: 'amber',
    role: 'Shared',
    vaultPin: '',
    createdAt: new Date().toISOString()
  }
];

export function getLocalProfiles() {
  try {
    const raw = localStorage.getItem(PROFILES_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(DEFAULT_PROFILES));
      return DEFAULT_PROFILES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_PROFILES;
  } catch {
    return DEFAULT_PROFILES;
  }
}

export function saveLocalProfiles(profiles) {
  try {
    localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(profiles));
  } catch (e) {
    console.error('Failed to save profiles to localStorage', e);
  }
}

export function getActiveUserProfile() {
  const profiles = getLocalProfiles();
  const activeId = localStorage.getItem(ACTIVE_USER_KEY) || profiles[0]?.id || 'usr_owner_01';
  const found = profiles.find(p => p.id === activeId);
  if (found) return found;
  return profiles[0] || DEFAULT_PROFILES[0];
}

export function setActiveUserProfile(userId) {
  localStorage.setItem(ACTIVE_USER_KEY, userId);
  // Dispatch custom event so all active components instantly react to profile changes
  window.dispatchEvent(new CustomEvent('omnigrab-user-changed', { detail: { userId } }));
}

export function createNewUserProfile(data) {
  const profiles = getLocalProfiles();
  const randomHex = Math.random().toString(36).substring(2, 9);
  const newProfile = {
    id: `usr_${randomHex}`,
    name: data.name || 'New User',
    avatar: data.avatar || '🚀',
    color: data.color || 'cyan',
    role: data.role || 'Member',
    vaultPin: data.vaultPin || '',
    createdAt: new Date().toISOString()
  };

  const updated = [...profiles, newProfile];
  saveLocalProfiles(updated);
  return newProfile;
}

export function updateUserProfile(id, updates) {
  const profiles = getLocalProfiles();
  const updated = profiles.map(p => {
    if (p.id === id) {
      return { ...p, ...updates };
    }
    return p;
  });
  saveLocalProfiles(updated);
  return updated.find(p => p.id === id);
}

export function deleteUserProfile(id) {
  const profiles = getLocalProfiles();
  if (profiles.length <= 1) {
    throw new Error('Cannot delete the last remaining user profile.');
  }
  const updated = profiles.filter(p => p.id !== id);
  saveLocalProfiles(updated);

  const activeId = localStorage.getItem(ACTIVE_USER_KEY);
  if (activeId === id) {
    setActiveUserProfile(updated[0].id);
  }
  return updated;
}

export function getColorClasses(color) {
  switch (color) {
    case 'purple':
      return {
        badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
        ring: 'ring-purple-500',
        glow: 'shadow-glow-purple',
        gradient: 'from-purple-600 to-indigo-600',
        text: 'text-purple-400',
        border: 'border-purple-500/40',
        bg: 'bg-purple-950/40'
      };
    case 'emerald':
      return {
        badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        ring: 'ring-emerald-500',
        glow: 'shadow-glow-emerald',
        gradient: 'from-emerald-600 to-teal-600',
        text: 'text-emerald-400',
        border: 'border-emerald-500/40',
        bg: 'bg-emerald-950/40'
      };
    case 'amber':
      return {
        badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        ring: 'ring-amber-500',
        glow: 'shadow-glow-amber',
        gradient: 'from-amber-600 to-orange-600',
        text: 'text-amber-400',
        border: 'border-amber-500/40',
        bg: 'bg-amber-950/40'
      };
    case 'rose':
      return {
        badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
        ring: 'ring-rose-500',
        glow: 'shadow-glow-rose',
        gradient: 'from-rose-600 to-pink-600',
        text: 'text-rose-400',
        border: 'border-rose-500/40',
        bg: 'bg-rose-950/40'
      };
    case 'cyan':
    default:
      return {
        badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
        ring: 'ring-cyan-500',
        glow: 'shadow-glow-cyan',
        gradient: 'from-brand-600 to-cyan-600',
        text: 'text-cyan-400',
        border: 'border-cyan-500/40',
        bg: 'bg-cyan-950/40'
      };
  }
}
