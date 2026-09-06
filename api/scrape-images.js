export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const url = (req.body?.url || req.query?.url || '').trim();
  if (!url) return res.status(400).json({ detail: 'URL is required' });

  try {
    const resp = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36' }
    });
    const html = await resp.text();

    const titleMatch = html.match(/<title>([^<]+)<\/title>/);
    const page_title = titleMatch ? titleMatch[1].trim() : url;

    const imgMatches = [...html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)];
    const images = [];
    const seen = new Set();

    for (let i = 0; i < Math.min(imgMatches.length, 30); i++) {
      let src = imgMatches[i][1];
      if (src && !src.startsWith('data:image/svg') && !seen.has(src)) {
        if (!src.startsWith('http')) {
          try { src = new URL(src, url).href; } catch(e) {}
        }
        seen.add(src);
        images.push({
          id: `img_${i}`,
          src: src,
          alt: `Photo ${i + 1}`,
          type: src.split('.').pop().split('?')[0].toUpperCase() || 'JPG',
          resolution: 'High Res',
          size: 'Full Size'
        });
      }
    }

    return res.status(200).json({
      success: true,
      url,
      page_title,
      total_count: images.length,
      images
    });
  } catch (err) {
    return res.status(500).json({ detail: err.message });
  }
}
