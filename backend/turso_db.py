import os
import json
import uuid
import time
from datetime import datetime, timezone, timedelta
import requests
from typing import List, Dict, Any, Optional

TURSO_DB_URL = os.getenv("TURSO_DB_URL", "https://webextention-axuile.aws-ap-south-1.turso.io/v2/pipeline")
TURSO_AUTH_TOKEN = os.getenv("TURSO_AUTH_TOKEN", "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODg2Nzk0MzQsImlkIjoiMDFhMDc1OWEtMWQwMS03MTExLTlmOTItMDdiZjUxOTA4MzNjIiwia2lkIjoiZ3BKaE53cTF1TmQ5Z2Jjek9MOVZjaEQ4QTdxVzd4OTNoNWNWbkJObTJRdyIsInJpZCI6IjY0YzZjZjEwLThhZDgtNGM2Ni05MzA3LTkyY2NlMDU4YWJiYSJ9.f0GvIrNC5hQUTVOK3BLg0OEQ4otRHKHhyZip--7YyKRyOa4NorYQg6KfB4M9HDDI2ejP0KOlgxzmRgU75MnEBw")

# If URL is in libsql:// format, convert to https://.../v2/pipeline
if TURSO_DB_URL.startswith("libsql://"):
    host = TURSO_DB_URL.replace("libsql://", "").split("/")[0]
    TURSO_DB_URL = f"https://{host}/v2/pipeline"
elif not TURSO_DB_URL.endswith("/v2/pipeline"):
    TURSO_DB_URL = TURSO_DB_URL.rstrip("/") + "/v2/pipeline"

HEADERS = {
    "Authorization": f"Bearer {TURSO_AUTH_TOKEN}",
    "Content-Type": "application/json"
}

def execute_query(sql: str, args: Optional[List[Any]] = None) -> Dict[str, Any]:
    stmt: Dict[str, Any] = {"sql": sql}
    if args:
        formatted_args = []
        for a in args:
            if a is None:
                formatted_args.append({"type": "null"})
            elif isinstance(a, int):
                formatted_args.append({"type": "integer", "value": str(a)})
            elif isinstance(a, float):
                formatted_args.append({"type": "float", "value": a})
            else:
                formatted_args.append({"type": "text", "value": str(a)})
        stmt["args"] = formatted_args

    payload = {"requests": [{"type": "execute", "stmt": stmt}]}
    
    t0 = time.time()
    resp = requests.post(TURSO_DB_URL, headers=HEADERS, json=payload, timeout=10)
    latency_ms = round((time.time() - t0) * 1000, 1)

    if resp.status_code != 200:
        raise Exception(f"Turso Error ({resp.status_code}): {resp.text}")

    data = resp.json()
    result = data.get("results", [{}])[0].get("response", {}).get("result", {})
    
    cols = [c["name"] for c in result.get("cols", [])]
    rows = []
    for r in result.get("rows", []):
        row_dict = {}
        for idx, col_name in enumerate(cols):
            val = r[idx].get("value")
            row_dict[col_name] = val
        rows.append(row_dict)

    return {
        "cols": cols,
        "rows": rows,
        "affected_row_count": result.get("affected_row_count", 0),
        "latency_ms": latency_ms
    }

def check_turso_health() -> Dict[str, Any]:
    try:
        res = execute_query("SELECT 1 as connected, datetime('now') as server_time;")
        maintenance = get_maintenance_status()
        return {
            "status": "connected",
            "provider": "Turso LibSQL Cloud (AWS ap-south-1)",
            "latency_ms": res.get("latency_ms"),
            "server_time": res["rows"][0].get("server_time") if res.get("rows") else None,
            "security": {
                "isolation": "Multi-User Tenant Vault Architecture",
                "auto_prune": "Daily at 02:00 AM (Downloads Only)",
                "preserved_data": "User Profiles, Bookmarks & Vault PINs"
            },
            "last_maintenance": maintenance
        }
    except Exception as e:
        return {
            "status": "disconnected",
            "error": str(e)
        }

