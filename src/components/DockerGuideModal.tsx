import React, { useState } from 'react';
import {
  X,
  Server,
  Copy,
  Check,
  FolderTree,
  Zap,
  HardDrive,
  Database,
  Terminal,
  FileCode2,
  BookOpen,
  Download
} from 'lucide-react';

interface DockerGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DockerGuideModal: React.FC<DockerGuideModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'windows' | 'compose' | 'dockerfile' | 'arch' | 'schema' | 'guide'>('windows');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const dockerComposeYaml = `services:
  resonance:
    image: ghcr.io/resonance/music-server:latest
    container_name: resonance-music-server
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - MUSIC_DIR=/music
      - DATA_DIR=/data
    volumes:
      # Mount your local music collection (read-only for safety)
      - /path/to/your/music/collection:/music:ro
      # Mount persistent directory for custom playlists and metadata cache
      - ./resonance_data:/data
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3`;

  const dockerfileCode = `# Multi-stage lightweight production build
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV MUSIC_DIR=/music
ENV DATA_DIR=/data

COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/src/utils ./src/utils
COPY --from=builder /app/server.ts ./

# Create default mountpoints
RUN mkdir -p /music /data

EXPOSE 3000
CMD ["node", "--loader", "tsx", "server.ts"]`;

  const schemaJson = `// 1. Playlists Database Schema (local JSON / SQLite representation)
// Location: \${DATA_DIR}/playlists.json
[
  {
    "id": "pl_1715000000_abc12",
    "name": "Midnight Synthesizer Drive",
    "description": "Cruising down neon city avenues",
    "createdAt": "2026-10-25T05:00:00.000Z",
    "updatedAt": "2026-10-25T05:12:00.000Z",
    "tracks": [
      {
        "id": "Electronic/Synthwave/Nightride.mp3",
        "filename": "Nightride.mp3",
        "path": "Electronic/Synthwave/Nightride.mp3",
        "directory": "Electronic/Synthwave",
        "title": "Nightride FM",
        "artist": "Kavinsky Wave",
        "album": "Outrun Drive",
        "trackNumber": 1,
        "duration": 185,
        "format": "mp3",
        "size": 4492100,
        "bitrate": 320,
        "sampleRate": 44100,
        "hasCover": true
      }
    ]
  }
]

// 2. HTTP 206 Partial Content Range Spec (RFC 7233)
// Client Request:
//   GET /api/stream?path=Electronic/Synthwave/Nightride.mp3
//   Range: bytes=1048576-2097151
// Server Response:
//   HTTP/1.1 206 Partial Content
//   Content-Type: audio/mpeg
//   Accept-Ranges: bytes
//   Content-Range: bytes 1048576-2097151/4492100
//   Content-Length: 1048576`;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-6 select-text">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Self-Hosted Architecture & Docker Deployment</span>
              </h2>
              <p className="text-xs text-zinc-400">
                Resonance Architecture, Volume Mounts & Production Setup
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 px-5 border-b border-zinc-800 bg-zinc-950/60 overflow-x-auto">
          <button
            onClick={() => setActiveTab('windows')}
            className={`px-3.5 py-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'windows'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <HardDrive className="w-4 h-4" />
            <span>Windows OS Guide</span>
          </button>

          <button
            onClick={() => setActiveTab('compose')}
            className={`px-3.5 py-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'compose'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>docker-compose.yml</span>
          </button>

          <button
            onClick={() => setActiveTab('dockerfile')}
            className={`px-3.5 py-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'dockerfile'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FileCode2 className="w-4 h-4" />
            <span>Dockerfile</span>
          </button>

          <button
            onClick={() => setActiveTab('arch')}
            className={`px-3.5 py-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'arch'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FolderTree className="w-4 h-4" />
            <span>System Architecture</span>
          </button>

          <button
            onClick={() => setActiveTab('schema')}
            className={`px-3.5 py-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'schema'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Data Schema</span>
          </button>

          <button
            onClick={() => setActiveTab('guide')}
            className={`px-3.5 py-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'guide'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Setup Guide</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {activeTab === 'windows' && (
            <div className="space-y-4 text-xs text-zinc-300">
              {/* Direct Download Card */}
              <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="font-bold text-sm text-emerald-300 flex items-center gap-2">
                    <Download className="w-4.5 h-4.5 text-emerald-400" />
                    <span>Скачать готовую папку с проектом (.zip)</span>
                  </div>
                  <p className="text-zinc-300 text-xs mt-1">
                    В архив включены все исходные файлы, плеер, конфигурации и файл запуска <code>start-windows.bat</code>.
                  </p>
                </div>
                <a
                  href="/api/download-project"
                  download="resonance-music-server.zip"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg flex items-center gap-2 transition-colors shrink-0 shadow-md"
                >
                  <Download className="w-4 h-4" />
                  <span>Скачать ZIP (~95 КБ)</span>
                </a>
              </div>

              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
                <div className="font-bold text-sm text-white flex items-center gap-2">
                  <HardDrive className="w-4.5 h-4.5 text-emerald-400" />
                  <span>Running on Windows 10 / Windows 11</span>
                </div>
                <p className="text-zinc-400 leading-relaxed">
                  Resonance is 100% native on Windows OS. Paths with backslashes (<code className="text-zinc-200 font-mono">C:\Music\Rock</code>), drive letters (<code className="text-zinc-200 font-mono">D:\</code>, <code className="text-zinc-200 font-mono">E:\</code>), and network shares (<code className="text-zinc-200 font-mono">\\NAS\Music</code>) are fully supported with case-insensitive boundary safety and streaming.
                </p>
              </div>

              {/* Method 1: Native Windows Script */}
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-cyan-400" />
                    <span>Method 1: Native Windows (No Docker Needed - One-Click Batch)</span>
                  </span>
                  <button
                    onClick={() => copyToClipboard('start-windows.bat', 'bat-cmd')}
                    className="px-2 py-1 rounded bg-zinc-800 text-zinc-300 hover:text-white text-[11px] font-mono border border-zinc-700"
                  >
                    {copiedKey === 'bat-cmd' ? 'Copied!' : 'start-windows.bat'}
                  </button>
                </div>
                <p className="text-zinc-400">
                  Included in the project root is <code className="text-emerald-400 font-mono">start-windows.bat</code>. Double-click it or run from Command Prompt / PowerShell:
                </p>
                <pre className="p-3 bg-zinc-900 rounded-lg font-mono text-xs text-emerald-300">
                  {`# In cmd.exe or PowerShell:
cd /d C:\\path\\to\\resonance
.\\start-windows.bat

# Or set custom Windows paths via environment variables:
set MUSIC_DIR=D:\\MyFlacCollection
set PORT=3000
npm start`}
                </pre>
                <div className="text-zinc-400 text-[11px]">
                  Default Music path on Windows: <code className="text-zinc-300 font-mono">%USERPROFILE%\\Music</code> (<code className="text-zinc-300 font-mono">C:\\Users\\YourName\\Music</code>).
                </div>
              </div>

              {/* Method 2: Windows Docker Desktop */}
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
                <span className="font-bold text-white flex items-center gap-2">
                  <Server className="w-4 h-4 text-purple-400" />
                  <span>Method 2: Windows Docker Desktop (WSL2 Backend)</span>
                </span>
                <p className="text-zinc-400">
                  In <code className="text-zinc-200 font-mono">docker-compose.yml</code>, specify your Windows host path using forward slashes:
                </p>
                <pre className="p-3 bg-zinc-900 rounded-lg font-mono text-xs text-zinc-300">
                  {`volumes:
  # Map Windows C: or D: drive into container:
  - C:/Users/YourUsername/Music:/music:ro
  # Or D: drive:
  # - D:/Music:/music:ro
  - ./resonance_data:/data`}
                </pre>
                <div className="text-[11px] text-zinc-500">
                  Run: <code className="text-emerald-400 font-mono">docker compose up -d</code> in Windows Terminal.
                </div>
              </div>

              {/* Method 3: Windows Firewall for Home Network Streaming */}
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span>Streaming to Phone/LAN (Windows Firewall Rule)</span>
                  </span>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        'netsh advfirewall firewall add rule name="Resonance Music Server" dir=in action=allow protocol=TCP localport=3000',
                        'firewall'
                      )
                    }
                    className="px-2 py-1 rounded bg-zinc-800 text-zinc-300 hover:text-white text-[11px] font-mono border border-zinc-700"
                  >
                    {copiedKey === 'firewall' ? 'Copied!' : 'Copy Rule Command'}
                  </button>
                </div>
                <p className="text-zinc-400">
                  To stream to your iPhone, Android, or laptop on the same local Wi-Fi, run in Administrator PowerShell:
                </p>
                <pre className="p-2.5 bg-zinc-900 rounded-lg font-mono text-xs text-amber-300 overflow-x-auto">
                  netsh advfirewall firewall add rule name="Resonance Music Server" dir=in action=allow protocol=TCP localport=3000
                </pre>
                <p className="text-zinc-500 text-[11px]">
                  Then open on your mobile browser: <code className="text-zinc-300 font-mono">http://&lt;your-pc-ip&gt;:3000</code> (check via <code className="text-zinc-300 font-mono">ipconfig</code>).
                </p>
              </div>
            </div>
          )}
          {activeTab === 'compose' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-400">
                  Ready-to-run Docker Compose configuration with read-only music mount:
                </span>
                <button
                  onClick={() => copyToClipboard(dockerComposeYaml, 'compose')}
                  className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium flex items-center gap-1.5 transition-colors border border-zinc-700"
                >
                  {copiedKey === 'compose' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy YAML</span>
                    </>
                  )}
                </button>
              </div>

              <div className="relative">
                <pre className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-200 overflow-x-auto leading-relaxed">
                  {dockerComposeYaml}
                </pre>
              </div>

              <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 text-xs text-zinc-400 space-y-2">
                <div className="font-semibold text-zinc-200 flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-emerald-400" />
                  <span>Mounting Explanation:</span>
                </div>
                <p>
                  • <code className="text-emerald-400 font-mono">/path/to/your/music:/music:ro</code>: Maps your native music folder from your NAS or host drive into the container in read-only mode (<code className="text-zinc-300 font-mono">:ro</code>) to guarantee zero modifications or accidental file deletions to your library.
                </p>
                <p>
                  • <code className="text-emerald-400 font-mono">./resonance_data:/data</code>: Maps the writable state directory for storing custom user playlists (<code className="text-zinc-300 font-mono">playlists.json</code>) and metadata cache.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'dockerfile' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-400">
                  Multi-stage minimal Node.js 22 Alpine Dockerfile:
                </span>
                <button
                  onClick={() => copyToClipboard(dockerfileCode, 'dockerfile')}
                  className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium flex items-center gap-1.5 transition-colors border border-zinc-700"
                >
                  {copiedKey === 'dockerfile' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Dockerfile</span>
                    </>
                  )}
                </button>
              </div>

              <pre className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-200 overflow-x-auto leading-relaxed">
                {dockerfileCode}
              </pre>
            </div>
          )}

          {activeTab === 'arch' && (
            <div className="space-y-5 text-xs text-zinc-300">
              <div className="p-5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-400" />
                  <span>Folder-First Streaming Architecture</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-center">
                  <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800 flex flex-col items-center">
                    <HardDrive className="w-6 h-6 text-emerald-400 mb-2" />
                    <span className="font-bold text-white">1. Native Filesystem</span>
                    <p className="text-[11px] text-zinc-500 mt-1">
                      Strict hierarchical traversal of physical folders on disk without database tag re-indexing or artist flattening.
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800 flex flex-col items-center">
                    <Server className="w-6 h-6 text-cyan-400 mb-2" />
                    <span className="font-bold text-white">2. Range Streamer</span>
                    <p className="text-[11px] text-zinc-500 mt-1">
                      Express HTTP 206 Partial Content server parses byte range headers for instantaneous seeking across large FLAC/WAV/MP3 files.
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800 flex flex-col items-center">
                    <FolderTree className="w-6 h-6 text-purple-400 mb-2" />
                    <span className="font-bold text-white">3. Responsive SPA</span>
                    <p className="text-[11px] text-zinc-500 mt-1">
                      React + Tailwind interface with recursive breadcrumb navigation, custom playlist engine, and native Media Session API.
                    </p>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                  <h4 className="font-semibold text-white">Why Folder-First Over Tag-First (Navidrome/Plex)?</h4>
                  <p className="text-zinc-400 leading-relaxed">
                    Most audio servers force tracks into database relational tables indexed strictly by <code className="text-zinc-200">Artist / Album</code> tags. This breaks compilation albums, multi-disc boxsets, bootlegs, sound effects, soundtracks, and DJ archives. Resonance honors the directory structure exactly as organized on disk while only extracting ID3 tags on the fly for cosmetic display in the folder listing.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'schema' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-400">
                  Playlists JSON Store and HTTP 206 Partial Content Range Spec:
                </span>
                <button
                  onClick={() => copyToClipboard(schemaJson, 'schema')}
                  className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium flex items-center gap-1.5 transition-colors border border-zinc-700"
                >
                  {copiedKey === 'schema' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Schema</span>
                    </>
                  )}
                </button>
              </div>

              <pre className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-200 overflow-x-auto leading-relaxed">
                {schemaJson}
              </pre>
            </div>
          )}

          {activeTab === 'guide' && (
            <div className="space-y-4 text-xs text-zinc-300">
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
                <div className="font-semibold text-white flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span>Quick Start in 3 Commands:</span>
                </div>
                <div className="p-3 bg-zinc-900 rounded-lg font-mono text-xs text-emerald-300 space-y-1">
                  <div># 1. Create docker-compose.yml file</div>
                  <div>cat &lt;&lt; 'EOF' &gt; docker-compose.yml</div>
                  <div className="text-zinc-500">... (paste the docker-compose YAML from tab 1) ...</div>
                  <div>EOF</div>
                  <div className="pt-2"># 2. Launch container in background</div>
                  <div>docker compose up -d</div>
                  <div className="pt-2"># 3. Access web player in any browser or mobile</div>
                  <div className="text-white">http://localhost:3000</div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                <h4 className="font-semibold text-white">Synology / QNAP / TrueNAS Mounting:</h4>
                <p className="text-zinc-400">
                  If running on a NAS (Synology Container Manager or TrueNAS SCALE), map your shared volume path (e.g. <code className="text-zinc-200">/volume1/music</code>) to container path <code className="text-emerald-400">/music</code> with Read-Only permissions enabled.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/60 flex items-center justify-between">
          <div className="text-xs text-zinc-500 font-mono">
            Resonance v1.0 • Folder-First Hi-Fi Architecture
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
