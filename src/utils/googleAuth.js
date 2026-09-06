// Google Account Authentication & Isolated Cloud Vault System for OmniGrab Pro

const GOOGLE_USER_KEY = 'omnigrab_google_auth_user_v1';

// Default guest account if not logged in
export const GUEST_USER = {
  id: 'guest_vault',
  email: 'guest@omnigrab.local',
  name: 'Local Guest Vault',
  picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
  isLoggedIn: false,
  role: 'Guest'
};

export function getGoogleUser() {
  try {
    const raw = localStorage.getItem(GOOGLE_USER_KEY);
    if (!raw) return GUEST_USER;
    const parsed = JSON.parse(raw);
    return parsed && parsed.email ? { ...parsed, isLoggedIn: true } : GUEST_USER;
  } catch {
    return GUEST_USER;
  }
}

export function saveGoogleUser(userData) {
  try {
    const user = {
      id: userData.id || userData.sub || `g_usr_${Math.random().toString(36).substring(2, 10)}`,
      email: userData.email,
      name: userData.name || userData.email.split('@')[0],
      picture: userData.picture || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(userData.email)}`,
      isLoggedIn: true,
      loginTime: new Date().toISOString()
    };
    localStorage.setItem(GOOGLE_USER_KEY, JSON.stringify(user));
    window.dispatchEvent(new CustomEvent('omnigrab-auth-changed', { detail: { user } }));
    return user;
  } catch (e) {
    console.error('Failed to save Google user:', e);
    return GUEST_USER;
  }
}

export function logoutGoogleUser() {
  localStorage.removeItem(GOOGLE_USER_KEY);
  window.dispatchEvent(new CustomEvent('omnigrab-auth-changed', { detail: { user: GUEST_USER } }));
  return GUEST_USER;
}

// Parse Google JWT Credential Token (from Google Identity Services)
export function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Invalid Google JWT token:', e);
    return null;
  }
}
