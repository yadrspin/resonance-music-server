import React from 'react';
import { ChevronRight, Home, Folder, Play, Shuffle, PlusSquare, ArrowLeft } from 'lucide-react';

interface BreadcrumbsProps {
  breadcrumbs: { name: string; path: string }[];
  parentPath: string | null;
  onNavigate: (path: string) => void;
  onPlayCurrentFolder: () => void;
  onShuffleCurrentFolder: () => void;
  onAddFolderToPlaylist: () => void;
  trackCount: number;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  breadcrumbs,
  parentPath,
  onNavigate,
  onPlayCurrentFolder,
  onShuffleCurrentFolder,
  onAddFolderToPlaylist,
  trackCount
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-zinc-800/80">
      {/* Path List */}
      <nav aria-label="Directory Breadcrumbs" className="flex items-center flex-wrap gap-1.5 text-sm">
        {parentPath !== null && (
          <button
            onClick={() => onNavigate(parentPath)}
            className="p-1.5 text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 rounded-md border border-zinc-800 transition-colors mr-1"
            title="Go to parent directory"
            aria-label="Parent directory"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}

        {breadcrumbs.map((crumb, idx) => {
          const isLast = idx === breadcrumbs.length - 1;
          const isFirst = idx === 0;

          return (
            <React.Fragment key={crumb.path || 'root'}>
              {idx > 0 && (
                <ChevronRight className="w-4 h-4 text-zinc-600 shrink-0 select-none" />
              )}
              {isLast ? (
                <span className="flex items-center gap-1.5 font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {isFirst ? <Home className="w-3.5 h-3.5" /> : <Folder className="w-3.5 h-3.5" />}
                  <span>{crumb.name}</span>
                </span>
              ) : (
                <button
                  onClick={() => onNavigate(crumb.path)}
                  className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 px-2 py-0.5 rounded transition-colors"
                >
                  {isFirst ? <Home className="w-3.5 h-3.5" /> : <Folder className="w-3.5 h-3.5" />}
                  <span>{crumb.name}</span>
                </button>
              )}
            </React.Fragment>
          );
        })}
      </nav>

      {/* Quick Play Controls for this folder */}
      {trackCount > 0 && (
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onPlayCurrentFolder}
            className="h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center gap-1.5 transition-colors shadow-sm"
            title="Play all tracks in this folder sequentially"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Play Folder ({trackCount})</span>
          </button>

          <button
            onClick={onShuffleCurrentFolder}
            className="h-8 px-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-medium text-xs flex items-center gap-1.5 transition-colors border border-zinc-700/60"
            title="Shuffle all tracks in this folder"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Shuffle</span>
          </button>

          <button
            onClick={onAddFolderToPlaylist}
            className="h-8 px-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-medium text-xs flex items-center gap-1.5 transition-colors border border-zinc-700/60"
            title="Add this entire folder to a playlist"
          >
            <PlusSquare className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline">To Playlist</span>
          </button>
        </div>
      )}
    </div>
  );
};
