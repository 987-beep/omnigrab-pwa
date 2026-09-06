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
  const filename = req.query?.filename || `omnigrab_${Date.now()}.${downloadType === 'audio' ? 'mp3' : 'mp4'}`;

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
        res.setHeader('Content-Type', directResp.headers.get('content-type') || 'video/mp4');
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

  // 2. YOUTUBE / COBALT / INVIDIOUS STREAM RESOLVER
  try {
    // Attempt Cobalt Media Resolver API
    const cobaltInstances = [
      'https://api.cobalt.tools/api/json',
      'https://cobalt-api.kwiatekm.com/api/json',
      'https://api.wuk.sh/api/json'
    ];

    let resolvedStreamUrl = null;

    for (const endpoint of cobaltInstances) {
      try {
        const cResp = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          body: JSON.stringify({
            url: url,
            vQuality: formatId.includes('1080') ? '1080' : (formatId.includes('720') ? '720' : 'max'),
            isAudioOnly: downloadType === 'audio'
          })
        });

        if (cResp.ok) {
          const cData = await cResp.json();
          if (cData.url) {
            resolvedStreamUrl = cData.url;
            break;
          }
        }
      } catch (err) {}
    }

    // Fallback: If YouTube video, check Invidious streaming endpoints
    if (!resolvedStreamUrl && (lower.includes('youtube.com') || lower.includes('youtu.be'))) {
      const vMatch = url.match(/(?:youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*)/);
      const vid = vMatch && vMatch[1].length === 11 ? vMatch[1] : null;

      if (vid) {
        const invidiousInstances = [
          'https://inv.tux.pizza',
          'https://invidious.nerdvpn.de',
          'https://vid.puffyan.us',
          'https://invidious.projectsegfau.lt'
        ];

        for (const inst of invidiousInstances) {
          try {
            const iResp = await fetch(`${inst}/api/v1/videos/${vid}`, {
              headers: { 'User-Agent': 'Mozilla/5.0' }
            });
            if (iResp.ok) {
              const iData = await iResp.json();
              const formats = iData.formatStreams || [];
              const bestFormat = formats.find(f => f.qualityLabel === '720p') || formats[0];
              if (bestFormat && bestFormat.url) {
                resolvedStreamUrl = bestFormat.url;
                break;
              }
            }
          } catch (err) {}
        }
      }
    }

    if (resolvedStreamUrl) {
      // Stream the media directly to the client
      const mediaResp = await fetch(resolvedStreamUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (mediaResp.ok) {
        res.setHeader('Content-Type', downloadType === 'audio' ? 'audio/mpeg' : 'video/mp4');
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
        if (mediaResp.headers.get('content-length')) {
          res.setHeader('Content-Length', mediaResp.headers.get('content-length'));
        }

        const buffer = await mediaResp.arrayBuffer();
        return res.status(200).send(Buffer.from(buffer));
      } else {
        // Redirect directly to stream if proxying fails
        return res.redirect(302, resolvedStreamUrl);
      }
    }

    // If resolver fails, return informative JSON response with guidance
    return res.status(200).json({
      success: false,
      error: 'Media stream resolver active. For full 4K local transcoding, run OmniGrab Pro backend locally with static FFmpeg.',
      direct_url: url
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
