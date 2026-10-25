import React, { useState } from 'react';
import { X, PlusSquare, ListMusic, Plus, Check } from 'lucide-react';
import { Playlist, Track } from '../types/music.js';

interface AddToPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  playlists: Playlist[];
  targetTrack?: Track | null;
  targetFolderPath?: string | null;
  onAddTrack: (playlistId: string, track: Track) => Promise<void>;
  onAddFolder: (playlistId: string, folderPath: string) => Promise<void>;
  onCreateAndAdd: (name: string, track?: Track | null, folderPath?: string | null) => Promise<void>;
}

export const AddToPlaylistModal: React.FC<AddToPlaylistModalProps> = ({
  isOpen,
  onClose,
  playlists,
  targetTrack,
  targetFolderPath,
  onAddTrack,
  onAddFolder,
  onCreateAndAdd
}) => {
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const title = targetTrack
    ? `Add "${targetTrack.title || targetTrack.filename}" to Playlist`
    : targetFolderPath !== null && targetFolderPath !== undefined
    ? `Add folder "${targetFolderPath || 'Music Root'}" to Playlist`
    : 'Add to Playlist';

  const handleSelectPlaylist = async (playlistId: string) => {
    setIsSubmitting(true);
    try {
      if (targetTrack) {
        await onAddTrack(playlistId, targetTrack);
      } else if (targetFolderPath !== null && targetFolderPath !== undefined) {
        await onAddFolder(playlistId, targetFolderPath);
      }
      setSuccessMessage('Added successfully!');
      setTimeout(() => {
        onClose();
        setSuccessMessage(null);
      }, 700);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;

    setIsSubmitting(true);
    try {
      await onCreateAndAdd(newPlaylistName.trim(), targetTrack, targetFolderPath);
      setSuccessMessage('Created and added!');
      setTimeout(() => {
        onClose();
        setSuccessMessage(null);
      }, 700);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PlusSquare className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white truncate">{title}</h3>
          </div>
          <button onClick={onClose} className="p-1 text-zinc-400 hover:text-white rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {successMessage ? (
            <div className="p-6 text-center text-emerald-400 flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <Check className="w-6 h-6 text-emerald-400" />
              </div>
              <span className="text-sm font-semibold">{successMessage}</span>
            </div>
          ) : (
            <>
              {/* Existing playlists list */}
              <div className="space-y-1.5 max-h-56 overflow-y-auto">
                <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                  Choose a Playlist
                </div>
                {playlists.length === 0 ? (
                  <p className="text-xs text-zinc-500 py-2">No playlists exist yet.</p>
                ) : (
                  playlists.map((pl) => (
                    <button
                      key={pl.id}
                      disabled={isSubmitting}
                      onClick={() => handleSelectPlaylist(pl.id)}
                      className="w-full px-3 py-2.5 rounded-lg bg-zinc-950/60 hover:bg-zinc-800 border border-zinc-800/80 hover:border-zinc-700 text-left flex items-center justify-between group transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <ListMusic className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="text-xs font-semibold text-zinc-200 group-hover:text-white truncate">
                          {pl.name}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-zinc-500">
                        {pl.tracks.length} tracks
                      </span>
                    </button>
                  ))
                )}
              </div>

              {/* Create new playlist toggle & form */}
              <div className="pt-2 border-t border-zinc-800">
                {!isCreatingNew ? (
                  <button
                    onClick={() => setIsCreatingNew(true)}
                    className="w-full py-2 px-3 rounded-lg bg-zinc-800/60 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors border border-dashed border-zinc-700"
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Create New Playlist & Add</span>
                  </button>
                ) : (
                  <form onSubmit={handleCreateNew} className="space-y-2">
                    <input
                      type="text"
                      autoFocus
                      required
                      value={newPlaylistName}
                      onChange={(e) => setNewPlaylistName(e.target.value)}
                      placeholder="New playlist name..."
                      className="w-full h-9 px-3 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsCreatingNew(false)}
                        className="flex-1 py-1.5 rounded-lg bg-zinc-800 text-zinc-400 text-xs font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                      >
                        Create & Add
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
