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

  // 2. YOUTUBE & MULTI-PLATFORM MEDIA STREAM CONVERTER
  try {
    let targetFormat = '1080';
    if (isAudio) {
      targetFormat = 'mp3';
    } else if (rawFormat.includes('2160') || rawFormat.includes('4k')) {
      targetFormat = '1080'; // high compatibility
    } else if (rawFormat.includes('1440') || rawFormat.includes('2k')) {
      targetFormat = '1080';
    } else if (rawFormat.includes('1080')) {
      targetFormat = '1080';
    } else if (rawFormat.includes('720')) {
      targetFormat = '720';
    } else if (rawFormat.includes('480')) {
      targetFormat = '480';
    } else if (rawFormat.includes('360')) {
      targetFormat = '360';
    }

    // Initialize Loader.to conversion
    const initRes = await fetch(`https://loader.to/ajax/download.php?format=${targetFormat}&url=${encodeURIComponent(url)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
      }
    });

    if (initRes.ok) {
      const initData = await initRes.json();
      const jobId = initData.id;

      if (jobId) {
        // Poll for download URL (max 10 attempts, total ~15s)
        for (let i = 0; i < 8; i++) {
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          try {
            const progRes = await fetch(`https://loader.to/ajax/progress.php?id=${jobId}`, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
              }
            });

            if (progRes.ok) {
              const progData = await progRes.json();
              if (progData.download_url && progData.download_url.startsWith('http')) {
                // Return 302 Redirect directly to the high-speed CDN file stream!
                // When browser follows 302 with Content-Disposition attachment, it downloads the file natively to device!
                return res.redirect(302, progData.download_url);
              }
            }
          } catch (e) {
            console.log('Polling retry note:', e);
          }
        }
      }
    }

    // Fallback: Cobalt resolver
    const cobaltRes = await fetch('https://api.cobalt.tools/api/json', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0'
      },
      body: JSON.stringify({ url, isAudioOnly: isAudio })
    });

    if (cobaltRes.ok) {
      const cData = await cobaltRes.json();
      if (cData.url) {
        return res.redirect(302, cData.url);
      }
    }

    // If all online stream resolvers are busy, return helpful direct stream message
    return res.status(200).json({
      success: false,
      message: 'Video conversion in progress. Please retry the download button in a few seconds.',
      url
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
