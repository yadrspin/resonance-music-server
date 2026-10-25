import React, { useState } from 'react';
import {
  Folder,
  ListMusic,
  Plus,
  FileUp,
  HardDrive,
  FolderTree,
  Radio,
  ChevronDown
} from 'lucide-react';
import { Playlist, SystemStats } from '../types/music.js';

interface FolderTreeSidebarProps {
  currentPath: string;
  selectedPlaylistId: string | null;
  playlists: Playlist[];
  topFolders: string[];
  systemStats: SystemStats | null;
  onNavigatePath: (path: string) => void;
  onSelectPlaylist: (id: string | null) => void;
  onOpenCreatePlaylist: () => void;
  onOpenImportM3U: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const FolderTreeSidebar: React.FC<FolderTreeSidebarProps> = ({
  currentPath,
  selectedPlaylistId,
  playlists,
  topFolders,
  systemStats,
  onNavigatePath,
  onSelectPlaylist,
  onOpenCreatePlaylist,
  onOpenImportM3U,
  isMobileOpen = false,
  onCloseMobile
}) => {
  const [isTopFoldersCollapsed, setIsTopFoldersCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('resonance_top_folders_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleTopFolders = () => {
    setIsTopFoldersCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('resonance_top_folders_collapsed', String(next));
      } catch {}
      return next;
    });
  };
  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        aria-label="Sidebar Navigation"
        className={`w-64 border-r border-zinc-800 bg-zinc-950 p-4 flex flex-col justify-between shrink-0 h-[calc(100vh-4rem-5.5rem)] overflow-y-auto transition-transform z-40 ${
          isMobileOpen
            ? 'fixed left-0 top-16 bottom-22 shadow-2xl flex'
            : 'hidden md:flex'
        }`}
      >
      <div className="space-y-6">
        {/* Navigation Category */}
        <div>
          <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider px-2 mb-2">
            Library Hierarchy
          </div>
          <div className="space-y-1">
            <button
              onClick={() => {
                onSelectPlaylist(null);
                onNavigatePath('');
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left ${
                selectedPlaylistId === null && currentPath === ''
                  ? 'bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-500/20'
                  : 'text-zinc-300 hover:bg-zinc-900 hover:text-white'
              }`}
            >
              <FolderTree className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Root Music Directory</span>
            </button>
          </div>
        </div>

        {/* Directory Quick Jumps */}
        {topFolders.length > 0 && (
          <div>
            <button
              onClick={toggleTopFolders}
              className="w-full text-[11px] font-semibold text-zinc-400 hover:text-zinc-200 uppercase tracking-wider px-2 py-1 mb-1.5 flex items-center justify-between rounded hover:bg-zinc-900/60 transition-colors group cursor-pointer"
              title={isTopFoldersCollapsed ? 'Развернуть Top Folders' : 'Свернуть Top Folders'}
              aria-expanded={!isTopFoldersCollapsed}
            >
              <div className="flex items-center gap-1.5">
                <ChevronDown
                  className={`w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300 transition-transform duration-200 ${
                    isTopFoldersCollapsed ? '-rotate-90' : 'rotate-0'
                  }`}
                />
                <span>Top Folders</span>
              </div>
              <span className="text-[10px] text-zinc-400 bg-zinc-900 border border-zinc-800/80 px-1.5 py-0.5 rounded-full font-mono">
                {topFolders.length}
              </span>
            </button>

            {!isTopFoldersCollapsed && (
              <div className="space-y-1">
                {topFolders.map((folder) => {
                  const isActive = selectedPlaylistId === null && currentPath.startsWith(folder);
                  return (
                    <button
                      key={folder}
                      onClick={() => {
                        onSelectPlaylist(null);
                        onNavigatePath(folder);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs transition-colors text-left truncate ${
                        isActive
                          ? 'bg-zinc-800 text-emerald-400 font-medium'
                          : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                      }`}
                      title={folder}
                    >
                      <Folder className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-emerald-400' : 'text-zinc-500'}`} />
                      <span className="truncate">{folder}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Custom Playlists */}
        <div>
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
              Playlists
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={onOpenImportM3U}
                className="p-1 text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800 rounded transition-colors"
                title="Import .m3u / .m3u8 playlist file"
                aria-label="Import M3U playlist"
              >
                <FileUp className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onOpenCreatePlaylist}
                className="p-1 text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800 rounded transition-colors"
                title="Create new custom playlist"
                aria-label="Create new playlist"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="space-y-1">
            {playlists.length === 0 ? (
              <div className="px-3 py-3 border border-dashed border-zinc-800 rounded-lg text-center">
                <p className="text-[11px] text-zinc-500 mb-2">No playlists created yet</p>
                <button
                  onClick={onOpenCreatePlaylist}
                  className="text-xs text-emerald-400 hover:underline font-medium"
                >
                  + Create Playlist
                </button>
              </div>
            ) : (
              playlists.map((pl) => {
                const isSelected = selectedPlaylistId === pl.id;
                return (
                  <button
                    key={pl.id}
                    onClick={() => onSelectPlaylist(pl.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors text-left group ${
                      isSelected
                        ? 'bg-emerald-500/15 text-emerald-300 font-semibold border border-emerald-500/20'
                        : 'text-zinc-300 hover:bg-zinc-900 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <ListMusic className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-emerald-400' : 'text-zinc-500'}`} />
                      <span className="truncate">{pl.name}</span>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-400 group-hover:text-zinc-300 ml-1 shrink-0">
                      {pl.tracks.length}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* System Status info card */}
      <div className="pt-4 border-t border-zinc-900 mt-4 text-[11px] text-zinc-500 space-y-2">
        <div className="flex items-center gap-1.5 text-zinc-400 font-medium">
          <HardDrive className="w-3.5 h-3.5 text-emerald-500" />
          <span>Native Directory Storage</span>
        </div>
        <div className="bg-zinc-900/60 rounded-md p-2 font-mono text-[10px] text-zinc-400 truncate border border-zinc-800/60" title={systemStats?.musicDir || 'Native Music Directory'}>
          {systemStats?.musicDir ? systemStats.musicDir.split('/').slice(-2).join('/') : 'music_data/library'}
        </div>
        <div className="flex flex-wrap gap-1 text-[9px] font-mono text-zinc-500">
          <span className="bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">FLAC</span>
          <span className="bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">MP3</span>
          <span className="bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">WAV</span>
          <span className="bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">OGG</span>
          <span className="bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">OPUS</span>
        </div>
      </div>
    </aside>
    </>
  );
};
