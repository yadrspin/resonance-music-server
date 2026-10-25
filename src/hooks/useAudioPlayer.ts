import { useState, useEffect, useRef, useCallback } from 'react';
import { Track, RepeatMode } from '../types/music.js';

const STORAGE_QUEUE_KEY = 'resonance_queue_v1';
const STORAGE_INDEX_KEY = 'resonance_queue_index_v1';
const STORAGE_VOLUME_KEY = 'resonance_volume_v1';

export function useAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [queue, setQueue] = useState<Track[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_QUEUE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [currentIndex, setCurrentIndex] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_INDEX_KEY);
      return saved ? parseInt(saved, 10) : -1;
    } catch {
      return -1;
    }
  });

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolumeState] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_VOLUME_KEY);
      return saved ? parseFloat(saved) : 0.85;
    } catch {
      return 0.85;
    }
  });
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');
  const [bufferedTime, setBufferedTime] = useState<number>(0);
  const [bufferedRanges, setBufferedRanges] = useState<{ start: number; end: number }[]>([]);
  const [isBuffering, setIsBuffering] = useState<boolean>(false);

  const currentTrack = currentIndex >= 0 && currentIndex < queue.length ? queue[currentIndex] : null;

  // Persist queue & index
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_QUEUE_KEY, JSON.stringify(queue));
    } catch {
      // Ignore
    }
  }, [queue]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_INDEX_KEY, currentIndex.toString());
    } catch {
      // Ignore
    }
  }, [currentIndex]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_VOLUME_KEY, volume.toString());
    } catch {
      // Ignore
    }
  }, [volume]);

  // Initialize Audio element once
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'metadata';
    audio.volume = volume;
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      updateBufferedRanges(audio);
    };

    const handleDurationChange = () => {
      if (!isNaN(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
    };

    const handleLoadedMetadata = () => {
      if (!isNaN(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
      setIsBuffering(false);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleWaiting = () => setIsBuffering(true);
    const handlePlaying = () => setIsBuffering(false);

    const handleEnded = () => {
      handleTrackEnd();
    };

    const handleError = () => {
      console.error('Audio stream playback error:', audio.error);
      setIsBuffering(false);
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, []);

  const updateBufferedRanges = (audio: HTMLAudioElement) => {
    const ranges: { start: number; end: number }[] = [];
    let maxBuffered = 0;
    for (let i = 0; i < audio.buffered.length; i++) {
      const start = audio.buffered.start(i);
      const end = audio.buffered.end(i);
      ranges.push({ start, end });
      if (end > maxBuffered) maxBuffered = end;
    }
    setBufferedRanges(ranges);
    setBufferedTime(maxBuffered);
  };

  // Play a specific track URL
  const loadAndPlay = useCallback((track: Track) => {
    const audio = audioRef.current;
    if (!audio) return;

    // Stream URL with path parameter
    const streamUrl = `/api/stream?path=${encodeURIComponent(track.path)}`;
    audio.src = streamUrl;
    audio.load();

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.warn('Playback autoplay was prevented or interrupted:', err);
      });
    }

    // Media Session API integration
    if ('mediaSession' in navigator) {
      const coverUrl = `/api/cover?path=${encodeURIComponent(track.path)}`;
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title || track.filename,
        artist: track.artist || 'Unknown Artist',
        album: track.album || track.directory || 'Resonance',
        artwork: [
          { src: coverUrl, sizes: '96x96', type: 'image/jpeg' },
          { src: coverUrl, sizes: '256x256', type: 'image/jpeg' },
          { src: coverUrl, sizes: '512x512', type: 'image/jpeg' }
        ]
      });

      navigator.mediaSession.setActionHandler('play', () => audio.play());
      navigator.mediaSession.setActionHandler('pause', () => audio.pause());
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime != null) {
          audio.currentTime = details.seekTime;
        }
      });
    }
  }, []);

  // Update Media Session handlers for next/prev
  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('previoustrack', () => playPrevious());
      navigator.mediaSession.setActionHandler('nexttrack', () => playNext());
    }
  });

  // Track ended logic
  const handleTrackEnd = () => {
    if (repeatMode === 'one') {
      const audio = audioRef.current;
      if (audio) {
        audio.currentTime = 0;
        audio.play();
      }
      return;
    }

    playNext();
  };

  const playNext = useCallback(() => {
    if (queue.length === 0) return;

    if (isShuffle) {
      const randomIndex = Math.floor(Math.random() * queue.length);
      setCurrentIndex(randomIndex);
      loadAndPlay(queue[randomIndex]);
      return;
    }

    if (currentIndex + 1 < queue.length) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      loadAndPlay(queue[nextIdx]);
    } else if (repeatMode === 'all') {
      setCurrentIndex(0);
      loadAndPlay(queue[0]);
    } else {
      setIsPlaying(false);
    }
  }, [queue, currentIndex, isShuffle, repeatMode, loadAndPlay]);

  const playPrevious = useCallback(() => {
    const audio = audioRef.current;
    if (audio && audio.currentTime > 3) {
      // If played more than 3 seconds, restart track
      audio.currentTime = 0;
      return;
    }

    if (queue.length === 0) return;

    if (currentIndex - 1 >= 0) {
      const prevIdx = currentIndex - 1;
      setCurrentIndex(prevIdx);
      loadAndPlay(queue[prevIdx]);
    } else if (repeatMode === 'all') {
      const lastIdx = queue.length - 1;
      setCurrentIndex(lastIdx);
      loadAndPlay(queue[lastIdx]);
    }
  }, [queue, currentIndex, repeatMode, loadAndPlay]);

  const playTrack = useCallback((track: Track, newQueue?: Track[], startIndex?: number) => {
    if (newQueue) {
      setQueue(newQueue);
      const targetIdx = startIndex !== undefined ? startIndex : newQueue.findIndex(t => t.id === track.id);
      const safeIdx = targetIdx >= 0 ? targetIdx : 0;
      setCurrentIndex(safeIdx);
      loadAndPlay(newQueue[safeIdx]);
    } else {
      // Check if already in queue
      const existingIdx = queue.findIndex(t => t.id === track.id);
      if (existingIdx !== -1) {
        setCurrentIndex(existingIdx);
        loadAndPlay(queue[existingIdx]);
      } else {
        const nextQueue = [...queue, track];
        setQueue(nextQueue);
        setCurrentIndex(nextQueue.length - 1);
        loadAndPlay(track);
      }
    }
  }, [queue, loadAndPlay]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      if (audio.src) {
        audio.play().catch(console.warn);
      } else if (currentTrack) {
        loadAndPlay(currentTrack);
      } else if (queue.length > 0) {
        setCurrentIndex(0);
        loadAndPlay(queue[0]);
      }
    } else {
      audio.pause();
    }
  }, [currentTrack, queue, loadAndPlay]);

  const seekTo = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const clamped = Math.max(0, Math.min(seconds, audio.duration || duration || seconds));
    audio.currentTime = clamped;
    setCurrentTime(clamped);
  }, [duration]);

  const setVolume = useCallback((newVol: number) => {
    const audio = audioRef.current;
    const clamped = Math.max(0, Math.min(1, newVol));
    setVolumeState(clamped);
    if (audio) {
      audio.volume = clamped;
    }
    if (clamped > 0 && isMuted) {
      setIsMuted(false);
      if (audio) audio.muted = false;
    }
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    audio.muted = nextMuted;
  }, [isMuted]);

  const toggleShuffle = useCallback(() => {
    setIsShuffle(prev => !prev);
  }, []);

  const toggleRepeatMode = useCallback(() => {
    setRepeatMode(prev => {
      if (prev === 'off') return 'all';
      if (prev === 'all') return 'one';
      return 'off';
    });
  }, []);

  const addToQueue = useCallback((tracks: Track | Track[], immediatelyNext = false) => {
    const trackList = Array.isArray(tracks) ? tracks : [tracks];
    if (trackList.length === 0) return;

    setQueue(prevQueue => {
      if (immediatelyNext && currentIndex >= 0) {
        const newQueue = [...prevQueue];
        newQueue.splice(currentIndex + 1, 0, ...trackList);
        return newQueue;
      }
      return [...prevQueue, ...trackList];
    });
  }, [currentIndex]);

  const removeFromQueue = useCallback((indexToRemove: number) => {
    setQueue(prev => {
      const next = prev.filter((_, idx) => idx !== indexToRemove);
      if (indexToRemove < currentIndex) {
        setCurrentIndex(c => c - 1);
      } else if (indexToRemove === currentIndex) {
        if (next.length === 0) {
          setCurrentIndex(-1);
          if (audioRef.current) audioRef.current.src = '';
        } else {
          const nextIdx = Math.min(currentIndex, next.length - 1);
          setCurrentIndex(nextIdx);
          loadAndPlay(next[nextIdx]);
        }
      }
      return next;
    });
  }, [currentIndex, loadAndPlay]);

  const reorderQueue = useCallback((fromIndex: number, toIndex: number) => {
    setQueue(prev => {
      if (fromIndex < 0 || fromIndex >= prev.length || toIndex < 0 || toIndex >= prev.length) {
        return prev;
      }
      const updated = [...prev];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);

      // Adjust currentIndex if necessary
      if (currentIndex === fromIndex) {
        setCurrentIndex(toIndex);
      } else if (currentIndex > fromIndex && currentIndex <= toIndex) {
        setCurrentIndex(c => c - 1);
      } else if (currentIndex < fromIndex && currentIndex >= toIndex) {
        setCurrentIndex(c => c + 1);
      }

      return updated;
    });
  }, [currentIndex]);

  const clearQueue = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.src = '';
    }
    setQueue([]);
    setCurrentIndex(-1);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, []);

  return {
    currentTrack,
    queue,
    currentIndex,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isShuffle,
    repeatMode,
    bufferedTime,
    bufferedRanges,
    isBuffering,
    playTrack,
    togglePlay,
    seekTo,
    playNext,
    playPrevious,
    setVolume,
    toggleMute,
    toggleShuffle,
    toggleRepeatMode,
    addToQueue,
    removeFromQueue,
    reorderQueue,
    clearQueue,
  };
}
