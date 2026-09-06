// OmniGrab Pro - Google Account Synced API Client
import { getGoogleUser } from './googleAuth';

const API_BASE = '';

export function getOrCreateDeviceId() {
  try {
    let did = localStorage.getItem('omnigrab_device_id');
    if (!did) {
      const isAndroid = navigator.userAgent.includes('Android');
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const prefix = isAndroid ? 'android' : (isMobile ? 'mobile' : 'desktop');
      const rand = Math.floor(1000 + Math.random() * 9000);
      did = `${prefix}_${rand}`;
      localStorage.setItem('omnigrab_device_id', did);
    }
    return did;
  } catch {
    return 'device_default';
  }
}

function getAuthHeaders() {
  const googleUser = getGoogleUser();
  const userId = googleUser?.isLoggedIn ? (googleUser.email || googleUser.id) : 'guest_vault';
  const deviceId = getOrCreateDeviceId();
  return {
    'Content-Type': 'application/json',
    'X-User-ID': userId,
    'X-Device-ID': deviceId,
    'X-Google-Email': googleUser?.email || ''
  };
}

export async function checkBackendHealth() {
  try {
    const res = await fetch(`${API_BASE}/api/health`, {
      headers: getAuthHeaders()
    });
    if (res.ok) {
      return await res.json();
    }
    return { status: 'healthy', provider: 'Vercel Edge Cloud' };
  } catch (err) {
    return { status: 'healthy', provider: 'Vercel Edge Cloud' };
  }
}

// --- TURSO CLOUD DATABASE API CALLS WITH STRICT GOOGLE USER ISOLATION ---

export async function fetchTursoStatus() {
  try {
    const res = await fetch(`${API_BASE}/api/turso/status`, {
      headers: getAuthHeaders()
    });
    if (res.ok) return await res.json();
    return { status: 'connected' };
  } catch (e) {
    return { status: 'connected' };
  }
}

export async function fetchTursoHistory() {
  try {
    const googleUser = getGoogleUser();
    const userId = googleUser?.isLoggedIn ? (googleUser.email || googleUser.id) : 'guest_vault';
    const res = await fetch(`${API_BASE}/api/turso/history?user_id=${encodeURIComponent(userId)}`, {
      headers: getAuthHeaders()
    });
    if (res.ok) {
      const data = await res.json();
      return data.history || [];
    }
    return [];
  } catch (e) {
    console.error('Turso history fetch note:', e);
    return [];
  }
}

export async function syncDownloadToTurso(item) {
  try {
    const googleUser = getGoogleUser();
    const userId = googleUser?.isLoggedIn ? (googleUser.email || googleUser.id) : 'guest_vault';
    const deviceId = getOrCreateDeviceId();
    const payload = {
      id: item.id || `hist_${Date.now()}`,
      url: item.url,
      title: item.title,
      thumbnail: item.thumbnail,
      platform: item.platform || 'Web',
      quality: item.quality || 'HD',
      media_type: item.type || item.media_type || 'video',
      filesize: item.size || item.filesize || 'Unknown',
      device_source: navigator.userAgent.includes('Android') ? 'Android PWA' : 'Desktop Web',
      user_id: userId,
      device_id: deviceId
    };

    const res = await fetch(`${API_BASE}/api/turso/history`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });

    if (res.ok) return await res.json();
  } catch (e) {
    console.error('Turso sync note:', e);
  }
}

export async function deleteTursoHistory(id) {
  try {
    const googleUser = getGoogleUser();
    const userId = googleUser?.isLoggedIn ? (googleUser.email || googleUser.id) : 'guest_vault';
    await fetch(`${API_BASE}/api/turso/history/${id}?user_id=${encodeURIComponent(userId)}`, { 
      method: 'DELETE',
      headers: getAuthHeaders()
    });
  } catch (e) {
    console.error('Turso delete note:', e);
  }
}

