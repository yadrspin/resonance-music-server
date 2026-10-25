// server.ts
import express from "express";
import path8 from "path";
import fs7 from "fs";
import { fileURLToPath as fileURLToPath2 } from "url";
import { createServer as createViteServer } from "vite";

// server/config.ts
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var currentDir = path.dirname(__filename);
var APP_ROOT = (() => {
  if (fs.existsSync(path.join(currentDir, "config.json")) || fs.existsSync(path.join(currentDir, "package.json"))) {
    return currentDir;
  }
  const parent = path.resolve(currentDir, "..");
  if (fs.existsSync(path.join(parent, "config.json")) || fs.existsSync(path.join(parent, "package.json"))) {
    return parent;
  }
  return process.cwd();
})();
try {
  if (process.cwd() !== APP_ROOT) {
    process.chdir(APP_ROOT);
    console.log(`[Config] Changed working directory to APP_ROOT: ${APP_ROOT}`);
  }
} catch (e) {
  console.warn(`[Config] Warning: Could not chdir to ${APP_ROOT}: ${e.message}`);
}
var CONFIG_FILE_PATH = path.join(APP_ROOT, "config.json");
var DEFAULT_MUSIC_DIR = path.join(APP_ROOT, "music_data", "library");
function loadConfigFile() {
  if (fs.existsSync(CONFIG_FILE_PATH)) {
    try {
      const rawContent = fs.readFileSync(CONFIG_FILE_PATH, "utf-8");
      const stripped = rawContent.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, "$1").trim();
      const parsed = JSON.parse(stripped);
      console.log(`[Config] \u{1F4C4} Loaded settings from: ${CONFIG_FILE_PATH}`);
      return parsed;
    } catch (err) {
      console.warn(`[Config] \u26A0\uFE0F Error parsing config.json (${err.message}), using defaults.`);
    }
  } else {
    console.log(`[Config] Note: config.json not found at ${CONFIG_FILE_PATH}, using defaults.`);
  }
  return {};
}
var fileConfig = loadConfigFile();
var PORT = (() => {
  if (process.env.PORT) {
    const parsed = parseInt(process.env.PORT, 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  if (fileConfig.port && typeof fileConfig.port === "number" && fileConfig.port > 0) {
    return fileConfig.port;
  }
  return 3e3;
})();
var MUSIC_DIR = (() => {
  if (process.env.MUSIC_DIR && process.env.MUSIC_DIR.trim() !== "") {
    try {
      return path.resolve(process.env.MUSIC_DIR.trim());
    } catch {
    }
  }
  if (fileConfig.musicDir && typeof fileConfig.musicDir === "string" && fileConfig.musicDir.trim() !== "") {
    try {
      return path.resolve(fileConfig.musicDir.trim());
    } catch {
    }
  }
  const userProfile = process.env.USERPROFILE;
  if (userProfile) {
    const winMusic = path.join(userProfile, "Music");
    if (fs.existsSync(winMusic)) {
      return winMusic;
    }
  }
  return DEFAULT_MUSIC_DIR;
})();
var DATA_DIR = (() => {
  if (process.env.DATA_DIR && process.env.DATA_DIR.trim() !== "") {
    return path.resolve(process.env.DATA_DIR.trim());
  }
  if (fileConfig.dataDir && typeof fileConfig.dataDir === "string" && fileConfig.dataDir.trim() !== "") {
    return path.resolve(fileConfig.dataDir.trim());
  }
  return path.join(APP_ROOT, "music_data", "data");
})();
var SUPPORTED_AUDIO_EXTENSIONS = /* @__PURE__ */ new Set([
  ".mp3",
  ".flac",
  ".ogg",
  ".m4a",
  ".wav",
  ".opus",
  ".aac",
  ".wma"
]);
var MIME_TYPES = {
  ".mp3": "audio/mpeg",
  ".flac": "audio/flac",
  ".ogg": "audio/ogg",
  ".m4a": "audio/mp4",
  ".wav": "audio/wav",
  ".opus": "audio/opus",
  ".aac": "audio/aac",
  ".wma": "audio/x-ms-wma"
};
function initDirectories() {
  try {
    if (!fs.existsSync(MUSIC_DIR)) {
      try {
        fs.mkdirSync(MUSIC_DIR, { recursive: true });
        console.log(`[Config] Created music directory: ${MUSIC_DIR}`);
      } catch (err) {
        console.warn(`[Config] Note: Could not create custom MUSIC_DIR (${MUSIC_DIR}): ${err.message}.`);
        if (!fs.existsSync(DEFAULT_MUSIC_DIR)) {
          fs.mkdirSync(DEFAULT_MUSIC_DIR, { recursive: true });
        }
        console.log(`[Config] Falling back to default library: ${DEFAULT_MUSIC_DIR}`);
        MUSIC_DIR = DEFAULT_MUSIC_DIR;
      }
    }
  } catch (err) {
    console.warn(`[Config] Directory check error for MUSIC_DIR: ${err.message}`);
  }
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
    console.warn(`[Config] Error creating DATA_DIR: ${err.message}`);
  }
}

// server/audioGen.ts
import fs2 from "fs";
import path2 from "path";
function generateWavBuffer(durationSeconds, chords) {
  const sampleRate = 44100;
  const numChannels = 2;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const totalSamples = Math.floor(sampleRate * durationSeconds);
  const dataSize = totalSamples * blockAlign;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);
  let offset = 44;
  const chordDurationSamples = Math.floor(totalSamples / chords.length);
  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    const chordIndex = Math.min(Math.floor(i / chordDurationSamples), chords.length - 1);
    const activeChord = chords[chordIndex];
    const chordProgress = i % chordDurationSamples / chordDurationSamples;
    const envelope = Math.sin(Math.PI * Math.min(chordProgress * 4, 1)) * Math.min(1, (1 - chordProgress) * 5 + 0.2);
    let leftSample = 0;
    let rightSample = 0;
    for (let f = 0; f < activeChord.length; f++) {
      const freq = activeChord[f];
      const osc1 = Math.sin(2 * Math.PI * freq * t);
      const osc2 = Math.sin(2 * Math.PI * freq * 2 * t) * 0.25;
      const oscSub = Math.sin(2 * Math.PI * (freq / 2) * t) * 0.35;
      const wave = (osc1 + osc2 + oscSub) / (activeChord.length * 1.3);
      const pan = f % 2 === 0 ? 0.35 : -0.35;
      leftSample += wave * (0.5 - pan * 0.5);
      rightSample += wave * (0.5 + pan * 0.5);
    }
    leftSample = Math.max(-1, Math.min(1, leftSample * envelope * 0.7));
    rightSample = Math.max(-1, Math.min(1, rightSample * envelope * 0.7));
    buffer.writeInt16LE(Math.floor(leftSample * 32767), offset);
    buffer.writeInt16LE(Math.floor(rightSample * 32767), offset + 2);
    offset += 4;
  }
  return buffer;
}
function createCoverSvg(title, subtitle, gradientColors) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${gradientColors[0]}" />
      <stop offset="100%" stop-color="${gradientColors[1]}" />
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="30%" r="60%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.15" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0.7" />
    </radialGradient>
  </defs>
  <rect width="600" height="600" fill="url(#g)" />
  <rect width="600" height="600" fill="url(#glow)" />
  <circle cx="300" cy="240" r="140" fill="none" stroke="#ffffff" stroke-width="4" opacity="0.3" stroke-dasharray="10 8" />
  <circle cx="300" cy="240" r="110" fill="none" stroke="#ffffff" stroke-width="2" opacity="0.4" />
  <circle cx="300" cy="240" r="40" fill="#ffffff" opacity="0.15" />
  <polygon points="290,225 320,240 290,255" fill="#ffffff" opacity="0.9" />
  <text x="300" y="440" font-family="system-ui, -apple-system, sans-serif" font-size="34" font-weight="800" fill="#ffffff" text-anchor="middle" letter-spacing="1.5">${title}</text>
  <text x="300" y="480" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="500" fill="#cbd5e1" text-anchor="middle" letter-spacing="3">${subtitle.toUpperCase()}</text>
  <text x="300" y="550" font-family="monospace" font-size="12" fill="#94a3b8" text-anchor="middle" letter-spacing="4">RESONANCE HI-FI AUDIO ARCHIVE</text>
