import os
import sys
import re
import io
import json
import uuid
import shutil
import asyncio
import zipfile
import urllib.parse
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional, Dict, Any

import requests
from bs4 import BeautifulSoup
from fastapi import FastAPI, HTTPException, Query, Header, BackgroundTasks, Response, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

# Initialize static ffmpeg
try:
    import static_ffmpeg
    static_ffmpeg.add_paths()
except Exception as e:
    print("static_ffmpeg init note:", e)

import yt_dlp
import backend.turso_db as turso

app = FastAPI(
    title="OmniGrab Pro API",
    description="Universal Video, Photo & Media Extraction Engine with Turso LibSQL Cloud & Zero-Knowledge User Isolation",
    version="2.6.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DOWNLOADS_DIR = Path("/tmp/omnigrab_downloads")
DOWNLOADS_DIR.mkdir(parents=True, exist_ok=True)

# Helper cleanup task
async def cleanup_file(filepath: Path, delay: int = 300):
    await asyncio.sleep(delay)
    try:
        if filepath.exists():
            if filepath.is_dir():
                shutil.rmtree(filepath, ignore_errors=True)
            else:
                filepath.unlink(missing_ok=True)
    except Exception:
        pass

# Background task for periodic 02:00 AM midnight cleanup
async def scheduled_midnight_cleanup_loop():
    while True:
        try:
            now = datetime.now(timezone.utc)
            # Check if it's 2 AM UTC (02:00 to 02:05)
            if now.hour == 2 and now.minute < 5:
                turso.auto_prune_midnight_storage()
            await asyncio.sleep(300) # Sleep 5 minutes
        except Exception as e:
            print("Midnight cleanup error:", e)
            await asyncio.sleep(600)

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(scheduled_midnight_cleanup_loop())

class ExtractRequest(BaseModel):
    url: str

class ScrapeImagesRequest(BaseModel):
    url: str
    include_svg: bool = False
    min_width: int = 0

class BatchZipRequest(BaseModel):
    items: List[Dict[str, str]]
    zip_name: Optional[str] = "omnigrab_batch.zip"

class CloudHistoryItem(BaseModel):
    id: Optional[str] = None
    url: str
    title: Optional[str] = "Untitled"
    thumbnail: Optional[str] = None
    platform: Optional[str] = "Web"
    quality: Optional[str] = "HD"
    media_type: Optional[str] = "video"
    filesize: Optional[str] = None
    device_source: Optional[str] = "Web PWA"
    user_id: Optional[str] = "default_guest"
    device_id: Optional[str] = "browser"

class BookmarkItem(BaseModel):
    id: Optional[str] = None
    url: str
    title: Optional[str] = "Saved Link"
    thumbnail: Optional[str] = None
    platform: Optional[str] = "Web"
    notes: Optional[str] = ""
    user_id: Optional[str] = "default_guest"

class VaultSyncRequest(BaseModel):
    user_id: str
    vault_pin: Optional[str] = None
    device_id: Optional[str] = "browser"

def get_platform_info(url: str) -> Dict[str, str]:
    lower = url.lower()
    if "youtube.com" in lower or "youtu.be" in lower:
        return {"name": "YouTube", "icon": "youtube", "color": "#FF0000", "type": "video"}
    elif "instagram.com" in lower:
        return {"name": "Instagram", "icon": "instagram", "color": "#E1306C", "type": "media"}
    elif "tiktok.com" in lower:
        return {"name": "TikTok", "icon": "music-2", "color": "#00F2FE", "type": "video"}
    elif "twitter.com" in lower or "x.com" in lower:
        return {"name": "X / Twitter", "icon": "twitter", "color": "#1DA1F2", "type": "media"}
    elif "pinterest.com" in lower or "pin.it" in lower:
        return {"name": "Pinterest", "icon": "pin", "color": "#E60023", "type": "image"}
    elif "reddit.com" in lower or "redd.it" in lower:
        return {"name": "Reddit", "icon": "reddit", "color": "#FF4500", "type": "media"}
    elif "facebook.com" in lower or "fb.watch" in lower:
        return {"name": "Facebook", "icon": "facebook", "color": "#1877F2", "type": "video"}
    elif "vimeo.com" in lower:
        return {"name": "Vimeo", "icon": "video", "color": "#1AB7EA", "type": "video"}
    elif any(lower.split('?')[0].endswith(ext) for ext in [".mp4", ".mov", ".mkv", ".webm", ".m3u8"]):
        return {"name": "Direct Video", "icon": "film", "color": "#6366F1", "type": "video"}
    elif any(lower.split('?')[0].endswith(ext) for ext in [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"]):
        return {"name": "Direct Image", "icon": "image", "color": "#10B981", "type": "image"}
    else:
        return {"name": "Web Source", "icon": "globe", "color": "#8B5CF6", "type": "web"}

def sanitize_filename(title: str) -> str:
    cleaned = re.sub(r'[\/\\:\*\?"<>\|\s]+', '_', title).strip('_')
    return cleaned[:80] if cleaned else "media_file"

@app.get("/api/health")
def health_check():
    ffmpeg_path = shutil.which("ffmpeg")
    turso_status = turso.check_turso_health()
    return {
        "status": "healthy",
        "ytdlp_version": yt_dlp.version.__version__,
        "ffmpeg_detected": bool(ffmpeg_path),
        "ffmpeg_path": ffmpeg_path,
        "turso": turso_status,
        "security": {
            "privacy_architecture": "Personal Private Cloud Storage Architecture",
            "midnight_cleanup": "02:00 AM UTC (Downloads purged, User & Bookmarks preserved)",
            "device_pairing": "Supported via Private Vault Keys"
        },
        "engine": "OmniGrab Pro v2.6 + Turso LibSQL Cloud"
    }

# --- TURSO CLOUD DATABASE & USER PRIVACY ISOLATION ENDPOINTS ---

@app.get("/api/turso/profiles")
def get_turso_profiles():
    try:
        return {"success": True, "profiles": turso.get_cloud_profiles()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Profiles Error: {str(e)}")

@app.post("/api/turso/profiles")
def sync_turso_profile(profile: Dict[str, Any]):
    try:
        res = turso.sync_cloud_profile(profile)
        return {"success": True, "profile": res}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Profile Sync Error: {str(e)}")

@app.delete("/api/turso/profiles/{profile_id}")
def delete_turso_profile(profile_id: str):
    try:
        turso.delete_cloud_profile(profile_id)
        return {"success": True, "deleted": profile_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Profile Delete Error: {str(e)}")

@app.post("/api/turso/transfer")
def transfer_media_item(req: Dict[str, Any]):
    try:
        from_u = req.get("from_user_id", "usr_owner_01")
        to_u = req.get("to_user_id", "usr_work_02")
        res = turso.transfer_cloud_item(req, from_u, to_u)
        return {"success": True, "transfer": res}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transfer Error: {str(e)}")

@app.get("/api/turso/status")
def get_turso_status():
    return turso.check_turso_health()

@app.get("/api/turso/history")
def get_turso_history(
    limit: int = 50, 
    user_id: Optional[str] = Query(None),
    x_user_id: Optional[str] = Header(None, alias="X-User-ID")
):
    resolved_uid = user_id or x_user_id or "default_guest"
    try:
        # Strictly queries by user_id ensuring zero leakage across users
        return {"success": True, "user_id": resolved_uid, "history": turso.get_cloud_history(resolved_uid, limit)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Turso Error: {str(e)}")

@app.post("/api/turso/history")
def save_turso_history(
    item: CloudHistoryItem,
    x_user_id: Optional[str] = Header(None, alias="X-User-ID"),
    x_device_id: Optional[str] = Header(None, alias="X-Device-ID")
):
    resolved_uid = item.user_id if (item.user_id and item.user_id != "default_guest") else (x_user_id or "default_guest")
    resolved_did = item.device_id or x_device_id or "browser"
    try:
        res = turso.add_cloud_history(item.dict(), resolved_uid, resolved_did)
        return {"success": True, "item": res}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Turso Error: {str(e)}")

@app.delete("/api/turso/history/{item_id}")
def delete_turso_history(
    item_id: str,
    user_id: Optional[str] = Query(None),
    x_user_id: Optional[str] = Header(None, alias="X-User-ID")
):
    resolved_uid = user_id or x_user_id or "default_guest"
    try:
        turso.delete_cloud_history(item_id, resolved_uid)
        return {"success": True, "deleted": item_id, "user_id": resolved_uid}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Turso Error: {str(e)}")

@app.get("/api/turso/bookmarks")
def get_turso_bookmarks(
    user_id: Optional[str] = Query(None),
    x_user_id: Optional[str] = Header(None, alias="X-User-ID")
):
    resolved_uid = user_id or x_user_id or "default_guest"
    try:
        return {"success": True, "user_id": resolved_uid, "bookmarks": turso.get_cloud_bookmarks(resolved_uid)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Turso Error: {str(e)}")

@app.post("/api/turso/bookmarks")
def save_turso_bookmark(
    item: BookmarkItem,
    x_user_id: Optional[str] = Header(None, alias="X-User-ID")
):
    resolved_uid = item.user_id if (item.user_id and item.user_id != "default_guest") else (x_user_id or "default_guest")
    try:
        res = turso.add_cloud_bookmark(item.dict(), resolved_uid)
        return {"success": True, "bookmark": res}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Turso Error: {str(e)}")

@app.delete("/api/turso/bookmarks/{item_id}")
def delete_turso_bookmark(
    item_id: str,
    user_id: Optional[str] = Query(None),
    x_user_id: Optional[str] = Header(None, alias="X-User-ID")
):
    resolved_uid = user_id or x_user_id or "default_guest"
    try:
        turso.delete_cloud_bookmark(item_id, resolved_uid)
        return {"success": True, "deleted": item_id, "user_id": resolved_uid}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Turso Error: {str(e)}")

@app.post("/api/turso/vault/sync")
def sync_private_vault(req: VaultSyncRequest):
    """
    Syncs or creates a private user vault so a user's phone, tablet, and PC share the same cloud stream while isolating from other users.
    """
    try:
        vault = turso.sync_user_vault(req.user_id, req.vault_pin, req.device_id)
        return {"success": True, "vault": vault}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Vault Error: {str(e)}")

@app.post("/api/turso/maintenance/prune")
def trigger_storage_prune():
    """
    Executes or tests the 02:00 AM Midnight Auto-Prune.
    Purges temporary download logs from Turso while PRESERVING user bookmarks and vaults.
    """
    try:
        res = turso.auto_prune_midnight_storage(force=True)
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prune Error: {str(e)}")

# --- MEDIA EXTRACTION & DOWNLOAD ENDPOINTS ---

@app.post("/api/extract")
def extract_media(req: ExtractRequest):
    url = req.url.strip()
    if not url:
        raise HTTPException(status_code=400, detail="URL is required")

    platform = get_platform_info(url)
    clean_url_base = url.split('?')[0].lower()

    # Direct Video Check
    if any(clean_url_base.endswith(ext) for ext in ['.mp4', '.webm', '.mov', '.mkv']):
        filename_guessed = url.split('/')[-1].split('?')[0] or "Direct_Video_Stream.mp4"
        return {
            "success": True,
            "is_playlist": False,
            "url": url,
            "title": filename_guessed.replace('_', ' ').replace('-', ' '),
            "thumbnail": None,
            "duration": None,
            "uploader": "Direct Video Source",
            "description": f"Direct media stream from {urllib.parse.urlparse(url).netloc}",
            "platform": platform,
            "video_formats": [
                {
                    "format_id": "best",
                    "resolution": "Original HD",
                    "quality_label": "Direct Video File (MP4)",
                    "ext": "mp4",
                    "has_audio": True,
                    "download_type": "video"
                }
            ],
            "audio_formats": [
                {"format_id": "mp3_320", "ext": "mp3", "quality_label": "Extracted MP3 (320 kbps)", "download_type": "audio"}
            ],
            "carousel_items": [],
            "is_direct": True,
            "direct_url": url
        }

    # Direct Image Check
    if any(clean_url_base.endswith(ext) for ext in ['.jpg', '.jpeg', '.png', '.webp', '.gif']):
        filename_guessed = url.split('/')[-1].split('?')[0] or "High_Res_Photo.jpg"
        return {
            "success": True,
            "is_playlist": False,
            "url": url,
            "title": filename_guessed.replace('_', ' ').replace('-', ' '),
            "thumbnail": url,
            "duration": None,
            "uploader": "Direct Image Source",
            "description": f"High resolution image file from {urllib.parse.urlparse(url).netloc}",
            "platform": platform,
            "video_formats": [],
            "audio_formats": [],
            "carousel_items": [
                {
                    "id": "1",
                    "title": filename_guessed,
                    "thumbnail": url,
                    "url": url,
                    "ext": clean_url_base.split('.')[-1],
                    "type": "image"
                }
            ],
            "is_direct": True,
            "direct_url": url
        }

    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'skip_download': True,
        'extract_flat': False,
        'no_check_certificates': True,
        'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
    }

    info = None
    ytdl_error = None
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
    except Exception as e:
        ytdl_error = str(e)

    if info:
        is_playlist = info.get('_type') == 'playlist' or 'entries' in info and bool(info.get('entries')) and not ('vcodec' in info and info['vcodec'] != 'none')
        
        entries = info.get('entries')
        playlist_items = []
        carousel_items = []

        if entries:
            for idx, entry in enumerate(entries):
                if entry:
                    c_title = entry.get('title') or f"Item {idx + 1}"
                    c_thumb = entry.get('thumbnail') or entry.get('url')
                    c_url = entry.get('url') or url
                    c_dur = entry.get('duration')
                    
                    if is_playlist:
                        playlist_items.append({
                            "id": str(idx + 1),
                            "index": idx + 1,
                            "title": c_title,
                            "thumbnail": c_thumb or "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600",
                            "url": c_url,
                            "duration": f"{c_dur // 60}:{c_dur % 60:02d}" if c_dur else "HD"
                        })
                    else:
                        carousel_items.append({
                            "id": str(idx),
                            "title": c_title,
                            "thumbnail": c_thumb,
                            "url": c_url,
                            "ext": entry.get('ext', 'jpg'),
                            "type": "video" if entry.get('vcodec') != 'none' else "image"
                        })

        if is_playlist and playlist_items:
            return {
                "success": True,
                "is_playlist": True,
                "url": url,
                "title": info.get('title') or f"{platform['name']} Playlist",
                "uploader": info.get('uploader') or "Creator",
                "thumbnail": playlist_items[0]['thumbnail'] if playlist_items else None,
                "platform": platform,
                "total_items": len(playlist_items),
                "playlist_items": playlist_items
            }

        audio_formats = []
        video_formats = []
        
        raw_formats = info.get('formats', [])
        title = info.get('title', 'Extracted Media')
        thumbnail = info.get('thumbnail')
        duration = info.get('duration')
        uploader = info.get('uploader') or info.get('channel') or platform['name']
        description = info.get('description', '')[:250] if info.get('description') else ''
        views = info.get('view_count')
        likes = info.get('like_count')

        seen_res = set()
        for f in raw_formats:
            f_id = f.get('format_id')
            vcodec = f.get('vcodec', 'none')
            acodec = f.get('acodec', 'none')
            ext = f.get('ext', 'mp4')
            height = f.get('height')
            width = f.get('width')
            filesize = f.get('filesize') or f.get('filesize_approx')
            fps = f.get('fps')
            tbr = f.get('tbr')
            abr = f.get('abr')

            if vcodec != 'none' and height:
                res_key = f"{height}p"
                if res_key not in seen_res:
                    seen_res.add(res_key)
                    
                    if height >= 2160:
                        quality_label = "4K Ultra HD (2160p)"
                    elif height >= 1440:
                        quality_label = "2K Quad HD (1440p)"
                    elif height >= 1080:
                        quality_label = "Full HD (1080p)"
                    elif height >= 720:
                        quality_label = "HD (720p)"
                    elif height >= 480:
                        quality_label = "SD (480p)"
                    else:
                        quality_label = f"{height}p"

                    video_formats.append({
                        "format_id": f_id,
                        "resolution": res_key,
                        "quality_label": quality_label,
                        "ext": "mp4",
                        "height": height,
                        "width": width,
                        "filesize": filesize,
                        "fps": fps,
                        "has_audio": acodec != 'none',
                        "download_type": "video",
                        "tbr": round(tbr, 1) if tbr else None
                    })

            if vcodec == 'none' and acodec != 'none':
                audio_formats.append({
                    "format_id": f_id,
                    "ext": ext,
                    "abr": round(abr, 1) if abr else 128,
                    "quality_label": f"Audio ({ext.upper()} {round(abr) if abr else 128}kbps)",
                    "filesize": filesize,
                    "download_type": "audio"
                })

        video_formats.sort(key=lambda x: x.get('height', 0), reverse=True)

        if not video_formats:
            video_formats.append({
                "format_id": "best",
                "resolution": "HD",
                "quality_label": "Best Available Quality (MP4)",
                "ext": "mp4",
                "has_audio": True,
                "download_type": "video"
            })

        custom_audio_presets = [
            {"format_id": "mp3_320", "ext": "mp3", "quality_label": "MP3 High Quality (320 kbps)", "download_type": "audio", "preset": "mp3_320"},
            {"format_id": "mp3_192", "ext": "mp3", "quality_label": "MP3 Standard (192 kbps)", "download_type": "audio", "preset": "mp3_192"},
            {"format_id": "m4a_best", "ext": "m4a", "quality_label": "M4A / AAC Audio", "download_type": "audio", "preset": "m4a"}
        ]

        return {
            "success": True,
            "is_playlist": False,
            "url": url,
            "title": title,
            "thumbnail": thumbnail,
            "duration": duration,
            "uploader": uploader,
            "description": description,
            "views": views,
            "likes": likes,
            "platform": platform,
            "video_formats": video_formats,
            "audio_formats": custom_audio_presets + audio_formats[:3],
            "carousel_items": carousel_items,
            "is_direct": False,
            "direct_url": info.get('url') if not raw_formats else None
        }

    # Fallback to HTML OpenGraph scrape
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        }
        resp = requests.get(url, headers=headers, timeout=12, allow_redirects=True)
        soup = BeautifulSoup(resp.text, 'html.parser')

        og_title = soup.find('meta', property='og:title') or soup.find('meta', attrs={'name': 'twitter:title'})
        title = og_title.get('content') if og_title else (soup.title.string if soup.title else "Scraped Media")

        og_desc = soup.find('meta', property='og:description') or soup.find('meta', attrs={'name': 'description'})
        desc = og_desc.get('content') if og_desc else ""

        og_img = soup.find('meta', property='og:image') or soup.find('meta', attrs={'name': 'twitter:image'})
        thumbnail = urllib.parse.urljoin(url, og_img.get('content')) if og_img and og_img.get('content') else None

        og_video = soup.find('meta', property='og:video') or soup.find('meta', property='og:video:secure_url')
        video_src = None
        if og_video and og_video.get('content'):
            video_src = urllib.parse.urljoin(url, og_video.get('content'))
        else:
            video_tag = soup.find('video')
            if video_tag:
                src = video_tag.get('src')
                if not src:
                    source_tag = video_tag.find('source')
                    if source_tag:
                        src = source_tag.get('src')
                if src:
                    video_src = urllib.parse.urljoin(url, src)

        extracted_images = []
        for img in soup.find_all('img')[:30]:
            src = img.get('src') or img.get('data-src') or img.get('data-original')
            if src and not src.startswith('data:image'):
                full_src = urllib.parse.urljoin(url, src)
                alt = img.get('alt') or "Web Image"
                extracted_images.append({
                    "id": str(uuid.uuid4())[:8],
                    "title": alt[:50],
                    "thumbnail": full_src,
                    "url": full_src,
                    "ext": full_src.split('?')[0].split('.')[-1].lower() if '.' in full_src.split('?')[0] else 'jpg',
                    "type": "image"
                })

        video_formats = []
        if video_src:
            video_formats.append({
                "format_id": "direct_video",
                "resolution": "HD",
                "quality_label": "Direct HTML5 Video (MP4)",
                "ext": "mp4",
                "has_audio": True,
                "download_type": "video",
                "direct_stream_url": video_src
            })

        return {
            "success": True,
            "is_playlist": False,
            "url": url,
            "title": title.strip(),
            "thumbnail": thumbnail or (extracted_images[0]['url'] if extracted_images else None),
            "duration": None,
            "uploader": platform['name'],
            "description": desc.strip()[:200],
            "platform": platform,
            "video_formats": video_formats,
            "audio_formats": [{"format_id": "mp3_320", "ext": "mp3", "quality_label": "Extracted MP3 (320 kbps)", "download_type": "audio"}] if video_src else [],
            "carousel_items": extracted_images[:12],
            "is_direct": True,
            "direct_url": video_src or thumbnail
        }

    except Exception as scrape_err:
        raise HTTPException(
            status_code=400,
            detail=f"Could not extract media: {str(scrape_err)}"
        )

@app.get("/api/download")
async def download_media(
    url: str = Query(..., description="Target Media URL"),
    format_id: Optional[str] = Query("best", description="yt-dlp format id or preset"),
    download_type: Optional[str] = Query("video", description="video or audio"),
    filename: Optional[str] = Query(None, description="Preferred filename"),
    background_tasks: BackgroundTasks = None
):
    url = url.strip()
    if not url:
        raise HTTPException(status_code=400, detail="URL is required")

    temp_id = str(uuid.uuid4())[:10]
    out_dir = DOWNLOADS_DIR / temp_id
    out_dir.mkdir(parents=True, exist_ok=True)

    lower_url = url.lower().split('?')[0]
    direct_match = any(lower_url.endswith(ext) for ext in ['.mp4', '.webm', '.jpg', '.jpeg', '.png', '.webp', '.gif', '.mp3', '.m4a'])
    
    if direct_match and not ("youtube.com" in lower_url or "youtu.be" in lower_url or "tiktok.com" in lower_url or "instagram.com" in lower_url):
        try:
            req_headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
            }
            r = requests.get(url, headers=req_headers, stream=True, timeout=20)
            if r.status_code == 200:
                ext = lower_url.split('.')[-1]
                safe_name = filename or f"omnigrab_{temp_id}.{ext}"
                if not safe_name.endswith(f".{ext}"):
                    safe_name += f".{ext}"

                content_type = r.headers.get("content-type", "application/octet-stream")
                
                def iter_stream():
                    for chunk in r.iter_content(chunk_size=65536):
                        if chunk:
                            yield chunk

                return StreamingResponse(
                    iter_stream(),
                    media_type=content_type,
                    headers={
                        "Content-Disposition": f'attachment; filename="{urllib.parse.quote(safe_name)}"',
                        "Content-Length": r.headers.get("content-length", "")
                    }
                )
        except Exception as e:
            print("Direct proxy fallback to yt-dlp:", e)

    out_template = str(out_dir / "%(title).80s.%(ext)s")
    
    ydl_opts: Dict[str, Any] = {
        'outtmpl': out_template,
        'quiet': True,
        'no_warnings': True,
        'no_check_certificates': True,
        'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
    }

    if download_type == "audio" or (format_id and format_id.startswith("mp3")) or format_id == "m4a_best":
        ydl_opts.update({
            'format': 'bestaudio/best',
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3' if 'mp3' in (format_id or '') else 'm4a',
                'preferredquality': '320' if '320' in (format_id or '') else '192',
            }],
        })
    elif format_id and format_id != "best" and format_id != "direct_video":
        ydl_opts.update({
            'format': f"{format_id}+bestaudio/bestvideo[height<={format_id}]+bestaudio/best",
            'merge_output_format': 'mp4',
        })
    else:
        ydl_opts.update({
            'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
            'merge_output_format': 'mp4',
        })

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            title = info.get('title', f"OmniGrab_{temp_id}") if info else f"OmniGrab_{temp_id}"

        downloaded_files = list(out_dir.glob("*"))
        if not downloaded_files:
            raise HTTPException(status_code=500, detail="Download completed but output file was not found")

        file_to_send = downloaded_files[0]
        ext = file_to_send.suffix.lstrip('.')
        clean_title = sanitize_filename(title)
        final_filename = f"{clean_title}.{ext}" if not filename else filename
        if not final_filename.endswith(f".{ext}"):
            final_filename += f".{ext}"

        if background_tasks:
            background_tasks.add_task(cleanup_file, out_dir, 600)

        media_type = "video/mp4" if ext == "mp4" else ("audio/mpeg" if ext == "mp3" else "application/octet-stream")

        return FileResponse(
            path=str(file_to_send),
            filename=final_filename,
            media_type=media_type,
            headers={
                "Content-Disposition": f'attachment; filename="{urllib.parse.quote(final_filename)}"',
                "Access-Control-Expose-Headers": "Content-Disposition"
            }
        )
    except Exception as e:
        shutil.rmtree(out_dir, ignore_errors=True)
        raise HTTPException(status_code=500, detail=f"Download failed: {str(e)}")

@app.post("/api/scrape-images")
def scrape_images(req: ScrapeImagesRequest):
    url = req.url.strip()
    if not url:
        raise HTTPException(status_code=400, detail="URL is required")

    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        }
        resp = requests.get(url, headers=headers, timeout=15)
        soup = BeautifulSoup(resp.text, 'html.parser')

        page_title = soup.title.string.strip() if soup.title and soup.title.string else url

        found_images = []
        seen_urls = set()

        for meta_name in ['og:image', 'og:image:secure_url', 'twitter:image']:
            for tag in soup.find_all('meta', attrs={'property': meta_name}) + soup.find_all('meta', attrs={'name': meta_name}):
                img_url = tag.get('content')
                if img_url and img_url not in seen_urls:
                    seen_urls.add(img_url)
                    full_url = urllib.parse.urljoin(url, img_url)
                    found_images.append({
                        "id": str(uuid.uuid4())[:8],
                        "src": full_url,
                        "alt": "Hero / Social Preview Image",
                        "type": "featured",
                        "resolution": "High Res (HD)",
                        "size": "Original"
                    })

        for img in soup.find_all(['img', 'source']):
            sources_to_check = []
            if img.get('src'):
                sources_to_check.append(img.get('src'))
            if img.get('data-src'):
                sources_to_check.append(img.get('data-src'))
            if img.get('data-original'):
                sources_to_check.append(img.get('data-original'))
            if img.get('data-lazy-src'):
                sources_to_check.append(img.get('data-lazy-src'))

            srcset = img.get('srcset') or img.get('data-srcset')
            if srcset:
                parts = [p.strip().split(' ')[0] for p in srcset.split(',') if p.strip()]
                if parts:
                    sources_to_check.append(parts[-1])

            for raw_src in sources_to_check:
                if not raw_src or raw_src.startswith('data:image/gif;base64'):
                    continue
                full_src = urllib.parse.urljoin(url, raw_src)
                if full_src in seen_urls:
                    continue
                seen_urls.add(full_src)

                alt_text = img.get('alt') or img.get('title') or "Website Image"
                ext = full_src.split('?')[0].split('.')[-1].lower() if '.' in full_src.split('?')[0] else 'jpg'
                
                if ext == 'svg' and not req.include_svg:
                    continue

                width = img.get('width')
                height = img.get('height')
                res_tag = f"{width}x{height}" if (width and height) else "Auto"

                found_images.append({
                    "id": str(uuid.uuid4())[:8],
                    "src": full_src,
                    "alt": alt_text[:60],
                    "type": ext.upper(),
                    "resolution": res_tag,
                    "size": "Full Size"
                })

        for tag in soup.find_all(style=True):
            style = tag.get('style', '')
            matches = re.findall(r'url\([\'"]?([^\'")]+)[\'"]?\)', style)
            for m in matches:
                if m.startswith('data:image'):
                    continue
                full_url = urllib.parse.urljoin(url, m)
                if full_url not in seen_urls:
                    seen_urls.add(full_url)
                    found_images.append({
                        "id": str(uuid.uuid4())[:8],
                        "src": full_url,
                        "alt": "CSS Background Asset",
                        "type": "BACKGROUND",
                        "resolution": "CSS Asset",
                        "size": "Web"
                    })

        return {
            "success": True,
            "url": url,
            "page_title": page_title,
            "total_count": len(found_images),
            "images": found_images
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to scrape webpage images: {str(e)}")

@app.post("/api/batch-zip")
def create_batch_zip(req: BatchZipRequest, background_tasks: BackgroundTasks):
    if not req.items:
        raise HTTPException(status_code=400, detail="No items provided for batch ZIP")

    zip_id = str(uuid.uuid4())[:10]
    zip_path = DOWNLOADS_DIR / f"batch_{zip_id}.zip"

    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
    }

    try:
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
            for idx, item in enumerate(req.items[:100]):
                item_url = item.get('url')
                item_filename = item.get('filename') or f"image_{idx+1}.jpg"
                if not item_url:
                    continue

                try:
                    r = requests.get(item_url, headers=headers, timeout=10)
                    if r.status_code == 200:
                        zf.writestr(item_filename, r.content)
                except Exception as dl_err:
                    print(f"Skipped {item_url}: {dl_err}")

        if not zip_path.exists() or zip_path.stat().st_size == 0:
            raise HTTPException(status_code=500, detail="Failed to create zip archive (all items failed)")

        clean_zip_name = sanitize_filename(req.zip_name or "omnigrab_bundle.zip")
        if not clean_zip_name.endswith('.zip'):
            clean_zip_name += ".zip"

        background_tasks.add_task(cleanup_file, zip_path, 600)

        return FileResponse(
            path=str(zip_path),
            filename=clean_zip_name,
            media_type="application/zip",
            headers={
                "Content-Disposition": f'attachment; filename="{urllib.parse.quote(clean_zip_name)}"',
                "Access-Control-Expose-Headers": "Content-Disposition"
            }
        )
    except Exception as e:
        if zip_path.exists():
            zip_path.unlink(missing_ok=True)
        raise HTTPException(status_code=500, detail=f"Zip packaging error: {str(e)}")

@app.get("/api/download-extension")
def download_extension_zip(background_tasks: BackgroundTasks):
    ext_dir = Path("/home/user/extension")
    if not ext_dir.exists():
        raise HTTPException(status_code=404, detail="Extension folder not found")

    zip_path = DOWNLOADS_DIR / "omnigrab_chrome_extension.zip"
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
        for root, dirs, files in os.walk(ext_dir):
            for file in files:
                full_p = Path(root) / file
                rel_p = full_p.relative_to(ext_dir)
                zf.write(full_p, arcname=str(rel_p))

    background_tasks.add_task(cleanup_file, zip_path, 300)

    return FileResponse(
        path=str(zip_path),
        filename="OmniGrab_Chrome_Extension_V3.zip",
        media_type="application/zip",
        headers={
            "Content-Disposition": 'attachment; filename="OmniGrab_Chrome_Extension_V3.zip"'
        }
    )

dist_dir = Path("/home/user/dist")
if dist_dir.exists():
    app.mount("/assets", StaticFiles(directory=str(dist_dir / "assets")), name="assets")
    if (dist_dir / "icons").exists():
        app.mount("/icons", StaticFiles(directory=str(dist_dir / "icons")), name="icons")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        target_file = dist_dir / full_path
        if full_path and target_file.exists() and target_file.is_file():
            return FileResponse(str(target_file))
        return FileResponse(str(dist_dir / "index.html"))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
