const TURSO_DB_URL = "https://webextention-axuile.aws-ap-south-1.turso.io/v2/pipeline";
const TURSO_AUTH_TOKEN = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODg2Nzk0MzQsImlkIjoiMDFhMDc1OWEtMWQwMS03MTExLTlmOTItMDdiZjUxOTA4MzNjIiwia2lkIjoiZ3BKaE53cTF1TmQ5Z2Jjek9MOVZjaEQ4QTdxVzd4OTNoNWNWbkJObTJRdyIsInJpZCI6IjY0YzZjZjEwLThhZDgtNGM2Ni05MzA3LTkyY2NlMDU4YWJiYSJ9.f0GvIrNC5hQUTVOK3BLg0OEQ4otRHKHhyZip--7YyKRyOa4NorYQg6KfB4M9HDDI2ejP0KOlgxzmRgU75MnEBw";

export default async function handler(req, res) {
  // Midnight 02:00 AM Cron Cleanup Handler
  try {
    const purgeQuery = "DELETE FROM downloads_history WHERE created_at <= datetime('now', '-1 day');";
    
    const resp = await fetch(TURSO_DB_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TURSO_AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        requests: [
          {
            type: 'execute',
            stmt: { sql: purgeQuery, args: [] }
          },
          {
            type: 'execute',
            stmt: {
              sql: "INSERT OR REPLACE INTO system_maintenance (task_name, last_run, items_purged, status) VALUES ('midnight_02am_prune', CURRENT_TIMESTAMP, 0, 'success');",
              args: []
            }
          }
        ]
      })
    });

    const data = await resp.json();
    const purgedCount = data?.results?.[0]?.response?.result?.affected_row_count || 0;

    return res.status(200).json({
      success: true,
      job: 'midnight_02am_cron',
      schedule: '02:00 AM Daily',
      purged_records: purgedCount,
      preserved_sections: [
        'user_vaults (Account profiles preserved)',
        'saved_bookmarks (User favorites preserved)',
        'user_settings (Preferences preserved)'
      ],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