</svg>`;
}
function seedSampleLibraryIfNeeded() {
  if (process.env.MUSIC_DIR) {
    return;
  }
  if (!fs2.existsSync(MUSIC_DIR)) {
    try {
      fs2.mkdirSync(MUSIC_DIR, { recursive: true });
    } catch {
      return;
    }
  }
  try {
    const existingFiles = fs2.readdirSync(MUSIC_DIR);
    if (existingFiles.length > 0) {
      return;
    }
  } catch {
    return;
  }
  console.log("[Seed] Generating initial native directory music archive...");
  const sampleLibrary = [
    {
      dir: "Electronic/Synthwave",
      cover: { title: "Neon Horizon", subtitle: "Outrun Drive", colors: ["#6366f1", "#ec4899"] },
      tracks: [
        {
          name: "01 - Nightride Cruise.wav",
          duration: 16,
          chords: [[220, 261.63, 329.63], [174.61, 220, 261.63], [196, 246.94, 293.66], [164.81, 196, 246.94]]
          // Am - F - G - Em
        },
        {
          name: "02 - Sunset Boulevard.wav",
          duration: 18,
          chords: [[261.63, 329.63, 392], [220, 261.63, 329.63], [174.61, 220, 261.63], [196, 246.94, 293.66]]
          // C - Am - F - G
        },
        {
          name: "03 - Cyberpunk Expressway.wav",
          duration: 15,
          chords: [[146.83, 174.61, 220], [130.81, 164.81, 196], [116.54, 146.83, 174.61], [130.81, 164.81, 196]]
          // Dm - C - Bb - C
        }
      ]
    },
    {
      dir: "Lo-Fi Beats/Chill Sessions",
      cover: { title: "Coffee & Rain", subtitle: "Lofi Study Beats", colors: ["#ca8a04", "#0f766e"] },
      tracks: [
        {
          name: "01 - Sunday Morning Coffee.wav",
          duration: 20,
          chords: [[174.61, 220, 261.63, 329.63], [164.81, 196, 246.94, 293.66], [146.83, 174.61, 220, 261.63], [130.81, 164.81, 196, 246.94]]
          // Fmaj7 - Em7 - Dm7 - Cmaj7
        },
        {
          name: "02 - Vinyl Raindrops.wav",
          duration: 16,
          chords: [[220, 261.63, 329.63, 392], [146.83, 174.61, 220, 261.63], [164.81, 196, 246.94, 329.63], [174.61, 220, 261.63, 329.63]]
        }
      ]
    },
    {
      dir: "Ambient/Meditation & Space",
      cover: { title: "Deep Cosmos", subtitle: "Stellar Frequency", colors: ["#0f172a", "#3b82f6"] },
      tracks: [
        {
          name: "01 - Celestial Drift.wav",
          duration: 22,
          chords: [[110, 164.81, 220, 277.18], [146.83, 220, 293.66, 369.99], [98, 146.83, 196, 246.94], [110, 164.81, 220, 277.18]]
          // A drone
        },
        {
          name: "02 - Forest Canopy Whisper.wav",
          duration: 18,
          chords: [[130.81, 196, 261.63, 329.63], [174.61, 261.63, 349.23, 440], [146.83, 220, 293.66, 349.23], [196, 246.94, 293.66, 392]]
        }
      ]
    },
    {
      dir: "Jazz & Soul/Acoustic Trio",
      cover: { title: "Midnight Blue", subtitle: "Late Night Session", colors: ["#1e1b4b", "#9333ea"] },
      tracks: [
        {
          name: "01 - Velvet Smoke.wav",
          duration: 17,
          chords: [[146.83, 174.61, 220, 261.63], [196, 246.94, 293.66, 349.23], [130.81, 164.81, 196, 246.94], [220, 277.18, 329.63, 392]]
          // ii-V-I-VI in C
        },
        {
          name: "02 - Blue Note Promenade.wav",
          duration: 19,
          chords: [[220, 261.63, 329.63, 392], [146.83, 174.61, 220, 261.63], [196, 246.94, 293.66, 349.23], [261.63, 329.63, 392, 493.88]]
        }
      ]
    },
    {
      dir: "Rock & Indie/Acoustic",
      cover: { title: "Desert Highway", subtitle: "Frontier Guitars", colors: ["#7c2d12", "#ea580c"] },
      tracks: [
        {
          name: "01 - Open Horizon.wav",
          duration: 16,
          chords: [[196, 246.94, 293.66], [146.83, 220, 293.66], [164.81, 196, 246.94], [261.63, 329.63, 392]]
          // G - D - Em - C
        }
      ]
    }
  ];
  for (const group of sampleLibrary) {
    const fullDir = path2.join(MUSIC_DIR, group.dir);
    fs2.mkdirSync(fullDir, { recursive: true });
    const coverSvg = createCoverSvg(group.cover.title, group.cover.subtitle, group.cover.colors);
    fs2.writeFileSync(path2.join(fullDir, "cover.svg"), coverSvg, "utf-8");
    for (const track of group.tracks) {
      const wavBuffer = generateWavBuffer(track.duration, track.chords);
      fs2.writeFileSync(path2.join(fullDir, track.name), wavBuffer);
    }
  }
  console.log("[Seed] Sample library successfully initialized with 5 folders and 10 tracks!");
}

// server/playlists.ts
import fs4 from "fs";
import path5 from "path";

// src/utils/m3u.ts
function serializeM3U8(playlistName, tracks) {
  const lines = [
    "#EXTM3U",
    `#PLAYLIST:${playlistName}`
  ];
  for (const track of tracks) {
    const duration = Math.round(track.duration || 0);
    const artist = track.artist || "Unknown Artist";
    const title = track.title || track.filename;
    lines.push(`#EXTINF:${duration},${artist} - ${title}`);
    lines.push(track.path);
  }
  return lines.join("\n") + "\n";
}
function parseM3U(content) {
  const lines = content.split(/\r?\n/);
  const entries = [];
  let playlistName;
  let currentDuration;
  let currentArtist;
  let currentTitle;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith("#PLAYLIST:")) {
      playlistName = trimmed.substring("#PLAYLIST:".length).trim();
      continue;
    }
    if (trimmed.startsWith("#EXTINF:")) {
      const rest = trimmed.substring("#EXTINF:".length).trim();
      const commaIdx = rest.indexOf(",");
      if (commaIdx !== -1) {
        const secStr = rest.substring(0, commaIdx).trim();
        const durationSec = parseInt(secStr, 10);
        if (!isNaN(durationSec)) {
          currentDuration = durationSec;
        }
        const info = rest.substring(commaIdx + 1).trim();
        const dashIdx = info.indexOf(" - ");
        if (dashIdx !== -1) {
          currentArtist = info.substring(0, dashIdx).trim();
          currentTitle = info.substring(dashIdx + 3).trim();
        } else {
          currentTitle = info;
        }
      }
      continue;
    }
    if (trimmed.startsWith("#")) {
      continue;
    }
    entries.push({
      path: trimmed.replace(/\\/g, "/"),
      duration: currentDuration,
      artist: currentArtist,
      title: currentTitle
    });
    currentDuration = void 0;
    currentArtist = void 0;
    currentTitle = void 0;
  }
  return { playlistName, entries };
}

