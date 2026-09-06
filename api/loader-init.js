export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const url = (req.query?.url || req.body?.url || '').trim();
  const format = (req.query?.format || req.body?.format || '1080').trim();

  if (!url) {
    return res.status(400).json({ success: false, error: 'URL parameter is required' });
  }

  try {
    const loaderRes = await fetch(`https://loader.to/ajax/download.php?format=${encodeURIComponent(format)}&url=${encodeURIComponent(url)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
      }
    });

    if (!loaderRes.ok) {
      return res.status(502).json({ success: false, error: `Conversion upstream error (${loaderRes.status})` });
    }

    const data = await loaderRes.json();
    return res.status(200).json({
      success: true,
      id: data.id,
      title: data.title || '',
      thumbnail_url: data.thumbnail_url || data.info?.image || '',
      full_format: data.full_format || format
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