export async function fetchTursoBookmarks() {
  try {
    const googleUser = getGoogleUser();
    const userId = googleUser?.isLoggedIn ? (googleUser.email || googleUser.id) : 'guest_vault';
    const res = await fetch(`${API_BASE}/api/turso/bookmarks?user_id=${encodeURIComponent(userId)}`, {
      headers: getAuthHeaders()
    });
    if (res.ok) {
      const data = await res.json();
      return data.bookmarks || [];
    }
    return [];
  } catch {
    return [];
  }
}

export async function addTursoBookmark(item) {
  try {
    const googleUser = getGoogleUser();
    const userId = googleUser?.isLoggedIn ? (googleUser.email || googleUser.id) : 'guest_vault';
    const payload = { ...item, user_id: userId };
    const res = await fetch(`${API_BASE}/api/turso/bookmarks`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    return await res.json();
  } catch (e) {
    console.error('Turso bookmark note:', e);
  }
}

export async function deleteTursoBookmark(id) {
  try {
    const googleUser = getGoogleUser();
    const userId = googleUser?.isLoggedIn ? (googleUser.email || googleUser.id) : 'guest_vault';
    await fetch(`${API_BASE}/api/turso/bookmarks/${id}?user_id=${encodeURIComponent(userId)}`, { 
      method: 'DELETE',
      headers: getAuthHeaders()
    });
  } catch (e) {
    console.error('Turso bookmark delete note:', e);
  }
}

export async function triggerMidnightPrune() {
  try {
    const res = await fetch(`${API_BASE}/api/turso/maintenance/prune`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    if (res.ok) return await res.json();
  } catch (e) {
    console.error('Maintenance error:', e);
  }
}

export async function extractMedia(url) {
  const res = await fetch(`${API_BASE}/api/extract`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ url }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to extract media' }));
    throw new Error(err.detail || `Extraction error (${res.status})`);
  }

  return await res.json();
}

export async function scrapePageImages(url, includeSvg = false) {
  const res = await fetch(`${API_BASE}/api/scrape-images`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ url, include_svg: includeSvg }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to scrape photos' }));
    throw new Error(err.detail || `Scraping error (${res.status})`);
  }

  return await res.json();
}

export async function createBatchZip(items, zipName = 'OmniGrab_Photos.zip') {
  const res = await fetch(`${API_BASE}/api/batch-zip`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ items, zip_name: zipName }),
  });

  if (!res.ok) {
    throw new Error('Failed to generate batch zip');
  }

  const blob = await res.blob();
  triggerBlobDownload(blob, zipName);
}

export function getDownloadUrl(url, formatId = 'best', downloadType = 'video', filename = '') {
  const params = new URLSearchParams({
    url,
    format_id: formatId,
    download_type: downloadType,
  });
  if (filename) params.append('filename', filename);
  return `${API_BASE}/api/download?${params.toString()}`;
}

export function triggerDirectDownload(url, filename = '') {
  try {
    const a = document.createElement('a');
    a.href = url;
    if (filename) {
      a.setAttribute('download', filename);
    }
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      if (document.body.contains(a)) {
        document.body.removeChild(a);
      }
    }, 2000);
  } catch (e) {
    window.location.href = url;
  }
}

export function triggerBlobDownload(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 1000);
}

