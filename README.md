# ⚡ OmniGrab Pro - Universal Media Downloader, PWA & Chrome Extension

OmniGrab Pro is a high-performance progressive web application, universal media extractor, and Chrome Manifest V3 companion extension designed to download 4K videos, Instagram Reels, TikTok clips (no watermark), Twitter/X media, Reddit carousels, and high-resolution webpage photo bundles with 1-click on-page download pills and Android background Web Share Target integration.

---

## 🌟 Key Architecture & Capabilities

### 1. 📱 Progressive Web App (PWA) with Android Share Target
- **Web Share Target API**: Share links directly from YouTube, Instagram, TikTok, Twitter/X, or Chrome into OmniGrab without copy-pasting.
- **Service Worker & Background Sync**: Full offline UI support, caching, background queue management, and push notification triggers on completion.
- **Zero-Footprint Installation**: Installs instantly as a standalone application on Android, Windows, macOS, Linux, and iOS.

### 2. 🧩 Chrome Extension Companion (Manifest V3)
- **On-Page Floating Buttons**: Automatically hovers a discreet high-tech `⚡ OmniGrab Download` badge over `<video>`, `<img>`, TikTok players, Instagram Reels, and YouTube.
- **Active Tab Media Sniffer**: Instant popup extracting all video streams, audio tracks, and high-res photos on your active tab.
- **Right-Click Context Menu**: 1-click download from any right-clicked link, image, video, or webpage.

### 3. 🎬 Universal Media Extraction Engine (FastAPI + yt-dlp + FFmpeg)
- **4K, 1440p, 1080p Full HD Video**: Automatically combines separate video and audio streams at maximum bitrate.
- **Audio Extraction**: Studio-quality 320kbps MP3, 192kbps MP3, and AAC/M4A.
- **Web Photo Scraper & Batch ZIP**: Crawls responsive `srcset`, CSS background images, and social cards, with 1-click compression into a `.zip` archive.

---

## 🚀 Quick Start Guide

### 1. Start the Backend API
```bash
python3 -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Start the Frontend PWA
```bash
npm run dev
```
Open your browser at `http://localhost:5173`.

---

## 📦 How to Install the Chrome Extension

1. In the OmniGrab PWA, go to the **Chrome Extension** tab and click **Download Extension (.ZIP)**.
2. Unzip the downloaded file.
3. In Chrome, Brave, Edge, or Arc, open `chrome://extensions`.
4. Turn on **Developer mode** in the top right.
5. Click **Load unpacked** and select the unzipped `extension` folder.
6. The OmniGrab extension is active! Hover over any video on the web to see the floating download pill.

---

## 📲 How to Install the Android PWA

1. Open OmniGrab in Android Chrome.
2. Tap the **Install PWA** button on the banner or tap the **3 dots menu (⋮) -> "Install app" / "Add to Home screen"**.
3. Now open any video in YouTube, Instagram, or TikTok.
4. Tap **Share** -> Select **OmniGrab**.
5. OmniGrab will auto-load the media with 4K, 1080p, and MP3 download options ready!

---

## ☁️ Production Deployment

### Frontend on Vercel
1. Push this repository to GitHub.
2. Import the repo in [Vercel](https://vercel.com).
3. The included `vercel.json` will automatically configure Vite routing and API proxies.

### Backend on Railway / Render / Docker
Deploy using the provided `Dockerfile`:
```bash
docker build -t omnigrab-backend .
docker run -p 8000:8000 omnigrab-backend
```
