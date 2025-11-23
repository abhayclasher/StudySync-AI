/**
 * YouTube Thumbnail Utility Functions
 * Provides robust fallback mechanisms for YouTube thumbnails to prevent 404 errors
 */

/**
 * YouTube thumbnail quality hierarchy (from highest to lowest quality)
 */
export const THUMBNAIL_QUALITIES = {
  MAXRES: 'maxresdefault.jpg',    // Highest quality (may not exist for all videos)
  HIGH: 'hqdefault.jpg',          // High quality (most reliable)
  MEDIUM: 'mqdefault.jpg',        // Medium quality
  STANDARD: 'sddefault.jpg',      // Standard definition
  DEFAULT: 'default.jpg'          // Lowest quality
};

/**
 * YouTube thumbnail quality fallback chain
 * Attempts thumbnails in order of preference until one loads successfully
 */
export const THUMBNAIL_FALLBACK_CHAIN = [
  THUMBNAIL_QUALITIES.MAXRES,
  THUMBNAIL_QUALITIES.HIGH,
  THUMBNAIL_QUALITIES.MEDIUM,
  THUMBNAIL_QUALITIES.STANDARD,
  THUMBNAIL_QUALITIES.DEFAULT
];

/**
 * Gets the best available YouTube thumbnail URL for a video
 * @param videoId - YouTube video ID
 * @param preferredQuality - Preferred thumbnail quality (optional)
 * @returns Best available thumbnail URL
 */
export function getYouTubeThumbnailUrl(
  videoId: string, 
  preferredQuality?: string
): string {
  if (!videoId || typeof videoId !== 'string') {
    return `https://placehold.co/1280x720/1e1e2e/FFF?text=Invalid+Video+ID`;
  }

  // Clean video ID
  const cleanVideoId = videoId.trim();
  
  // If preferred quality is specified and valid, use it
  if (preferredQuality && THUMBNAIL_QUALITIES[preferredQuality as keyof typeof THUMBNAIL_QUALITIES]) {
    return `https://img.youtube.com/vi/${cleanVideoId}/${preferredQuality}`;
  }

  // Default to maxresdefault with fallback chain
  return `https://img.youtube.com/vi/${cleanVideoId}/${THUMBNAIL_QUALITIES.MAXRES}`;
}

/**
 * Creates an image element and tests if a thumbnail URL loads successfully
 * @param url - Image URL to test
 * @returns Promise that resolves to true if image loads successfully
 */
export function testImageLoad(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
}

/**
 * Finds the best available thumbnail URL from the fallback chain
 * @param videoId - YouTube video ID
 * @returns Promise that resolves to the best available thumbnail URL
 */
export async function getBestAvailableThumbnail(videoId: string): Promise<string> {
  if (!videoId || typeof videoId !== 'string') {
    return `https://placehold.co/1280x720/1e1e2e/FFF?text=Invalid+Video+ID`;
  }

  const cleanVideoId = videoId.trim();
  
  // Test each thumbnail quality in order
  for (const quality of THUMBNAIL_FALLBACK_CHAIN) {
    const url = `https://img.youtube.com/vi/${cleanVideoId}/${quality}`;
    
    try {
      const isAvailable = await testImageLoad(url);
      if (isAvailable) {
        return url;
      }
    } catch (error) {
      console.warn(`Failed to test thumbnail ${quality} for video ${cleanVideoId}:`, error);
    }
  }

  // If all YouTube thumbnails fail, return placeholder
  return `https://placehold.co/1280x720/1e1e2e/FFF?text=Video+Thumbnail+Not+Available`;
}

/**
 * Enhanced thumbnail URL with automatic fallback for React components
 * @param videoId - YouTube video ID
 * @param fallbackTitle - Title to use for placeholder if all thumbnails fail
 * @returns Object with src and fallback properties for use in img elements
 */
export function createThumbnailConfig(
  videoId: string, 
  fallbackTitle?: string
): { src: string; fallback: string } {
  const src = getYouTubeThumbnailUrl(videoId);
  const title = fallbackTitle || 'Video';
  
  return {
    src,
    fallback: `https://placehold.co/1280x720/1e1e2e/FFF?text=${encodeURIComponent(title.substring(0, 20))}`
  };
}

/**
 * Extracts YouTube video ID from various URL formats
 * @param url - YouTube URL (watch, short, embed, etc.)
 * @returns Video ID or null if not found
 */
export function extractVideoId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;

  // Various regex patterns for different YouTube URL formats
  const patterns = [
    /(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/user\/\S+|\/ytscreeningroom\?v=|\/live\/))([\w\-]{10,12})\b/,
    /[?&]v=([\w\-]{10,12})/,
    /(?:youtu\.be\/|youtube\.com\/embed\/)([\w\-]{10,12})/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Creates a robust thumbnail URL with automatic fallback handling
 * @param urlOrId - Either a YouTube URL or video ID
 * @param fallbackTitle - Title for placeholder image
 * @returns Promise that resolves to the best available thumbnail URL
 */
export async function getRobustThumbnail(
  urlOrId: string, 
  fallbackTitle?: string
): Promise<string> {
  if (!urlOrId) {
    return `https://placehold.co/1280x720/1e1e2e/FFF?text=${encodeURIComponent(fallbackTitle || 'Video')}`;
  }

  // Check if input is already a video ID (11 characters, alphanumeric and hyphens/underscores)
  const isVideoId = /^[A-Za-z0-9_-]{11}$/.test(urlOrId.trim());
  
  let videoId: string | null;
  
  if (isVideoId) {
    videoId = urlOrId.trim();
  } else {
    videoId = extractVideoId(urlOrId);
  }

  if (!videoId) {
    return `https://placehold.co/1280x720/1e1e2e/FFF?text=${encodeURIComponent(fallbackTitle || 'Invalid+URL')}`;
  }

  try {
    return await getBestAvailableThumbnail(videoId);
  } catch (error) {
    console.warn('Failed to get best available thumbnail:', error);
    return `https://placehold.co/1280x720/1e1e2e/FFF?text=${encodeURIComponent(fallbackTitle || 'Video')}`;
  }
}

/**
 * React hook-style error handler for img elements
 * Usage: onError={(e) => handleThumbnailError(e, videoId, fallbackTitle)}
 */
export function handleThumbnailError(
  event: React.SyntheticEvent<HTMLImageElement, Event>,
  videoId: string,
  fallbackTitle?: string
): void {
  const target = event.target as HTMLImageElement;
  
  // Prevent infinite error loops
  if (target.onerror === null) return;
  
  target.onerror = null;
  
  // Try the next quality in the fallback chain
  const currentSrc = target.src;
  let nextQuality = null;
  
  if (currentSrc.includes('maxresdefault.jpg')) {
    nextQuality = 'hqdefault.jpg';
  } else if (currentSrc.includes('hqdefault.jpg')) {
    nextQuality = 'mqdefault.jpg';
  } else if (currentSrc.includes('mqdefault.jpg')) {
    nextQuality = 'sddefault.jpg';
  } else if (currentSrc.includes('sddefault.jpg')) {
    nextQuality = 'default.jpg';
  }
  
  if (nextQuality) {
    const videoIdMatch = currentSrc.match(/\/vi\/([^\/]+)\//);
    if (videoIdMatch) {
      target.src = `https://img.youtube.com/vi/${videoIdMatch[1]}/${nextQuality}`;
      return;
    }
  }
  
  // If all YouTube thumbnails fail, use placeholder
  const title = fallbackTitle || 'Video';
  target.src = `https://placehold.co/1280x720/1e1e2e/FFF?text=${encodeURIComponent(title.substring(0, 20))}`;
}