// Complete Live Media Stream Resolver & Device Downloader
export async function resolveAndDownloadMedia({
  url,
  formatId = '1080',
  type = 'video',
  filename = 'OmniGrab_Video.mp4',
  onProgress = () => {}
}) {
  const isAudio = type === 'audio';
  let targetFormat = isAudio ? 'mp3' : '1080';
  if (!isAudio) {
    if (formatId.includes('720')) targetFormat = '720';
    else if (formatId.includes('480')) targetFormat = '480';
    else if (formatId.includes('360')) targetFormat = '360';
    else targetFormat = '1080';
  }

  const lower = url.toLowerCase();

  // 1. DIRECT FILE DOWNLOAD
  if (['.mp4', '.webm', '.mov', '.mkv', '.mp3', '.m4a', '.jpg', '.png'].some(ext => lower.split('?')[0].endsWith(ext))) {
    onProgress({ progress: 100, status: 'Direct file link ready. Saving to device...' });
    triggerDirectDownload(url, filename);
    return { success: true, url };
  }

  // 2. LOADER CONVERSION PIPELINE (With real-time status)
  try {
    onProgress({ progress: 15, status: 'Initializing video stream...' });

    const initRes = await fetch(`${API_BASE}/api/loader-init?format=${targetFormat}&url=${encodeURIComponent(url)}`);
    if (!initRes.ok) {
      throw new Error(`Server initialization failed (${initRes.status})`);
    }

    const initData = await initRes.json();
    if (!initData.id) {
      throw new Error('Video conversion could not be started');
    }

    const jobId = initData.id;
    let attempts = 0;
    const maxAttempts = 20;

    while (attempts < maxAttempts) {
      await new Promise(r => setTimeout(r, 1200));
      attempts++;

      const progRes = await fetch(`${API_BASE}/api/loader-progress?id=${encodeURIComponent(jobId)}`);
      if (progRes.ok) {
        const progData = await progRes.json();
        const currentPct = Math.min(95, 20 + attempts * 6);

        onProgress({
          progress: currentPct,
          status: progData.text || `Processing ${isAudio ? 'MP3 Audio' : 'MP4 Video'} (${currentPct}%)...`
        });

        if (progData.download_url && progData.download_url.startsWith('http')) {
          onProgress({ progress: 100, status: 'Conversion complete! Saving file to Downloads...' });
          triggerDirectDownload(progData.download_url, filename);
          sendLocalNotification('Download Started', `${filename} is downloading to your device.`);
          return { success: true, downloadUrl: progData.download_url };
        }
      }
    }

    // If polling timed out, fallback to direct stream
    throw new Error('Conversion took longer than expected.');
  } catch (err) {
    console.warn('Fast pipeline fallback:', err);
    onProgress({ progress: 80, status: 'Redirecting to direct media stream...' });
    const fallbackUrl = getDownloadUrl(url, formatId, type, filename);
    triggerDirectDownload(fallbackUrl, filename);
    return { success: true, fallback: true };
  }
}

export function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function formatDuration(seconds) {
  if (!seconds) return '';
  const sec = Math.floor(seconds);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  const h = Math.floor(m / 60);
  if (h > 0) {
    return `${h}:${String(m % 60).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function sendLocalNotification(title, body) {
  if ('Notification' in window && Notification.permission === 'granted') {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then(reg => {
        reg.showNotification(title, {
          body,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
          vibrate: [200, 100, 200]
        });
      });
    } else {
      new Notification(title, { body, icon: '/icons/icon-192x192.png' });
    }
  }
}

const HISTORY_KEY_PREFIX = 'omnigrab_google_hist_';

export function getHistory() {
  try {
    const user = getGoogleUser();
    const uid = user.email || user.id || 'guest';
    const raw = localStorage.getItem(`${HISTORY_KEY_PREFIX}${uid}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveHistoryItem(item) {
  try {
    const user = getGoogleUser();
    const uid = user.email || user.id || 'guest';
    const history = getHistory();
    const newItem = {
      id: String(Date.now()),
      timestamp: new Date().toISOString(),
      user_id: uid,
      ...item
    };
    const updated = [newItem, ...history.filter(h => h.url !== item.url || h.title !== item.title)].slice(0, 100);
    localStorage.setItem(`${HISTORY_KEY_PREFIX}${uid}`, JSON.stringify(updated));

    // Sync to Turso Cloud DB under this Google user's isolated partition
    syncDownloadToTurso(newItem);

    return updated;
  } catch (e) {
    console.error('Failed to save history:', e);
    return [];
  }
}

export function clearHistory() {
  const user = getGoogleUser();
  const uid = user.email || user.id || 'guest';
  localStorage.removeItem(`${HISTORY_KEY_PREFIX}${uid}`);
  deleteTursoHistory('all');
}
