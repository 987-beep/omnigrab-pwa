# ⚡ OmniGrab Pro - Universal Multi-User Media Downloader, Trimmer & Companion Suite

**Live Website**: [https://omnigrab-pwa.vercel.app/](https://omnigrab-pwa.vercel.app/)  
**GitHub Repository**: [https://github.com/987-beep/omnigrab-pwa](https://github.com/987-beep/omnigrab-pwa)  
**Database**: Turso LibSQL Cloud (`AWS ap-south-1` Mumbai)

---

## 🌟 Key Architecture & Capabilities

### 1. 👥 Multi-User Platform & Profile Vaults
- **1-Click Profile Switching**: Seamlessly toggle between **Personal Account**, **Work & Research**, **Family Shared Vault**, or custom profiles.
- **Custom Profile Editor**: Custom avatars (⚡, 💼, 🌟, 🎬, 🚀, 💎, 🎧, 🎮, 🛡️, 👑, 🔥, 🌈), theme color accents (Neon Cyan, Electric Purple, Emerald Green, Amber Gold, Vibrant Rose), and roles (*Owner, Member, Shared, Guest*).
- **PIN-Protected Vaults**: Optional 4-digit PIN locks for sensitive personal profiles on shared devices.
- **Cross-Profile Media Transfer**: Send any downloaded video or photo directly into another user profile’s vault with 1 click.
- **Instant Device Pairing QR**: Scan with iPhone or Android camera to link any phone directly into that user profile.

### 2. ✂️ Media Trim & Cut Studio & Video-to-GIF Converter
- **Custom Timeframe Trimmer**: Set Start & End timestamps (e.g. `00:10` to `00:45`) to extract specific video segments or audio clips.
- **Animated GIF Maker**: Convert any video clip into smooth looping GIFs with customizable FPS (15 / 20 / 25 / 30 fps).
- **Custom Ringtones**: Cut audio segments directly into 320kbps MP3 ringtones.

### 3. 📝 Subtitle & Caption Extractor (.SRT / .VTT)
- Download subtitles, closed captions, and AI speech-to-text transcripts in multiple languages (English, Auto-Generated, Hindi, etc.) in standard `.srt` format.

### 4. 📱 Instant QR Code Mobile Handoff
- 1-click QR code handoff: Point your phone camera (iPhone / Android) at your laptop screen to instantly open the extracted video in your mobile PWA without typing long URLs.

### 5. 🧹 Automated 02:00 AM Midnight Storage Auto-Pruning
- **Deleted Daily at 02:00 AM**: Ephemeral download logs and temporary stream buffers are purged to protect Turso cloud storage limits and keep database performance fast.
- **PRESERVED FOREVER**: All User Profiles (`user_profiles`), User Bookmarks (`saved_bookmarks`), Vault PINs (`user_vaults`), and Settings (`user_settings`) are **never deleted**.

### 6. 🧩 Chrome Extension Companion (Manifest V3)
- **On-Page Floating Badges**: Automatically injects high-tech `⚡ OmniGrab Save` pills over `<video>`, Instagram Reels, and TikTok clips.
- **Active Tab Media Sniffer**: Instant popup extracting all video streams, audio tracks, and photos on the active tab (`Alt + D` / `Alt + S`).
- **Right-Click Context Menu**: 1-click download from any right-clicked link, image, or video.

### 7. 📲 Progressive Web App (PWA) with Android System Share Target
- **Web Share Target API**: Tap native **Share** inside YouTube, Instagram, or TikTok and select **OmniGrab** to download without copy-pasting.
- **Background Sync & Notifications**: Alerts you when long 4K downloads or large batch ZIP archives finish packing in the background.

---

## 🚀 Quick Start & Local Run

### 1. Backend Engine (FastAPI + yt-dlp + FFmpeg)
```bash
python3 -m uvicorn backend.main:app --host 0.0.0.0 --port 8000
```

### 2. Frontend Progressive Web App (Vite + React + Tailwind)
```bash
npm install
npm run dev
```
Open your browser at `http://localhost:5173`.

---

## 📦 How to Install the Chrome Extension

1. In OmniGrab, go to the **Chrome Extension** tab and click **Download Extension (.ZIP)** (or download `OmniGrab_Chrome_Extension_V3.zip`).
2. Unzip the downloaded file.
3. In Chrome, Brave, Edge, or Opera, navigate to `chrome://extensions`.
4. Turn on **Developer mode** in the top-right corner.
5. Click **Load unpacked** and select the unzipped extension folder.

---

## 📲 How to Install on Android

1. Open `https://omnigrab-pwa.vercel.app/` in Android Chrome.
2. Tap the **Install PWA** banner or tap **3 dots (⋮) -> "Install app" / "Add to Home screen"**.
3. Now open any video in YouTube, Instagram, or TikTok.
4. Tap **Share -> OmniGrab** for instant 1-tap download!
