import os
import json
import uuid
import time
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
        # Convert args to Hrana parameter format
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
        return {
            "status": "connected",
            "provider": "Turso LibSQL Cloud (AWS ap-south-1)",
            "latency_ms": res.get("latency_ms"),
            "server_time": res["rows"][0].get("server_time") if res.get("rows") else None
        }
    except Exception as e:
        return {
            "status": "disconnected",
            "error": str(e)
        }

def get_cloud_history(limit: int = 50) -> List[Dict[str, Any]]:
    sql = "SELECT * FROM downloads_history ORDER BY created_at DESC LIMIT ?"
    res = execute_query(sql, [limit])
    return res.get("rows", [])

def add_cloud_history(item: Dict[str, Any]) -> Dict[str, Any]:
    item_id = item.get("id") or str(uuid.uuid4())[:12]
    sql = """
    INSERT INTO downloads_history (id, url, title, thumbnail, platform, quality, media_type, filesize, device_source)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        item.get("device_source", "Web PWA")
    ]
    execute_query(sql, args)
    return {"id": item_id, "success": True}

def delete_cloud_history(item_id: str) -> bool:
    if item_id == "all":
        execute_query("DELETE FROM downloads_history;")
    else:
        execute_query("DELETE FROM downloads_history WHERE id = ?;", [item_id])
    return True

def get_cloud_bookmarks() -> List[Dict[str, Any]]:
    sql = "SELECT * FROM saved_bookmarks ORDER BY created_at DESC"
    res = execute_query(sql)
    return res.get("rows", [])

def add_cloud_bookmark(item: Dict[str, Any]) -> Dict[str, Any]:
    b_id = item.get("id") or str(uuid.uuid4())[:12]
    sql = """
    INSERT INTO saved_bookmarks (id, url, title, thumbnail, platform, notes)
    VALUES (?, ?, ?, ?, ?, ?)
    """
    args = [
        b_id,
        item.get("url", ""),
        item.get("title", "Saved Link"),
        item.get("thumbnail", ""),
        item.get("platform", "Web"),
        item.get("notes", "")
    ]
    execute_query(sql, args)
    return {"id": b_id, "success": True}

def delete_cloud_bookmark(b_id: str) -> bool:
    execute_query("DELETE FROM saved_bookmarks WHERE id = ?;", [b_id])
    return True
