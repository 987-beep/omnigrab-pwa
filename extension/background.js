// OmniGrab Chrome Extension - Background Service Worker v2.5.0 with Turso Cloud Sync

const TURSO_DB_URL = "https://webextention-axuile.aws-ap-south-1.turso.io/v2/pipeline";
const TURSO_AUTH_TOKEN = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODg2Nzk0MzQsImlkIjoiMDFhMDc1OWEtMWQwMS03MTExLTlmOTItMDdiZjUxOTA4MzNjIiwia2lkIjoiZ3BKaE53cTF1TmQ5Z2Jjek9MOVZjaEQ4QTdxVzd4OTNoNWNWbkJObTJRdyIsInJpZCI6IjY0YzZjZjEwLThhZDgtNGM2Ni05MzA3LTkyY2NlMDU4YWJiYSJ9.f0GvIrNC5hQUTVOK3BLg0OEQ4otRHKHhyZip--7YyKRyOa4NorYQg6KfB4M9HDDI2ejP0KOlgxzmRgU75MnEBw";

async function syncToTurso(item) {
  try {
    const sql = `
      INSERT INTO downloads_history (id, url, title, thumbnail, platform, quality, media_type, filesize, device_source)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const itemId = `ext_${Date.now()}`;
    const payload = {
      requests: [{
        type: 'execute',
        stmt: {
          sql: sql.trim(),
          args: [
            { type: 'text', value: itemId },
            { type: 'text', value: item.url || '' },
            { type: 'text', value: item.title || 'Chrome Download' },
            { type: 'text', value: item.thumbnail || '' },
            { type: 'text', value: 'Chrome Ext' },
            { type: 'text', value: '1080p HD' },
            { type: 'text', value: item.mediaType === 'Video' ? 'video' : 'photo' },
            { type: 'text', value: 'Direct Stream' },
            { type: 'text', value: 'Chrome Extension' }
          ]
        }
      }]
    };

    await fetch(TURSO_DB_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TURSO_AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
  } catch (e) {
    console.log('Turso background sync note:', e);
  }
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'omnigrab-download-link',
    title: '⚡ OmniGrab: Download Video / Photo from this Link',
    contexts: ['link', 'video', 'image', 'audio', 'page']
  });

  chrome.contextMenus.create({
    id: 'omnigrab-scrape-page',
    title: '📸 OmniGrab: Extract All Photos on this Page',
    contexts: ['page']
  });

  chrome.storage.sync.set({
    omnigrabServerUrl: 'http://localhost:5173'
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  const targetUrl = info.srcUrl || info.linkUrl || info.pageUrl || (tab && tab.url);

  chrome.storage.sync.get(['omnigrabServerUrl'], (res) => {
    const server = res.omnigrabServerUrl || 'http://localhost:5173';

    if (info.menuItemId === 'omnigrab-download-link') {
      chrome.tabs.create({
        url: `${server}/?url=${encodeURIComponent(targetUrl)}`
      });
    } else if (info.menuItemId === 'omnigrab-scrape-page') {
      chrome.tabs.create({
        url: `${server}/?tab=scraper&url=${encodeURIComponent(info.pageUrl || (tab && tab.url))}`
      });
    }
  });
});

chrome.commands.onCommand.addListener((command) => {
  if (command === 'download_active_video') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'sniff_media' }, (res) => {
          if (res && res.media && res.media.length > 0) {
            const firstVideo = res.media.find(m => m.type === 'video') || res.media[0];
            chrome.downloads.download({
              url: firstVideo.url,
              filename: `OmniGrab_${Date.now()}.${firstVideo.type === 'video' ? 'mp4' : 'jpg'}`
            });
            syncToTurso({ url: firstVideo.url, title: firstVideo.title, mediaType: 'Video' });
          }
        });
      }
    });
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'download_media') {
    const { url, mediaType, pageUrl } = request;

    chrome.downloads.download({
      url: url,
      filename: `OmniGrab_${Date.now()}.${mediaType === 'Video' ? 'mp4' : 'jpg'}`,
      saveAs: false
    }, (downloadId) => {
      if (chrome.runtime.lastError) {
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        syncToTurso({ url, mediaType, title: `Media from ${pageUrl || 'webpage'}` });
        sendResponse({ success: true, downloadId });
      }
    });

    return true;
  }
});
