// Multi-User API & Utilities Client for OmniGrab Pro
import { getActiveUserProfile } from './userManagement';

const API_BASE = '';

// --- DEVICE & USER IDENTITY ---

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

function getAuthHeaders(overrideUserId = null) {
  const activeUser = getActiveUserProfile();
  const userId = overrideUserId || activeUser?.id || 'usr_owner_01';
  const deviceId = getOrCreateDeviceId();
  return {
    'Content-Type': 'application/json',
    'X-User-ID': userId,
    'X-Device-ID': deviceId
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
    return { status: 'offline' };
  } catch (err) {
    return { status: 'offline', error: err.message };
  }
}

// TURSO CLOUD DATABASE API CALLS WITH MULTI-USER TENANT ISOLATION

export async function fetchTursoStatus() {
  try {
    const res = await fetch(`${API_BASE}/api/turso/status`, {
      headers: getAuthHeaders()
    });
    if (res.ok) return await res.json();
    return { status: 'error' };
  } catch (e) {
    return { status: 'error', error: e.message };
  }
}

export async function fetchTursoProfiles() {
  try {
    const res = await fetch(`${API_BASE}/api/turso/profiles`, {
      headers: getAuthHeaders()
    });
    if (res.ok) {
      const data = await res.json();
      return data.profiles || [];
    }
    return [];
  } catch (e) {
    console.error('Turso profiles fetch error:', e);
    return [];
  }
}

export async function syncUserProfileToTurso(profile) {
  try {
    const res = await fetch(`${API_BASE}/api/turso/profiles`, {
      method: 'POST',
      headers: getAuthHeaders(profile.id),
      body: JSON.stringify(profile)
    });
    if (res.ok) return await res.json();
  } catch (e) {
    console.error('Turso profile sync note:', e);
  }
}

