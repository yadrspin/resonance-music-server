import { Track } from '../types/music.js';

export interface M3UEntry {
  path: string;
  duration?: number;
  title?: string;
  artist?: string;
}

/**
 * Serializes a list of tracks into standard Extended M3U8 playlist format.
 */
export function serializeM3U8(playlistName: string, tracks: Track[]): string {
  const lines: string[] = [
    '#EXTM3U',
    `#PLAYLIST:${playlistName}`,
  ];

  for (const track of tracks) {
    const duration = Math.round(track.duration || 0);
    const artist = track.artist || 'Unknown Artist';
    const title = track.title || track.filename;
    lines.push(`#EXTINF:${duration},${artist} - ${title}`);
    lines.push(track.path);
  }

  return lines.join('\n') + '\n';
}

/**
 * Parses an M3U or M3U8 string into structured track entries.
 */
export function parseM3U(content: string): { playlistName?: string; entries: M3UEntry[] } {
  const lines = content.split(/\r?\n/);
  const entries: M3UEntry[] = [];
  let playlistName: string | undefined;

  let currentDuration: number | undefined;
  let currentArtist: string | undefined;
  let currentTitle: string | undefined;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith('#PLAYLIST:')) {
      playlistName = trimmed.substring('#PLAYLIST:'.length).trim();
      continue;
    }

    if (trimmed.startsWith('#EXTINF:')) {
      const rest = trimmed.substring('#EXTINF:'.length).trim();
      const commaIdx = rest.indexOf(',');
      if (commaIdx !== -1) {
        const secStr = rest.substring(0, commaIdx).trim();
        const durationSec = parseInt(secStr, 10);
        if (!isNaN(durationSec)) {
          currentDuration = durationSec;
        }

        const info = rest.substring(commaIdx + 1).trim();
        const dashIdx = info.indexOf(' - ');
        if (dashIdx !== -1) {
          currentArtist = info.substring(0, dashIdx).trim();
          currentTitle = info.substring(dashIdx + 3).trim();
        } else {
          currentTitle = info;
        }
      }
      continue;
    }

    if (trimmed.startsWith('#')) {
      // Other directive or comment, ignore
      continue;
    }

    // It's a file path
    entries.push({
      path: trimmed.replace(/\\/g, '/'),
      duration: currentDuration,
      artist: currentArtist,
      title: currentTitle,
    });

    currentDuration = undefined;
    currentArtist = undefined;
    currentTitle = undefined;
  }

  return { playlistName, entries };
}
