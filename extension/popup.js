// OmniGrab Popup Script

document.addEventListener('DOMContentLoaded', () => {
  const mediaListContainer = document.getElementById('media-list');
  const countLabel = document.getElementById('media-count-label');
  const scanBtn = document.getElementById('scan-page-btn');
  const batchZipBtn = document.getElementById('batch-zip-btn');
  const pwaLinkBtn = document.getElementById('pwa-link-btn');
  const extractBackendBtn = document.getElementById('extract-backend-btn');

  let currentTabUrl = '';
  let discoveredMedia = [];
  let serverEndpoint = 'http://localhost:5173';

  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
    chrome.storage.sync.get(['omnigrabServerUrl'], (res) => {
      if (res.omnigrabServerUrl) serverEndpoint = res.omnigrabServerUrl;
    });
  }

  function renderMedia(items) {
    discoveredMedia = items;
    mediaListContainer.innerHTML = '';

    if (!items || items.length === 0) {
      mediaListContainer.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="#64748b" stroke-width="2">
            <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect>
            <line x1="7" y1="2" x2="7" y2="22"></line>
            <line x1="17" y1="2" x2="17" y2="22"></line>
            <line x1="2" y1="12" x2="22" y2="12"></line>
          </svg>
          <p>No direct video or image streams detected on this tab yet.</p>
          <p style="font-size:10px; color:#64748b;">Click "Deep Extract with PWA Engine" to extract restricted / protected media.</p>
        </div>
      `;
      countLabel.textContent = '0 items found';
      batchZipBtn.style.display = 'none';
      return;
    }

    countLabel.textContent = `${items.length} item${items.length === 1 ? '' : 's'} ready`;
    if (items.filter(i => i.type === 'image').length > 1) {
      batchZipBtn.style.display = 'inline-flex';
    } else {
      batchZipBtn.style.display = 'none';
    }

    items.forEach((item, index) => {
      const card = document.createElement('div');
      card.className = 'media-card';

      const thumbUrl = item.type === 'image' ? item.url : (item.thumbnail || '');
      const isVideo = item.type === 'video';

      card.innerHTML = `
        <div class="thumb-wrapper">
          ${thumbUrl ? `<img src="${thumbUrl}" class="thumb-img" alt="thumb" onerror="this.style.display='none'"/>` : `
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#94a3b8" stroke-width="2">
              ${isVideo ? '<polygon points="5 3 19 12 5 21 5 3"></polygon>' : '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>'}
            </svg>
          `}
          <span class="thumb-badge">${isVideo ? 'MP4' : 'IMG'}</span>
        </div>
        <div class="media-details">
          <div class="media-title" title="${item.title || 'Media Stream'}">${item.title || (isVideo ? 'Video Stream' : 'High-Res Photo')}</div>
          <div class="media-meta">
            <span>${isVideo ? 'HD Video' : 'HQ Image'}</span>
            ${item.width ? `<span>• ${item.width}x${item.height}</span>` : ''}
          </div>
        </div>
        <button class="dl-button" data-index="${index}">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          Save
        </button>
      `;

      card.querySelector('.dl-button').addEventListener('click', () => {
        downloadItem(item);
      });

      mediaListContainer.appendChild(card);
    });
  }

  function downloadItem(item) {
    if (typeof chrome !== 'undefined' && chrome.downloads) {
      chrome.downloads.download({
        url: item.url,
        filename: `OmniGrab_${Date.now()}.${item.type === 'video' ? 'mp4' : 'jpg'}`,
        saveAs: false
      });
    } else {
      window.open(item.url, '_blank');
    }
  }

  function sniffCurrentTab() {
    mediaListContainer.innerHTML = `
      <div class="empty-state">
        <div class="spinner"></div>
        <p>Scanning active page streams & images...</p>
      </div>
    `;

    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs || !tabs[0]) return;
        currentTabUrl = tabs[0].url;

        // Message active content script
        chrome.tabs.sendMessage(tabs[0].id, { action: 'sniff_media' }, (response) => {
          if (chrome.runtime.lastError || !response) {
            // If content script not yet injected, inject dynamically
            chrome.scripting.executeScript({
              target: { tabId: tabs[0].id },
              files: ['content.js']
            }, () => {
              // Retry
              setTimeout(() => {
                chrome.tabs.sendMessage(tabs[0].id, { action: 'sniff_media' }, (res) => {
                  if (res && res.media) {
                    renderMedia(res.media);
                  } else {
                    renderMedia([]);
                  }
                });
              }, 200);
            });
          } else {
            renderMedia(response.media || []);
          }
        });
      });
    } else {
      // Mock preview for extension development
      setTimeout(() => {
        renderMedia([
          { id: '1', type: 'video', url: '#', title: 'Sample 1080p Web Video', width: 1920, height: 1080 },
          { id: '2', type: 'image', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800', title: 'High Res Wallpaper', width: 3840, height: 2160 }
        ]);
      }, 500);
    }
  }

  scanBtn.addEventListener('click', sniffCurrentTab);

  pwaLinkBtn.addEventListener('click', () => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.create({ url: `${serverEndpoint}/` });
    } else {
      window.open('/', '_blank');
    }
  });

  extractBackendBtn.addEventListener('click', () => {
    const target = currentTabUrl || window.location.href;
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.create({ url: `${serverEndpoint}/?url=${encodeURIComponent(target)}` });
    } else {
      window.open(`/?url=${encodeURIComponent(target)}`, '_blank');
    }
  });

  batchZipBtn.addEventListener('click', async () => {
    const images = discoveredMedia.filter(m => m.type === 'image');
    if (images.length === 0) return;

    batchZipBtn.textContent = 'Packing ZIP...';
    try {
      const resp = await fetch(`${serverEndpoint}/api/batch-zip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: images.map((img, i) => ({ url: img.url, filename: `photo_${i+1}.jpg` })),
          zip_name: `Page_Photos_${Date.now()}.zip`
        })
      });
      if (resp.ok) {
        const blob = await resp.blob();
        const dlUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = dlUrl;
        a.download = `Page_Photos_${Date.now()}.zip`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    } catch (e) {
      console.error('Batch download failed:', e);
    } finally {
      batchZipBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 8v13H3V8"></path>
          <path d="M1 3h22v5H1z"></path>
          <path d="M10 12h4"></path>
        </svg>
        <span>Save All as ZIP</span>
      `;
    }
  });

  // Initial load
  sniffCurrentTab();
});
