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
  
    const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
  
    try {
      const { url } = req.body;
      if (!url) return res.status(400).json({ error: 'URL is required' });
  
      // Check if it's a playlist or individual video
      const listIdMatch = url.match(/[?&]list=([^#\&\?]+)/);
      const videoIdMatch = url.match(/[?&]v=([^#\&\?]+)/) || url.match(/youtu\.be\/([^#\&\?]+)/);
      
      if (listIdMatch) {
        // Handle Playlist
        const playlistId = listIdMatch[1];
        
        if (!YOUTUBE_API_KEY) return res.status(500).json({ error: 'YOUTUBE_API_KEY not configured on server' });
        
        // Fetch from Google API
        const googleUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&key=${YOUTUBE_API_KEY}`;
        
        const response = await fetch(googleUrl);
        const data = await response.json();
  
        if (!response.ok) {
          console.error('Google API Error:', data);
          const errorMessage = data.error?.message || 'YouTube API Error';
          const errorCode = data.error?.code || 500;
          
          if (errorCode === 403 || errorMessage.includes('permission') || errorMessage.includes('PERMISSION_DENIED')) {
            return res.status(403).json({
              error: 'YouTube API Permission Error',
              details: 'The YouTube API key may not have the required permissions for playlist access.',
              message: errorMessage,
              rawError: data.error
            });
          }
          
          return res.status(errorCode).json({
            error: 'YouTube API Error',
            details: errorMessage,
            rawError: data.error
          });
        }
  
        // Transform playlist data to roadmap format
        const roadmapItems = data.items.map((item) => ({
          id: item.id || `vid-${Date.now()}-${Math.random()}`,
          title: item.snippet?.title?.replace(/\s*[-–]\s*YouTube\s*$/, '') || "Untitled Video",
          description: item.snippet?.description ? item.snippet.description.substring(0, 150) : "No description available",
          duration: '15 min',
          status: 'pending',
          videoUrl: item.snippet?.resourceId?.videoId 
            ? `https://www.youtube.com/watch?v=${item.snippet.resourceId.videoId}`
            : (item.videoUrl || url),
          thumbnail: item.snippet?.thumbnails?.medium?.url ||
            (item.snippet?.resourceId?.videoId 
              ? `https://img.youtube.com/vi/${item.snippet.resourceId.videoId}/maxresdefault.jpg`
              : `https://placehold.co/1280x720/1e1e2e/FFF?text=${encodeURIComponent(item.snippet?.title?.substring(0, 20) || 'Video')}`)
        }));
  
        res.status(200).json({ 
          type: 'playlist',
          items: roadmapItems,
          originalUrl: url,
          playlistId: playlistId 
        });
      } else if (videoIdMatch) {
        // Handle Individual Video
        const videoId = videoIdMatch[1];
        
        if (!YOUTUBE_API_KEY) {
          // Fallback without API key - try to extract title from URL parameters and video ID
          let extractedTitle = 'YouTube Video';
          let extractedDescription = 'Individual YouTube video';
          
          try {
            const urlObj = new URL(url, window.location.origin);
            // Try to extract title from various URL parameters
            const titleParam = urlObj.searchParams.get('t') || 
                              urlObj.searchParams.get('title') || 
                              urlObj.searchParams.get('list') ||
                              urlObj.searchParams.get('v');
            if (titleParam) {
              extractedTitle = decodeURIComponent(titleParam).replace(/\+/g, ' ');
              // Clean up common YouTube parameters
              extractedTitle = extractedTitle.replace(/_/g, ' ').replace(/-/g, ' ');
              extractedDescription = `Video: ${extractedTitle}`;
            } else {
              // Try to create a meaningful title from the video ID
              const videoId = videoIdMatch[1];
              if (videoId) {
                // Create a readable title from the video ID pattern
                extractedTitle = `Video: ${videoId.substring(0, 4)}...${videoId.substring(videoId.length - 4)}`;
                extractedDescription = `YouTube video with ID: ${videoId}`;
              } else {
                // Fallback to generic title
                extractedTitle = 'YouTube Video Lesson';
                extractedDescription = 'Individual YouTube video lesson';
              }
            }
            
            // Clean up the title to make it more readable
            extractedTitle = extractedTitle
              .replace(/\s+/g, ' ')
              .trim()
              .replace(/\s*[-–]\s*YouTube\s*$/i, '') // Remove YouTube suffixes
              .replace(/^\s*video\s*[:\-]?\s*/i, '') // Remove leading "Video:" prefixes
              .replace(/^\s*youtube\s*[:\-]?\s*/i, ''); // Remove leading "YouTube:" prefixes
            
            // Capitalize first letter
            if (extractedTitle.length > 0) {
              extractedTitle = extractedTitle.charAt(0).toUpperCase() + extractedTitle.slice(1);
            }
            
            // Ensure we have a reasonable title
            if (extractedTitle.length < 3 || extractedTitle === 'Video') {
              extractedTitle = 'YouTube Video Lesson';
            }
            
          } catch (e) {
            console.warn('Error parsing URL for title extraction:', e);
            // Fallback to a reasonable default
            extractedTitle = 'YouTube Video Lesson';
            extractedDescription = 'Individual YouTube video';
          }
          
          const videoData = {
            type: 'video',
            items: [{
              id: `vid-${Date.now()}`,
              title: extractedTitle,
              description: extractedDescription,
              duration: '15 min',
              status: 'pending',
              videoUrl: url,
              thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
            }],
            originalUrl: url,
            videoId: videoId
          };
          return res.status(200).json(videoData);
        }
        
        // Fetch video details from YouTube API
        const videoUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,liveStreamingDetails&id=${videoId}&key=${YOUTUBE_API_KEY}`;
        
        const response = await fetch(videoUrl);
        const data = await response.json();

        if (!response.ok) {
          console.error('YouTube Video API Error:', data);
          const errorMessage = data.error?.message || 'YouTube Video API Error';
          const errorCode = data.error?.code || 500;
          
          if (errorCode === 403 || errorMessage.includes('permission') || errorMessage.includes('PERMISSION_DENIED')) {
            return res.status(403).json({
              error: 'YouTube API Permission Error',
              details: 'The YouTube API key may not have the required permissions for video access.',
              message: errorMessage,
              rawError: data.error
            });
          }
          
          return res.status(errorCode).json({
            error: 'YouTube Video API Error',
            details: errorMessage,
            rawError: data.error
          });
        }

        if (!data.items || data.items.length === 0) {
          return res.status(404).json({
            error: 'Video not found',
            details: 'The video ID does not correspond to a valid YouTube video.'
          });
        }

        const video = data.items[0];
        
        // Check if it's a live stream
        const isLive = video.snippet?.liveBroadcastContent === 'live';
        const isUpcoming = video.snippet?.liveBroadcastContent === 'upcoming';
        const isCompleted = video.snippet?.liveBroadcastContent === 'completed';
        
        let duration = video.contentDetails?.duration || '15 min';
        let status = 'pending';
        
        if (isLive) {
          duration = 'Live Stream';
          status = 'live';
        } else if (isUpcoming) {
          duration = 'Scheduled Live';
          status = 'upcoming';
        } else if (isCompleted) {
          duration = video.contentDetails?.duration || 'Recorded Live';
          status = 'completed';
        }
        
        // Handle live stream thumbnails - use high quality thumbnail if available
        let thumbnail = video.snippet?.thumbnails?.medium?.url;
        if (isLive || isUpcoming) {
          // For live streams, try to get the best available thumbnail
          thumbnail = video.snippet?.thumbnails?.high?.url || 
                     video.snippet?.thumbnails?.medium?.url ||
                     `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
        } else {
          thumbnail = thumbnail || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
        }
        
        const videoData = {
          type: 'video',
          items: [{
            id: `vid-${Date.now()}`,
            title: video.snippet?.title?.replace(/\s*[-–]\s*YouTube\s*$/, '') || "Untitled Video",
            description: video.snippet?.description ? video.snippet.description.substring(0, 150) : "No description available",
            duration: duration,
            status: status,
            videoUrl: url,
            thumbnail: thumbnail,
            // Add live stream specific fields
            isLive: isLive,
            isUpcoming: isUpcoming,
            isCompleted: isCompleted,
            liveStreamingDetails: video.liveStreamingDetails || null
          }],
          originalUrl: url,
          videoId: videoId
        };
  
        res.status(200).json(videoData);
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
  }
