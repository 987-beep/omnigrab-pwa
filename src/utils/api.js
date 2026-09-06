// API & Utilities Client for OmniGrab Pro

const API_BASE = ''; // Uses relative /api which Vite/Vercel proxies to backend

export async function checkBackendHealth() {
  try {
    const res = await fetch(`${API_BASE}/api/health`);
    if (res.ok) {
      return await res.json();
    }
    return { status: 'offline' };
  } catch (err) {
    return { status: 'offline', error: err.message };
  }
}

export async function extractMedia(url) {
  const res = await fetch(`${API_BASE}/api/extract`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
    headers: { 'Content-Type': 'application/json' },
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
    headers: { 'Content-Type': 'application/json' },
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
    
    // Check if browser supports readable stream
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

    // Determine mime
    let mimeType = 'video/mp4';
    if (downloadType === 'audio') mimeType = 'audio/mpeg';
    if (filename && filename.endsWith('.zip')) mimeType = 'application/zip';
    if (filename && filename.endsWith('.jpg')) mimeType = 'image/jpeg';
    if (filename && filename.endsWith('.png')) mimeType = 'image/png';

    const blob = new Blob(chunks, { type: mimeType });
    triggerBlobDownload(blob, filename || `omnigrab_${Date.now()}.${downloadType === 'audio' ? 'mp3' : 'mp4'}`);

    onProgress({ progress: 100, status: 'Download Complete & Saved!', bytes: receivedBytes, total: receivedBytes });

    // Send push notification if permitted
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

// LocalStorage Download History Management
const HISTORY_KEY = 'omnigrab_download_history_v2';

export function getHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveHistoryItem(item) {
  try {
    const history = getHistory();
    const newItem = {
      id: String(Date.now()),
      timestamp: new Date().toISOString(),
      ...item
    };
    const updated = [newItem, ...history.filter(h => h.url !== item.url || h.title !== item.title)].slice(0, 100);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Failed to save history:', e);
    return [];
  }
}

export function clearHistory() {
  localStorage.removeItem(HISTORY_KEY);
}
