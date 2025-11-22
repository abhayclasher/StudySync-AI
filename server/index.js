
/**
 * StudySync AI Backend Server
 * Run this with: node server/index.js
 * Requires: npm install express cors youtube-transcript dotenv
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { YoutubeTranscript } = require('youtube-transcript');
const app = express();
const PORT = 3001;

// Allow CORS
app.use(cors());
app.use(express.json());

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

// --- Root Route ---
app.get('/', (req, res) => {
  res.send('StudySync AI Backend is Running');
});

// --- YouTube Transcript API ---
app.post('/api/transcript', async (req, res) => {
  try {
    console.log('Transcript API called with body:', req.body);
    const { url } = req.body;
    if (!url) {
      console.log('URL parameter missing for transcript API');
      return res.status(400).json({ error: 'URL is required' });
    }

    console.log(`Fetching transcript for: ${url}`);

    // Use youtubei.js (Innertube) for robust transcript fetching
    const { Innertube } = require('youtubei.js');
    const youtube = await Innertube.create();

    // Extract video ID
    const videoIdMatch = url.match(/(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/user\/\S+|\/ytscreeningroom\?v=|\/live\/))([\w\-]{10,12})\b/);
    const videoId = videoIdMatch ? videoIdMatch[1] : null;

    if (!videoId) {
      throw new Error("Invalid YouTube URL");
    }

    const info = await youtube.getInfo(videoId);
    const transcriptData = await info.getTranscript();

    if (!transcriptData || !transcriptData.transcript) {
      throw new Error("No transcript available for this video");
    }

    // Parse transcript
    const transcriptItems = transcriptData.transcript.content.body.initial_segments.map(segment => ({
      text: segment.snippet.text,
      offset: Number(segment.start_ms),
      duration: Number(segment.end_ms) - Number(segment.start_ms)
    }));

    const fullText = transcriptItems.map(item => item.text).join(' ');

    res.json({ transcript: fullText, items: transcriptItems });
  } catch (error) {
    console.error('Transcript Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch transcript', details: error.message });
  }
});

// --- YouTube Video API (Unified for playlists and individual videos) ---
app.post('/api/video', async (req, res) => {
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
        const { Innertube } = require('youtubei.js');
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
        return res.json({
          type: 'playlist',
          items: mappedItems,
          originalUrl: url,
          playlistId: playlistId
        });

      } catch (innerTubeError) {
        console.error('Innertube Playlist Error:', innerTubeError.message);

        // Fallback to youtube-sr
        try {
          const YouTube = require("youtube-sr").default;
          console.log(`Falling back to youtube-sr for playlist: ${playlistId}`);
          const playlist = await YouTube.getPlaylist(url, { limit: 500 });

          const mappedItems = playlist.videos.map(video => ({
            title: video.title,
            description: `Duration: ${video.durationFormatted} | Author: ${video.channel?.name || 'Unknown'}`,
            duration: video.durationFormatted || '15 min',
            videoUrl: `https://www.youtube.com/watch?v=${video.id}`,
            thumbnail: video.thumbnail?.url || video.thumbnail || `https://placehold.co/1280x720/1e1e2e/FFF?text=Video`
          }));

          return res.json({
            type: 'playlist',
            items: mappedItems,
            originalUrl: url,
            playlistId: playlistId
          });
        } catch (srError) {
          console.error('youtube-sr Error:', srError.message);
          throw new Error("Failed to fetch playlist via all methods");
        }
      }
    } else if (videoIdMatch) {
      // Handle Individual Video
      const videoId = videoIdMatch[1];
      console.log('Processing individual video ID:', videoId);

      try {
        const { Innertube } = require('youtubei.js');
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
            thumbnail: info.thumbnail ? info.thumbnail[0].url : `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
          }],
          originalUrl: url,
          videoId: videoId
        };

        console.log('Successfully fetched individual video info');
        return res.json(videoData);

      } catch (error) {
        console.error('Individual Video Error:', error.message);

        // Fallback: Try youtube-sr for individual video
        try {
          const YouTube = require("youtube-sr").default;
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
              thumbnail: video.thumbnail?.url || video.thumbnail || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
              isLive: video.live || false
            }],
            originalUrl: url,
            videoId: videoId
          };
          return res.json(videoData);
        } catch (srError) {
          console.error('youtube-sr Video Error:', srError.message);

          // Final Fallback: create basic video info without API
          const basicData = {
            type: 'video',
            items: [{
              title: 'YouTube Video',
              description: 'Individual YouTube video',
              duration: '15 min',
              videoUrl: url,
              thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
            }],
            originalUrl: url,
            videoId: videoId
          };

          return res.json(basicData);
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
    res.status(500).json({
      error: 'Failed to fetch video/playlist',
      details: error.message
    });
  }
});

// --- YouTube Playlist API (Legacy - kept for backward compatibility) ---
app.post('/api/playlist', async (req, res) => {
  try {
    console.log('Playlist API called with body:', req.body);
    const { url } = req.body;
    if (!url) {
      console.log('URL parameter missing');
      return res.status(400).json({ error: 'URL is required' });
    }

    const listIdMatch = url.match(/[?&]list=([^#\&\?]+)/);
    if (!listIdMatch) {
      console.log('Invalid playlist URL format:', url);
      return res.status(400).json({ error: 'Invalid Playlist URL' });
    }
    const playlistId = listIdMatch[1];
    console.log('Extracted playlist ID:', playlistId);

    // Use youtubei.js (Innertube) for robust playlist fetching
    // This bypasses the need for an API key and is less likely to be blocked than simple scraping
    try {
      const { Innertube } = require('youtubei.js');
      const youtube = await Innertube.create();

      const playlist = await youtube.getPlaylist(playlistId);

      if (!playlist || !playlist.items) {
        throw new Error("Playlist not found or empty");
      }

      // Fetch all videos by loading continuation pages
      let allItems = [...playlist.items];
      let hasMore = playlist.has_continuation;

      while (hasMore) {
        try {
          const continuation = await playlist.getContinuation();
          if (continuation && continuation.length > 0) {
            allItems = [...allItems, ...continuation];
            hasMore = playlist.has_continuation;
          } else {
            hasMore = false;
          }
        } catch (contError) {
          console.log('Continuation fetch ended:', contError.message);
          hasMore = false;
        }
      }

      // Map Innertube items to Google API format
      const mappedItems = allItems.map(item => {
        // Innertube returns different object structures, handle safely
        return {
          snippet: {
            title: item.title?.toString() || "Untitled Video",
            description: `Duration: ${item.duration?.toString() || 'Unknown'} | Author: ${item.author?.name || 'Unknown'}`,
            resourceId: {
              videoId: item.id
            },
            thumbnails: {
              medium: {
                // Innertube thumbnails are usually an array, get the first or best
                url: item.thumbnails ? item.thumbnails[0].url : ''
              }
            }
          }
        };
      });

      console.log(`Successfully fetched ${mappedItems.length} items via youtubei.js`);
      return res.json({ items: mappedItems });

    } catch (innerTubeError) {
      console.error('Innertube Error:', innerTubeError.message);

      // Fallback to youtube-sr if Innertube fails (double safety)
      try {
        const YouTube = require("youtube-sr").default;
        console.log(`Falling back to youtube-sr for playlist: ${playlistId}`);
        const playlist = await YouTube.getPlaylist(url, { limit: 500 });

        const mappedItems = playlist.videos.map(video => ({
          snippet: {
            title: video.title,
            description: `Duration: ${video.durationFormatted} | Author: ${video.channel?.name || 'Unknown'}`,
            resourceId: {
              videoId: video.id
            },
            thumbnails: {
              medium: {
                // Ensure we get a valid URL string
                url: video.thumbnail?.url || video.thumbnail || ''
              }
            }
          }
        }));

        return res.json({ items: mappedItems });
      } catch (srError) {
        console.error('youtube-sr Error:', srError.message);
        throw new Error("Failed to fetch playlist via all methods");
      }
    }

  } catch (error) {
    console.error('Playlist API Error:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to fetch playlist', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Backend Server running on http://localhost:${PORT}`);
  console.log(`   - YouTube API Key configured: ${!!YOUTUBE_API_KEY}`);
  console.log(`   - Available endpoints: /api/transcript, /api/playlist`);
});