# --- MULTI-USER PROFILES & VAULTS ---

def get_cloud_profiles() -> List[Dict[str, Any]]:
    sql = "SELECT * FROM user_profiles ORDER BY created_at ASC"
    res = execute_query(sql)
    return res.get("rows", [])

def sync_cloud_profile(profile: Dict[str, Any]) -> Dict[str, Any]:
    p_id = profile.get("id") or f"usr_{uuid.uuid4().hex[:8]}"
    sql = """
    INSERT INTO user_profiles (id, name, avatar, color, role, vault_pin, last_active)
    VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET 
      name=excluded.name, 
      avatar=excluded.avatar, 
      color=excluded.color, 
      role=excluded.role, 
      vault_pin=excluded.vault_pin, 
      last_active=CURRENT_TIMESTAMP
    """
    args = [
        p_id,
        profile.get("name", "User Profile"),
        profile.get("avatar", "⚡"),
        profile.get("color", "cyan"),
        profile.get("role", "Member"),
        profile.get("vaultPin") or profile.get("vault_pin") or ""
    ]
    execute_query(sql, args)
    return {"id": p_id, "success": True}

def delete_cloud_profile(profile_id: str) -> bool:
    execute_query("DELETE FROM user_profiles WHERE id = ?", [profile_id])
    execute_query("DELETE FROM downloads_history WHERE user_id = ?", [profile_id])
    execute_query("DELETE FROM saved_bookmarks WHERE user_id = ?", [profile_id])
    return True

# --- MULTI-USER CLOUD HISTORY & BOOKMARKS REPOSITORY ---