// server/fsScanner.ts
import fs3 from "fs";
import path4 from "path";
import * as mm from "music-metadata";

// src/utils/pathSafety.ts
import path3 from "path";
function sanitizeRelativePath(userPath) {
  if (!userPath) return "";
  let clean = decodeURIComponent(userPath).trim();
  clean = clean.replace(/\0/g, "");
  clean = clean.replace(/\\/g, "/");
  clean = clean.replace(/^\/+|\/+$/g, "");
  const segments = clean.split("/").filter(Boolean);
  const safeSegments = [];
  for (const segment of segments) {
    if (segment === "." || segment === "") {
      continue;
    }
    if (segment === "..") {
      if (safeSegments.length > 0) {
        safeSegments.pop();
      } else {
        return "";
      }
    } else {
      safeSegments.push(segment);
    }
  }
  return safeSegments.join("/");
}
function isPathInsideRoot(rootDir, targetPath) {
  const resolvedRoot = path3.resolve(rootDir);
  const resolvedTarget = path3.resolve(targetPath);
  const relative = path3.relative(resolvedRoot, resolvedTarget);
  return relative === "" || !relative.startsWith("..") && !path3.isAbsolute(relative);
}

// server/fsScanner.ts
var metadataCache = /* @__PURE__ */ new Map();
function getFormat(ext) {
  return ext.replace(/^\./, "").toLowerCase();
}
function parseFilenameFallback(filename) {
  const nameWithoutExt = filename.substring(0, filename.lastIndexOf(".")) || filename;
  const parts = nameWithoutExt.split(" - ");
  if (parts.length >= 2) {
    const firstPart = parts[0].trim();
    const trackNum = parseInt(firstPart, 10);
    if (!isNaN(trackNum) && parts.length === 2) {
      return { trackNumber: trackNum, title: parts[1].trim() };
    } else if (!isNaN(trackNum) && parts.length >= 3) {
      return { trackNumber: trackNum, artist: parts[1].trim(), title: parts.slice(2).join(" - ").trim() };
    } else {
      return { artist: parts[0].trim(), title: parts.slice(1).join(" - ").trim() };
    }
  }
  return { title: nameWithoutExt };
}
function findCoverFileInDir(dirFullPath) {
  const candidateNames = [
    "cover.jpg",
    "cover.jpeg",
    "cover.png",
    "cover.webp",
    "cover.svg",
    "folder.jpg",
    "folder.png",
    "album.jpg",
    "front.jpg",
    "art.jpg"
  ];
  for (const name of candidateNames) {
    const p = path4.join(dirFullPath, name);
    if (fs3.existsSync(p)) {
      return p;
    }
  }
  try {
    const files = fs3.readdirSync(dirFullPath);
    for (const f of files) {
      const ext = path4.extname(f).toLowerCase();
      if ([".jpg", ".jpeg", ".png", ".webp", ".svg"].includes(ext)) {
        return path4.join(dirFullPath, f);
      }
    }
  } catch {
  }
  return null;
}
async function getTrackMetadata(relativeFilePath) {
  const safeRelPath = sanitizeRelativePath(relativeFilePath);
  const fullPath = path4.join(MUSIC_DIR, safeRelPath);
  if (!isPathInsideRoot(MUSIC_DIR, fullPath) || !fs3.existsSync(fullPath)) {
    return null;
  }
  const stat = fs3.statSync(fullPath);
  if (!stat.isFile()) return null;
  const ext = path4.extname(fullPath).toLowerCase();
  if (!SUPPORTED_AUDIO_EXTENSIONS.has(ext)) return null;
  const cached = metadataCache.get(safeRelPath);
  if (cached && cached.mtime === stat.mtimeMs) {
    return cached.track;
  }
  const dirRel = path4.dirname(safeRelPath) === "." ? "" : path4.dirname(safeRelPath);
  const filename = path4.basename(safeRelPath);
  const fallback = parseFilenameFallback(filename);
  let title = fallback.title;
  let artist = fallback.artist || (dirRel ? path4.basename(dirRel) : "Unknown Artist");
  let album = dirRel ? path4.basename(dirRel) : "Direct Folders";
  let trackNumber = fallback.trackNumber;
  let duration = 0;
  let bitrate;
  let sampleRate;
  let year;
  let hasCover = false;
  const dirFullPath = path4.dirname(fullPath);
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
    if (meta.format.bitrate) bitrate = Math.round(meta.format.bitrate / 1e3);
    if (meta.format.sampleRate) sampleRate = meta.format.sampleRate;
    if (meta.common.picture && meta.common.picture.length > 0) {
      hasCover = true;
    }
  } catch (err) {
    if (ext === ".wav") {
      duration = Math.max(1, Math.round((stat.size - 44) / 176400));
    } else {
      duration = 180;
    }
  }
  const track = {
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
async function getDirectoryListing(reqPath) {
  const safeRelPath = sanitizeRelativePath(reqPath);
  const fullPath = path4.join(MUSIC_DIR, safeRelPath);
  if (!isPathInsideRoot(MUSIC_DIR, fullPath) || !fs3.existsSync(fullPath)) {
    throw new Error(`Directory not found: ${reqPath}`);
  }
  const stat = fs3.statSync(fullPath);
  if (!stat.isDirectory()) {
    throw new Error(`Path is not a directory: ${reqPath}`);
  }
  const breadcrumbs = [{ name: "Music Root", path: "" }];
  if (safeRelPath) {
    const parts = safeRelPath.split("/");
    let currentAccum = "";
    for (const part of parts) {
      currentAccum = currentAccum ? `${currentAccum}/${part}` : part;
      breadcrumbs.push({ name: part, path: currentAccum });
    }
  }
  const entries = fs3.readdirSync(fullPath, { withFileTypes: true });
  const folders = [];
  const tracks = [];
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const entryRelPath = safeRelPath ? `${safeRelPath}/${entry.name}` : entry.name;
    const entryFullPath = path4.join(fullPath, entry.name);
    if (entry.isDirectory()) {
      let trackCount = 0;
      let subfolderCount = 0;
      try {
        const subEntries = fs3.readdirSync(entryFullPath, { withFileTypes: true });
        for (const sub of subEntries) {
          if (sub.name.startsWith(".")) continue;
          if (sub.isDirectory()) {
            subfolderCount++;
          } else if (sub.isFile()) {
            const ext = path4.extname(sub.name).toLowerCase();
            if (SUPPORTED_AUDIO_EXTENSIONS.has(ext)) {
              trackCount++;
            }
          }
        }
      } catch {
      }
      folders.push({
        name: entry.name,
        path: entryRelPath,
        parentPath: safeRelPath,
        trackCount,
        subfolderCount
      });
    } else if (entry.isFile()) {
      const ext = path4.extname(entry.name).toLowerCase();
      if (SUPPORTED_AUDIO_EXTENSIONS.has(ext)) {
        const track = await getTrackMetadata(entryRelPath);
        if (track) {
          tracks.push(track);
        }
      }
    }
  }
  folders.sort((a, b) => a.name.localeCompare(b.name, void 0, { numeric: true, sensitivity: "base" }));
  tracks.sort((a, b) => {
    if (a.trackNumber != null && b.trackNumber != null && a.trackNumber !== b.trackNumber) {
      return a.trackNumber - b.trackNumber;
    }
    return a.filename.localeCompare(b.filename, void 0, { numeric: true, sensitivity: "base" });
  });
  const parentPath = safeRelPath ? path4.dirname(safeRelPath) === "." ? "" : path4.dirname(safeRelPath) : null;
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
async function getAllTracksRecursively(reqPath) {
  const safeRelPath = sanitizeRelativePath(reqPath);
  const fullPath = path4.join(MUSIC_DIR, safeRelPath);
  if (!isPathInsideRoot(MUSIC_DIR, fullPath) || !fs3.existsSync(fullPath)) {
    return [];
  }
  const allTracks = [];
  async function walk(currentRel) {
    const curFull = path4.join(MUSIC_DIR, currentRel);
    try {
      const entries = fs3.readdirSync(curFull, { withFileTypes: true });
      entries.sort((a, b) => a.name.localeCompare(b.name, void 0, { numeric: true }));
      for (const entry of entries) {
        if (entry.name.startsWith(".")) continue;
        const entryRel = currentRel ? `${currentRel}/${entry.name}` : entry.name;
        if (entry.isDirectory()) {
          await walk(entryRel);
        } else if (entry.isFile()) {
          const ext = path4.extname(entry.name).toLowerCase();
          if (SUPPORTED_AUDIO_EXTENSIONS.has(ext)) {
            const track = await getTrackMetadata(entryRel);
            if (track) {
              allTracks.push(track);
            }
          }
        }
      }
    } catch {
    }
  }
  const stat = fs3.statSync(fullPath);
  if (stat.isDirectory()) {
    await walk(safeRelPath);
  } else if (stat.isFile()) {
    const track = await getTrackMetadata(safeRelPath);
    if (track) allTracks.push(track);
  }
  return allTracks;
}
async function getSystemStats() {
  let totalFiles = 0;
  let totalFolders = 0;
  let totalSizeBytes = 0;
  function countRecursive(dir) {
    try {
      const entries = fs3.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name.startsWith(".")) continue;
        const full = path4.join(dir, entry.name);
        if (entry.isDirectory()) {
          totalFolders++;
          countRecursive(full);
        } else if (entry.isFile()) {
          const ext = path4.extname(entry.name).toLowerCase();
          if (SUPPORTED_AUDIO_EXTENSIONS.has(ext)) {
            totalFiles++;
            const s = fs3.statSync(full);
            totalSizeBytes += s.size;
          }
        }
      }
    } catch {
    }
  }
  countRecursive(MUSIC_DIR);
  return {
    musicDir: MUSIC_DIR,
    totalFiles,
    totalFolders,
    totalSizeBytes,
    supportedFormats: Array.from(SUPPORTED_AUDIO_EXTENSIONS).map((e) => e.replace(".", "").toUpperCase()),
    uptimeSeconds: Math.floor(process.uptime())
  };
}
function clearMetadataCache() {
  metadataCache.clear();
}

