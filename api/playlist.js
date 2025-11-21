
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
      if (!YOUTUBE_API_KEY) return res.status(500).json({ error: 'YOUTUBE_API_KEY not configured on server' });
  
      // Extract Playlist ID
      const listIdMatch = url.match(/[?&]list=([^#\&\?]+)/);
      if (!listIdMatch) return res.status(400).json({ error: 'Invalid Playlist URL' });
      const playlistId = listIdMatch[1];
  
      // Fetch from Google API
      const googleUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&key=${YOUTUBE_API_KEY}`;
      
      const response = await fetch(googleUrl);
      const data = await response.json();
  
      if (!response.ok) {
        console.error('Google API Error:', data);
        // Return a more specific error based on the response
        const errorMessage = data.error?.message || 'YouTube API Error';
        const errorCode = data.error?.code || 500;
        
        // Check if it's a permission error specifically
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
  
      res.status(200).json(data);
    } catch (error) {
      console.error('Playlist API Error:', error.message);
      res.status(500).json({ error: 'Failed to fetch playlist', details: error.message });
    }
  }
