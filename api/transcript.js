
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
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    console.log(`Fetching transcript for: ${url}`);
    const transcriptItems = await YoutubeTranscript.fetchTranscript(url);
    const fullText = transcriptItems.map(item => item.text).join(' ');
    
    res.status(200).json({ transcript: fullText, items: transcriptItems });
  } catch (error) {
    console.error('Transcript Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch transcript', details: error.message });
  }
}
