import fs from 'fs';
import path from 'path';
import * as mm from 'music-metadata';
import { MUSIC_DIR, SUPPORTED_AUDIO_EXTENSIONS } from './config.js';
import { sanitizeRelativePath, isPathInsideRoot } from '../src/utils/pathSafety.js';
import { Track, FolderItem, DirectoryListing } from '../src/types/music.js';

interface CachedMeta {
  mtime: number;
  track: Track;
}

const metadataCache = new Map<string, CachedMeta>();

/**
 * Returns clean format without leading dot (e.g. "mp3", "flac")
 */
function getFormat(ext: string): string {
  return ext.replace(/^\./, '').toLowerCase();
}

/**
 * Parses track title and track number from filename if metadata tags are absent
 * e.g. "01 - Nightride Cruise.wav" -> track: 1, title: "Nightride Cruise"
 */
function parseFilenameFallback(filename: string): { title: string; trackNumber?: number; artist?: string } {
  const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.')) || filename;
  
  // Format: "01 - Title" or "01 - Artist - Title"
  const parts = nameWithoutExt.split(' - ');
  if (parts.length >= 2) {
    const firstPart = parts[0].trim();
    const trackNum = parseInt(firstPart, 10);
    if (!isNaN(trackNum) && parts.length === 2) {
      return { trackNumber: trackNum, title: parts[1].trim() };
    } else if (!isNaN(trackNum) && parts.length >= 3) {
      return { trackNumber: trackNum, artist: parts[1].trim(), title: parts.slice(2).join(' - ').trim() };
    } else {
      return { artist: parts[0].trim(), title: parts.slice(1).join(' - ').trim() };
    }
  }

  return { title: nameWithoutExt };
}

/**
 * Inspects if a directory contains a cover image file
 */
export function findCoverFileInDir(dirFullPath: string): string | null {
  const candidateNames = [
    'cover.jpg', 'cover.jpeg', 'cover.png', 'cover.webp', 'cover.svg',
    'folder.jpg', 'folder.png', 'album.jpg', 'front.jpg', 'art.jpg'
  ];

  for (const name of candidateNames) {
    const p = path.join(dirFullPath, name);
    if (fs.existsSync(p)) {
      return p;
    }
  }

  // Check any image in directory
  try {
    const files = fs.readdirSync(dirFullPath);
    for (const f of files) {
      const ext = path.extname(f).toLowerCase();
      if (['.jpg', '.jpeg', '.png', '.webp', '.svg'].includes(ext)) {
        return path.join(dirFullPath, f);
      }
    }
  } catch {
    // Ignore read errors
  }

  return null;
}

/**
 * Extracts metadata for a single audio file with caching
 */
export async function getTrackMetadata(relativeFilePath: string): Promise<Track | null> {
  const safeRelPath = sanitizeRelativePath(relativeFilePath);
  const fullPath = path.join(MUSIC_DIR, safeRelPath);

  if (!isPathInsideRoot(MUSIC_DIR, fullPath) || !fs.existsSync(fullPath)) {
    return null;
  }

  const stat = fs.statSync(fullPath);
  if (!stat.isFile()) return null;

  const ext = path.extname(fullPath).toLowerCase();
  if (!SUPPORTED_AUDIO_EXTENSIONS.has(ext)) return null;

  const cached = metadataCache.get(safeRelPath);
  if (cached && cached.mtime === stat.mtimeMs) {
    return cached.track;
  }

  const dirRel = path.dirname(safeRelPath) === '.' ? '' : path.dirname(safeRelPath);
  const filename = path.basename(safeRelPath);
  const fallback = parseFilenameFallback(filename);

  let title = fallback.title;
  let artist = fallback.artist || (dirRel ? path.basename(dirRel) : 'Unknown Artist');
  let album = dirRel ? path.basename(dirRel) : 'Direct Folders';
  let trackNumber = fallback.trackNumber;
  let duration = 0;
  let bitrate: number | undefined;
  let sampleRate: number | undefined;
  let year: number | undefined;
  let hasCover = false;

  // Check if directory has cover image
  const dirFullPath = path.dirname(fullPath);
  if (findCoverFileInDir(dirFullPath)) {
    hasCover = true;
  }

  try {
    const meta = await mm.parseFile(fullPath, { skipCovers: false });
    if (meta.common.title) title = meta.common.title;
    if (meta.common.artist) artist = meta.common.artist;
    if (meta.common.album) album = meta.common.album;
    if (meta.common.track?.no) trackNumber = meta.common.track.no;
    if (meta.common.year) year = meta.common.year;
    if (meta.format.duration) duration = meta.format.duration;
    if (meta.format.bitrate) bitrate = Math.round(meta.format.bitrate / 1000);
    if (meta.format.sampleRate) sampleRate = meta.format.sampleRate;
    if (meta.common.picture && meta.common.picture.length > 0) {
      hasCover = true;
    }
  } catch (err) {
    // If tag extraction fails (e.g. raw WAV or minimal tags), estimate duration from size
    if (ext === '.wav') {
      // 44100 * 2 * 2 = 176400 bytes/sec
      duration = Math.max(1, Math.round((stat.size - 44) / 176400));
    } else {
      // Default placeholder duration
      duration = 180;
    }
  }

  const track: Track = {
    id: safeRelPath,
    filename,
    path: safeRelPath,
    directory: dirRel,
    title,
    artist,
    album,
    trackNumber,
    year,
    duration,
    format: getFormat(ext),
    size: stat.size,
    bitrate,
    sampleRate,
    hasCover
  };

  metadataCache.set(safeRelPath, { mtime: stat.mtimeMs, track });
  return track;
}

