export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Check Turso Database status
  let tursoStatus = { status: 'disconnected' };
  try {
    const tursoRes = await fetch('https://webextention-axuile.aws-ap-south-1.turso.io/v2/pipeline', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODg2Nzk0MzQsImlkIjoiMDFhMDc1OWEtMWQwMS03MTExLTlmOTItMDdiZjUxOTA4MzNjIiwia2lkIjoiZ3BKaE53cTF1TmQ5Z2Jjek9MOVZjaEQ4QTdxVzd4OTNoNWNWbkJObTJRdyIsInJpZCI6IjY0YzZjZjEwLThhZDgtNGM2Ni05MzA3LTkyY2NlMDU4YWJiYSJ9.f0GvIrNC5hQUTVOK3BLg0OEQ4otRHKHhyZip--7YyKRyOa4NorYQg6KfB4M9HDDI2ejP0KOlgxzmRgU75MnEBw`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        requests: [{ type: 'execute', stmt: { sql: 'SELECT 1 as connected;' } }]
      })
    });
    if (tursoRes.ok) {
      tursoStatus = {
        status: 'connected',
        provider: 'Turso LibSQL Cloud (AWS ap-south-1)',
        server_time: new Date().toISOString()
      };
    }
  } catch (e) {
    tursoStatus = { status: 'error', error: e.message };
  }

  return res.status(200).json({
    status: 'healthy',
    engine: 'OmniGrab Vercel Edge Serverless + Turso LibSQL',
    turso: tursoStatus,
    timestamp: new Date().toISOString()
  });
}
