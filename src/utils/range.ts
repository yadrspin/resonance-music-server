export interface ByteRange {
  start: number;
  end: number;
  chunkSize: number;
}

/**
 * Parses an HTTP Range header (RFC 7233) against a given file size.
 * Handles forms like:
 *   - "bytes=0-1023"
 *   - "bytes=1000-"
 *   - "bytes=-500" (suffix byte range)
 * 
 * Returns null if the range is invalid or unsatisfiable (416).
 */
export function parseRangeHeader(
  rangeHeader: string | undefined | null,
  totalSize: number
): ByteRange | null {
  if (!rangeHeader || totalSize <= 0) {
    return null;
  }

  const matches = rangeHeader.trim().match(/^bytes=(\d*)-(\d*)$/);
  if (!matches) {
    return null;
  }

  const startStr = matches[1];
  const endStr = matches[2];

  if (startStr === '' && endStr === '') {
    return null;
  }

  let start: number;
  let end: number;

  if (startStr === '') {
    // Suffix range: bytes=-500 -> last 500 bytes
    const suffixLength = parseInt(endStr, 10);
    if (isNaN(suffixLength) || suffixLength <= 0) return null;
    start = Math.max(0, totalSize - suffixLength);
    end = totalSize - 1;
  } else if (endStr === '') {
    // Open-ended range: bytes=1000- -> from 1000 to end
    start = parseInt(startStr, 10);
    if (isNaN(start) || start < 0 || start >= totalSize) return null;
    end = totalSize - 1;
  } else {
    // Explicit range: bytes=0-1024
    start = parseInt(startStr, 10);
    end = parseInt(endStr, 10);
    if (isNaN(start) || isNaN(end) || start < 0 || start > end || start >= totalSize) {
      return null;
    }
    // Clamp end to file size - 1
    end = Math.min(end, totalSize - 1);
  }

  const chunkSize = end - start + 1;
  if (chunkSize <= 0) return null;

  return { start, end, chunkSize };
}
