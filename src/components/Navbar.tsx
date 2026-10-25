import React, { useState, useEffect, useRef } from 'react';
import {
  FolderTree,
  Search,
  Server,
  RefreshCw,
  FolderPlus,
  Play,
  Music2,
  HardDrive,
  Download
} from 'lucide-react';
import { Track } from '../types/music.js';

interface NavbarProps {
  currentPath: string;
  onOpenDockerGuide: () => void;
  onOpenCreateFolder: () => void;
  onNavigatePath: (path: string) => void;
  onPlayTrack: (track: Track) => void;
  onRescan: () => Promise<void>;
  isRescanning: boolean;
  onToggleMobileSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPath,
  onOpenDockerGuide,
  onOpenCreateFolder,
  onNavigatePath,
  onPlayTrack,
  onRescan,
  isRescanning,
  onToggleMobileSidebar
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.results || []);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  // Click outside closes search dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-16 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between gap-3 sticky top-0 z-30 select-none">
      {/* Brand & Mobile Menu */}
      <div className="flex items-center gap-2 min-w-max">
        {onToggleMobileSidebar && (
          <button
            onClick={onToggleMobileSidebar}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-850 md:hidden transition-colors"
            title="Toggle directory menu"
            aria-label="Toggle directory menu"
          >
            <FolderTree className="w-5 h-5 text-emerald-400" />
          </button>
        )}
        <button
          onClick={() => onNavigatePath('')}
          className="flex items-center gap-2.5 text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-lg p-1"
          title="Go to Music Root"
        >
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/20 group-hover:scale-105 transition-all">
            <FolderTree className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-zinc-100 tracking-tight text-base group-hover:text-emerald-400 transition-colors">
                Resonance
              </span>
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-zinc-800/80 text-zinc-400 border border-zinc-700/60">
                Folder-First
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 hidden sm:block">
              Directory-Based Hi-Fi Server
            </p>
          </div>
        </button>
      </div>

      {/* Instant Search Bar */}
      <div ref={searchContainerRef} className="relative flex-1 max-w-xl mx-2">
        <div className="relative">
          <label htmlFor="global-search-input" className="sr-only">Search audio files</label>
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
          <input
            id="global-search-input"
            type="search"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowResults(true);
            }}
            onFocus={() => setShowResults(true)}
            placeholder="Search audio files across folders (e.g. Nightride, wav, flac)..."
            className="w-full h-9.5 pl-9 pr-8 text-sm bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500/70 focus:ring-1 focus:ring-emerald-500/40 transition-colors"
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <RefreshCw className="w-3.5 h-3.5 text-zinc-400 animate-spin" />
            </div>
          )}
        </div>

        {/* Results Dropdown */}
        {showResults && searchQuery.trim() && (
          <div className="absolute left-0 right-0 top-11 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden z-50 max-h-96 overflow-y-auto divide-y divide-zinc-800/60">
            {searchResults.length === 0 ? (
              <div className="p-4 text-center text-sm text-zinc-400">
                {isSearching ? 'Searching audio files...' : `No audio tracks matched "${searchQuery}"`}
              </div>
            ) : (
              <div>
                <div className="px-3 py-2 bg-zinc-950/60 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex justify-between">
                  <span>Found {searchResults.length} audio tracks</span>
                  <span>Click to play</span>
                </div>
                {searchResults.map((track) => (
                  <button
                    key={track.path}
                    onClick={() => {
                      onPlayTrack(track);
                      setShowResults(false);
                    }}
                    className="w-full px-3 py-2.5 text-left hover:bg-zinc-800/70 flex items-center justify-between gap-3 group transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-emerald-400 shrink-0">
                        <Music2 className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-zinc-200 truncate group-hover:text-white">
                          {track.title || track.filename}
                        </div>
                        <div className="text-xs text-zinc-400 truncate flex items-center gap-1.5 font-mono">
                          <span>{track.artist}</span>
                          <span>•</span>
                          <span className="text-zinc-400">{track.directory || 'Root'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/60">
                        {track.format}
                      </span>
                      <div className="w-7 h-7 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenCreateFolder}
          className="h-9 px-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
          title="Create a new folder in current directory"
        >
          <FolderPlus className="w-4 h-4 text-emerald-400" />
          <span className="hidden md:inline">New Folder</span>
        </button>

        <button
          onClick={onRescan}
          disabled={isRescanning}
          className="h-9 px-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
          title="Rescan music library and refresh metadata cache"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRescanning ? 'animate-spin text-emerald-400' : 'text-zinc-400'}`} />
          <span className="hidden lg:inline">{isRescanning ? 'Rescanning...' : 'Rescan Library'}</span>
        </button>

        <a
          href="/api/download-project"
          download="resonance-music-server.zip"
          className="h-9 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
          title="Скачать zip-архив проекта на компьютер"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Скачать проект (.zip)</span>
        </a>

        <button
          onClick={onOpenDockerGuide}
          className="h-9 px-3.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
          title="Open Docker Compose & Architecture Deployment Guide"
        >
          <Server className="w-3.5 h-3.5 text-emerald-400" />
          <span>Инструкция</span>
        </button>
      </div>
    </header>
  );
};
