export function formatDuration(seconds: number | undefined): string {
  if (!seconds || isNaN(seconds) || seconds <= 0) return '0:00';
  const total = Math.floor(seconds);
  const hrs = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function formatBytes(bytes: number | undefined): string {
  if (!bytes || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

export function getFormatBadgeClasses(format: string): { bg: string; text: string; border: string } {
  const f = format.toLowerCase();
  switch (f) {
    case 'flac':
      return { bg: 'bg-emerald-950/60', text: 'text-emerald-400', border: 'border-emerald-800/60' };
    case 'wav':
      return { bg: 'bg-cyan-950/60', text: 'text-cyan-400', border: 'border-cyan-800/60' };
    case 'opus':
      return { bg: 'bg-purple-950/60', text: 'text-purple-400', border: 'border-purple-800/60' };
    case 'ogg':
      return { bg: 'bg-amber-950/60', text: 'text-amber-400', border: 'border-amber-800/60' };
    case 'mp3':
      return { bg: 'bg-blue-950/60', text: 'text-blue-400', border: 'border-blue-800/60' };
    case 'm4a':
    case 'aac':
      return { bg: 'bg-rose-950/60', text: 'text-rose-400', border: 'border-rose-800/60' };
    default:
      return { bg: 'bg-zinc-800', text: 'text-zinc-300', border: 'border-zinc-700' };
  }
}
