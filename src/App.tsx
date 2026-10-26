import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar.js';
import { Breadcrumbs } from './components/Breadcrumbs.js';
import { FolderTreeSidebar } from './components/FolderTreeSidebar.js';
import { FolderBrowser } from './components/FolderBrowser.js';
import { PlaylistView } from './components/PlaylistView.js';
import { AudioPlayerBar } from './components/AudioPlayerBar.js';
import { QueueDrawer } from './components/QueueDrawer.js';
import { PlaylistModal } from './components/PlaylistModal.js';
import { AddToPlaylistModal } from './components/AddToPlaylistModal.js';
import { CreateFolderModal } from './components/CreateFolderModal.js';
import { DockerGuideModal } from './components/DockerGuideModal.js';
import { useAudioPlayer } from './hooks/useAudioPlayer.js';
import { DirectoryListing, Playlist, SystemStats, Track } from './types/music.js';
import { RefreshCw } from 'lucide-react';

const STORAGE_PATH_KEY = 'resonance_current_path_v1';
const STORAGE_SELECTED_PLAYLIST_KEY = 'resonance_selected_playlist_v1';

export default function App() {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_PATH_KEY) || '';
    } catch {
      return '';
    }
  });
  const [directoryListing, setDirectoryListing] = useState<DirectoryListing | null>(null);
  const [isLoadingDir, setIsLoadingDir] = useState<boolean>(true);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_SELECTED_PLAYLIST_KEY) || null;
    } catch {
      return null;
    }
  });
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [rootFolders, setRootFolders] = useState<string[]>([]);
  const [isRescanning, setIsRescanning] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // Modals state
  const [isDockerGuideOpen, setIsDockerGuideOpen] = useState<boolean>(false);
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState<boolean>(false);
  const [isQueueDrawerOpen, setIsQueueDrawerOpen] = useState<boolean>(false);

  const [playlistModalState, setPlaylistModalState] = useState<{
    isOpen: boolean;
    mode: 'create' | 'edit' | 'import';
    initialName?: string;
    initialDescription?: string;
  }>({ isOpen: false, mode: 'create' });

  const [addToPlaylistState, setAddToPlaylistState] = useState<{
    isOpen: boolean;
    targetTrack?: Track | null;
    targetFolderPath?: string | null;
  }>({ isOpen: false });

  // Audio Player Hook
  const {
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
    clearQueue
  } = useAudioPlayer();

  // Load playlists
  const fetchPlaylists = useCallback(async () => {
    try {
      const res = await fetch('/api/playlists');
      if (res.ok) {
        const data = await res.json();
        setPlaylists(data);
      }
    } catch (err) {
      console.error('Error fetching playlists:', err);
    }
  }, []);

  // Load system stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/system/stats');
      if (res.ok) {
        const data = await res.json();
        setSystemStats(data);
      }
    } catch (err) {
      console.error('Error fetching system stats:', err);
    }
  }, []);

  // Load directory listing
  const fetchDirectory = useCallback(async (path: string) => {
    setIsLoadingDir(true);
    try {
      const res = await fetch(`/api/browse?path=${encodeURIComponent(path)}`);
      if (res.ok) {
        const data: DirectoryListing = await res.json();
        setDirectoryListing(data);
      } else {
        console.error('Failed to load directory');
      }
    } catch (err) {
      console.error('Error fetching directory listing:', err);
    } finally {
      setIsLoadingDir(false);
    }
  }, []);

  // Load root folders for persistent sidebar navigation
  const fetchRootFolders = useCallback(async () => {
    try {
      const res = await fetch('/api/browse?path=');
      if (res.ok) {
        const data: DirectoryListing = await res.json();
        const folderNames = data.folders.map((f) => f.name);
        setRootFolders(folderNames);
      }
    } catch (err) {
      console.error('Error fetching root folders:', err);
    }
  }, []);

  useEffect(() => {
    fetchPlaylists();
    fetchStats();
    fetchRootFolders();
  }, [fetchPlaylists, fetchStats, fetchRootFolders]);

  useEffect(() => {
    fetchDirectory(currentPath);
  }, [currentPath, fetchDirectory]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_PATH_KEY, currentPath);
    } catch {}
  }, [currentPath]);

  useEffect(() => {
    try {
      if (selectedPlaylistId) {
        localStorage.setItem(STORAGE_SELECTED_PLAYLIST_KEY, selectedPlaylistId);
      } else {
        localStorage.removeItem(STORAGE_SELECTED_PLAYLIST_KEY);
      }
    } catch {}
  }, [selectedPlaylistId]);

  // Navigate to folder path
  const handleNavigatePath = (path: string) => {
    setSelectedPlaylistId(null);
    setCurrentPath(path);
    setIsMobileSidebarOpen(false);
  };

  // Select playlist
  const handleSelectPlaylist = (id: string | null) => {
    setSelectedPlaylistId(id);
    setIsMobileSidebarOpen(false);
  };

  // Play entire current folder
  const handlePlayFolder = async (folderPath: string, shuffle = false) => {
    try {
      const res = await fetch(`/api/folder/all-tracks?path=${encodeURIComponent(folderPath)}`);
      if (res.ok) {
        const data = await res.json();
        const tracks: Track[] = data.tracks || [];
        if (tracks.length > 0) {
          if (shuffle) {
            const shuffled = [...tracks].sort(() => Math.random() - 0.5);
            playTrack(shuffled[0], shuffled, 0);
          } else {
            playTrack(tracks[0], tracks, 0);
          }
        }
      }
    } catch (err) {
      console.error('Error playing folder:', err);
    }
  };

  // Rescan library
  const handleRescan = async () => {
    setIsRescanning(true);
    try {
      const res = await fetch('/api/system/rescan', { method: 'POST' });
      if (res.ok) {
        await Promise.all([
          fetchDirectory(currentPath),
          fetchStats(),
          fetchRootFolders()
        ]);
      }
    } catch (err) {
      console.error('Error during library rescan:', err);
    } finally {
      setIsRescanning(false);
    }
  };

  // Create or Edit Playlist
  const handleCreateOrEditPlaylist = async (name: string, description: string) => {
    if (playlistModalState.mode === 'edit' && selectedPlaylistId) {
      const res = await fetch(`/api/playlists/${selectedPlaylistId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description })
      });
      if (res.ok) {
        await fetchPlaylists();
      }
    } else {
      const res = await fetch('/api/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description })
      });
      if (res.ok) {
        const newPl = await res.json();
        await fetchPlaylists();
        setSelectedPlaylistId(newPl.id);
      }
    }
  };

  // Import M3U playlist
  const handleImportM3U = async (name: string, content: string) => {
    const res = await fetch('/api/playlists/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, content })
    });
    if (res.ok) {
      const importedPl = await res.json();
      await fetchPlaylists();
      setSelectedPlaylistId(importedPl.id);
    }
  };

  // Delete playlist
  const handleDeletePlaylist = async (id: string) => {
    const ok = window.confirm('Are you sure you want to delete this playlist?');
    if (!ok) return;

    const res = await fetch(`/api/playlists/${id}`, { method: 'DELETE' });
    if (res.ok) {
      await fetchPlaylists();
      setSelectedPlaylistId(null);
    }
  };

  // Remove track from playlist
  const handleRemoveTrackFromPlaylist = async (playlistId: string, trackIndex: number) => {
    const res = await fetch(`/api/playlists/${playlistId}/tracks/${trackIndex}`, {
      method: 'DELETE'
    });
    if (res.ok) {
      await fetchPlaylists();
    }
  };

  // Reorder track in playlist
  const handleReorderPlaylistTrack = async (playlistId: string, fromIndex: number, toIndex: number) => {
    const res = await fetch(`/api/playlists/${playlistId}/reorder`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fromIndex, toIndex })
    });
    if (res.ok) {
      await fetchPlaylists();
    }
  };

  // Add track to playlist
  const handleAddTrackToPlaylist = async (playlistId: string, track: Track) => {
    await fetch(`/api/playlists/${playlistId}/tracks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tracks: [track] })
    });
    await fetchPlaylists();
  };

  // Add folder to playlist
  const handleAddFolderToPlaylist = async (playlistId: string, folderPath: string) => {
    await fetch(`/api/playlists/${playlistId}/tracks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folderPath })
    });
    await fetchPlaylists();
  };

  // Create new playlist & add track or folder
  const handleCreatePlaylistAndAdd = async (name: string, track?: Track | null, folderPath?: string | null) => {
    const res = await fetch('/api/playlists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    if (res.ok) {
      const newPl = await res.json();
      if (track) {
        await handleAddTrackToPlaylist(newPl.id, track);
      } else if (folderPath !== null && folderPath !== undefined) {
        await handleAddFolderToPlaylist(newPl.id, folderPath);
      }
      await fetchPlaylists();
    }
  };

  // Export Playlist M3U8
  const handleExportM3U8 = (id: string) => {
    window.location.href = `/api/playlists/${id}/export.m3u8`;
  };

  // Create Folder on disk
  const handleCreateFolder = async (parentPath: string, folderName: string) => {
    const res = await fetch('/api/folders/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parentPath, folderName })
    });
    if (res.ok) {
      await fetchDirectory(parentPath);
      await fetchStats();
    } else {
      const errData = await res.json();
      throw new Error(errData.error || 'Failed to create folder');
    }
  };

  // Save current queue as new playlist
  const handleSaveQueueAsPlaylist = async () => {
    if (queue.length === 0) return;
    const name = `Queue Archive (${new Date().toLocaleDateString()})`;
    const res = await fetch('/api/playlists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description: 'Saved from playback queue' })
    });
    if (res.ok) {
      const newPl = await res.json();
      await fetch(`/api/playlists/${newPl.id}/tracks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tracks: queue })
      });
      await fetchPlaylists();
      setIsQueueDrawerOpen(false);
      setSelectedPlaylistId(newPl.id);
    }
  };

  const selectedPlaylist = selectedPlaylistId
    ? playlists.find((p) => p.id === selectedPlaylistId) || null
    : null;

  const topFolders = rootFolders.length > 0
    ? rootFolders
    : (directoryListing?.folders.map((f) => f.name) || []);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* 1. Header / Navbar */}
      <Navbar
        currentPath={currentPath}
        onNavigatePath={handleNavigatePath}
        onPlayTrack={(track) => playTrack(track)}
        onRescan={handleRescan}
        isRescanning={isRescanning}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
      />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar (Hierarchy & Playlists) */}
        <FolderTreeSidebar
          currentPath={currentPath}
          selectedPlaylistId={selectedPlaylistId}
          playlists={playlists}
          topFolders={topFolders}
          systemStats={systemStats}
          onNavigatePath={handleNavigatePath}
          onSelectPlaylist={handleSelectPlaylist}
          onOpenCreatePlaylist={() =>
            setPlaylistModalState({ isOpen: true, mode: 'create' })
          }
          onOpenImportM3U={() =>
            setPlaylistModalState({ isOpen: true, mode: 'import' })
          }
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Center Main Stage */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-32">
          {selectedPlaylist ? (
            /* Playlist View */
            <PlaylistView
              playlist={selectedPlaylist}
              currentTrackId={currentTrack?.id || null}
              isPlaying={isPlaying}
              onPlayPlaylist={(startIndex = 0) => {
                if (selectedPlaylist.tracks.length > 0) {
                  playTrack(selectedPlaylist.tracks[startIndex], selectedPlaylist.tracks, startIndex);
                }
              }}
              onShufflePlaylist={() => {
                if (selectedPlaylist.tracks.length > 0) {
                  const shuffled = [...selectedPlaylist.tracks].sort(() => Math.random() - 0.5);
                  playTrack(shuffled[0], shuffled, 0);
                }
              }}
              onPlayTrack={(track, tracks, index) => playTrack(track, tracks, index)}
              onRemoveTrack={(trackIndex) =>
                handleRemoveTrackFromPlaylist(selectedPlaylist.id, trackIndex)
              }
              onReorderTrack={(fromIndex, toIndex) =>
                handleReorderPlaylistTrack(selectedPlaylist.id, fromIndex, toIndex)
              }
              onEditDetails={() =>
                setPlaylistModalState({
                  isOpen: true,
                  mode: 'edit',
                  initialName: selectedPlaylist.name,
                  initialDescription: selectedPlaylist.description
                })
              }
              onDeletePlaylist={() => handleDeletePlaylist(selectedPlaylist.id)}
              onExportM3U8={() => handleExportM3U8(selectedPlaylist.id)}
              onOpenFolderBrowser={() => setSelectedPlaylistId(null)}
            />
          ) : (
            /* Native Directory / Folder View */
            <div>
              {directoryListing && (
                <Breadcrumbs
                  breadcrumbs={directoryListing.breadcrumbs}
                  parentPath={directoryListing.parentPath}
                  onNavigate={handleNavigatePath}
                  onPlayCurrentFolder={() => handlePlayFolder(directoryListing.currentPath, false)}
                  onShuffleCurrentFolder={() => handlePlayFolder(directoryListing.currentPath, true)}
                  onAddFolderToPlaylist={() =>
                    setAddToPlaylistState({
                      isOpen: true,
                      targetFolderPath: directoryListing.currentPath
                    })
                  }
                  trackCount={directoryListing.totalTracks}
                />
              )}

              {isLoadingDir ? (
                <div className="flex items-center justify-center p-20 text-zinc-500 gap-3">
                  <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
                  <span className="text-sm">Reading directory structure...</span>
                </div>
              ) : directoryListing ? (
                <FolderBrowser
                  listing={directoryListing}
                  currentTrackId={currentTrack?.id || null}
                  isPlaying={isPlaying}
                  onNavigatePath={handleNavigatePath}
                  onPlayTrack={(track, folderTracks, index) =>
                    playTrack(track, folderTracks, index)
                  }
                  onPlayFolder={(folder) => handlePlayFolder(folder, false)}
                  onShuffleFolder={(folder) => handlePlayFolder(folder, true)}
                  onAddFolderToPlaylist={(folder) =>
                    setAddToPlaylistState({ isOpen: true, targetFolderPath: folder })
                  }
                  onAddTrackToQueue={(track, next) => addToQueue(track, next)}
                  onAddTrackToPlaylist={(track) =>
                    setAddToPlaylistState({ isOpen: true, targetTrack: track })
                  }
                />
              ) : (
                <div className="p-8 text-center text-zinc-500">
                  Folder could not be read or does not exist.
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* 3. Persistent Audio Player Bar */}
      <AudioPlayerBar
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        volume={volume}
        isMuted={isMuted}
        isShuffle={isShuffle}
        repeatMode={repeatMode}
        bufferedRanges={bufferedRanges}
        isBuffering={isBuffering}
        queueLength={queue.length}
        onTogglePlay={togglePlay}
        onSeekTo={seekTo}
        onPlayNext={playNext}
        onPlayPrevious={playPrevious}
        onSetVolume={setVolume}
        onToggleMute={toggleMute}
        onToggleShuffle={toggleShuffle}
        onToggleRepeat={toggleRepeatMode}
        onToggleQueueDrawer={() => setIsQueueDrawerOpen((prev) => !prev)}
        onAddCurrentToPlaylist={() => {
          if (currentTrack) {
            setAddToPlaylistState({ isOpen: true, targetTrack: currentTrack });
          }
        }}
        onNavigateToFolder={handleNavigatePath}
      />

      {/* 4. Queue Drawer */}
      <QueueDrawer
        isOpen={isQueueDrawerOpen}
        onClose={() => setIsQueueDrawerOpen(false)}
        queue={queue}
        currentIndex={currentIndex}
        isPlaying={isPlaying}
        onPlayQueueIndex={(index) => {
          if (queue[index]) {
            playTrack(queue[index], queue, index);
          }
        }}
        onRemoveIndex={removeFromQueue}
        onReorderIndex={reorderQueue}
        onClearQueue={clearQueue}
        onSaveAsPlaylist={handleSaveQueueAsPlaylist}
      />

      {/* 5. Playlist Create / Edit / Import Modal */}
      <PlaylistModal
        isOpen={playlistModalState.isOpen}
        mode={playlistModalState.mode}
        initialName={playlistModalState.initialName}
        initialDescription={playlistModalState.initialDescription}
        onClose={() => setPlaylistModalState((prev) => ({ ...prev, isOpen: false }))}
        onSubmitCreateOrEdit={handleCreateOrEditPlaylist}
        onSubmitImport={handleImportM3U}
      />

      {/* 6. Add Track or Folder to Playlist Modal */}
      <AddToPlaylistModal
        isOpen={addToPlaylistState.isOpen}
        onClose={() => setAddToPlaylistState({ isOpen: false })}
        playlists={playlists}
        targetTrack={addToPlaylistState.targetTrack}
        targetFolderPath={addToPlaylistState.targetFolderPath}
        onAddTrack={handleAddTrackToPlaylist}
        onAddFolder={handleAddFolderToPlaylist}
        onCreateAndAdd={handleCreatePlaylistAndAdd}
      />

      {/* 7. Create Folder Modal */}
      <CreateFolderModal
        isOpen={isCreateFolderOpen}
        parentPath={currentPath}
        onClose={() => setIsCreateFolderOpen(false)}
        onCreateFolder={handleCreateFolder}
      />

      {/* 8. Docker Deployment & Architecture Modal */}
      <DockerGuideModal
        isOpen={isDockerGuideOpen}
        onClose={() => setIsDockerGuideOpen(false)}
      />
    </div>
  );
}