/**
 * Scans a folder for subfolders and audio tracks (Folder-First View)
 */
export async function getDirectoryListing(reqPath: string): Promise<DirectoryListing> {
  const safeRelPath = sanitizeRelativePath(reqPath);
  const fullPath = path.join(MUSIC_DIR, safeRelPath);

  if (!isPathInsideRoot(MUSIC_DIR, fullPath) || !fs.existsSync(fullPath)) {
    throw new Error(`Directory not found: ${reqPath}`);
  }

  const stat = fs.statSync(fullPath);
  if (!stat.isDirectory()) {
    throw new Error(`Path is not a directory: ${reqPath}`);
  }

  // Construct breadcrumbs
  const breadcrumbs: { name: string; path: string }[] = [{ name: 'Music Root', path: '' }];
  if (safeRelPath) {
    const parts = safeRelPath.split('/');
    let currentAccum = '';
    for (const part of parts) {
      currentAccum = currentAccum ? `${currentAccum}/${part}` : part;
      breadcrumbs.push({ name: part, path: currentAccum });
    }
  }

  const entries = fs.readdirSync(fullPath, { withFileTypes: true });
  const folders: FolderItem[] = [];
  const tracks: Track[] = [];

  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue; // ignore hidden

    const entryRelPath = safeRelPath ? `${safeRelPath}/${entry.name}` : entry.name;
    const entryFullPath = path.join(fullPath, entry.name);

    if (entry.isDirectory()) {
      // Count audio files & subfolders inside this subfolder
      let trackCount = 0;
      let subfolderCount = 0;
      try {
        const subEntries = fs.readdirSync(entryFullPath, { withFileTypes: true });
        for (const sub of subEntries) {
          if (sub.name.startsWith('.')) continue;
          if (sub.isDirectory()) {
            subfolderCount++;
          } else if (sub.isFile()) {
            const ext = path.extname(sub.name).toLowerCase();
            if (SUPPORTED_AUDIO_EXTENSIONS.has(ext)) {
              trackCount++;
            }
          }
        }
      } catch {
        // Ignore unreadable
      }

      folders.push({
        name: entry.name,
        path: entryRelPath,
        parentPath: safeRelPath,
        trackCount,
        subfolderCount
      });
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (SUPPORTED_AUDIO_EXTENSIONS.has(ext)) {
        const track = await getTrackMetadata(entryRelPath);
        if (track) {
          tracks.push(track);
        }
      }
    }
  }

  // Sort folders alphabetically
  folders.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

  // Sort tracks by trackNumber if available, or natural filename
  tracks.sort((a, b) => {
    if (a.trackNumber != null && b.trackNumber != null && a.trackNumber !== b.trackNumber) {
      return a.trackNumber - b.trackNumber;
    }
    return a.filename.localeCompare(b.filename, undefined, { numeric: true, sensitivity: 'base' });
  });

  const parentPath = safeRelPath ? (path.dirname(safeRelPath) === '.' ? '' : path.dirname(safeRelPath)) : null;
  const totalSize = tracks.reduce((acc, t) => acc + t.size, 0);

  return {
    currentPath: safeRelPath,
    breadcrumbs,
    folders,
    tracks,
    totalTracks: tracks.length,
    totalSize,
    parentPath
  };
}

/**
 * Recursively retrieves all audio tracks under a given folder path
 */
export async function getAllTracksRecursively(reqPath: string): Promise<Track[]> {
  const safeRelPath = sanitizeRelativePath(reqPath);
  const fullPath = path.join(MUSIC_DIR, safeRelPath);

  if (!isPathInsideRoot(MUSIC_DIR, fullPath) || !fs.existsSync(fullPath)) {
    return [];
  }

  const allTracks: Track[] = [];

  async function walk(currentRel: string) {
    const curFull = path.join(MUSIC_DIR, currentRel);
    try {
      const entries = fs.readdirSync(curFull, { withFileTypes: true });
      // Sort entries for deterministic folder traversal
      entries.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

      for (const entry of entries) {
        if (entry.name.startsWith('.')) continue;
        const entryRel = currentRel ? `${currentRel}/${entry.name}` : entry.name;
        if (entry.isDirectory()) {
          await walk(entryRel);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (SUPPORTED_AUDIO_EXTENSIONS.has(ext)) {
            const track = await getTrackMetadata(entryRel);
            if (track) {
              allTracks.push(track);
            }
          }
        }
      }
    } catch {
      // Continue on subfolder error
    }
  }

  const stat = fs.statSync(fullPath);
  if (stat.isDirectory()) {
    await walk(safeRelPath);
  } else if (stat.isFile()) {
    const track = await getTrackMetadata(safeRelPath);
    if (track) allTracks.push(track);
  }

  return allTracks;
}

/**
 * Calculates global stats of the music library
 */
export async function getSystemStats() {
  let totalFiles = 0;
  let totalFolders = 0;
  let totalSizeBytes = 0;

  function countRecursive(dir: string) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name.startsWith('.')) continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          totalFolders++;
          countRecursive(full);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (SUPPORTED_AUDIO_EXTENSIONS.has(ext)) {
            totalFiles++;
            const s = fs.statSync(full);
            totalSizeBytes += s.size;
          }
        }
      }
    } catch {
      // Ignore
    }
  }

  countRecursive(MUSIC_DIR);

  return {
    musicDir: MUSIC_DIR,
    totalFiles,
    totalFolders,
    totalSizeBytes,
    supportedFormats: Array.from(SUPPORTED_AUDIO_EXTENSIONS).map(e => e.replace('.', '').toUpperCase()),
    uptimeSeconds: Math.floor(process.uptime())
  };
}

export function clearMetadataCache() {
  metadataCache.clear();
}
