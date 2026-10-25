import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { MUSIC_DIR } from './config.js';
import { sanitizeRelativePath, isPathInsideRoot } from '../src/utils/pathSafety.js';
import {
  getDirectoryListing,
  getAllTracksRecursively,
  getSystemStats,
  clearMetadataCache
} from './fsScanner.js';
import { handleAudioStream, handleCoverArt } from './streamHandler.js';
import { playlistStore } from './playlists.js';

export const apiRouter = Router();

// 1. Directory Browsing (Folder View)
apiRouter.get('/browse', async (req: Request, res: Response) => {
  try {
    const targetPath = (req.query.path as string) || '';
    const listing = await getDirectoryListing(targetPath);
    res.json(listing);
  } catch (err: any) {
    res.status(404).json({ error: err.message || 'Failed to list directory' });
  }
});

// 2. Recursive Folder Tracks (for "Play All in Folder" or "Add Folder to Playlist")
apiRouter.get('/folder/all-tracks', async (req: Request, res: Response) => {
  try {
    const targetPath = (req.query.path as string) || '';
    const tracks = await getAllTracksRecursively(targetPath);
    res.json({ path: targetPath, tracks, count: tracks.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to collect tracks' });
  }
});

// 3. Audio Streaming (HTTP 206 Range Seeking)
apiRouter.get('/stream', handleAudioStream);

// 4. Album Cover Art
apiRouter.get('/cover', handleCoverArt);

// 4b. Download full project archive (.zip) for local execution on Windows/Mac/Linux
apiRouter.get('/download-project', (req: Request, res: Response) => {
  const zipPath = path.resolve(process.cwd(), 'resonance-music-server.zip');
  if (fs.existsSync(zipPath)) {
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="resonance-music-server.zip"');
    fs.createReadStream(zipPath).pipe(res);
  } else {
    res.status(404).json({ error: 'Project archive not found' });
  }
});

// 5. Search Across Directory Hierarchy
apiRouter.get('/search', async (req: Request, res: Response) => {
  try {
    const query = ((req.query.q as string) || '').trim().toLowerCase();
    if (!query) {
      res.json({ results: [] });
      return;
    }

    const allTracks = await getAllTracksRecursively('');
    const matched = allTracks.filter(t => 
      t.title.toLowerCase().includes(query) ||
      t.artist.toLowerCase().includes(query) ||
      t.filename.toLowerCase().includes(query) ||
      t.directory.toLowerCase().includes(query) ||
      t.album.toLowerCase().includes(query)
    );

    res.json({ query, results: matched.slice(0, 50) });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Search failed' });
  }
});

// 6. Playlists CRUD
apiRouter.get('/playlists', (req: Request, res: Response) => {
  res.json(playlistStore.getAll());
});

apiRouter.post('/playlists', (req: Request, res: Response) => {
  const { name, description } = req.body;
  if (!name || typeof name !== 'string') {
    res.status(400).json({ error: 'Playlist name is required' });
    return;
  }
  const playlist = playlistStore.create(name, description);
  res.status(201).json(playlist);
});

apiRouter.get('/playlists/:id', (req: Request, res: Response) => {
  const pl = playlistStore.getById(req.params.id);
  if (!pl) {
    res.status(404).json({ error: 'Playlist not found' });
    return;
  }
  res.json(pl);
});

apiRouter.put('/playlists/:id', (req: Request, res: Response) => {
  const pl = playlistStore.update(req.params.id, req.body);
  if (!pl) {
    res.status(404).json({ error: 'Playlist not found' });
    return;
  }
  res.json(pl);
});

apiRouter.delete('/playlists/:id', (req: Request, res: Response) => {
  const success = playlistStore.delete(req.params.id);
  if (!success) {
    res.status(404).json({ error: 'Playlist not found' });
    return;
  }
  res.json({ success: true, id: req.params.id });
});

// Add tracks or whole folder to playlist
apiRouter.post('/playlists/:id/tracks', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { tracks, folderPath } = req.body;

  let tracksToAdd = tracks;

  if (folderPath !== undefined) {
    tracksToAdd = await getAllTracksRecursively(folderPath);
  }

  if (!Array.isArray(tracksToAdd) || tracksToAdd.length === 0) {
    res.status(400).json({ error: 'No valid tracks provided to add' });
    return;
  }

  const updated = playlistStore.addTracks(id, tracksToAdd);
  if (!updated) {
    res.status(404).json({ error: 'Playlist not found' });
    return;
  }

  res.json(updated);
});

// Remove track at index
apiRouter.delete('/playlists/:id/tracks/:index', (req: Request, res: Response) => {
  const { id, index } = req.params;
  const idx = parseInt(index, 10);
  const updated = playlistStore.removeTrack(id, idx);
  if (!updated) {
    res.status(404).json({ error: 'Playlist or track index not found' });
    return;
  }
  res.json(updated);
});

// Reorder track inside playlist
apiRouter.put('/playlists/:id/reorder', (req: Request, res: Response) => {
  const { id } = req.params;
  const { fromIndex, toIndex } = req.body;

  if (typeof fromIndex !== 'number' || typeof toIndex !== 'number') {
    res.status(400).json({ error: 'fromIndex and toIndex must be numbers' });
    return;
  }

  const updated = playlistStore.reorderTracks(id, fromIndex, toIndex);
  if (!updated) {
    res.status(404).json({ error: 'Playlist not found or invalid indices' });
    return;
  }
  res.json(updated);
});

// Export Playlist to M3U8
apiRouter.get('/playlists/:id/export.m3u8', (req: Request, res: Response) => {
  const { id } = req.params;
  const pl = playlistStore.getById(id);
  if (!pl) {
    res.status(404).send('Playlist not found');
    return;
  }

  const m3uContent = playlistStore.exportM3U8(id);
  if (!m3uContent) {
    res.status(500).send('Failed to generate M3U8');
    return;
  }

  const filename = `${pl.name.replace(/[^a-zA-Z0-9_-]/g, '_')}.m3u8`;
  res.setHeader('Content-Type', 'audio/x-mpegurl; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(m3uContent);
});

// Import Playlist from M3U/M3U8
apiRouter.post('/playlists/import', async (req: Request, res: Response) => {
  try {
    const { name, content } = req.body;
    if (!content || typeof content !== 'string') {
      res.status(400).json({ error: 'M3U content string is required' });
      return;
    }

    const playlist = await playlistStore.importM3U(name, content);
    res.status(201).json(playlist);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Import failed' });
  }
});

// 7. System Stats & Management
apiRouter.get('/system/stats', async (req: Request, res: Response) => {
  try {
    const stats = await getSystemStats();
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/system/rescan', async (req: Request, res: Response) => {
  try {
    clearMetadataCache();
    const stats = await getSystemStats();
    res.json({ message: 'Library cache cleared and re-indexed', stats });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create new folder in music library
apiRouter.post('/folders/create', (req: Request, res: Response) => {
  const { parentPath, folderName } = req.body;
  if (!folderName || typeof folderName !== 'string') {
    res.status(400).json({ error: 'Folder name is required' });
    return;
  }

  const cleanName = folderName.replace(/[\/\\:*?"<>|]/g, '').trim();
  if (!cleanName) {
    res.status(400).json({ error: 'Invalid folder name' });
    return;
  }

  const safeParent = sanitizeRelativePath(parentPath || '');
  const targetDir = path.join(MUSIC_DIR, safeParent, cleanName);

  if (!isPathInsideRoot(MUSIC_DIR, targetDir)) {
    res.status(400).json({ error: 'Illegal folder location' });
    return;
  }

  if (fs.existsSync(targetDir)) {
    res.status(409).json({ error: 'Folder already exists' });
    return;
  }

  fs.mkdirSync(targetDir, { recursive: true });
  res.status(201).json({ success: true, path: safeParent ? `${safeParent}/${cleanName}` : cleanName });
});