// server/playlists.ts
var PLAYLISTS_FILE = path5.join(DATA_DIR, "playlists.json");
var PlaylistStore = class {
  constructor() {
    this.playlists = /* @__PURE__ */ new Map();
    this.load();
  }
  load() {
    try {
      if (fs4.existsSync(PLAYLISTS_FILE)) {
        const raw = fs4.readFileSync(PLAYLISTS_FILE, "utf-8");
        const list = JSON.parse(raw);
        for (const pl of list) {
          this.playlists.set(pl.id, pl);
        }
      } else {
        this.save();
      }
    } catch (err) {
      console.error("Error loading playlists store:", err);
    }
  }
  save() {
    try {
      const list = Array.from(this.playlists.values());
      fs4.writeFileSync(PLAYLISTS_FILE, JSON.stringify(list, null, 2), "utf-8");
    } catch (err) {
      console.error("Error saving playlists store:", err);
    }
  }
  getAll() {
    return Array.from(this.playlists.values()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }
  getById(id) {
    return this.playlists.get(id) || null;
  }
  create(name, description) {
    const id = "pl_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const playlist = {
      id,
      name: name.trim() || "Untitled Playlist",
      description: description?.trim() || "",
      createdAt: now,
      updatedAt: now,
      tracks: []
    };
    this.playlists.set(id, playlist);
    this.save();
    return playlist;
  }
  update(id, updates) {
    const pl = this.playlists.get(id);
    if (!pl) return null;
    if (updates.name !== void 0) pl.name = updates.name.trim() || pl.name;
    if (updates.description !== void 0) pl.description = updates.description.trim();
    pl.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    this.playlists.set(id, pl);
    this.save();
    return pl;
  }
  delete(id) {
    const deleted = this.playlists.delete(id);
    if (deleted) this.save();
    return deleted;
  }
  addTracks(id, newTracks) {
    const pl = this.playlists.get(id);
    if (!pl) return null;
    pl.tracks.push(...newTracks);
    pl.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    this.playlists.set(id, pl);
    this.save();
    return pl;
  }
  removeTrack(id, trackIndex) {
    const pl = this.playlists.get(id);
    if (!pl) return null;
    if (trackIndex >= 0 && trackIndex < pl.tracks.length) {
      pl.tracks.splice(trackIndex, 1);
      pl.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
      this.playlists.set(id, pl);
      this.save();
    }
    return pl;
  }
  reorderTracks(id, fromIndex, toIndex) {
    const pl = this.playlists.get(id);
    if (!pl) return null;
    if (fromIndex >= 0 && fromIndex < pl.tracks.length && toIndex >= 0 && toIndex < pl.tracks.length) {
      const [moved] = pl.tracks.splice(fromIndex, 1);
      pl.tracks.splice(toIndex, 0, moved);
      pl.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
      this.playlists.set(id, pl);
      this.save();
    }
    return pl;
  }
  exportM3U8(id) {
    const pl = this.playlists.get(id);
    if (!pl) return null;
    return serializeM3U8(pl.name, pl.tracks);
  }
  async importM3U(name, content) {
    const parsed = parseM3U(content);
    const playlistName = name || parsed.playlistName || "Imported Playlist";
    const playlist = this.create(playlistName, `Imported from M3U (${parsed.entries.length} items)`);
    const tracks = [];
    for (const entry of parsed.entries) {
      const track = await getTrackMetadata(entry.path);
      if (track) {
        tracks.push(track);
      }
    }
    if (tracks.length > 0) {
      playlist.tracks = tracks;
      playlist.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
      this.playlists.set(playlist.id, playlist);
      this.save();
    }
    return playlist;
  }
  async seedDefaultPlaylistIfNeeded() {
    if (this.playlists.size > 0) return;
    try {
      const allTracks = await getAllTracksRecursively("");
      if (allTracks.length > 0) {
        const defaultPl = this.create(
          "Featured Highlights",
          "Curated sample tracks from the native folder archive"
        );
        defaultPl.tracks = allTracks.slice(0, 5);
        this.playlists.set(defaultPl.id, defaultPl);
        this.save();
      }
    } catch (err) {
      console.error("Error seeding default playlist:", err);
    }
  }
};
var playlistStore = new PlaylistStore();

