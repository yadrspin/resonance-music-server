import React, { useRef, useState } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  VolumeX,
  ListMusic,
  PlusSquare,
  Radio,
  Music2,
  Zap
} from 'lucide-react';
import { Track, RepeatMode } from '../types/music.js';
import { formatDuration, getFormatBadgeClasses } from '../utils/formatters.js';

interface AudioPlayerBarProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isShuffle: boolean;
  repeatMode: RepeatMode;
  bufferedRanges: { start: number; end: number }[];
  isBuffering: boolean;
  queueLength: number;
  onTogglePlay: () => void;
  onSeekTo: (seconds: number) => void;
  onPlayNext: () => void;
  onPlayPrevious: () => void;
  onSetVolume: (vol: number) => void;
  onToggleMute: () => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
  onToggleQueueDrawer: () => void;
  onAddCurrentToPlaylist: () => void;
  onNavigateToFolder: (folderPath: string) => void;
}

export const AudioPlayerBar: React.FC<AudioPlayerBarProps> = ({
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  isShuffle,
  repeatMode,
  bufferedRanges,
  isBuffering,
  queueLength,
  onTogglePlay,
  onSeekTo,
  onPlayNext,
  onPlayPrevious,
  onSetVolume,
  onToggleMute,
  onToggleShuffle,
  onToggleRepeat,
  onToggleQueueDrawer,
  onAddCurrentToPlaylist,
  onNavigateToFolder
}) => {
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubTime, setScrubTime] = useState<number | null>(null);

  const activeDuration = duration > 0 ? duration : currentTrack?.duration || 180;
  const displayTime = isScrubbing && scrubTime !== null ? scrubTime : currentTime;
  const progressPercent = Math.min(100, Math.max(0, (displayTime / activeDuration) * 100));

  const formatStyle = currentTrack ? getFormatBadgeClasses(currentTrack.format) : null;

  const handleSeekClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const fraction = Math.max(0, Math.min(1, clickX / rect.width));
    const targetSeconds = fraction * activeDuration;
    onSeekTo(targetSeconds);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsScrubbing(true);
    handleSeekClick(e);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!progressBarRef.current) return;
      const rect = progressBarRef.current.getBoundingClientRect();
      const moveX = moveEvent.clientX - rect.left;
      const fraction = Math.max(0, Math.min(1, moveX / rect.width));
      setScrubTime(fraction * activeDuration);
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      if (progressBarRef.current) {
        const rect = progressBarRef.current.getBoundingClientRect();
        const moveX = upEvent.clientX - rect.left;
        const fraction = Math.max(0, Math.min(1, moveX / rect.width));
        onSeekTo(fraction * activeDuration);
      }
      setIsScrubbing(false);
      setScrubTime(null);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <footer aria-label="Persistent Audio Player" className="fixed bottom-0 left-0 right-0 h-22 bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800/90 z-40 px-4 sm:px-6 flex items-center justify-between gap-4 select-none">
      {/* 1. Track Info (Left) */}
      <div className="w-1/4 min-w-[200px] flex items-center gap-3">
        {currentTrack ? (
          <>
            <div className="w-13 h-13 rounded-lg bg-zinc-900 border border-zinc-800 overflow-hidden relative shrink-0 shadow-md">
              <img
                src={`/api/cover?path=${encodeURIComponent(currentTrack.path)}`}
                alt={currentTrack.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <Music2 className="w-6 h-6 text-zinc-600 absolute inset-0 m-auto pointer-events-none" />
            </div>

            <div className="min-w-0 pr-2">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-white truncate">
                  {currentTrack.title || currentTrack.filename}
                </span>
                {formatStyle && (
                  <span className={`text-[9px] font-mono font-bold uppercase px-1 py-0.2 rounded border shrink-0 ${formatStyle.bg} ${formatStyle.text} ${formatStyle.border}`}>
                    {currentTrack.format}
                  </span>
                )}
              </div>
              <div className="text-xs text-zinc-400 truncate mt-0.5">
                {currentTrack.artist}
              </div>
              <button
                onClick={() => onNavigateToFolder(currentTrack.directory)}
                className="text-[10px] text-zinc-500 hover:text-emerald-400 font-mono truncate block text-left transition-colors"
                title={`Open folder: ${currentTrack.directory || 'Root'}`}
              >
                📁 {currentTrack.directory || '/ (Root)'}
              </button>
            </div>

            <button
              onClick={onAddCurrentToPlaylist}
              className="p-1.5 text-zinc-500 hover:text-emerald-400 rounded transition-colors shrink-0 hidden lg:block"
              title="Add current track to playlist"
              aria-label="Add current track to playlist"
            >
              <PlusSquare className="w-4 h-4" />
            </button>
          </>
        ) : (
          <div className="flex items-center gap-3 text-zinc-500 text-xs">
            <div className="w-12 h-12 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              <Music2 className="w-5 h-5 text-zinc-700" />
            </div>
            <span>No track playing. Pick a folder or track.</span>
          </div>
        )}
      </div>

      {/* 2. Central Player Controls & Range Progress Bar */}
      <div className="flex-1 max-w-2xl flex flex-col items-center justify-center gap-1.5">
        {/* Buttons */}
        <div className="flex items-center gap-4">
          {/* Shuffle */}
          <button
            onClick={onToggleShuffle}
            className={`p-1.5 rounded transition-colors relative ${
              isShuffle ? 'text-emerald-400' : 'text-zinc-500 hover:text-zinc-300'
            }`}
            title={isShuffle ? 'Shuffle enabled' : 'Shuffle disabled'}
            aria-label="Toggle shuffle"
          >
            <Shuffle className="w-4 h-4" />
            {isShuffle && <span className="w-1 h-1 bg-emerald-400 rounded-full absolute bottom-0.5 left-1/2 -translate-x-1/2" />}
          </button>

          {/* Previous Track */}
          <button
            onClick={onPlayPrevious}
            disabled={!currentTrack}
            className="p-2 text-zinc-300 hover:text-white disabled:opacity-30 transition-colors"
            title="Previous Track"
            aria-label="Previous track"
          >
            <SkipBack className="w-4 h-4 fill-current" />
          </button>

          {/* Play/Pause */}
          <button
            onClick={onTogglePlay}
            disabled={!currentTrack && queueLength === 0}
            className="w-10 h-10 rounded-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-30 text-zinc-950 flex items-center justify-center shadow-lg hover:scale-105 transition-all"
            title={isPlaying ? 'Pause' : 'Play'}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>

          {/* Next Track */}
          <button
            onClick={onPlayNext}
            disabled={!currentTrack}
            className="p-2 text-zinc-300 hover:text-white disabled:opacity-30 transition-colors"
            title="Next Track"
            aria-label="Next track"
          >
            <SkipForward className="w-4 h-4 fill-current" />
          </button>

          {/* Repeat */}
          <button
            onClick={onToggleRepeat}
            className={`p-1.5 rounded transition-colors relative ${
              repeatMode !== 'off' ? 'text-emerald-400' : 'text-zinc-500 hover:text-zinc-300'
            }`}
            title={`Repeat: ${repeatMode}`}
            aria-label={`Toggle repeat: ${repeatMode}`}
          >
            {repeatMode === 'one' ? (
              <Repeat1 className="w-4 h-4" />
            ) : (
              <Repeat className="w-4 h-4" />
            )}
            {repeatMode !== 'off' && <span className="w-1 h-1 bg-emerald-400 rounded-full absolute bottom-0.5 left-1/2 -translate-x-1/2" />}
          </button>
        </div>

        {/* Seek Bar with Buffered 206 Partial Content visualizer */}
        <div className="w-full flex items-center gap-3">
          <span className="text-[11px] font-mono text-zinc-400 w-10 text-right">
            {formatDuration(displayTime)}
          </span>

          <div
            ref={progressBarRef}
            onMouseDown={handleMouseDown}
            className="relative flex-1 h-2 bg-zinc-800 rounded-full cursor-pointer group py-1"
          >
            <div className="absolute inset-0 rounded-full overflow-hidden">
              {/* Buffered Ranges (HTTP 206 Partial Content proof) */}
              {bufferedRanges.map((range, idx) => {
                const bStartPct = (range.start / activeDuration) * 100;
                const bWidthPct = ((range.end - range.start) / activeDuration) * 100;
                return (
                  <div
                    key={idx}
                    className="absolute top-0 bottom-0 bg-zinc-700/60"
                    style={{ left: `${bStartPct}%`, width: `${bWidthPct}%` }}
                    title={`HTTP 206 Buffered: ${Math.round(range.start)}s - ${Math.round(range.end)}s`}
                  />
                );
              })}

              {/* Played Progress Bar */}
              <div
                className="absolute top-0 bottom-0 left-0 bg-emerald-500 group-hover:bg-emerald-400 transition-colors"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Scrubber thumb */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-md scale-0 group-hover:scale-100 transition-transform -ml-1.5 pointer-events-none"
              style={{ left: `${progressPercent}%` }}
            />
          </div>

          <span className="text-[11px] font-mono text-zinc-400 w-10 text-left">
            {formatDuration(activeDuration)}
          </span>
        </div>
      </div>

      {/* 3. Audio Diagnostics, Volume & Queue (Right) */}
      <div className="w-1/4 min-w-[200px] flex items-center justify-end gap-3">
        {/* HTTP 206 Streaming Indicator */}
        <div
          className="hidden xl:flex items-center gap-1.5 px-2 py-1 rounded-md bg-zinc-900 border border-zinc-800/80 text-[10px] font-mono text-emerald-400"
          title="Instant audio seeking active via HTTP 206 Partial Content range requests"
        >
          <Zap className="w-3 h-3 text-emerald-400" />
          <span>HTTP 206</span>
        </div>

        {/* Volume Slider */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleMute}
            className="text-zinc-400 hover:text-white transition-colors"
            title={isMuted ? 'Unmute' : 'Mute'}
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={isMuted ? 0 : volume}
            onChange={(e) => onSetVolume(parseFloat(e.target.value))}
            className="w-18 sm:w-24 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            title={`Volume: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
            aria-label="Volume slider"
          />
        </div>

        {/* Playback Queue Drawer Toggle */}
        <button
          onClick={onToggleQueueDrawer}
          className="relative p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-colors flex items-center gap-1.5"
          title="Toggle Playback Queue"
          aria-label="Toggle playback queue"
        >
          <ListMusic className="w-4 h-4 text-emerald-400" />
          {queueLength > 0 && (
            <span className="text-[10px] font-mono font-bold text-zinc-200">
              {queueLength}
            </span>
          )}
        </button>
      </div>
    </footer>
  );
};
