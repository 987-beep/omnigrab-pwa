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

  return { cols, rows };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const action = req.query.action || (req.url.split('?')[0].split('/').pop());

  try {
    if (action === 'status') {
      const dbRes = await executeTurso("SELECT 1 as connected, datetime('now') as server_time;");
      return res.status(200).json({
        status: 'connected',
        provider: 'Turso LibSQL Cloud (AWS ap-south-1)',
        server_time: dbRes.rows[0]?.server_time
      });
    }

    if (action === 'history') {
      if (req.method === 'GET') {
        const dbRes = await executeTurso("SELECT * FROM downloads_history ORDER BY created_at DESC LIMIT 50;");
        return res.status(200).json({ success: true, history: dbRes.rows });
      }

      if (req.method === 'POST') {
        const item = req.body || {};
        const itemId = item.id || `hist_${Date.now()}`;
        await executeTurso(
          "INSERT INTO downloads_history (id, url, title, thumbnail, platform, quality, media_type, filesize, device_source) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);",
          [itemId, item.url || '', item.title || 'Media', item.thumbnail || '', item.platform || 'Web', item.quality || 'HD', item.media_type || 'video', item.filesize || 'Unknown', item.device_source || 'Vercel Web']
        );
        return res.status(200).json({ success: true, id: itemId });
      }

      if (req.method === 'DELETE') {
        await executeTurso("DELETE FROM downloads_history;");
        return res.status(200).json({ success: true, message: 'History cleared' });
      }
    }

    if (action === 'bookmarks') {
      if (req.method === 'GET') {
        const dbRes = await executeTurso("SELECT * FROM saved_bookmarks ORDER BY created_at DESC;");
        return res.status(200).json({ success: true, bookmarks: dbRes.rows });
      }

      if (req.method === 'POST') {
        const item = req.body || {};
        const itemId = item.id || `bm_${Date.now()}`;
        await executeTurso(
          "INSERT INTO saved_bookmarks (id, url, title, thumbnail, platform, notes) VALUES (?, ?, ?, ?, ?, ?);",
          [itemId, item.url || '', item.title || 'Saved Link', item.thumbnail || '', item.platform || 'Web', item.notes || '']
        );
        return res.status(200).json({ success: true, id: itemId });
      }
    }

    return res.status(200).json({ success: true, action });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