export async function fetchTursoHistory(targetUserId = null) {
  try {
    const activeUser = getActiveUserProfile();
    const userId = targetUserId || activeUser?.id || 'usr_owner_01';
    const res = await fetch(`${API_BASE}/api/turso/history?user_id=${encodeURIComponent(userId)}`, {
      headers: getAuthHeaders(userId)
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

export async function syncDownloadToTurso(item, targetUserId = null) {
  try {
    const activeUser = getActiveUserProfile();
    const userId = targetUserId || activeUser?.id || 'usr_owner_01';
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
      headers: getAuthHeaders(userId),
      body: JSON.stringify(payload)
    });

    if (res.ok) return await res.json();
  } catch (e) {
    console.error('Turso sync note:', e);
  }
}

export async function deleteTursoHistory(id, targetUserId = null) {
  try {
    const activeUser = getActiveUserProfile();
    const userId = targetUserId || activeUser?.id || 'usr_owner_01';
    await fetch(`${API_BASE}/api/turso/history/${id}?user_id=${encodeURIComponent(userId)}`, { 
      method: 'DELETE',
      headers: getAuthHeaders(userId)
    });
  } catch (e) {
    console.error('Turso delete note:', e);
  }
}

export async function fetchTursoBookmarks(targetUserId = null) {
  try {
    const activeUser = getActiveUserProfile();
    const userId = targetUserId || activeUser?.id || 'usr_owner_01';
    const res = await fetch(`${API_BASE}/api/turso/bookmarks?user_id=${encodeURIComponent(userId)}`, {
      headers: getAuthHeaders(userId)
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

export async function addTursoBookmark(item, targetUserId = null) {
  try {
    const activeUser = getActiveUserProfile();
    const userId = targetUserId || activeUser?.id || 'usr_owner_01';
    const payload = { ...item, user_id: userId };
    const res = await fetch(`${API_BASE}/api/turso/bookmarks`, {
      method: 'POST',
      headers: getAuthHeaders(userId),
      body: JSON.stringify(payload)
    });
    return await res.json();
  } catch (e) {
    console.error('Turso bookmark note:', e);
  }
}

export async function deleteTursoBookmark(id, targetUserId = null) {
  try {
    const activeUser = getActiveUserProfile();
    const userId = targetUserId || activeUser?.id || 'usr_owner_01';
    await fetch(`${API_BASE}/api/turso/bookmarks/${id}?user_id=${encodeURIComponent(userId)}`, { 
      method: 'DELETE',
      headers: getAuthHeaders(userId)
    });
  } catch (e) {
    console.error('Turso bookmark delete note:', e);
  }
}

export async function transferItemToUser(item, targetUserId) {
  try {
    const activeUser = getActiveUserProfile();
    const res = await fetch(`${API_BASE}/api/turso/transfer`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        from_user_id: activeUser.id,
        to_user_id: targetUserId,
        url: item.url,
        title: item.title,
        thumbnail: item.thumbnail,
        platform: item.platform || 'Web'
      })
    });
    return await res.json();
  } catch (e) {
    console.error('Transfer note:', e);
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

export async function downloadWithProgress(url, formatId, downloadType, filename, onProgress) {
  const downloadApiUrl = getDownloadUrl(url, formatId, downloadType, filename);
  
  onProgress({ progress: 15, status: 'Connecting to high-speed stream...', bytes: 0, total: 0 });

  try {
    const response = await fetch(downloadApiUrl);
    if (!response.ok) {
      throw new Error(`Server returned status ${response.status}`);
    }

    const contentLength = response.headers.get('content-length');
    const total = contentLength ? parseInt(contentLength, 10) : 0;
    
    if (!response.body) {
      const blob = await response.blob();
      triggerBlobDownload(blob, filename || 'omnigrab_download.mp4');
      onProgress({ progress: 100, status: 'Completed!', bytes: total, total });
      return;
    }

    const reader = response.body.getReader();
    let receivedBytes = 0;
    const chunks = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      chunks.push(value);
      receivedBytes += value.length;

      let pct = total ? Math.round((receivedBytes / total) * 100) : Math.min(95, 20 + Math.round(receivedBytes / 500000));
      onProgress({
        progress: pct,
        status: `Downloading... ${formatBytes(receivedBytes)} ${total ? '/ ' + formatBytes(total) : ''}`,
        bytes: receivedBytes,
        total: total || receivedBytes
      });
    }

    onProgress({ progress: 98, status: 'Finalizing file packaging...', bytes: receivedBytes, total: receivedBytes });

    let mimeType = 'video/mp4';
    if (downloadType === 'audio') mimeType = 'audio/mpeg';
    if (filename && filename.endsWith('.zip')) mimeType = 'application/zip';
    if (filename && filename.endsWith('.jpg')) mimeType = 'image/jpeg';
    if (filename && filename.endsWith('.png')) mimeType = 'image/png';

    const blob = new Blob(chunks, { type: mimeType });
    triggerBlobDownload(blob, filename || `omnigrab_${Date.now()}.${downloadType === 'audio' ? 'mp3' : 'mp4'}`);

    onProgress({ progress: 100, status: 'Download Complete & Saved!', bytes: receivedBytes, total: receivedBytes });

    sendLocalNotification('Download Complete', `${filename || 'Media file'} is ready in your downloads!`);

    return true;
  } catch (err) {
    console.error('Download error:', err);
    throw err;
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

const HISTORY_KEY_PREFIX = 'omnigrab_hist_';

export function getHistory(userId = null) {
  try {
    const activeUser = getActiveUserProfile();
    const uid = userId || activeUser?.id || 'usr_owner_01';
    const raw = localStorage.getItem(`${HISTORY_KEY_PREFIX}${uid}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveHistoryItem(item, userId = null) {
  try {
    const activeUser = getActiveUserProfile();
    const uid = userId || activeUser?.id || 'usr_owner_01';
    const history = getHistory(uid);
    const newItem = {
      id: String(Date.now()),
      timestamp: new Date().toISOString(),
      user_id: uid,
      ...item
    };
    const updated = [newItem, ...history.filter(h => h.url !== item.url || h.title !== item.title)].slice(0, 100);
    localStorage.setItem(`${HISTORY_KEY_PREFIX}${uid}`, JSON.stringify(updated));

    // Sync to Turso Cloud DB under this user's isolated partition
    syncDownloadToTurso(newItem, uid);

    return updated;
  } catch (e) {
    console.error('Failed to save history:', e);
    return [];
  }
}

export function clearHistory(userId = null) {
  const activeUser = getActiveUserProfile();
  const uid = userId || activeUser?.id || 'usr_owner_01';
  localStorage.removeItem(`${HISTORY_KEY_PREFIX}${uid}`);
  deleteTursoHistory('all', uid);
}
