import path from 'path';
import fs from 'fs';

// Default library path
export const DEFAULT_MUSIC_DIR = path.resolve(process.cwd(), 'music_data/library');

// Configurable Music Root Directory
export let MUSIC_DIR: string = (() => {
  if (process.env.MUSIC_DIR) {
    try {
      const resolved = path.resolve(process.env.MUSIC_DIR);
      return resolved;
    } catch {
      return DEFAULT_MUSIC_DIR;
    }
  }
  return DEFAULT_MUSIC_DIR;
})();

// Persistent Data Storage Directory (Playlists, Cache)
export const DATA_DIR = process.env.DATA_DIR 
  ? path.resolve(process.env.DATA_DIR) 
  : path.resolve(process.cwd(), 'music_data/data');

export const SUPPORTED_AUDIO_EXTENSIONS = new Set([
  '.mp3',
  '.flac',
  '.ogg',
  '.m4a',
  '.wav',
  '.opus',
  '.aac',
  '.wma'
]);

export const MIME_TYPES: Record<string, string> = {
  '.mp3': 'audio/mpeg',
  '.flac': 'audio/flac',
  '.ogg': 'audio/ogg',
  '.m4a': 'audio/mp4',
  '.wav': 'audio/wav',
  '.opus': 'audio/opus',
  '.aac': 'audio/aac',
  '.wma': 'audio/x-ms-wma'
};

// Ensure directories exist safely without crashing on external or read-only drives
export function initDirectories() {
  try {
    if (!fs.existsSync(MUSIC_DIR)) {
      try {
        fs.mkdirSync(MUSIC_DIR, { recursive: true });
        console.log(`[Config] Created music directory: ${MUSIC_DIR}`);
      } catch (err: any) {
        console.warn(`[Config] Note: Could not create custom MUSIC_DIR (${MUSIC_DIR}): ${err.message}.`);
        if (!fs.existsSync(DEFAULT_MUSIC_DIR)) {
          fs.mkdirSync(DEFAULT_MUSIC_DIR, { recursive: true });
        }
        console.log(`[Config] Falling back to default library: ${DEFAULT_MUSIC_DIR}`);
        MUSIC_DIR = DEFAULT_MUSIC_DIR;
      }
    }
  } catch (err: any) {
    console.warn(`[Config] Directory check error for MUSIC_DIR: ${err.message}`);
  }

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err: any) {
    console.warn(`[Config] Error creating DATA_DIR: ${err.message}`);
  }
}
