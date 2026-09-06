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
  const userId = req.headers['x-user-id'] || req.query.user_id || req.body?.user_id || 'usr_owner_01';
  const deviceId = req.headers['x-device-id'] || req.query.device_id || req.body?.device_id || 'browser';

  try {
    if (action === 'status') {
      const dbRes = await executeTurso("SELECT 1 as connected, datetime('now') as server_time;");
      return res.status(200).json({
        status: 'connected',
        provider: 'Turso LibSQL Cloud (AWS ap-south-1)',
        server_time: dbRes.rows[0]?.server_time,
        security: {
          isolation: 'Multi-User Partitioned Tenant Vaults',
          midnight_cleanup: '02:00 AM UTC (Purges downloads, preserves user profiles & bookmarks)'
        }
      });
    }

    // 1. USER PROFILES MANAGEMENT
    if (action === 'profiles') {
      if (req.method === 'GET') {
        const dbRes = await executeTurso("SELECT * FROM user_profiles ORDER BY created_at ASC;");
        return res.status(200).json({ success: true, profiles: dbRes.rows });
      }

      if (req.method === 'POST') {
        const profile = req.body || {};
        const pId = profile.id || `usr_${Date.now()}`;
        await executeTurso(
          `INSERT INTO user_profiles (id, name, avatar, color, role, vault_pin, last_active)
           VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
           ON CONFLICT(id) DO UPDATE SET 
             name=excluded.name, 
             avatar=excluded.avatar, 
             color=excluded.color, 
             role=excluded.role, 
             vault_pin=excluded.vault_pin, 
             last_active=CURRENT_TIMESTAMP;`,
          [
            pId,
            profile.name || 'User Profile',
            profile.avatar || '⚡',
            profile.color || 'cyan',
            profile.role || 'Member',
            profile.vaultPin || profile.vault_pin || ''
          ]
        );
        return res.status(200).json({ success: true, id: pId });
      }

      if (req.method === 'DELETE') {
        const pId = req.query.id;
        if (pId) {
          await executeTurso("DELETE FROM user_profiles WHERE id = ?;", [pId]);
          await executeTurso("DELETE FROM downloads_history WHERE user_id = ?;", [pId]);
          await executeTurso("DELETE FROM saved_bookmarks WHERE user_id = ?;", [pId]);
        }
        return res.status(200).json({ success: true });
      }
    }

    // 2. ISOLATED MULTI-USER HISTORY
    if (action === 'history') {
      if (req.method === 'GET') {
        const limit = parseInt(req.query.limit || '50', 10);
        let sql = "SELECT * FROM downloads_history WHERE user_id = ? ORDER BY created_at DESC LIMIT ?;";
        let args = [userId, limit];
        
        // If all requested
        if (req.query.user_id === 'all') {
          sql = "SELECT * FROM downloads_history ORDER BY created_at DESC LIMIT ?;";
          args = [limit];
        }

        const dbRes = await executeTurso(sql, args);
        return res.status(200).json({ success: true, user_id: userId, history: dbRes.rows });
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
        return res.status(200).json({ success: true, id: itemId, user_id: userId });
      }

      if (req.method === 'DELETE') {
        const itemId = req.query.id;
        if (itemId && itemId !== 'all') {
          await executeTurso("DELETE FROM downloads_history WHERE id = ? AND user_id = ?;", [itemId, userId]);
        } else {
          await executeTurso("DELETE FROM downloads_history WHERE user_id = ?;", [userId]);
        }
        return res.status(200).json({ success: true, message: 'User history cleared', user_id: userId });
      }
    }

    // 3. ISOLATED MULTI-USER BOOKMARKS
    if (action === 'bookmarks') {
      if (req.method === 'GET') {
        const dbRes = await executeTurso(
          "SELECT * FROM saved_bookmarks WHERE user_id = ? ORDER BY created_at DESC;",
          [userId]
        );
        return res.status(200).json({ success: true, user_id: userId, bookmarks: dbRes.rows });
      }

      if (req.method === 'POST') {
        const item = req.body || {};
        const itemId = item.id || `bm_${Date.now()}`;
        await executeTurso(
          "INSERT INTO saved_bookmarks (id, url, title, thumbnail, platform, notes, user_id) VALUES (?, ?, ?, ?, ?, ?, ?);",
          [itemId, item.url || '', item.title || 'Saved Link', item.thumbnail || '', item.platform || 'Web', item.notes || '', userId]
        );
        return res.status(200).json({ success: true, id: itemId, user_id: userId });
      }

      if (req.method === 'DELETE') {
        const itemId = req.query.id;
        if (itemId) {
          await executeTurso("DELETE FROM saved_bookmarks WHERE id = ? AND user_id = ?;", [itemId, userId]);
        }
        return res.status(200).json({ success: true, user_id: userId });
      }
    }

    // 4. CROSS-PROFILE TRANSFER
    if (action === 'transfer') {
      const { from_user_id, to_user_id, url, title, thumbnail, platform } = req.body || {};
      const transferId = `tr_${Date.now()}`;
      
      // Save transfer record
      await executeTurso(
        "INSERT INTO shared_transfers (id, from_user_id, to_user_id, url, title, thumbnail, platform) VALUES (?, ?, ?, ?, ?, ?, ?);",
        [transferId, from_user_id || userId, to_user_id, url || '', title || 'Shared Media', thumbnail || '', platform || 'Web']
      );

      // Copy directly into target user's downloads history
      const targetHistId = `hist_${Date.now()}`;
      await executeTurso(
        "INSERT INTO downloads_history (id, url, title, thumbnail, platform, quality, media_type, filesize, device_source, user_id, device_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);",
        [
          targetHistId,
          url || '',
          title || 'Transferred Media',
          thumbnail || '',
          platform || 'Web',
          'HD',
          'video',
          'Unknown',
          `Transferred from ${from_user_id || 'User'}`,
          to_user_id,
          deviceId
        ]
      );

      return res.status(200).json({ success: true, transfer_id: transferId, target_user: to_user_id });
    }

    // 5. MIDNIGHT 02:00 AM AUTO-PRUNE ENGINE (MULTI-USER SAFE)
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
        preserved_tables: ['user_profiles', 'saved_bookmarks', 'user_vaults', 'user_settings'],
        note: 'All user profiles, vaults, and saved bookmarks were safely preserved without deletion.'
      });
    }

    return res.status(200).json({ success: true, action });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