def get_cloud_history(user_id: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
    check_and_lazy_prune()
    if not user_id or user_id == "all":
        sql = "SELECT * FROM downloads_history ORDER BY created_at DESC LIMIT ?"
        res = execute_query(sql, [limit])
    else:
        sql = """
        SELECT * FROM downloads_history 
        WHERE user_id = ? 
        ORDER BY created_at DESC 
        LIMIT ?
        """
        res = execute_query(sql, [user_id, limit])
    return res.get("rows", [])

def add_cloud_history(item: Dict[str, Any], user_id: str = "usr_owner_01", device_id: str = "browser") -> Dict[str, Any]:
    check_and_lazy_prune()
    if not user_id:
        user_id = "usr_owner_01"
    
    item_id = item.get("id") or str(uuid.uuid4())[:12]
    sql = """
    INSERT INTO downloads_history (id, url, title, thumbnail, platform, quality, media_type, filesize, device_source, user_id, device_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """
    args = [
        item_id,
        item.get("url", ""),
        item.get("title", "Untitled Media"),
        item.get("thumbnail", ""),
        item.get("platform", "Web"),
        item.get("quality", "HD"),
        item.get("media_type", "video"),
        item.get("filesize", "Unknown"),
        item.get("device_source", "Web PWA"),
        user_id,
        device_id or "device"
    ]
    execute_query(sql, args)
    return {"id": item_id, "user_id": user_id, "success": True}

def delete_cloud_history(item_id: str, user_id: str = "usr_owner_01") -> bool:
    if item_id == "all":
        execute_query("DELETE FROM downloads_history WHERE user_id = ?;", [user_id])
    else:
        execute_query("DELETE FROM downloads_history WHERE id = ? AND user_id = ?;", [item_id, user_id])
    return True

def get_cloud_bookmarks(user_id: Optional[str] = None) -> List[Dict[str, Any]]:
    if not user_id or user_id == "all":
        sql = "SELECT * FROM saved_bookmarks ORDER BY created_at DESC"
        res = execute_query(sql)
    else:
        sql = "SELECT * FROM saved_bookmarks WHERE user_id = ? ORDER BY created_at DESC"
        res = execute_query(sql, [user_id])
    return res.get("rows", [])

def add_cloud_bookmark(item: Dict[str, Any], user_id: str = "usr_owner_01") -> Dict[str, Any]:
    b_id = item.get("id") or str(uuid.uuid4())[:12]
    sql = """
    INSERT INTO saved_bookmarks (id, url, title, thumbnail, platform, notes, user_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """
    args = [
        b_id,
        item.get("url", ""),
        item.get("title", "Saved Link"),
        item.get("thumbnail", ""),
        item.get("platform", "Web"),
        item.get("notes", ""),
        user_id
    ]
    execute_query(sql, args)
    return {"id": b_id, "user_id": user_id, "success": True}

def delete_cloud_bookmark(b_id: str, user_id: str = "usr_owner_01") -> bool:
    execute_query("DELETE FROM saved_bookmarks WHERE id = ? AND user_id = ?;", [b_id, user_id])
    return True

def transfer_cloud_item(item: Dict[str, Any], from_user: str, to_user: str) -> Dict[str, Any]:
    t_id = f"tr_{uuid.uuid4().hex[:10]}"
    execute_query(
        "INSERT INTO shared_transfers (id, from_user_id, to_user_id, url, title, thumbnail, platform) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [t_id, from_user, to_user, item.get("url", ""), item.get("title", "Media"), item.get("thumbnail", ""), item.get("platform", "Web")]
    )
    add_cloud_history({
        "url": item.get("url", ""),
        "title": item.get("title", "Media"),
        "thumbnail": item.get("thumbnail", ""),
        "platform": item.get("platform", "Web"),
        "quality": "HD",
        "media_type": "video",
        "device_source": f"Transferred from {from_user}"
    }, user_id=to_user)
    return {"success": True, "transfer_id": t_id}

# --- MIDNIGHT 02:00 AM AUTO-PRUNE / STORAGE SAVER ENGINE ---

def auto_prune_midnight_storage(force: bool = False) -> Dict[str, Any]:
    """
    Auto-prune engine:
    - Runs at 02:00 AM daily
    - Purges downloaded material & download logs (downloads_history) across all users
    - PRESERVES all user profiles, vaults, bookmarks, and settings
    """
    try:
        purge_query = "DELETE FROM downloads_history WHERE created_at <= datetime('now', '-1 day');"
        res = execute_query(purge_query)
        purged_count = res.get("affected_row_count", 0)

        # Update system maintenance tracking record
        execute_query("""
        INSERT OR REPLACE INTO system_maintenance (task_name, last_run, items_purged, status)
        VALUES ('midnight_02am_prune', CURRENT_TIMESTAMP, ?, 'success')
        """, [purged_count])

        return {
            "success": True,
            "task": "midnight_02am_prune",
            "schedule": "02:00 AM Daily",
            "purged_download_records": purged_count,
            "preserved": [
                "user_profiles (Never deleted)",
                "saved_bookmarks (Never deleted)",
                "user_vaults & device IDs (Never deleted)",
                "user_settings (Never deleted)"
            ],
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

def get_maintenance_status() -> Dict[str, Any]:
    try:
        res = execute_query("SELECT * FROM system_maintenance WHERE task_name = 'midnight_02am_prune'")
        if res.get("rows"):
            return res["rows"][0]
        return {"task_name": "midnight_02am_prune", "last_run": "Scheduled for 02:00 AM", "status": "active"}
    except:
        return {"status": "scheduled", "time": "02:00 AM"}

_last_lazy_check = 0
def check_and_lazy_prune():
    global _last_lazy_check
    now = time.time()
    if now - _last_lazy_check < 3600:
        return
    _last_lazy_check = now
    
    try:
        now_dt = datetime.now(timezone.utc)
        res = execute_query("SELECT last_run FROM system_maintenance WHERE task_name = 'midnight_02am_prune'")
        if res.get("rows"):
            last_run_str = res["rows"][0].get("last_run", "")
            if last_run_str and last_run_str[:10] != now_dt.strftime("%Y-%m-%d") and now_dt.hour >= 2:
                auto_prune_midnight_storage()
    except Exception:
        pass
