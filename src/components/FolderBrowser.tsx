import React, { useState } from 'react';
import {
  Folder,
  Music2,
  Play,
  Shuffle,
  PlusSquare,
  List,
  LayoutGrid,
  MoreVertical,
  Clock,
  HardDrive,
  ListPlus,
  Radio,
  FileAudio
} from 'lucide-react';
import { DirectoryListing, Track, FolderItem } from '../types/music.js';
import { formatDuration, formatBytes, getFormatBadgeClasses } from '../utils/formatters.js';

interface FolderBrowserProps {
  listing: DirectoryListing;
  currentTrackId: string | null;
  isPlaying: boolean;
  onNavigatePath: (path: string) => void;
  onPlayTrack: (track: Track, tracksInFolder: Track[], index: number) => void;
  onPlayFolder: (folderPath: string) => void;
  onShuffleFolder: (folderPath: string) => void;
  onAddFolderToPlaylist: (folderPath: string) => void;
  onAddTrackToQueue: (track: Track, immediatelyNext?: boolean) => void;
  onAddTrackToPlaylist: (track: Track) => void;
}

export const FolderBrowser: React.FC<FolderBrowserProps> = ({
  listing,
  currentTrackId,
  isPlaying,
  onNavigatePath,
  onPlayTrack,
  onPlayFolder,
  onShuffleFolder,
  onAddFolderToPlaylist,
  onAddTrackToQueue,
  onAddTrackToPlaylist
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [activeMenuTrackId, setActiveMenuTrackId] = useState<string | null>(null);

  const folderName = listing.currentPath ? listing.currentPath.split('/').pop() || 'Music' : 'Music Root';

  return (
    <div className="space-y-6">
      {/* Folder Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-gradient-to-r from-zinc-900 to-zinc-900/60 rounded-xl border border-zinc-800/80 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-lg bg-zinc-800 border border-zinc-700/80 overflow-hidden flex items-center justify-center shrink-0 shadow-md">
            <img
              src={`/api/cover?path=${encodeURIComponent(listing.currentPath)}`}
              alt={folderName}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback to generic icon if image fails
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <Folder className="w-8 h-8 text-emerald-400 absolute pointer-events-none" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Directory
              </span>
              <span className="text-xs text-zinc-400 font-mono">
                {listing.currentPath || '/ (Root)'}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight mt-0.5">
              {folderName}
            </h1>
            <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1">
              <span>{listing.folders.length} subfolders</span>
              <span>•</span>
              <span>{listing.totalTracks} audio tracks</span>
              <span>•</span>
              <span>{formatBytes(listing.totalSize)}</span>
            </div>
          </div>
        </div>

        {/* Action Controls & View Switcher */}
        <div className="flex items-center gap-2.5 self-end sm:self-center">
          {listing.totalTracks > 0 && (
            <>
              <button
                onClick={() => onPlayFolder(listing.currentPath)}
                className="h-9 px-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center gap-2 transition-colors shadow-sm"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Play All</span>
              </button>
              <button
                onClick={() => onShuffleFolder(listing.currentPath)}
                className="h-9 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium flex items-center gap-1.5 transition-colors border border-zinc-700/60"
              >
                <Shuffle className="w-3.5 h-3.5" />
                <span>Shuffle</span>
              </button>
            </>
          )}

          <div className="flex items-center bg-zinc-950 p-1 rounded-lg border border-zinc-800">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'list' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title="List view"
              aria-label="List view"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'grid' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title="Grid view"
              aria-label="Grid view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Subfolders Grid */}
      {listing.folders.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <Folder className="w-3.5 h-3.5 text-emerald-400" />
              <span>Subdirectories ({listing.folders.length})</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {listing.folders.map((folder) => (
              <div
                key={folder.path}
                className="group relative bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700/80 rounded-xl p-3.5 transition-all flex items-center justify-between gap-3 cursor-pointer"
                onClick={() => onNavigatePath(folder.path)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/20 group-hover:scale-105 transition-all shrink-0">
                    <Folder className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-zinc-200 group-hover:text-emerald-400 transition-colors truncate">
                      {folder.name}
                    </div>
                    <div className="text-xs text-zinc-500 flex items-center gap-2 mt-0.5">
                      <span>{folder.trackCount} tracks</span>
                      {folder.subfolderCount > 0 && (
                        <>
                          <span>•</span>
                          <span>{folder.subfolderCount} subfolders</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick actions on hover */}
                {folder.trackCount > 0 && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onPlayFolder(folder.path)}
                      className="w-8 h-8 rounded-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 flex items-center justify-center shadow-lg hover:scale-105 transition-all"
                      title="Play entire folder"
                      aria-label={`Play folder ${folder.name}`}
                    >
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Audio Tracks Section */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
            <Music2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Audio Files in this Directory ({listing.tracks.length})</span>
          </h2>
        </div>

        {listing.tracks.length === 0 ? (
          <div className="p-8 text-center bg-zinc-900/30 rounded-xl border border-dashed border-zinc-800">
            <FileAudio className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
            <p className="text-sm text-zinc-400 font-medium">No audio files in this directory</p>
            <p className="text-xs text-zinc-500 mt-1">
              Select one of the subdirectories above or create a new subfolder
            </p>
          </div>
        ) : viewMode === 'list' ? (
          /* Table / List View */
          <div className="border border-zinc-800/80 rounded-xl overflow-hidden bg-zinc-900/40 divide-y divide-zinc-800/60">
            {/* Header */}
            <div className="grid grid-cols-12 gap-3 px-4 py-2.5 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider bg-zinc-950/60 select-none">
              <div className="col-span-1 text-center">#</div>
              <div className="col-span-5 sm:col-span-5">Title & Artist</div>
              <div className="hidden sm:block col-span-3">Album / Folder</div>
              <div className="col-span-3 sm:col-span-2 text-right">Format / Size</div>
              <div className="col-span-3 sm:col-span-1 text-right flex justify-end items-center">
                <Clock className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Rows */}
            {listing.tracks.map((track, idx) => {
              const isCurrent = currentTrackId === track.id;
              const formatStyle = getFormatBadgeClasses(track.format);

              return (
                <div
                  key={track.id}
                  className={`grid grid-cols-12 gap-3 px-4 py-3 items-center hover:bg-zinc-800/50 transition-colors group ${
                    isCurrent ? 'bg-emerald-500/10 text-emerald-300' : 'text-zinc-300'
                  }`}
                >
                  {/* Track Number / Play button */}
                  <div className="col-span-1 text-center flex items-center justify-center">
                    <button
                      onClick={() => onPlayTrack(track, listing.tracks, idx)}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-zinc-400 group-hover:text-white group-hover:bg-emerald-500 group-hover:text-zinc-950 transition-all"
                      title="Play track"
                      aria-label={`Play ${track.title}`}
                    >
                      {isCurrent && isPlaying ? (
                        <div className="flex items-center gap-0.5">
                          <span className="w-1 h-3 bg-emerald-400 animate-pulse rounded-full" />
                          <span className="w-1 h-4 bg-emerald-400 animate-pulse delay-75 rounded-full" />
                          <span className="w-1 h-2 bg-emerald-400 animate-pulse delay-150 rounded-full" />
                        </div>
                      ) : (
                        <>
                          <span className="group-hover:hidden text-xs font-mono text-zinc-500">
                            {track.trackNumber || (idx + 1)}
                          </span>
                          <Play className="w-3.5 h-3.5 fill-current hidden group-hover:block ml-0.5" />
                        </>
                      )}
                    </button>
                  </div>

                  {/* Title & Artist */}
                  <div className="col-span-5 sm:col-span-5 min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-semibold truncate ${isCurrent ? 'text-emerald-400' : 'text-zinc-200'}`}>
                        {track.title || track.filename}
                      </span>
                    </div>
                    <div className="text-xs text-zinc-500 truncate flex items-center gap-1.5 mt-0.5">
                      <span>{track.artist}</span>
                      <span className="text-zinc-700">•</span>
                      <span className="font-mono text-[11px] text-zinc-500 truncate">{track.filename}</span>
                    </div>
                  </div>

                  {/* Album / Folder */}
                  <div className="hidden sm:block col-span-3 min-w-0 text-xs text-zinc-400 truncate">
                    {track.album || folderName}
                  </div>

                  {/* Format & Size */}
                  <div className="col-span-3 sm:col-span-2 text-right flex flex-col items-end gap-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-mono font-bold uppercase px-1.5 py-0.2 rounded border ${formatStyle.bg} ${formatStyle.text} ${formatStyle.border}`}>
                        {track.format}
                      </span>
                      {track.bitrate && (
                        <span className="text-[10px] font-mono text-zinc-500 hidden md:inline">
                          {track.bitrate}k
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500">
                      {formatBytes(track.size)}
                    </span>
                  </div>

                  {/* Duration & Menu */}
                  <div className="col-span-3 sm:col-span-1 text-right flex items-center justify-end gap-2">
                    <span className="text-xs font-mono text-zinc-400">
                      {formatDuration(track.duration)}
                    </span>

                    {/* Quick Menu */}
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuTrackId(activeMenuTrackId === track.id ? null : track.id);
                        }}
                        className="p-1 text-zinc-500 hover:text-zinc-200 rounded hover:bg-zinc-700 transition-colors opacity-0 group-hover:opacity-100"
                        title="Track options"
                        aria-label={`Options for ${track.title}`}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {activeMenuTrackId === track.id && (
                        <div
                          className="absolute right-0 top-6 w-48 bg-zinc-900 border border-zinc-700/80 rounded-lg shadow-2xl py-1 z-40 text-left"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => {
                              onAddTrackToQueue(track, true);
                              setActiveMenuTrackId(null);
                            }}
                            className="w-full px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center gap-2"
                          >
                            <Play className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Play Next</span>
                          </button>
                          <button
                            onClick={() => {
                              onAddTrackToQueue(track, false);
                              setActiveMenuTrackId(null);
                            }}
                            className="w-full px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center gap-2"
                          >
                            <ListPlus className="w-3.5 h-3.5 text-zinc-400" />
                            <span>Add to Queue</span>
                          </button>
                          <button
                            onClick={() => {
                              onAddTrackToPlaylist(track);
                              setActiveMenuTrackId(null);
                            }}
                            className="w-full px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center gap-2"
                          >
                            <PlusSquare className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Add to Playlist...</span>
                          </button>
                          <div className="border-t border-zinc-800 my-1" />
                          <a
                            href={`/api/stream?path=${encodeURIComponent(track.path)}`}
                            download={track.filename}
                            onClick={() => setActiveMenuTrackId(null)}
                            className="w-full px-3 py-1.5 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 flex items-center gap-2"
                          >
                            <HardDrive className="w-3.5 h-3.5" />
                            <span>Download File</span>
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Grid View */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {listing.tracks.map((track, idx) => {
              const isCurrent = currentTrackId === track.id;
              const formatStyle = getFormatBadgeClasses(track.format);

              return (
                <div
                  key={track.id}
                  className={`group relative bg-zinc-900/60 hover:bg-zinc-900 border rounded-xl p-3 flex flex-col justify-between transition-all ${
                    isCurrent
                      ? 'border-emerald-500/60 bg-emerald-500/5'
                      : 'border-zinc-800/80 hover:border-zinc-700'
                  }`}
                >
                  <div>
                    {/* Artwork thumbnail */}
                    <div className="aspect-square w-full rounded-lg bg-zinc-800/80 overflow-hidden relative flex items-center justify-center mb-2.5">
                      <img
                        src={`/api/cover?path=${encodeURIComponent(track.path)}`}
                        alt={track.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      <Music2 className="w-8 h-8 text-zinc-600 absolute pointer-events-none" />

                      {/* Play overlay button */}
                      <button
                        onClick={() => onPlayTrack(track, listing.tracks, idx)}
                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                        aria-label={`Play ${track.title}`}
                      >
                        <div className="w-10 h-10 rounded-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 flex items-center justify-center shadow-lg transform group-hover:scale-105 transition-transform">
                          <Play className="w-5 h-5 fill-current ml-0.5" />
                        </div>
                      </button>

                      <div className="absolute top-2 right-2">
                        <span className={`text-[9px] font-mono font-bold uppercase px-1 py-0.2 rounded border shadow-sm ${formatStyle.bg} ${formatStyle.text} ${formatStyle.border}`}>
                          {track.format}
                        </span>
                      </div>
                    </div>

                    <div className="text-sm font-semibold text-zinc-200 truncate group-hover:text-emerald-400 transition-colors">
                      {track.title || track.filename}
                    </div>
                    <div className="text-xs text-zinc-500 truncate mt-0.5">
                      {track.artist}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-zinc-800/60 text-xs text-zinc-400 font-mono">
                    <span>{formatDuration(track.duration)}</span>
                    <button
                      onClick={() => onAddTrackToPlaylist(track)}
                      className="p-1 hover:text-emerald-400 transition-colors"
                      title="Add to playlist"
                      aria-label="Add to playlist"
                    >
                      <PlusSquare className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