// server/api.ts
import { Router } from "express";
import path7 from "path";
import fs6 from "fs";

// server/streamHandler.ts
import fs5 from "fs";
import path6 from "path";
import * as mm2 from "music-metadata";

// src/utils/range.ts
function parseRangeHeader(rangeHeader, totalSize) {
  if (!rangeHeader || totalSize <= 0) {
    return null;
  }
  const matches = rangeHeader.trim().match(/^bytes=(\d*)-(\d*)$/);
  if (!matches) {
    return null;
  }
  const startStr = matches[1];
  const endStr = matches[2];
  if (startStr === "" && endStr === "") {
    return null;
  }
  let start;
  let end;
  if (startStr === "") {
    const suffixLength = parseInt(endStr, 10);
    if (isNaN(suffixLength) || suffixLength <= 0) return null;
    start = Math.max(0, totalSize - suffixLength);
    end = totalSize - 1;
  } else if (endStr === "") {
    start = parseInt(startStr, 10);
    if (isNaN(start) || start < 0 || start >= totalSize) return null;
    end = totalSize - 1;
  } else {
    start = parseInt(startStr, 10);
    end = parseInt(endStr, 10);
    if (isNaN(start) || isNaN(end) || start < 0 || start > end || start >= totalSize) {
      return null;
    }
    end = Math.min(end, totalSize - 1);
  }
  const chunkSize = end - start + 1;
  if (chunkSize <= 0) return null;
  return { start, end, chunkSize };
}

