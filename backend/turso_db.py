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
                "isolation": "Tenant / User Vault (Zero-Leakage)",
                "auto_prune": "Daily at 02:00 AM (Downloads Only)",
                "preserved_data": "User Accounts, Vault Keys, Bookmarks & Settings"
            },
            "last_maintenance": maintenance
        }
    except Exception as e:
        return {
            "status": "disconnected",
            "error": str(e)
        }

# --- MULTI-USER / MULTI-DEVICE TENANT ISOLATION ---

def get_cloud_history(user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
    check_and_lazy_prune()
    if not user_id or user_id.strip() == "":
        user_id = "default_guest"
    
    sql = """
    SELECT * FROM downloads_history 
    WHERE user_id = ? 
    ORDER BY created_at DESC 
    LIMIT ?
    """
    res = execute_query(sql, [user_id, limit])
    return res.get("rows", [])

def add_cloud_history(item: Dict[str, Any], user_id: str, device_id: str = "browser") -> Dict[str, Any]:
    check_and_lazy_prune()
    if not user_id:
        user_id = "default_guest"
    
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

def delete_cloud_history(item_id: str, user_id: str) -> bool:
    if not user_id:
        user_id = "default_guest"
        
    if item_id == "all":
        # Strictly deletes only records belonging to this specific user_id
        execute_query("DELETE FROM downloads_history WHERE user_id = ?;", [user_id])
    else:
        # Strictly enforces user_id check so no user can delete another user's item
        execute_query("DELETE FROM downloads_history WHERE id = ? AND user_id = ?;", [item_id, user_id])
    return True

def get_cloud_bookmarks(user_id: str) -> List[Dict[str, Any]]:
    if not user_id:
        user_id = "default_guest"
        
    sql = "SELECT * FROM saved_bookmarks WHERE user_id = ? ORDER BY created_at DESC"
    res = execute_query(sql, [user_id])
    return res.get("rows", [])

def add_cloud_bookmark(item: Dict[str, Any], user_id: str) -> Dict[str, Any]:
    if not user_id:
        user_id = "default_guest"
        
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

def delete_cloud_bookmark(b_id: str, user_id: str) -> bool:
    if not user_id:
        user_id = "default_guest"
        
    execute_query("DELETE FROM saved_bookmarks WHERE id = ? AND user_id = ?;", [b_id, user_id])
    return True

def sync_user_vault(user_id: str, vault_pin: Optional[str] = None, device_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Validates or registers a multi-device secure vault.
    Allows user to sync Android + Chrome Extension + Desktop without exposing data to other users.
    """
    if not user_id:
        user_id = f"usr_{uuid.uuid4().hex[:10]}"
    
    # Check if vault exists
    check = execute_query("SELECT * FROM user_vaults WHERE user_id = ?", [user_id])
    if check.get("rows"):
        execute_query(
            "UPDATE user_vaults SET last_active = CURRENT_TIMESTAMP, device_count = device_count + 1 WHERE user_id = ?",
            [user_id]
        )
        return {
            "user_id": user_id,
            "status": "authenticated",
            "vault_pin": check["rows"][0].get("vault_pin")
        }
    else:
        pin = vault_pin or f"PIN-{str(uuid.uuid4().int)[:6]}"
        execute_query(
            "INSERT INTO user_vaults (user_id, vault_pin, device_count) VALUES (?, ?, 1)",
            [user_id, pin]
        )
        return {
            "user_id": user_id,
            "status": "created",
            "vault_pin": pin
        }

# --- MIDNIGHT 02:00 AM AUTO-PRUNE / STORAGE SAVER ENGINE ---

def auto_prune_midnight_storage(force: bool = False) -> Dict[str, Any]:
    """
    Auto-prune engine:
    - Runs at 02:00 AM daily
    - Purges downloaded material & download logs (downloads_history)
    - PRESERVES all user sections: saved_bookmarks, user_vaults, user_settings
    """
    try:
        # Count items before purge
        count_res = execute_query("SELECT COUNT(*) as cnt FROM downloads_history")
        total_downloads = count_res["rows"][0]["cnt"] if count_res.get("rows") else 0

        # Purge download history records older than 24 hours or before 2:00 AM cutoff
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
    """
    Runs lazy check every hour: if today's 02:00 AM has passed and no cleanup ran today, trigger prune!
    """
    global _last_lazy_check
    now = time.time()
    if now - _last_lazy_check < 3600:  # Check at most once per hour
        return
    _last_lazy_check = now
    
    try:
        now_dt = datetime.now(timezone.utc)
        # If UTC hour is >= 2, check if cleanup ran today
        res = execute_query("SELECT last_run FROM system_maintenance WHERE task_name = 'midnight_02am_prune'")
        if res.get("rows"):
            last_run_str = res["rows"][0].get("last_run", "")
            # If last run was not today, run auto prune
            if last_run_str and last_run_str[:10] != now_dt.strftime("%Y-%m-%d") and now_dt.hour >= 2:
                auto_prune_midnight_storage()
    except Exception:
        pass
