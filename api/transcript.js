import { Innertube } from 'youtubei.js';

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

    // Use youtubei.js (Innertube) for robust transcript fetching
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

    res.status(200).json({ transcript: fullText, items: transcriptItems });
  } catch (error) {
    console.error('Transcript Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch transcript', details: error.message });
  }
}
