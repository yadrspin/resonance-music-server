import React, { useRef, useEffect } from 'react';
import {
  ListMusic,
  Play,
  Shuffle,
  Download,
  Trash2,
  Edit2,
  ArrowUp,
  ArrowDown,
  X,
  Clock,
  Music2,
  PlusCircle
} from 'lucide-react';
import { Playlist, Track } from '../types/music.js';
import { formatDuration, formatBytes, getFormatBadgeClasses } from '../utils/formatters.js';

interface PlaylistViewProps {
  playlist: Playlist;
  currentTrackId: string | null;
  isPlaying: boolean;
  onPlayPlaylist: (startIndex?: number) => void;
  onShufflePlaylist: () => void;
  onPlayTrack: (track: Track, tracks: Track[], index: number) => void;
  onRemoveTrack: (trackIndex: number) => void;
  onReorderTrack: (fromIndex: number, toIndex: number) => void;
  onEditDetails: () => void;
  onDeletePlaylist: () => void;
  onExportM3U8: () => void;
  onOpenFolderBrowser: () => void;
}

export const PlaylistView: React.FC<PlaylistViewProps> = ({
  playlist,
  currentTrackId,
  isPlaying,
  onPlayPlaylist,
  onShufflePlaylist,
  onPlayTrack,
  onRemoveTrack,
  onReorderTrack,
  onEditDetails,
  onDeletePlaylist,
  onExportM3U8,
  onOpenFolderBrowser
}) => {
  const currentTrackRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (currentTrackRef.current) {
      currentTrackRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentTrackId]);
  const totalDuration = playlist.tracks.reduce((acc, t) => acc + (t.duration || 0), 0);
  const totalSize = playlist.tracks.reduce((acc, t) => acc + (t.size || 0), 0);

  return (
    <div className="space-y-6">
      {/* Playlist Header */}
      <div className="p-6 bg-gradient-to-r from-zinc-900 to-zinc-900/60 rounded-xl border border-zinc-800/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 shadow-md">
            <ListMusic className="w-10 h-10" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Custom Playlist
              </span>
              <span className="text-xs text-zinc-500">
                Created {new Date(playlist.createdAt).toLocaleDateString()}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight mt-1">
              {playlist.name}
            </h1>
            {playlist.description && (
              <p className="text-xs text-zinc-400 mt-1 max-w-xl">
                {playlist.description}
              </p>
            )}
            <div className="flex items-center gap-3 text-xs text-zinc-500 mt-2 font-mono">
              <span>{playlist.tracks.length} tracks</span>
              <span>•</span>
              <span>{formatDuration(totalDuration)} total runtime</span>
              <span>•</span>
              <span>{formatBytes(totalSize)}</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 self-stretch md:self-center">
          {playlist.tracks.length > 0 && (
            <>
              <button
                onClick={() => onPlayPlaylist(0)}
                className="h-9 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center gap-2 transition-colors shadow-sm"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Play All</span>
              </button>
              <button
                onClick={onShufflePlaylist}
                className="h-9 px-3.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium flex items-center gap-1.5 transition-colors border border-zinc-700/60"
              >
                <Shuffle className="w-3.5 h-3.5" />
                <span>Shuffle</span>
              </button>
            </>
          )}

          <button
            onClick={onExportM3U8}
            className="h-9 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors border border-zinc-700/60"
            title="Download .m3u8 playlist file"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export M3U8</span>
          </button>

          <button
            onClick={onEditDetails}
            className="h-9 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 text-xs font-medium flex items-center gap-1.5 transition-colors border border-zinc-700/60"
            title="Edit playlist name or description"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onDeletePlaylist}
            className="h-9 px-3 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 text-rose-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
            title="Delete this playlist"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Playlist Tracks List */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
            <Music2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Playlist Tracks ({playlist.tracks.length})</span>
          </h2>
          <button
            onClick={onOpenFolderBrowser}
            className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Add more from folders</span>
          </button>
        </div>

        {playlist.tracks.length === 0 ? (
          <div className="p-10 text-center bg-zinc-900/30 rounded-xl border border-dashed border-zinc-800 space-y-3">
            <ListMusic className="w-10 h-10 text-zinc-600 mx-auto" />
            <div>
              <p className="text-sm font-semibold text-zinc-300">This playlist is currently empty</p>
              <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                Browse your native music folders and click "Add to Playlist" on any track or entire folder.
              </p>
            </div>
            <button
              onClick={onOpenFolderBrowser}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-2 transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Browse Music Folders</span>
            </button>
          </div>
        ) : (
          <div className="border border-zinc-800/80 rounded-xl overflow-hidden bg-zinc-900/40 divide-y divide-zinc-800/60">
            {/* Header */}
            <div className="grid grid-cols-12 gap-3 px-4 py-2.5 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider bg-zinc-950/60 select-none">
              <div className="col-span-1 text-center">#</div>
              <div className="col-span-5 sm:col-span-5">Title & Artist</div>
              <div className="hidden sm:block col-span-3">Native Folder Path</div>
              <div className="col-span-3 sm:col-span-2 text-right">Format / Order</div>
              <div className="col-span-3 sm:col-span-1 text-right flex justify-end items-center">
                <Clock className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Track rows */}
            {playlist.tracks.map((track, idx) => {
              const isCurrent = currentTrackId === track.id;
              const formatStyle = getFormatBadgeClasses(track.format);

              return (
                <div
                  key={`${track.id}-${idx}`}
                  ref={isCurrent ? currentTrackRef : undefined}
                  className={`grid grid-cols-12 gap-3 px-4 py-3 items-center hover:bg-zinc-800/50 transition-colors group ${
                    isCurrent ? 'bg-emerald-500/15 text-emerald-300 border-l-2 border-emerald-400 font-medium shadow-sm' : 'text-zinc-300'
                  }`}
                >
                  {/* Track number / play button */}
                  <div className="col-span-1 text-center flex items-center justify-center">
                    <button
                      onClick={() => onPlayTrack(track, playlist.tracks, idx)}
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
                            {idx + 1}
                          </span>
                          <Play className="w-3.5 h-3.5 fill-current hidden group-hover:block ml-0.5" />
                        </>
                      )}
                    </button>
                  </div>

                  {/* Title & Artist */}
                  <div className="col-span-5 sm:col-span-5 min-w-0 pr-2">
                    <div className="text-sm font-semibold truncate text-zinc-200 group-hover:text-white">
                      {track.title || track.filename}
                    </div>
                    <div className="text-xs text-zinc-500 truncate flex items-center gap-1.5 mt-0.5">
                      <span>{track.artist}</span>
                      <span className="text-zinc-700">•</span>
                      <span className="font-mono text-[11px] text-zinc-500 truncate">{track.filename}</span>
                    </div>
                  </div>

                  {/* Folder path */}
                  <div className="hidden sm:block col-span-3 min-w-0 text-xs text-zinc-400 font-mono truncate" title={track.path}>
                    {track.path}
                  </div>

                  {/* Reorder Up/Down Controls & Format */}
                  <div className="col-span-3 sm:col-span-2 text-right flex items-center justify-end gap-1.5">
                    <span className={`text-[10px] font-mono font-bold uppercase px-1.5 py-0.2 rounded border ${formatStyle.bg} ${formatStyle.text} ${formatStyle.border}`}>
                      {track.format}
                    </span>

                    {/* Move Up */}
                    <button
                      onClick={() => onReorderTrack(idx, idx - 1)}
                      disabled={idx === 0}
                      className="p-1 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 rounded disabled:opacity-20 transition-colors"
                      title="Move up in playlist"
                      aria-label="Move up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>

                    {/* Move Down */}
                    <button
                      onClick={() => onReorderTrack(idx, idx + 1)}
                      disabled={idx === playlist.tracks.length - 1}
                      className="p-1 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 rounded disabled:opacity-20 transition-colors"
                      title="Move down in playlist"
                      aria-label="Move down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Duration & Remove Track */}
                  <div className="col-span-3 sm:col-span-1 text-right flex items-center justify-end gap-2">
                    <span className="text-xs font-mono text-zinc-400">
                      {formatDuration(track.duration)}
                    </span>
                    <button
                      onClick={() => onRemoveTrack(idx)}
                      className="p-1 text-zinc-600 hover:text-rose-400 hover:bg-rose-950/40 rounded transition-colors"
                      title="Remove from playlist"
                      aria-label="Remove from playlist"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
