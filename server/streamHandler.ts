import fs from 'fs';
import path from 'path';
import { Request, Response } from 'express';
import * as mm from 'music-metadata';
import { MUSIC_DIR, MIME_TYPES } from './config.js';
import { sanitizeRelativePath, isPathInsideRoot } from '../src/utils/pathSafety.js';
import { parseRangeHeader } from '../src/utils/range.js';
import { findCoverFileInDir } from './fsScanner.js';

/**
 * Handles HTTP 206 Partial Content range requests for instant seeking
 */
export function handleAudioStream(req: Request, res: Response) {
  const rawPath = req.query.path as string;
  if (!rawPath) {
    res.status(400).json({ error: 'Missing audio file path' });
    return;
  }

  const safeRelPath = sanitizeRelativePath(rawPath);
  const fullPath = path.join(MUSIC_DIR, safeRelPath);

  if (!isPathInsideRoot(MUSIC_DIR, fullPath) || !fs.existsSync(fullPath)) {
    res.status(404).json({ error: 'Audio file not found' });
    return;
  }

  const stat = fs.statSync(fullPath);
  if (!stat.isFile()) {
    res.status(400).json({ error: 'Path is not a regular file' });
    return;
  }

  const ext = path.extname(fullPath).toLowerCase();
  const mimeType = MIME_TYPES[ext] || 'application/octet-stream';
  const totalSize = stat.size;
  const rangeHeader = req.headers.range;

  if (!rangeHeader) {
    // Standard full stream
    res.writeHead(200, {
      'Content-Length': totalSize,
      'Content-Type': mimeType,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=3600',
    });
    fs.createReadStream(fullPath).pipe(res);
    return;
  }

  // Parse HTTP Range header
  const parsedRange = parseRangeHeader(rangeHeader, totalSize);

  if (!parsedRange) {
    res.status(416).set({
      'Content-Range': `bytes */${totalSize}`,
    }).send('Requested Range Not Satisfiable');
    return;
  }

  const { start, end, chunkSize } = parsedRange;

  res.writeHead(206, {
    'Content-Range': `bytes ${start}-${end}/${totalSize}`,
    'Accept-Ranges': 'bytes',
    'Content-Length': chunkSize,
    'Content-Type': mimeType,
    'Cache-Control': 'no-cache',
  });

  const stream = fs.createReadStream(fullPath, { start, end });
  stream.on('error', (err) => {
    console.error('Audio stream read error:', err);
    if (!res.headersSent) {
      res.status(500).end();
    }
  });

  stream.pipe(res);
}

/**
 * Serves album art: extracted from embedded ID3 picture, local cover image, or fallback SVG
 */
export async function handleCoverArt(req: Request, res: Response) {
  const rawPath = req.query.path as string;
  if (!rawPath) {
    serveDefaultPlaceholder(res, 'Audio');
    return;
  }

  const safeRelPath = sanitizeRelativePath(rawPath);
  const fullPath = path.join(MUSIC_DIR, safeRelPath);

  if (!isPathInsideRoot(MUSIC_DIR, fullPath) || !fs.existsSync(fullPath)) {
    serveDefaultPlaceholder(res, path.basename(rawPath));
    return;
  }

  const stat = fs.statSync(fullPath);

  // If path is an audio file, check for embedded image or adjacent cover
  if (stat.isFile()) {
    try {
      const meta = await mm.parseFile(fullPath, { skipCovers: false });
      if (meta.common.picture && meta.common.picture.length > 0) {
        const pic = meta.common.picture[0];
        res.setHeader('Content-Type', pic.format || 'image/jpeg');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        res.send(Buffer.from(pic.data));
        return;
      }
    } catch {
      // Fall through to directory cover
    }

    const dirFullPath = path.dirname(fullPath);
    const coverFile = findCoverFileInDir(dirFullPath);
    if (coverFile) {
      serveImageFile(coverFile, res);
      return;
    }
  } else if (stat.isDirectory()) {
    const coverFile = findCoverFileInDir(fullPath);
    if (coverFile) {
      serveImageFile(coverFile, res);
      return;
    }
  }

  serveDefaultPlaceholder(res, path.basename(safeRelPath) || 'Library');
}

function serveImageFile(filePath: string, res: Response) {
  const ext = path.extname(filePath).toLowerCase();
  const mimeMap: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml'
  };
  const mime = mimeMap[ext] || 'application/octet-stream';
  res.setHeader('Content-Type', mime);
  res.setHeader('Cache-Control', 'public, max-age=86400');
  fs.createReadStream(filePath).pipe(res);
}

function serveDefaultPlaceholder(res: Response, label: string) {
  const cleanLabel = label.substring(0, 18).toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1e293b" />
        <stop offset="100%" stop-color="#0f172a" />
      </linearGradient>
    </defs>
    <rect width="300" height="300" fill="url(#bg)" />
    <circle cx="150" cy="130" r="60" fill="#334155" opacity="0.5" />
    <polygon points="140,110 170,130 140,150" fill="#94a3b8" />
    <text x="150" y="230" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="600" fill="#94a3b8" text-anchor="middle" letter-spacing="2">${cleanLabel}</text>
  </svg>`;

  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.send(svg);
}
