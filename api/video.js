import { Innertube } from 'youtubei.js';
import YouTube from 'youtube-sr';
import { getYouTubeThumbnailUrl } from '../lib/youtubeUtils';

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
          description: `Duration: ${item.duration?.toString() || 'Unknown'} | Author: ${item.author?.name || 'Unknown'}`,
          duration: item.duration?.toString() || '15 min',
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
            description: `Duration: ${video.durationFormatted || 'Unknown'} | Author: ${video.channel?.name || 'Unknown'}`,
            duration: video.durationFormatted || '15 min',
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
            duration: info.basic_info.length_seconds ? `${Math.floor(info.basic_info.length_seconds / 60)}:${(info.basic_info.length_seconds % 60).toString().padStart(2, '0')}` : '15 min',
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
              duration: video.durationFormatted || '15 min',
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
      return res.status(400).json({
        error: 'Invalid YouTube URL',
        details: 'Please provide a valid YouTube video or playlist URL.',
        providedUrl: url
      });
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
