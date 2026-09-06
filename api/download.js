export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const url = (req.query?.url || '').trim();
  const rawFormat = req.query?.format_id || '1080';
  const downloadType = req.query?.download_type || 'video';
  const isAudio = downloadType === 'audio';
  const filename = req.query?.filename || `OmniGrab_${Date.now()}.${isAudio ? 'mp3' : 'mp4'}`;

  if (!url) {
    return res.status(400).json({ error: 'URL parameter is required' });
  }

  const lower = url.toLowerCase();

  // 1. DIRECT MEDIA URL (MP4, MP3, WebM, MOV, etc.)
  if (['.mp4', '.webm', '.mov', '.mkv', '.mp3', '.m4a', '.jpg', '.png', '.webp'].some(ext => lower.split('?')[0].endsWith(ext))) {
    return res.redirect(302, url);
  }

  // 2. CONVERT USING LOADER
  try {
    let targetFormat = '1080';
    if (isAudio) {
      targetFormat = 'mp3';
    } else if (rawFormat.includes('720')) {
      targetFormat = '720';
    } else if (rawFormat.includes('480')) {
      targetFormat = '480';
    } else if (rawFormat.includes('360')) {
      targetFormat = '360';
    }

    const initRes = await fetch(`https://loader.to/ajax/download.php?format=${targetFormat}&url=${encodeURIComponent(url)}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });

    if (initRes.ok) {
      const initData = await initRes.json();
      const jobId = initData.id;

      if (jobId) {
        for (let i = 0; i < 6; i++) {
          await new Promise(resolve => setTimeout(resolve, 1200));
          try {
            const progRes = await fetch(`https://loader.to/ajax/progress.php?id=${jobId}`, {
              headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
            });
            if (progRes.ok) {
              const progData = await progRes.json();
              if (progData.download_url && progData.download_url.startsWith('http')) {
                return res.redirect(302, progData.download_url);
              }
            }
          } catch (e) {}
        }
      }
    }

    // Direct fallback
    return res.redirect(302, url);
  } catch (error) {
    return res.redirect(302, url);
  }
}