// server/streamHandler.ts
function handleAudioStream(req, res) {
  const rawPath = req.query.path;
  if (!rawPath) {
    res.status(400).json({ error: "Missing audio file path" });
    return;
  }
  const safeRelPath = sanitizeRelativePath(rawPath);
  const fullPath = path6.join(MUSIC_DIR, safeRelPath);
  if (!isPathInsideRoot(MUSIC_DIR, fullPath) || !fs5.existsSync(fullPath)) {
    res.status(404).json({ error: "Audio file not found" });
    return;
  }
  const stat = fs5.statSync(fullPath);
  if (!stat.isFile()) {
    res.status(400).json({ error: "Path is not a regular file" });
    return;
  }
  const ext = path6.extname(fullPath).toLowerCase();
  const mimeType = MIME_TYPES[ext] || "application/octet-stream";
  const totalSize = stat.size;
  const rangeHeader = req.headers.range;
  if (!rangeHeader) {
    res.writeHead(200, {
      "Content-Length": totalSize,
      "Content-Type": mimeType,
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=3600"
    });
    fs5.createReadStream(fullPath).pipe(res);
    return;
  }
  const parsedRange = parseRangeHeader(rangeHeader, totalSize);
  if (!parsedRange) {
    res.status(416).set({
      "Content-Range": `bytes */${totalSize}`
    }).send("Requested Range Not Satisfiable");
    return;
  }
  const { start, end, chunkSize } = parsedRange;
  res.writeHead(206, {
    "Content-Range": `bytes ${start}-${end}/${totalSize}`,
    "Accept-Ranges": "bytes",
    "Content-Length": chunkSize,
    "Content-Type": mimeType,
    "Cache-Control": "no-cache"
  });
  const stream = fs5.createReadStream(fullPath, { start, end });
  stream.on("error", (err) => {
    console.error("Audio stream read error:", err);
    if (!res.headersSent) {
      res.status(500).end();
    }
  });
  stream.pipe(res);
}
async function handleCoverArt(req, res) {
  const rawPath = req.query.path;
  if (!rawPath) {
    serveDefaultPlaceholder(res, "Audio");
    return;
  }
  const safeRelPath = sanitizeRelativePath(rawPath);
  const fullPath = path6.join(MUSIC_DIR, safeRelPath);
  if (!isPathInsideRoot(MUSIC_DIR, fullPath) || !fs5.existsSync(fullPath)) {
    serveDefaultPlaceholder(res, path6.basename(rawPath));
    return;
  }
  const stat = fs5.statSync(fullPath);
  if (stat.isFile()) {
    try {
      const meta = await mm2.parseFile(fullPath, { skipCovers: false });
      if (meta.common.picture && meta.common.picture.length > 0) {
        const pic = meta.common.picture[0];
        res.setHeader("Content-Type", pic.format || "image/jpeg");
        res.setHeader("Cache-Control", "public, max-age=86400");
        res.send(Buffer.from(pic.data));
        return;
      }
    } catch {
    }
    const dirFullPath = path6.dirname(fullPath);
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
  serveDefaultPlaceholder(res, path6.basename(safeRelPath) || "Library");
}
function serveImageFile(filePath, res) {
  const ext = path6.extname(filePath).toLowerCase();
  const mimeMap = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".svg": "image/svg+xml"
  };
  const mime = mimeMap[ext] || "application/octet-stream";
  res.setHeader("Content-Type", mime);
  res.setHeader("Cache-Control", "public, max-age=86400");
  fs5.createReadStream(filePath).pipe(res);
}
function serveDefaultPlaceholder(res, label) {
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
  res.setHeader("Content-Type", "image/svg+xml");
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.send(svg);
}

