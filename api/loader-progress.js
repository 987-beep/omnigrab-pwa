export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const id = (req.query?.id || req.body?.id || '').trim();

  if (!id) {
    return res.status(400).json({ success: false, error: 'Job ID parameter is required' });
  }

  try {
    const progRes = await fetch(`https://loader.to/ajax/progress.php?id=${encodeURIComponent(id)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
      }
    });

    if (!progRes.ok) {
      return res.status(502).json({ success: false, error: `Progress upstream error (${progRes.status})` });
    }

    const data = await progRes.json();
    return res.status(200).json({
      success: true,
      progress: data.progress || 0,
      text: data.text || 'Processing stream...',
      download_url: data.download_url || null,
      title: data.title || '',
      format: data.format || ''
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
