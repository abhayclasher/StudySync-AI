import { Innertube } from 'youtubei.js';
import { YoutubeTranscript } from 'youtube-transcript';

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
    console.log('Transcript API called with body:', req.body);
    const { url } = req.body;
    if (!url) {
      console.log('URL parameter missing for transcript API');
      return res.status(400).json({ error: 'URL is required' });
    }

    console.log(`Fetching transcript for: ${url}`);

    // Extract video ID
    const videoIdMatch = url.match(/(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/user\/\S+|\/ytscreeningroom\?v=|\/live\/))([\w\-]{10,12})\b/);
    const videoId = videoIdMatch ? videoIdMatch[1] : null;

    if (!videoId) {
      throw new Error("Invalid YouTube URL");
    }

    // Try multiple methods to get the transcript
    let transcriptItems = [];
    let fullText = '';

    // Method 1: Try youtubei.js (Innertube) - most robust
    try {
      const youtube = await Innertube.create();
      const info = await youtube.getInfo(videoId);
      const transcriptData = await info.getTranscript();

      if (transcriptData && transcriptData.transcript) {
        transcriptItems = transcriptData.transcript.content.body.initial_segments.map(segment => ({
          text: segment.snippet.text,
          offset: Number(segment.start_ms),
          duration: Number(segment.end_ms) - Number(segment.start_ms)
        }));

        fullText = transcriptItems.map(item => item.text).join(' ');
        
        console.log('Successfully fetched transcript using youtubei.js');
      } else {
        console.log('No transcript found with youtubei.js, trying fallback methods');
      }
    } catch (innertubeError) {
      console.log('youtubei.js method failed, trying fallback:', innertubeError.message);
    }

    // If youtubei.js didn't work, try the original method
    if (!fullText && transcriptItems.length === 0) {
      try {
        console.log('Trying fallback method with youtube-transcript');
        const transcriptData = await YoutubeTranscript.fetchTranscript(url);
        
        transcriptItems = transcriptData.map(segment => ({
          text: segment.text,
          offset: segment.offset,
          duration: segment.duration
        }));

        fullText = transcriptItems.map(item => item.text).join(' ');
        console.log('Successfully fetched transcript using youtube-transcript fallback');
      } catch (fallbackError) {
        console.log('youtube-transcript fallback also failed:', fallbackError.message);
        // If both methods fail, return an error
        throw new Error("No transcript available for this video using any method");
      }
    }

    res.status(200).json({ transcript: fullText, items: transcriptItems });
  } catch (error) {
    console.error('Transcript Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch transcript', details: error.message });
  }
}
