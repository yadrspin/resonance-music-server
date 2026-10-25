import fs from 'fs';
import path from 'path';
import { DATA_DIR, MUSIC_DIR } from './config.js';
import { Playlist, Track } from '../src/types/music.js';
import { serializeM3U8, parseM3U } from '../src/utils/m3u.js';
import { getTrackMetadata, getAllTracksRecursively } from './fsScanner.js';

const PLAYLISTS_FILE = path.join(DATA_DIR, 'playlists.json');

class PlaylistStore {
  private playlists: Map<string, Playlist> = new Map();

  constructor() {
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(PLAYLISTS_FILE)) {
        const raw = fs.readFileSync(PLAYLISTS_FILE, 'utf-8');
        const list: Playlist[] = JSON.parse(raw);
        for (const pl of list) {
          this.playlists.set(pl.id, pl);
        }
      } else {
        this.save();
      }
    } catch (err) {
      console.error('Error loading playlists store:', err);
    }
  }

  private save() {
    try {
      const list = Array.from(this.playlists.values());
      fs.writeFileSync(PLAYLISTS_FILE, JSON.stringify(list, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving playlists store:', err);
    }
  }

  getAll(): Playlist[] {
    return Array.from(this.playlists.values()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  getById(id: string): Playlist | null {
    return this.playlists.get(id) || null;
  }

  create(name: string, description?: string): Playlist {
    const id = 'pl_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const now = new Date().toISOString();
    const playlist: Playlist = {
      id,
      name: name.trim() || 'Untitled Playlist',
      description: description?.trim() || '',
      createdAt: now,
      updatedAt: now,
      tracks: []
    };
    this.playlists.set(id, playlist);
    this.save();
    return playlist;
  }

  update(id: string, updates: { name?: string; description?: string }): Playlist | null {
    const pl = this.playlists.get(id);
    if (!pl) return null;

    if (updates.name !== undefined) pl.name = updates.name.trim() || pl.name;
    if (updates.description !== undefined) pl.description = updates.description.trim();
    pl.updatedAt = new Date().toISOString();

    this.playlists.set(id, pl);
    this.save();
    return pl;
  }

  delete(id: string): boolean {
    const deleted = this.playlists.delete(id);
    if (deleted) this.save();
    return deleted;
  }

  addTracks(id: string, newTracks: Track[]): Playlist | null {
    const pl = this.playlists.get(id);
    if (!pl) return null;

    // Append new tracks (allowing same track if user desires, or unique by path)
    pl.tracks.push(...newTracks);
    pl.updatedAt = new Date().toISOString();

    this.playlists.set(id, pl);
    this.save();
    return pl;
  }

  removeTrack(id: string, trackIndex: number): Playlist | null {
    const pl = this.playlists.get(id);
    if (!pl) return null;

    if (trackIndex >= 0 && trackIndex < pl.tracks.length) {
      pl.tracks.splice(trackIndex, 1);
      pl.updatedAt = new Date().toISOString();
      this.playlists.set(id, pl);
      this.save();
    }
    return pl;
  }

  reorderTracks(id: string, fromIndex: number, toIndex: number): Playlist | null {
    const pl = this.playlists.get(id);
    if (!pl) return null;

    if (
      fromIndex >= 0 &&
      fromIndex < pl.tracks.length &&
      toIndex >= 0 &&
      toIndex < pl.tracks.length
    ) {
      const [moved] = pl.tracks.splice(fromIndex, 1);
      pl.tracks.splice(toIndex, 0, moved);
      pl.updatedAt = new Date().toISOString();
      this.playlists.set(id, pl);
      this.save();
    }
    return pl;
  }

  exportM3U8(id: string): string | null {
    const pl = this.playlists.get(id);
    if (!pl) return null;
    return serializeM3U8(pl.name, pl.tracks);
  }

  async importM3U(name: string, content: string): Promise<Playlist> {
    const parsed = parseM3U(content);
    const playlistName = name || parsed.playlistName || 'Imported Playlist';
    const playlist = this.create(playlistName, `Imported from M3U (${parsed.entries.length} items)`);

    const tracks: Track[] = [];
    for (const entry of parsed.entries) {
      const track = await getTrackMetadata(entry.path);
      if (track) {
        tracks.push(track);
      }
    }

    if (tracks.length > 0) {
      playlist.tracks = tracks;
      playlist.updatedAt = new Date().toISOString();
      this.playlists.set(playlist.id, playlist);
      this.save();
    }

    return playlist;
  }

  async seedDefaultPlaylistIfNeeded() {
    if (this.playlists.size > 0) return;

    try {
      const allTracks = await getAllTracksRecursively('');
      if (allTracks.length > 0) {
        const defaultPl = this.create(
          'Featured Highlights',
          'Curated sample tracks from the native folder archive'
        );
        defaultPl.tracks = allTracks.slice(0, 5);
        this.playlists.set(defaultPl.id, defaultPl);
        this.save();
      }
    } catch (err) {
      console.error('Error seeding default playlist:', err);
    }
  }
}

export const playlistStore = new PlaylistStore();