// server/api.ts
var apiRouter = Router();
apiRouter.get("/browse", async (req, res) => {
  try {
    const targetPath = req.query.path || "";
    const listing = await getDirectoryListing(targetPath);
    res.json(listing);
  } catch (err) {
    res.status(404).json({ error: err.message || "Failed to list directory" });
  }
});
apiRouter.get("/folder/all-tracks", async (req, res) => {
  try {
    const targetPath = req.query.path || "";
    const tracks = await getAllTracksRecursively(targetPath);
    res.json({ path: targetPath, tracks, count: tracks.length });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to collect tracks" });
  }
});
apiRouter.get("/stream", handleAudioStream);
apiRouter.get("/cover", handleCoverArt);
apiRouter.get("/download-project", (req, res) => {
  const zipPath = path7.resolve(process.cwd(), "resonance-music-server.zip");
  if (fs6.existsSync(zipPath)) {
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", 'attachment; filename="resonance-music-server.zip"');
    fs6.createReadStream(zipPath).pipe(res);
  } else {
    res.status(404).json({ error: "Project archive not found" });
  }
});
apiRouter.get("/search", async (req, res) => {
  try {
    const query = (req.query.q || "").trim().toLowerCase();
    if (!query) {
      res.json({ results: [] });
      return;
    }
    const allTracks = await getAllTracksRecursively("");
    const matched = allTracks.filter(
      (t) => t.title.toLowerCase().includes(query) || t.artist.toLowerCase().includes(query) || t.filename.toLowerCase().includes(query) || t.directory.toLowerCase().includes(query) || t.album.toLowerCase().includes(query)
    );
    res.json({ query, results: matched.slice(0, 50) });
  } catch (err) {
    res.status(500).json({ error: err.message || "Search failed" });
  }
});
apiRouter.get("/playlists", (req, res) => {
  res.json(playlistStore.getAll());
});
apiRouter.post("/playlists", (req, res) => {
  const { name, description } = req.body;
  if (!name || typeof name !== "string") {
    res.status(400).json({ error: "Playlist name is required" });
    return;
  }
  const playlist = playlistStore.create(name, description);
  res.status(201).json(playlist);
});
apiRouter.get("/playlists/:id", (req, res) => {
  const pl = playlistStore.getById(req.params.id);
  if (!pl) {
    res.status(404).json({ error: "Playlist not found" });
    return;
  }
  res.json(pl);
});
apiRouter.put("/playlists/:id", (req, res) => {
  const pl = playlistStore.update(req.params.id, req.body);
  if (!pl) {
    res.status(404).json({ error: "Playlist not found" });
    return;
  }
  res.json(pl);
});
apiRouter.delete("/playlists/:id", (req, res) => {
  const success = playlistStore.delete(req.params.id);
  if (!success) {
    res.status(404).json({ error: "Playlist not found" });
    return;
  }
  res.json({ success: true, id: req.params.id });
});
apiRouter.post("/playlists/:id/tracks", async (req, res) => {
  const { id } = req.params;
  const { tracks, folderPath } = req.body;
  let tracksToAdd = tracks;
  if (folderPath !== void 0) {
    tracksToAdd = await getAllTracksRecursively(folderPath);
  }
  if (!Array.isArray(tracksToAdd) || tracksToAdd.length === 0) {
    res.status(400).json({ error: "No valid tracks provided to add" });
    return;
  }
  const updated = playlistStore.addTracks(id, tracksToAdd);
  if (!updated) {
    res.status(404).json({ error: "Playlist not found" });
    return;
  }
  res.json(updated);
});
apiRouter.delete("/playlists/:id/tracks/:index", (req, res) => {
  const { id, index } = req.params;
  const idx = parseInt(index, 10);
  const updated = playlistStore.removeTrack(id, idx);
  if (!updated) {
    res.status(404).json({ error: "Playlist or track index not found" });
    return;
  }
  res.json(updated);
});
apiRouter.put("/playlists/:id/reorder", (req, res) => {
  const { id } = req.params;
  const { fromIndex, toIndex } = req.body;
  if (typeof fromIndex !== "number" || typeof toIndex !== "number") {
    res.status(400).json({ error: "fromIndex and toIndex must be numbers" });
    return;
  }
  const updated = playlistStore.reorderTracks(id, fromIndex, toIndex);
  if (!updated) {
    res.status(404).json({ error: "Playlist not found or invalid indices" });
    return;
  }
  res.json(updated);
});
apiRouter.get("/playlists/:id/export.m3u8", (req, res) => {
  const { id } = req.params;
  const pl = playlistStore.getById(id);
  if (!pl) {
    res.status(404).send("Playlist not found");
    return;
  }
  const m3uContent = playlistStore.exportM3U8(id);
  if (!m3uContent) {
    res.status(500).send("Failed to generate M3U8");
    return;
  }
  const filename = `${pl.name.replace(/[^a-zA-Z0-9_-]/g, "_")}.m3u8`;
  res.setHeader("Content-Type", "audio/x-mpegurl; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(m3uContent);
});
apiRouter.post("/playlists/import", async (req, res) => {
  try {
    const { name, content } = req.body;
    if (!content || typeof content !== "string") {
      res.status(400).json({ error: "M3U content string is required" });
      return;
    }
    const playlist = await playlistStore.importM3U(name, content);
    res.status(201).json(playlist);
  } catch (err) {
    res.status(500).json({ error: err.message || "Import failed" });
  }
});
apiRouter.get("/system/stats", async (req, res) => {
  try {
    const stats = await getSystemStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
apiRouter.post("/system/rescan", async (req, res) => {
  try {
    clearMetadataCache();
    const stats = await getSystemStats();
    res.json({ message: "Library cache cleared and re-indexed", stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
apiRouter.post("/folders/create", (req, res) => {
  const { parentPath, folderName } = req.body;
  if (!folderName || typeof folderName !== "string") {
    res.status(400).json({ error: "Folder name is required" });
    return;
  }
  const cleanName = folderName.replace(/[\/\\:*?"<>|]/g, "").trim();
  if (!cleanName) {
    res.status(400).json({ error: "Invalid folder name" });
    return;
  }
  const safeParent = sanitizeRelativePath(parentPath || "");
  const targetDir = path7.join(MUSIC_DIR, safeParent, cleanName);
  if (!isPathInsideRoot(MUSIC_DIR, targetDir)) {
    res.status(400).json({ error: "Illegal folder location" });
    return;
  }
  if (fs6.existsSync(targetDir)) {
    res.status(409).json({ error: "Folder already exists" });
    return;
  }
  fs6.mkdirSync(targetDir, { recursive: true });
  res.status(201).json({ success: true, path: safeParent ? `${safeParent}/${cleanName}` : cleanName });
});

// server.ts
var __filename2 = fileURLToPath2(import.meta.url);
var __dirname = path8.dirname(__filename2);
async function startServer() {
  const app = express();
  initDirectories();
  seedSampleLibraryIfNeeded();
  await playlistStore.seedDefaultPlaylistIfNeeded();
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use("/api", apiRouter);
  app.get("/api/health", (req, res) => {
    res.json({
      status: "healthy",
      musicDir: MUSIC_DIR,
      dataDir: DATA_DIR,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
  const distPath = path8.resolve(APP_ROOT, "dist");
  const hasDist = fs7.existsSync(distPath);
  if (hasDist) {
    app.use(express.static(distPath));
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api")) {
        return next();
      }
      res.sendFile(path8.join(distPath, "index.html"));
    });
    console.log(`[Resonance Server] \u{1F680} Serving built interface from: ${distPath}`);
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
    console.log(`[Resonance Server] \u{1F6E0}\uFE0F Dev server attached with Vite middlewares`);
  }
  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`
========================================================`);
    console.log(`  \u{1F3B5} Resonance Music Server is LIVE!`);
    console.log(`  Local address:   http://localhost:${PORT}`);
    console.log(`  Local IP:        http://127.0.0.1:${PORT}`);
    console.log(`  \u{1F4C1} Music folder: ${MUSIC_DIR}`);
    console.log(`========================================================
`);
  });
  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(`
[\u041E\u0428\u0418\u0411\u041A\u0410] \u041F\u043E\u0440\u0442 ${PORT} \u0443\u0436\u0435 \u0437\u0430\u043D\u044F\u0442 \u0434\u0440\u0443\u0433\u0438\u043C \u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u0435\u043C!`);
      console.error(`\u0417\u0430\u043F\u0443\u0441\u0442\u0438\u0442\u0435 \u0441 \u0434\u0440\u0443\u0433\u0438\u043C \u043F\u043E\u0440\u0442\u043E\u043C: set PORT=3001 && start-windows.bat
`);
    } else {
      console.error("Server listen error:", err);
    }
  });
}
startServer().catch((err) => {
  console.error("Fatal server startup error:", err);
  process.exit(1);
});
