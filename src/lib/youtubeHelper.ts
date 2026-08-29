/**
 * Utility helper for YouTube Video ID extraction and Thumbnail Generation
 */

export function getYouTubeVideoId(url?: string): string | null {
  if (!url) return null;
  const str = url.trim();
  // Direct 11-char ID check
  if (str.length === 11 && !str.includes('/') && !str.includes('.') && !str.includes(':')) {
    return str;
  }
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = str.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

export function getYouTubeThumbnailUrl(urlOrId?: string): string | null {
  const videoId = getYouTubeVideoId(urlOrId);
  if (!videoId) return null;
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

export function getYouTubeWatchUrl(urlOrId?: string): string {
  const videoId = getYouTubeVideoId(urlOrId);
  if (!videoId) return urlOrId || 'https://www.youtube.com';
  return `https://www.youtube.com/watch?v=${videoId}`;
}

export function isYouTubeUrl(url?: string, type?: string): boolean {
  if (type === 'youtube') return true;
  if (!url) return false;
  return url.includes('youtube.com') || url.includes('youtu.be') || getYouTubeVideoId(url) !== null;
}
