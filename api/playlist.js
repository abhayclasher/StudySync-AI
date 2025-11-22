import { Innertube } from 'youtubei.js';
import YouTube from 'youtube-sr';

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
      return res.status(200).json({ items: mappedItems });

    } catch (innerTubeError) {
      console.error('Innertube Error:', innerTubeError.message);

      // Fallback to youtube-sr if Innertube fails (double safety)
      try {
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

        return res.status(200).json({ items: mappedItems });
      } catch (srError) {
        console.error('youtube-sr Error:', srError.message);
        throw new Error("Failed to fetch playlist via all methods");
      }
    }

  } catch (error) {
    console.error('Playlist API Error:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to fetch playlist', details: error.message });
  }
}
