import { Innertube } from 'youtubei.js';
import YouTube from 'youtube-sr';

const THUMBNAIL_QUALITIES = {
  MAXRES: 'maxresdefault.jpg',
  HIGH: 'hqdefault.jpg',
  MEDIUM: 'mqdefault.jpg',
  STANDARD: 'sddefault.jpg',
  DEFAULT: 'default.jpg'
};

function getYouTubeThumbnailUrl(videoId, preferredQuality) {
  if (!videoId || typeof videoId !== 'string') {
    return `https://placehold.co/1280x720/1e1e2e/FFF?text=Invalid+Video+ID`;
  }

  const cleanVideoId = videoId.trim();

  if (preferredQuality && THUMBNAIL_QUALITIES[preferredQuality]) {
    return `https://img.youtube.com/vi/${cleanVideoId}/${preferredQuality}`;
  }

  return `https://img.youtube.com/vi/${cleanVideoId}/${THUMBNAIL_QUALITIES.MAXRES}`;
}

function formatDuration(duration) {
  if (!duration) return '15 min';

  // If it's already a string like "15:30" or "15 min", return it
  if (typeof duration === 'string') {
    if (duration.includes(':') || duration.includes('min')) return duration;
    // If it's a string number, treat as seconds
    if (!isNaN(duration)) {
      const seconds = parseInt(duration);
      return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
    }
  }

  // If it's a number (seconds)
  if (typeof duration === 'number') {
    return `${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`;
  }

  // If it's an object (Innertube often returns { seconds: number, text: string })
  if (typeof duration === 'object') {
    if (duration.text) return duration.text;
    if (duration.seconds) {
      return `${Math.floor(duration.seconds / 60)}:${(duration.seconds % 60).toString().padStart(2, '0')}`;
    }
    // Try toString as last resort
    return duration.toString();
  }

  return '15 min';
}

