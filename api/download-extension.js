import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const zipPath = path.join(process.cwd(), 'public', 'OmniGrab_Chrome_Extension_V3.zip');
  
  if (fs.existsSync(zipPath)) {
    const stat = fs.statSync(zipPath);
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="OmniGrab_Chrome_Extension_V3.zip"');
    res.setHeader('Content-Length', stat.size);
    
    const stream = fs.createReadStream(zipPath);
    return stream.pipe(res);
  } else {
    // If running in edge without filesystem access, redirect to static asset
    return res.redirect(302, '/OmniGrab_Chrome_Extension_V3.zip');
  }
}
