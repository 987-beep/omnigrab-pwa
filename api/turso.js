const TURSO_DB_URL = "https://webextention-axuile.aws-ap-south-1.turso.io/v2/pipeline";
const TURSO_AUTH_TOKEN = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODg2Nzk0MzQsImlkIjoiMDFhMDc1OWEtMWQwMS03MTExLTlmOTItMDdiZjUxOTA4MzNjIiwia2lkIjoiZ3BKaE53cTF1TmQ5Z2Jjek9MOVZjaEQ4QTdxVzd4OTNoNWNWbkJObTJRdyIsInJpZCI6IjY0YzZjZjEwLThhZDgtNGM2Ni05MzA3LTkyY2NlMDU4YWJiYSJ9.f0GvIrNC5hQUTVOK3BLg0OEQ4otRHKHhyZip--7YyKRyOa4NorYQg6KfB4M9HDDI2ejP0KOlgxzmRgU75MnEBw";

async function executeTurso(sql, args = []) {
  const formattedArgs = args.map(a => {
    if (a === null || a === undefined) return { type: 'null' };
    if (typeof a === 'number') return { type: 'integer', value: String(a) };
    return { type: 'text', value: String(a) };
  });

  const resp = await fetch(TURSO_DB_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TURSO_AUTH_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      requests: [{
        type: 'execute',
        stmt: { sql: sql.trim(), args: formattedArgs }
      }]
    })
  });

  if (!resp.ok) throw new Error(`Turso HTTP ${resp.status}`);
  const data = await resp.json();
  const result = data?.results?.[0]?.response?.result || {};
  const cols = (result.cols || []).map(c => c.name);
  const rows = (result.rows || []).map(r => {
    const obj = {};
    cols.forEach((col, idx) => { obj[col] = r[idx]?.value; });
    return obj;
  });

  return { cols, rows, affected_row_count: result.affected_row_count || 0 };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-User-ID, X-Device-ID');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const action = req.query.action || (req.url.split('?')[0].split('/').pop());
  const userId = req.headers['x-user-id'] || req.query.user_id || req.body?.user_id || 'default_guest';
  const deviceId = req.headers['x-device-id'] || req.query.device_id || req.body?.device_id || 'browser';

  try {
    if (action === 'status') {
      const dbRes = await executeTurso("SELECT 1 as connected, datetime('now') as server_time;");
      return res.status(200).json({
        status: 'connected',
        provider: 'Turso LibSQL Cloud (AWS ap-south-1)',
        server_time: dbRes.rows[0]?.server_time,
        security: {
          isolation: 'Personal Private Cloud Storage Architecture',
          midnight_cleanup: '02:00 AM UTC (Purges downloads, preserves user & bookmarks)'
        }
      });
    }

    // 1. CLOUD HISTORY
    if (action === 'history') {
      if (req.method === 'GET') {
        const limit = parseInt(req.query.limit || '50', 10);
        const dbRes = await executeTurso(
          "SELECT * FROM downloads_history ORDER BY created_at DESC LIMIT ?;",
          [limit]
        );
        return res.status(200).json({ success: true, history: dbRes.rows });
      }

      if (req.method === 'POST') {
        const item = req.body || {};
        const itemId = item.id || `hist_${Date.now()}`;
        await executeTurso(
          "INSERT INTO downloads_history (id, url, title, thumbnail, platform, quality, media_type, filesize, device_source, user_id, device_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);",
          [
            itemId, 
            item.url || '', 
            item.title || 'Media', 
            item.thumbnail || '', 
            item.platform || 'Web', 
            item.quality || 'HD', 
            item.media_type || 'video', 
            item.filesize || 'Unknown', 
            item.device_source || 'Vercel PWA',
            userId,
            deviceId
          ]
        );
        return res.status(200).json({ success: true, id: itemId });
      }

      if (req.method === 'DELETE') {
        const itemId = req.query.id;
        if (itemId && itemId !== 'all') {
          await executeTurso("DELETE FROM downloads_history WHERE id = ?;", [itemId]);
        } else {
          await executeTurso("DELETE FROM downloads_history;");
        }
        return res.status(200).json({ success: true, message: 'History cleared' });
      }
    }

    // 2. SAVED BOOKMARKS (PRESERVED ACROSS CLEANUPS)
    if (action === 'bookmarks') {
      if (req.method === 'GET') {
        const dbRes = await executeTurso(
          "SELECT * FROM saved_bookmarks ORDER BY created_at DESC;"
        );
        return res.status(200).json({ success: true, bookmarks: dbRes.rows });
      }

      if (req.method === 'POST') {
        const item = req.body || {};
        const itemId = item.id || `bm_${Date.now()}`;
        await executeTurso(
          "INSERT INTO saved_bookmarks (id, url, title, thumbnail, platform, notes, user_id) VALUES (?, ?, ?, ?, ?, ?, ?);",
          [itemId, item.url || '', item.title || 'Saved Link', item.thumbnail || '', item.platform || 'Web', item.notes || '', userId]
        );
        return res.status(200).json({ success: true, id: itemId });
      }

      if (req.method === 'DELETE') {
        const itemId = req.query.id;
        if (itemId) {
          await executeTurso("DELETE FROM saved_bookmarks WHERE id = ?;", [itemId]);
        }
        return res.status(200).json({ success: true });
      }
    }

    // 3. PRIVATE VAULT MULTI-DEVICE PAIRING
    if (action === 'vault') {
      const pin = req.body?.vault_pin || `PIN-${Math.floor(100000 + Math.random() * 900000)}`;
      const existing = await executeTurso("SELECT * FROM user_vaults WHERE user_id = ?;", [userId]);
      if (existing.rows.length > 0) {
        await executeTurso("UPDATE user_vaults SET last_active = CURRENT_TIMESTAMP, device_count = device_count + 1 WHERE user_id = ?;", [userId]);
        return res.status(200).json({ success: true, user_id: userId, vault_pin: existing.rows[0].vault_pin, status: 'synced' });
      } else {
        await executeTurso("INSERT INTO user_vaults (user_id, vault_pin, device_count) VALUES (?, ?, 1);", [userId, pin]);
        return res.status(200).json({ success: true, user_id: userId, vault_pin: pin, status: 'created' });
      }
    }

    // 4. MIDNIGHT 02:00 AM AUTO-PRUNE ENGINE
    if (action === 'prune') {
      const purgeRes = await executeTurso("DELETE FROM downloads_history WHERE created_at <= datetime('now', '-1 day');");
      await executeTurso(
        "INSERT OR REPLACE INTO system_maintenance (task_name, last_run, items_purged, status) VALUES ('midnight_02am_prune', CURRENT_TIMESTAMP, ?, 'success');",
        [purgeRes.affected_row_count]
      );
      return res.status(200).json({
        success: true,
        task: 'midnight_02am_prune',
        schedule: '02:00 AM Daily',
        purged_records: purgeRes.affected_row_count,
        preserved_tables: ['saved_bookmarks', 'user_vaults', 'user_settings'],
        note: 'User profiles and bookmarks were safely preserved without deletion.'
      });
    }

    return res.status(200).json({ success: true, action });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
