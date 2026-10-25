import React from 'react';
import {
  X,
  Trash2,
  BookmarkPlus,
  Play,
  ArrowUp,
  ArrowDown,
  Music2,
  ListMusic
} from 'lucide-react';
import { Track } from '../types/music.js';
import { formatDuration, getFormatBadgeClasses } from '../utils/formatters.js';

interface QueueDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  queue: Track[];
  currentIndex: number;
  isPlaying: boolean;
  onPlayQueueIndex: (index: number) => void;
  onRemoveIndex: (index: number) => void;
  onReorderIndex: (fromIndex: number, toIndex: number) => void;
  onClearQueue: () => void;
  onSaveAsPlaylist: () => void;
}

export const QueueDrawer: React.FC<QueueDrawerProps> = ({
  isOpen,
  onClose,
  queue,
  currentIndex,
  isPlaying,
  onPlayQueueIndex,
  onRemoveIndex,
  onReorderIndex,
  onClearQueue,
  onSaveAsPlaylist
}) => {
  if (!isOpen) return null;

  return (
    <aside aria-label="Playback Queue" className="fixed right-0 top-16 bottom-22 w-full sm:w-96 bg-zinc-950/95 backdrop-blur-xl border-l border-zinc-800/90 z-50 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
      {/* Drawer Header */}
      <div className="p-4 border-b border-zinc-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ListMusic className="w-4 h-4 text-emerald-400" />
          <h2 className="text-sm font-bold text-white">Playback Queue</h2>
          <span className="text-xs font-mono text-zinc-500">({queue.length})</span>
        </div>
        <div className="flex items-center gap-1">
          {queue.length > 0 && (
            <>
              <button
                onClick={onSaveAsPlaylist}
                className="p-1.5 text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800 rounded transition-colors"
                title="Save current queue as a new playlist"
                aria-label="Save queue as playlist"
              >
                <BookmarkPlus className="w-4 h-4" />
              </button>
              <button
                onClick={onClearQueue}
                className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 rounded transition-colors"
                title="Clear all tracks from queue"
                aria-label="Clear queue"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors ml-1"
            title="Close queue"
            aria-label="Close queue"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Queue Items */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {queue.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 text-xs">
            <Music2 className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p>Your queue is empty.</p>
            <p className="text-[11px] text-zinc-600 mt-1">
              Select tracks or click "Play All" on a folder to populate the queue.
            </p>
          </div>
        ) : (
          queue.map((track, idx) => {
            const isCurrent = idx === currentIndex;
            const formatStyle = getFormatBadgeClasses(track.format);

            return (
              <div
                key={`${track.id}-${idx}`}
                className={`p-2.5 rounded-lg border transition-all flex items-center justify-between gap-2.5 group ${
                  isCurrent
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-white'
                    : 'bg-zinc-900/60 hover:bg-zinc-900 border-zinc-800/80 text-zinc-300'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <button
                    onClick={() => onPlayQueueIndex(idx)}
                    className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:bg-emerald-500 group-hover:text-zinc-950 transition-all shrink-0"
                    title="Play this track"
                    aria-label={`Play ${track.title}`}
                  >
                    {isCurrent && isPlaying ? (
                      <div className="flex items-center gap-0.5">
                        <span className="w-1 h-2.5 bg-emerald-400 animate-pulse rounded-full" />
                        <span className="w-1 h-3.5 bg-emerald-400 animate-pulse delay-75 rounded-full" />
                      </div>
                    ) : (
                      <Play className="w-3 h-3 fill-current ml-0.5" />
                    )}
                  </button>

                  <div className="min-w-0">
                    <div className="text-xs font-semibold truncate">
                      {track.title || track.filename}
                    </div>
                    <div className="text-[11px] text-zinc-400 truncate flex items-center gap-1.5 mt-0.5">
                      <span>{track.artist}</span>
                      <span>•</span>
                      <span className={`text-[9px] font-mono uppercase px-1 py-0.2 rounded border ${formatStyle.bg} ${formatStyle.text} ${formatStyle.border}`}>
                        {track.format}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-[11px] font-mono text-zinc-400 mr-1">
                    {formatDuration(track.duration)}
                  </span>

                  {/* Reorder Up/Down */}
                  <button
                    onClick={() => onReorderIndex(idx, idx - 1)}
                    disabled={idx === 0}
                    className="p-1 text-zinc-500 hover:text-zinc-300 rounded disabled:opacity-20 transition-colors"
                    title="Move up"
                    aria-label="Move up"
                  >
                    <ArrowUp className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => onReorderIndex(idx, idx + 1)}
                    disabled={idx === queue.length - 1}
                    className="p-1 text-zinc-500 hover:text-zinc-300 rounded disabled:opacity-20 transition-colors"
                    title="Move down"
                    aria-label="Move down"
                  >
                    <ArrowDown className="w-3 h-3" />
                  </button>

                  {/* Remove */}
                  <button
                    onClick={() => onRemoveIndex(idx)}
                    className="p-1 text-zinc-500 hover:text-rose-400 rounded transition-colors"
                    title="Remove from queue"
                    aria-label="Remove from queue"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
