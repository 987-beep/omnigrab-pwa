// OmniGrab Pro Content Script v2.5.0 - Universal Media Ingestion & On-Page Badges

(function () {
  'use strict';

  const PROCESSED_ATTR = 'data-omnigrab-processed';
  let serverEndpoint = 'http://localhost:5173';

  // Announce presence to OmniGrab PWA Web Page
  function broadcastPresence() {
    window.postMessage({ type: 'OMNIGRAB_EXTENSION_READY', version: '2.5.0' }, '*');
    document.documentElement.setAttribute('data-omnigrab-extension-active', 'true');
  }

  broadcastPresence();
  setInterval(broadcastPresence, 3000);

  // Listen for download requests coming directly from OmniGrab PWA
  window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'OMNIGRAB_PWA_DOWNLOAD') {
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({
          action: 'download_media',
          url: event.data.url,
          mediaType: event.data.mediaType || 'Video'
        });
      }
    }
  });

  // Fetch settings from extension storage
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
    chrome.storage.sync.get(['omnigrabServerUrl'], (result) => {
      if (result.omnigrabServerUrl) {
        serverEndpoint = result.omnigrabServerUrl;
      }
    });
  }

  function showToast(message, type = 'success') {
    const existing = document.querySelector('.omnigrab-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'omnigrab-toast';
    const icon = type === 'success' ? '⚡' : 'ℹ️';
    toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  function createDownloadButton(mediaEl, mediaUrl, mediaType) {
    const btn = document.createElement('button');
    btn.className = 'omnigrab-hover-btn';
    btn.type = 'button';
    btn.title = `⚡ OmniGrab: Download ${mediaType}`;
    btn.innerHTML = `
      <svg class="omnigrab-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="7 10 12 15 17 10"></polyline>
        <line x1="12" y1="15" x2="12" y2="3"></line>
      </svg>
      <span>Save ${mediaType}</span>
    `;

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const targetUrl = mediaUrl || window.location.href;
      showToast(`Saving ${mediaType}...`);

      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({
          action: 'download_media',
          url: targetUrl,
          mediaType: mediaType,
          pageUrl: window.location.href
        }, (response) => {
          if (chrome.runtime.lastError) {
            window.open(`${serverEndpoint}/?url=${encodeURIComponent(targetUrl)}`, '_blank');
          } else {
            showToast(`Download started!`);
          }
        });
      } else {
        const a = document.createElement('a');
        a.href = targetUrl;
        a.download = `omnigrab_${Date.now()}.${mediaType === 'Video' ? 'mp4' : 'jpg'}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    });

    return btn;
  }

  function processElement(el) {
    if (el.getAttribute(PROCESSED_ATTR)) return;
    el.setAttribute(PROCESSED_ATTR, 'true');

    const tagName = el.tagName.toLowerCase();

    // Video handling
    if (tagName === 'video') {
      const src = el.src || el.currentSrc || (el.querySelector('source') && el.querySelector('source').src);
      const parent = el.parentElement;
      if (parent) {
        parent.classList.add('omnigrab-anchor-wrapper');
        const btn = createDownloadButton(el, src || window.location.href, 'Video');
        parent.appendChild(btn);
      }
    }

    // High resolution images
    if (tagName === 'img') {
      const w = el.naturalWidth || el.width || el.clientWidth;
      const h = el.naturalHeight || el.height || el.clientHeight;
      if (w > 250 && h > 200) {
        const src = el.currentSrc || el.src;
        if (src && !src.startsWith('data:')) {
          const parent = el.parentElement;
          if (parent && parent.tagName.toLowerCase() !== 'a') {
            parent.classList.add('omnigrab-anchor-wrapper');
            const btn = createDownloadButton(el, src, 'Photo');
            parent.appendChild(btn);
          }
        }
      }
    }

    // YouTube Player Overlay
    if (window.location.hostname.includes('youtube.com')) {
      const ytdPlayer = document.querySelector('#movie_player, .ytd-player');
      if (ytdPlayer && !ytdPlayer.getAttribute(PROCESSED_ATTR)) {
        ytdPlayer.setAttribute(PROCESSED_ATTR, 'true');
        ytdPlayer.classList.add('omnigrab-anchor-wrapper');
        const btn = createDownloadButton(ytdPlayer, window.location.href, '1080p Video');
        btn.classList.add('omnigrab-visible');
        ytdPlayer.appendChild(btn);
      }
    }
  }

  function scanDOM() {
    document.querySelectorAll('video, img').forEach(processElement);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scanDOM);
  } else {
    scanDOM();
  }

  const observer = new MutationObserver((mutations) => {
    let shouldScan = false;
    for (const m of mutations) {
      if (m.addedNodes.length > 0) {
        shouldScan = true;
        break;
      }
    }
    if (shouldScan) scanDOM();
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });

  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'sniff_media') {
        const mediaList = [];
        const seen = new Set();

        document.querySelectorAll('video').forEach((v, idx) => {
          const src = v.src || v.currentSrc || (v.querySelector('source') && v.querySelector('source').src);
          if (src && !seen.has(src)) {
            seen.add(src);
            mediaList.push({
              id: `v_${idx}`,
              type: 'video',
              url: src,
              title: document.title || 'Video Stream',
              width: v.videoWidth || 1920,
              height: v.videoHeight || 1080
            });
          }
        });

        document.querySelectorAll('img').forEach((img, idx) => {
          const src = img.currentSrc || img.src;
          const w = img.naturalWidth || img.width;
          const h = img.naturalHeight || img.height;
          if (src && w > 180 && h > 180 && !seen.has(src) && !src.startsWith('data:image/svg')) {
            seen.add(src);
            mediaList.push({
              id: `img_${idx}`,
              type: 'image',
              url: src,
              title: img.alt || `Photo ${idx + 1}`,
              width: w,
              height: h
            });
          }
        });

        sendResponse({
          pageTitle: document.title,
          pageUrl: window.location.href,
          media: mediaList
        });
      }
      return true;
    });
  }
})();
