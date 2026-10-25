import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

export interface AppConfig {
  musicDir: string;
  port: number;
  dataDir: string;
}

const __filename = fileURLToPath(import.meta.url);
const currentDir = path.dirname(__filename);

// Automatically detect application root folder even when started as a Windows Service from C:\Windows\system32
export const APP_ROOT: string = (() => {
  if (fs.existsSync(path.join(currentDir, 'config.json')) || fs.existsSync(path.join(currentDir, 'package.json'))) {
    return path.resolve(currentDir);
  }
  const parent = path.resolve(currentDir, '..');
  if (fs.existsSync(path.join(parent, 'config.json')) || fs.existsSync(path.join(parent, 'package.json'))) {
    return path.resolve(parent);
  }
  return path.resolve(process.cwd());
})();

// Force working directory to the application folder
try {
  if (process.cwd() !== APP_ROOT) {
    process.chdir(APP_ROOT);
    console.log(`[Config] Changed working directory to APP_ROOT: ${APP_ROOT}`);
  }
} catch (e: any) {
  console.warn(`[Config] Warning: Could not chdir to ${APP_ROOT}: ${e.message}`);
}

// Path to configuration file
export const CONFIG_FILE_PATH = path.join(APP_ROOT, 'config.json');

// Default internal library path
export const DEFAULT_MUSIC_DIR = path.join(APP_ROOT, 'music_data', 'library');

// Read config.json with support for comments
export function loadConfigFile(): Partial<AppConfig> {
  if (fs.existsSync(CONFIG_FILE_PATH)) {
    try {
      const rawContent = fs.readFileSync(CONFIG_FILE_PATH, 'utf-8');
      // Strip comments (// or /* */) to prevent JSON parse errors
      const stripped = rawContent.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1').trim();
      const parsed = JSON.parse(stripped);
      console.log(`[Config] 📄 Loaded settings from: ${CONFIG_FILE_PATH}`);
      return parsed;
    } catch (err: any) {
      console.warn(`[Config] ⚠️ Error parsing config.json (${err.message}), using defaults.`);
    }
  } else {
    console.log(`[Config] Note: config.json not found at ${CONFIG_FILE_PATH}, using defaults.`);
  }
  return {};
}

const fileConfig = loadConfigFile();

// Configurable Port
export const PORT: number = (() => {
  if (process.env.PORT) {
    const parsed = parseInt(process.env.PORT, 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  if (fileConfig.port && typeof fileConfig.port === 'number' && fileConfig.port > 0) {
    return fileConfig.port;
  }
  return 3000;
})();

// Configurable Music Root Directory (Always Absolute Path)
export let MUSIC_DIR: string = (() => {
  let raw = '';
  if (process.env.MUSIC_DIR && process.env.MUSIC_DIR.trim() !== '') {
    raw = process.env.MUSIC_DIR.trim();
  } else if (fileConfig.musicDir && typeof fileConfig.musicDir === 'string' && fileConfig.musicDir.trim() !== '') {
    raw = fileConfig.musicDir.trim();
  }

  if (raw) {
    if (path.isAbsolute(raw)) {
      return path.resolve(raw);
    }
    return path.resolve(APP_ROOT, raw);
  }

  // Windows standard user profile
  const userProfile = process.env.USERPROFILE;
  if (userProfile) {
    const winMusic = path.join(userProfile, 'Music');
    if (fs.existsSync(winMusic)) {
      return winMusic;
    }
  }

  return DEFAULT_MUSIC_DIR;
})();

// Persistent Data Storage Directory (Playlists, Cache) - Always Absolute Path
export const DATA_DIR: string = (() => {
  let raw = '';
  if (process.env.DATA_DIR && process.env.DATA_DIR.trim() !== '') {
    raw = process.env.DATA_DIR.trim();
  } else if (fileConfig.dataDir && typeof fileConfig.dataDir === 'string' && fileConfig.dataDir.trim() !== '') {
    raw = fileConfig.dataDir.trim();
  }

  if (raw) {
    if (path.isAbsolute(raw)) {
      return path.resolve(raw);
    }
    return path.resolve(APP_ROOT, raw);
  }

  return path.resolve(APP_ROOT, 'music_data', 'data');
})();

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
