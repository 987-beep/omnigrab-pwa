// OmniGrab Chrome Extension - Background Service Worker v2.5.0

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

// Keyboard Shortcut commands listener
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
          }
        });
      }
    });
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'download_media') {
    const { url, mediaType } = request;

    chrome.downloads.download({
      url: url,
      filename: `OmniGrab_${Date.now()}.${mediaType === 'Video' ? 'mp4' : 'jpg'}`,
      saveAs: false
    }, (downloadId) => {
      if (chrome.runtime.lastError) {
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        sendResponse({ success: true, downloadId });
      }
    });

    return true;
  }
});
