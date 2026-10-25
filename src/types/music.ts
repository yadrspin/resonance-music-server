export interface Track {
  id: string;
  filename: string;
  path: string; // Relative path from music root, e.g. "Electronic/Synthwave/Nightride.mp3"
  directory: string;
  title: string;
  artist: string;
  album: string;
  year?: number;
  trackNumber?: number;
  duration: number; // in seconds
  format: string; // "mp3" | "flac" | "wav" | "ogg" | "m4a" | "opus"
  size: number; // bytes
  bitrate?: number; // kbps
  sampleRate?: number;
  hasCover?: boolean;
}

export interface FolderItem {
  name: string;
  path: string; // Relative path from music root
  parentPath: string;
  trackCount: number;
  subfolderCount: number;
}

export interface DirectoryListing {
  currentPath: string;
  breadcrumbs: { name: string; path: string }[];
  folders: FolderItem[];
  tracks: Track[];
  totalTracks: number;
  totalSize: number;
  parentPath: string | null;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  tracks: Track[];
}

export interface SystemStats {
  musicDir: string;
  totalFiles: number;
  totalFolders: number;
  totalSizeBytes: number;
  supportedFormats: string[];
  uptimeSeconds: number;
}

export type RepeatMode = 'off' | 'all' | 'one';