export default async function handler(req, res) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    console.log('Video API called with body:', req.body);
    const { url } = req.body;
    if (!url) {
      console.log('URL parameter missing');
      return res.status(400).json({ error: 'URL is required' });
    }

    // Check if it's a playlist or individual video
    // Prioritize playlist ID if present (even in watch URLs)
    const listIdMatch = url.match(/[?&]list=([^#\&\?]+)/);
    // Only treat as single video if NO list ID is present, OR if we explicitly want to handle it as single video
    // But for now, if a list ID is there, we assume the user wants the playlist.
    const videoIdMatch = !listIdMatch ? (url.match(/(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/user\/\S+|\/ytscreeningroom\?v=|\/live\/))([\w\-]{10,12})\b/) || url.match(/[?&]v=([^#\&\?]+)/)) : null;

    if (listIdMatch) {
      // Handle Playlist
      const playlistId = listIdMatch[1];
      console.log('Processing playlist ID:', playlistId);

      try {
        // Try youtubei.js (Innertube) first - most robust
        const youtube = await Innertube.create();
        const playlist = await youtube.getPlaylist(playlistId);

        if (!playlist || !playlist.items) {
          throw new Error("Playlist not found or empty");
        }

        // Fetch all videos by loading continuation pages
        let allItems = [...playlist.items];
        let currentBatch = playlist;

        while (currentBatch.has_continuation) {
          try {
            console.log('Fetching playlist continuation...');
            currentBatch = await currentBatch.getContinuation();
            if (currentBatch && currentBatch.items) {
              allItems = [...allItems, ...currentBatch.items];
              console.log(`Fetched ${currentBatch.items.length} more items. Total: ${allItems.length}`);
            } else {
              break;
            }
          } catch (contError) {
            console.log('Continuation fetch ended:', contError.message);
            break;
          }
        }

        // Map Innertube items to standard format
        const mappedItems = allItems.map(item => ({
          title: item.title?.toString() || "Untitled Video",
          description: `Duration: ${formatDuration(item.duration) || 'Unknown'} | Author: ${item.author?.name || 'Unknown'}`,
          duration: formatDuration(item.duration),
          videoUrl: `https://www.youtube.com/watch?v=${item.id}`,
          thumbnail: item.thumbnails ? item.thumbnails[0].url : `https://placehold.co/1280x720/1e1e2e/FFF?text=Video`
        }));

        console.log(`Successfully fetched ${mappedItems.length} playlist items`);
        return res.status(200).json({
          type: 'playlist',
          items: mappedItems,
          originalUrl: url,
          playlistId: playlistId
        });

      } catch (innerTubeError) {
        console.log('Innertube Playlist Error:', innerTubeError.message);

        // Fallback to youtube-sr
        try {
          console.log(`Falling back to youtube-sr for playlist: ${playlistId}`);
          const playlist = await YouTube.getPlaylist(url, { limit: 500 });

          const mappedItems = playlist.videos.map(video => ({
            title: video.title || 'Untitled Video',
            description: `Duration: ${formatDuration(video.durationFormatted || video.duration) || 'Unknown'} | Author: ${video.channel?.name || 'Unknown'}`,
            duration: formatDuration(video.durationFormatted || video.duration),
            videoUrl: `https://www.youtube.com/watch?v=${video.id}`,
            thumbnail: video.thumbnail?.url || video.thumbnail || `https://placehold.co/1280x720/1e1e2e/FFF?text=Video`
          }));

          return res.status(200).json({
            type: 'playlist',
            items: mappedItems,
            originalUrl: url,
            playlistId: playlistId
          });
        } catch (srError) {
          console.error('youtube-sr Error:', srError.message);

          // Final fallback - basic response with playlist ID
          return res.status(200).json({
            type: 'playlist',
            items: [{
              title: `Playlist: ${playlistId.substring(0, 10)}...`,
              description: 'Playlist could not be loaded. Please try again later.',
              duration: 'Varies',
              videoUrl: url,
              thumbnail: `https://placehold.co/1280x720/1e1e2e/FFF?text=Playlist`
            }],
            originalUrl: url,
            playlistId: playlistId
          });
        }
      }
    } else if (videoIdMatch) {
      // Handle Individual Video
      const videoId = videoIdMatch[1];
      console.log('Processing individual video ID:', videoId);

      try {
        // Try Innertube first
        const youtube = await Innertube.create();
        const info = await youtube.getInfo(videoId);

        if (!info) {
          throw new Error("Video not found");
        }

        const videoData = {
          type: 'video',
          items: [{
            title: info.basic_info.title || info.title || "YouTube Video",
            description: info.basic_info.short_description || "No description available",
            duration: formatDuration(info.basic_info.length_seconds || info.basic_info.duration),
            videoUrl: url,
            thumbnail: info.thumbnail ? info.thumbnail[0].url : getYouTubeThumbnailUrl(videoId)
          }],
          originalUrl: url,
          videoId: videoId
        };

        console.log('Successfully fetched individual video info');
        return res.status(200).json(videoData);

      } catch (error) {
        console.log('Individual Video Error (Innertube):', error.message);

        // Fallback: Try youtube-sr for individual video
        try {
          console.log(`Falling back to youtube-sr for video: ${videoId}`);
          const video = await YouTube.getVideo(url);

          if (!video) throw new Error("Video not found via youtube-sr");

          const videoData = {
            type: 'video',
            items: [{
              title: video.title || "YouTube Video",
              description: video.description || "No description available",
              duration: formatDuration(video.durationFormatted || video.duration),
              videoUrl: `https://www.youtube.com/watch?v=${video.id}`,
              thumbnail: video.thumbnail?.url || video.thumbnail || getYouTubeThumbnailUrl(videoId),
              isLive: video.live || false
            }],
            originalUrl: url,
            videoId: videoId
          };
          return res.status(200).json(videoData);
        } catch (srError) {
          console.log('youtube-sr Video Error:', srError.message);

          // Final Fallback: create basic video info without API
          const basicData = {
            type: 'video',
            items: [{
              title: 'YouTube Video',
              description: 'Individual YouTube video',
              duration: '15 min',
              videoUrl: url,
              thumbnail: getYouTubeThumbnailUrl(videoId)
            }],
            originalUrl: url,
            videoId: videoId
          };

          return res.status(200).json(basicData);
        }
      }
    } else {
      // Treat as a search query if it's not a URL
      console.log('Treating input as search query:', url);

      try {
        // Try Innertube search first
        const youtube = await Innertube.create();

        // Search for playlists first as they are better for courses
        const playlistResults = await youtube.search(url, { type: 'playlist', limit: 1 });

        if (playlistResults && playlistResults.results && playlistResults.results.length > 0) {
          const firstResult = playlistResults.results[0];
          if (firstResult.type === 'Playlist') {
            console.log('Found playlist via search:', firstResult.title?.toString());

            // We found a playlist, now we need to fetch its videos
            const playlistId = firstResult.id;
            const playlist = await youtube.getPlaylist(playlistId);

            if (playlist && playlist.items) {
              // Fetch all videos by loading continuation pages (limit to reasonable amount for speed)
              let allItems = [...playlist.items];
              let currentBatch = playlist;
              let continuationCount = 0;

              // Fetch up to 2 continuations (approx 300 videos max) to be safe
              while (currentBatch.has_continuation && continuationCount < 2) {
                try {
                  currentBatch = await currentBatch.getContinuation();
                  if (currentBatch && currentBatch.items) {
                    allItems = [...allItems, ...currentBatch.items];
                  } else {
                    break;
                  }
                  continuationCount++;
                } catch (contError) {
                  break;
                }
              }

              const mappedItems = allItems.map(item => ({
                title: item.title?.toString() || "Untitled Video",
                description: `Duration: ${formatDuration(item.duration) || 'Unknown'} | Author: ${item.author?.name || 'Unknown'}`,
                duration: formatDuration(item.duration),
                videoUrl: `https://www.youtube.com/watch?v=${item.id}`,
                thumbnail: item.thumbnails ? item.thumbnails[0].url : `https://placehold.co/1280x720/1e1e2e/FFF?text=Video`
              }));

              return res.status(200).json({
                type: 'playlist',
                items: mappedItems,
                originalUrl: `https://www.youtube.com/playlist?list=${playlistId}`,
                playlistId: playlistId
              });
            }
          }
        }

        // If no playlist found, search for video
        const searchResults = await youtube.search(url, { type: 'video', limit: 1 });

        if (searchResults && searchResults.results && searchResults.results.length > 0) {
          const firstResult = searchResults.results[0];

          // If it's a video
          if (firstResult.type === 'Video') {
            console.log('Found video via search:', firstResult.title?.toString());
            const videoData = {
              type: 'video',
              items: [{
                title: firstResult.title?.toString() || "YouTube Video",
                description: firstResult.description?.toString() || "No description available",
                duration: formatDuration(firstResult.duration),
                videoUrl: `https://www.youtube.com/watch?v=${firstResult.id}`,
                thumbnail: firstResult.thumbnails ? firstResult.thumbnails[0].url : `https://placehold.co/1280x720/1e1e2e/FFF?text=Video`
              }],
              originalUrl: `https://www.youtube.com/watch?v=${firstResult.id}`,
              videoId: firstResult.id
            };
            return res.status(200).json(videoData);
          }
        }

        // Fallback to youtube-sr search (Video only as fallback)
        console.log('Falling back to youtube-sr search');
        const video = await YouTube.searchOne(url);

        if (video) {
          const videoData = {
            type: 'video',
            items: [{
              title: video.title || "YouTube Video",
              description: video.description || "No description available",
              duration: formatDuration(video.durationFormatted || video.duration),
              videoUrl: `https://www.youtube.com/watch?v=${video.id}`,
              thumbnail: video.thumbnail?.url || video.thumbnail || `https://placehold.co/1280x720/1e1e2e/FFF?text=Video`,
              isLive: video.live || false
            }],
            originalUrl: `https://www.youtube.com/watch?v=${video.id}`,
            videoId: video.id
          };
          return res.status(200).json(videoData);
        }

        return res.status(404).json({ error: 'No results found for query' });

      } catch (searchError) {
        console.error('Search Error:', searchError);
        return res.status(500).json({ error: 'Search failed', details: searchError.message });
      }
    }
  } catch (error) {
    console.error('Video API Error:', error.message);
    console.error('Video API Stack:', error.stack);

    // Return a safe fallback response instead of throwing 500
    // This prevents the "Unexpected token 'A'" error when HTML is returned instead of JSON
    try {
      return res.status(200).json({
        type: 'error',
        error: 'Failed to fetch video/playlist',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Server error occurred',
        items: [],
        originalUrl: url || 'unknown',
        fallback: true
      });
    } catch (jsonError) {
      console.error('Failed to send JSON response:', jsonError);
      // Last resort: send plain text response
      res.status(200);
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        type: 'error',
        error: 'Server error occurred',
        items: [],
        originalUrl: url || 'unknown',
        fallback: true
      }));
    }
  }
}
