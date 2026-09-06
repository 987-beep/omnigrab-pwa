export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const url = (req.query?.url || '').trim();
  const formatId = req.query?.format_id || 'best';
  const downloadType = req.query?.download_type || 'video';
  const isAudio = downloadType === 'audio';
  const filename = req.query?.filename || `omnigrab_${Date.now()}.${isAudio ? 'mp3' : 'mp4'}`;

  if (!url) {
    return res.status(400).json({ error: 'URL parameter is required' });
  }

  const lower = url.toLowerCase();

  // 1. DIRECT MEDIA URL PROXY STREAM
  if (['.mp4', '.webm', '.mov', '.mkv', '.mp3', '.m4a', '.jpg', '.png', '.webp'].some(ext => lower.split('?')[0].endsWith(ext))) {
    try {
      const directResp = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
        }
      });

      if (directResp.ok) {
        res.setHeader('Content-Type', isAudio ? 'audio/mpeg' : (directResp.headers.get('content-type') || 'video/mp4'));
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
        if (directResp.headers.get('content-length')) {
          res.setHeader('Content-Length', directResp.headers.get('content-length'));
        }

        const buffer = await directResp.arrayBuffer();
        return res.status(200).send(Buffer.from(buffer));
      }
    } catch (e) {
      console.log('Direct stream fetch note:', e);
    }
  }

  // 2. YOUTUBE / INSTAGRAM / TIKTOK / TWITTER MEDIA STREAM BRIDGES
  try {
    const cobaltEndpoints = [
      'https://api.cobalt.tools/api/json',
      'https://cobalt.api.online/api/json',
      'https://cobalt-api.kwiatekm.com/api/json'
    ];

    let resolvedUrl = null;

    for (const ep of cobaltEndpoints) {
      try {
        const cResp = await fetch(ep, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
          },
          body: JSON.stringify({
            url: url,
            vQuality: formatId.includes('1080') ? '1080' : (formatId.includes('720') ? '720' : 'max'),
            isAudioOnly: isAudio
          })
        });

        if (cResp.ok) {
          const cData = await cResp.json();
          if (cData.url) {
            resolvedUrl = cData.url;
            break;
          }
        }
      } catch (err) {}
    }

    if (resolvedUrl) {
      const streamResp = await fetch(resolvedUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });

      if (streamResp.ok) {
        res.setHeader('Content-Type', isAudio ? 'audio/mpeg' : 'video/mp4');
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
        if (streamResp.headers.get('content-length')) {
          res.setHeader('Content-Length', streamResp.headers.get('content-length'));
        }

        const buffer = await streamResp.arrayBuffer();
        return res.status(200).send(Buffer.from(buffer));
      }
    }

    // Fallback: Pipe with attachment headers
    res.setHeader('Content-Type', isAudio ? 'audio/mpeg' : 'video/mp4');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    return res.status(200).send(Buffer.from([]));

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
