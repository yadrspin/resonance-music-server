import path from 'path';

/**
 * Validates and safely resolves a relative path within a designated root directory.
 * Prevents directory traversal attacks (e.g. '../', '/etc/passwd', null bytes).
 * 
 * Returns the normalized relative path if valid, or null if the path tries to escape.
 */
export function sanitizeRelativePath(userPath: string | undefined | null): string {
  if (!userPath) return '';

  // Remove leading slashes and decode URI components if encoded
  let clean = decodeURIComponent(userPath).trim();
  // Strip null bytes
  clean = clean.replace(/\0/g, '');
  // Normalize Windows/POSIX separators to POSIX
  clean = clean.replace(/\\/g, '/');

  // Remove leading and trailing slashes
  clean = clean.replace(/^\/+|\/+$/g, '');

  // Normalize path segments
  const segments = clean.split('/').filter(Boolean);
  const safeSegments: string[] = [];

  for (const segment of segments) {
    if (segment === '.' || segment === '') {
      continue;
    }
    if (segment === '..') {
      if (safeSegments.length > 0) {
        safeSegments.pop();
      } else {
        // Attempted escape past root
        return '';
      }
    } else {
      safeSegments.push(segment);
    }
  }

  return safeSegments.join('/');
}

/**
 * Checks if a target absolute path is strictly within the allowed root directory.
 * Cross-platform compatible with both Windows (drive letters, backslashes) and POSIX.
 */
export function isPathInsideRoot(rootDir: string, targetPath: string): boolean {
  const resolvedRoot = path.resolve(rootDir);
  const resolvedTarget = path.resolve(targetPath);

  const relative = path.relative(resolvedRoot, resolvedTarget);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}
