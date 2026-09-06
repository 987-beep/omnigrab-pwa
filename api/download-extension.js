import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  return res.status(200).json({
    status: 'ready',
    message: 'Chrome Extension V3 is bundled inside the repo in the /extension folder',
    folder: 'extension/'
  });
}
