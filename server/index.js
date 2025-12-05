
/**
 * StudySync AI Backend Server
 * Run this with: node server/index.js
 * Requires: npm install express cors youtube-transcript dotenv
 */

require('dotenv').config({ path: '../.env' });
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
      // Treat as a search query if it's not a URL
      console.log('Treating input as search query:', url);

      try {
        const { Innertube } = require('youtubei.js');
        // Try Innertube search first
        const youtube = await Innertube.create();
        const searchResults = await youtube.search(url, { type: 'video', limit: 1 });

        if (searchResults && searchResults.results && searchResults.results.length > 0) {
          const firstResult = searchResults.results[0];

          // If it's a video
          if (firstResult.type === 'Video') {
            const videoData = {
              type: 'video',
              items: [{
                title: firstResult.title?.toString() || "YouTube Video",
                description: firstResult.description?.toString() || "No description available",
                duration: firstResult.duration?.toString() || '15 min',
                videoUrl: `https://www.youtube.com/watch?v=${firstResult.id}`,
                thumbnail: firstResult.thumbnails ? firstResult.thumbnails[0].url : `https://placehold.co/1280x720/1e1e2e/FFF?text=Video`
              }],
              originalUrl: `https://www.youtube.com/watch?v=${firstResult.id}`,
              videoId: firstResult.id
            };
            return res.json(videoData);
          }
        }

        // Fallback to youtube-sr search
        console.log('Falling back to youtube-sr search');
        const YouTube = require("youtube-sr").default;
        const video = await YouTube.searchOne(url);

        if (video) {
          const videoData = {
            type: 'video',
            items: [{
              title: video.title || "YouTube Video",
              description: video.description || "No description available",
              duration: video.durationFormatted || '15 min',
              videoUrl: `https://www.youtube.com/watch?v=${video.id}`,
              thumbnail: video.thumbnail?.url || video.thumbnail || `https://placehold.co/1280x720/1e1e2e/FFF?text=Video`,
              isLive: video.live || false
            }],
            originalUrl: `https://www.youtube.com/watch?v=${video.id}`,
            videoId: video.id
          };
          return res.json(videoData);
        }

        return res.status(404).json({ error: 'No results found for query' });

      } catch (searchError) {
        console.error('Search Error:', searchError);
        return res.status(500).json({ error: 'Search failed', details: searchError.message });
      }
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

// --- AI Test Series Generation API ---
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

app.post('/api/generate-test-series', async (req, res) => {
  try {
    console.log('Test Series API called with body:', req.body);
    const { topic, questionCount, difficulty, examType, referencePapers, syllabusYear, questionTypes } = req.body;

    // Validation
    if (!topic || !questionCount) {
      return res.status(400).json({ error: 'Topic and question count are required' });
    }

    if (questionCount < 10 || questionCount > 100) {
      return res.status(400).json({ error: 'Question count must be between 10 and 100' });
    }

    const validDifficulties = ['easy', 'medium', 'hard'];
    const selectedDifficulty = difficulty || 'medium';
    if (!validDifficulties.includes(selectedDifficulty)) {
      return res.status(400).json({ error: 'Invalid difficulty level' });
    }

    // Construct AI prompt based on difficulty and exam type
    let difficultyInstruction = '';
    switch (selectedDifficulty) {
      case 'easy':
        difficultyInstruction = 'Create easy-level questions focusing on basic concepts, definitions, and fundamental understanding. Questions should be straightforward and test recall of key facts.';
        break;
      case 'medium':
        difficultyInstruction = 'Create medium-level questions that require application of concepts, understanding of relationships, and basic problem-solving. Mix conceptual and application-based questions.';
        break;
      case 'hard':
        difficultyInstruction = 'Create hard-level questions that require deep understanding, critical thinking, multi-step reasoning, and application in complex scenarios. Include tricky edge cases and advanced concepts.';
        break;
    }

    const examContext = examType ? `This is for ${examType} examination preparation.` : '';
    const syllabusContext = syllabusYear ? `Strictly adhere to the ${syllabusYear} syllabus for ${examType || 'the topic'}. Ensure questions are relevant to this specific year's curriculum changes if any.` : '';

    // Question Types Context
    let typesContext = '';
    if (questionTypes && questionTypes.length > 0) {
      typesContext = `\n\nREQUIRED QUESTION TYPES:\nGenerate a mix of the following question types:\n`;
      if (questionTypes.includes('multiple-choice')) typesContext += `- Multiple Choice Questions: Use type "single-correct-mcq". Standard 4 options.\n`;
      if (questionTypes.includes('numerical')) typesContext += `- Numerical Value Questions: Use type "numerical-integer" or "numerical-decimal". Provide exact "answer" as a number. No options.\n`;
      if (questionTypes.includes('assertion-reason')) typesContext += `- Assertion-Reason Questions: Use type "assertion-reason". Provide "assertion" and "reason" fields separately. Standard 5 options.\n`;
      if (questionTypes.includes('multiple-correct')) typesContext += `- Multiple Correct Questions: Use type "multiple-correct-mcq". Options where more than one can be correct. Provide "correctAnswers" as array of indices.\n`;
      if (questionTypes.includes('matrix-matching')) typesContext += `- Matrix Matching: Use type "matrix-matching". Two columns (A and B) to match. Provide "correctMatches" object.\n`;
      if (questionTypes.includes('paragraph-based')) typesContext += `- Paragraph Based: Use type "paragraph-based". A comprehension paragraph followed by 2-3 sub-questions.\n`;

      typesContext += `\nDistribute the ${questionCount} questions among these types.`;
    }

    // HYBRID APPROACH: Include reference papers if provided
    let referencePapersContext = '';
    if (referencePapers && referencePapers.trim().length > 0) {
      referencePapersContext = `\n\n📚 REFERENCE MATERIAL (Previous Year Questions/Papers):\n${referencePapers.substring(0, 4000)}\n\nIMPORTANT: Analyze the above reference material to understand:
1. Question patterns and styles used in previous exams
2. Common topics and subtopics that are frequently tested
3. The level of difficulty and complexity expected
4. The format and structure of questions

Use this analysis to generate NEW questions that follow similar patterns but are NOT direct copies. Create original questions that test the same concepts in different ways.`;
    } else {
      referencePapersContext = '\n\nNote: No reference papers provided. Generate questions based on your knowledge of the topic and common examination patterns.';
    }

    const systemPrompt = `You are an expert exam question generator specializing in creating high-quality questions for competitive exams. ${examContext}
${syllabusContext}

Your task is to generate ${questionCount} unique, well-crafted questions on the topic: "${topic}".

${difficultyInstruction}
${typesContext}

IMPORTANT FORMATTING RULES:
1. Return ONLY a valid JSON object with a "questions" array.
2. STRICTLY follow the JSON structure for each question type below.
3. Include brief explanations for educational value.
4. Ensure questions are diverse and cover different aspects of the topic.

REQUIRED JSON FORMATS:

For 'single-correct-mcq':
{
  "type": "single-correct-mcq",
  "question": "Question text?",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswer": 0, // Index 0-3
  "explanation": "Brief explanation",
  "difficulty": "${selectedDifficulty}",
  "subtopic": "Specific subtopic"
}

For 'numerical-integer' or 'numerical-decimal':
{
  "type": "numerical-integer", // or "numerical-decimal"
  "question": "Calculate the value...",
  "answer": 42.5, // Number only
  "explanation": "Step-by-step calculation",
  "difficulty": "${selectedDifficulty}",
  "subtopic": "Specific subtopic"
}

For 'assertion-reason':
{
  "type": "assertion-reason",
  "assertion": "Statement A text...",
  "reason": "Statement R text...",
  "options": [
    "Both Assertion and Reason are true and Reason is the correct explanation of Assertion",
    "Both Assertion and Reason are true but Reason is NOT the correct explanation of Assertion",
    "Assertion is true but Reason is false",
    "Assertion is false but Reason is true",
    "Both Assertion and Reason are false"
  ],
  "correctAnswer": 0, // Index 0-4
  "explanation": "Explanation of the logic",
  "difficulty": "${selectedDifficulty}",
  "subtopic": "Specific subtopic"
}

For 'multiple-correct-mcq':
{
  "type": "multiple-correct-mcq",
  "question": "Which of the following are correct?",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswers": [0, 2], // Array of correct indices
  "explanation": "Explanation",
  "difficulty": "${selectedDifficulty}",
  "subtopic": "Specific subtopic"
}

For 'matrix-matching':
{
  "type": "matrix-matching",
  "question": "Match the following:",
  "columnA": [
    {"id": "A", "text": "Item 1"},
    {"id": "B", "text": "Item 2"}
  ],
  "columnB": [
    {"id": "P", "text": "Match 1"},
    {"id": "Q", "text": "Match 2"},
    {"id": "R", "text": "Match 3"}
  ],
  "correctMatches": {
    "A": ["P", "Q"], // One-to-many possible
    "B": ["R"]
  },
  "explanation": "Explanation",
  "difficulty": "${selectedDifficulty}",
  "subtopic": "Specific subtopic"
}

For 'paragraph-based':
{
  "type": "paragraph-based",
  "paragraph": "Long comprehension text...",
  "questions": [
    {
      "id": "q1",
      "question": "Sub-question 1?",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": 0
    },
    {
      "id": "q2",
      "question": "Sub-question 2?",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": 2
    }
  ],
  "explanation": "Overall explanation",
  "difficulty": "${selectedDifficulty}",
  "subtopic": "Specific subtopic"
}

${referencePapersContext}`;

    // Call Groq API
    // Try multiple env var names for the key
    const apiKey = process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY;
    console.log('API Key check - VITE_GROQ_API_KEY:', !!process.env.VITE_GROQ_API_KEY);
    console.log('API Key check - GROQ_API_KEY:', !!process.env.GROQ_API_KEY);
    console.log('API Key check - GEMINI_API_KEY:', !!process.env.GEMINI_API_KEY);
    console.log('Final API Key present:', !!apiKey);

    if (!apiKey) {
      console.error('API Key missing. Checked VITE_GROQ_API_KEY, GROQ_API_KEY, GEMINI_API_KEY');
      return res.status(500).json({ error: 'API key not configured on server' });
    }

    console.log('Calling Groq API...');
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Generate ${questionCount} questions on "${topic}" at ${selectedDifficulty} difficulty level. ${referencePapers ? 'Use the reference material to understand patterns but create original questions.' : 'Create questions based on standard examination patterns for this topic.'}` }
        ],
        temperature: 0.8,
        max_tokens: 8000,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API Error:', response.status, errorText);
      throw new Error(`Groq API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    let content = data.choices[0]?.message?.content || '{}';

    // Parse and validate JSON
    let questions;
    try {
      const parsed = JSON.parse(content);
      questions = Array.isArray(parsed) ? parsed : (parsed.questions || []);
    } catch (e) {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/```\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1]);
        questions = Array.isArray(parsed) ? parsed : (parsed.questions || []);
      } else {
        console.error('JSON Parse Error. Content:', content);
        throw new Error('Failed to parse AI response');
      }
    }

    // Validate questions
    const validQuestions = questions.filter(q =>
      q.question &&
      Array.isArray(q.options) &&
      q.options.length === 4 &&
      typeof q.correctAnswer === 'number' &&
      q.correctAnswer >= 0 &&
      q.correctAnswer <= 3
    ).slice(0, questionCount);

    if (validQuestions.length === 0) {
      throw new Error('No valid questions generated');
    }

    // Add IDs to questions
    const questionsWithIds = validQuestions.map((q, index) => ({
      id: `q-${Date.now()}-${index}`,
      ...q,
      type: 'multiple-choice'
    }));

    console.log(`Successfully generated ${questionsWithIds.length} questions`);

    return res.status(200).json({
      success: true,
      questions: questionsWithIds,
      metadata: {
        topic,
        difficulty: selectedDifficulty,
        examType,
        totalQuestions: questionsWithIds.length,
        usedReferencePapers: !!referencePapers,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Test series generation error:', error);
    return res.status(500).json({
      error: 'Failed to generate test series',
      details: error.message
    });
  }
});

// --- PDF Processing API ---

app.post('/api/pdf-process', async (req, res) => {
  try {
    console.log('PDF Process API called with body:', req.body);
    const { pdfContent, taskType = 'summary', chunkSize = 2000 } = req.body;

    if (!pdfContent) {
      console.log('PDF content parameter missing for PDF process API');
      return res.status(400).json({ error: 'PDF content is required' });
    }

    const apiKey = process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.error('API Key missing. Checked VITE_GROQ_API_KEY, GROQ_API_KEY');
      return res.status(500).json({ error: 'API key not configured on server' });
    }

    // Split the PDF content into chunks
    const chunks = splitIntoChunks(pdfContent, chunkSize);

    if (chunks.length === 1) {
      // If only one chunk, process directly
      const result = await processChunkWithGroq(apiKey, chunks[0], taskType);
      return res.status(200).json({ result, chunksProcessed: 1 });
    }

    // Process each chunk and collect intermediate results
    const intermediateResults = [];
    for (let i = 0; i < chunks.length; i++) {
      console.log(`Processing chunk ${i + 1} of ${chunks.length}`);
      const chunkResult = await processChunkWithGroq(apiKey, chunks[i], taskType);
      intermediateResults.push(chunkResult);
    }

    // Consolidate all intermediate results into a final summary
    const consolidatedResult = await consolidateResultsWithGroq(apiKey, intermediateResults, taskType);

    res.status(200).json({
      result: consolidatedResult,
      chunksProcessed: chunks.length,
      chunkSize: chunkSize,
      intermediateResultsCount: intermediateResults.length
    });

  } catch (error) {
    console.error('PDF processing error:', error);
    res.status(500).json({ error: 'Failed to process PDF', details: error.message });
  }
});

// Function to split text into chunks of specified size
function splitIntoChunks(text, chunkSize) {
  const chunks = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.substring(i, i + chunkSize));
  }
  return chunks;
}

// Function to process a single chunk with Groq based on task type
async function processChunkWithGroq(apiKey, chunk, taskType) {
  let systemPrompt = '';
  let userPrompt = '';

  switch (taskType) {
    case 'summary':
      systemPrompt = 'You are an expert document summarizer. Provide a comprehensive summary focusing on key points, main arguments, and important details.';
      userPrompt = `Please provide a comprehensive summary of the following document content. Focus on key points, main arguments, and important details:\n\n${chunk}`;
      break;
    case 'detailed-summary':
      systemPrompt = 'You are an expert document analyzer. Provide a detailed, comprehensive summary that maintains all key information, main points, supporting details, and structural elements. Ensure the summary proportionally covers every section and includes all major themes, arguments, data points, and conclusions.';
      userPrompt = `Provide a detailed, comprehensive summary of the following document content that maintains all key information, main points, supporting details, and structural elements. Ensure the summary proportionally covers every section, chapter, and significant topic throughout the full document length. Include all major themes, arguments, data points, conclusions, and relevant details:\n\n${chunk}`;
      break;
    case 'key-points':
      systemPrompt = 'You are an expert at extracting key information from documents. Extract and list the most important key points, main arguments, and details.';
      userPrompt = `Extract and list the key points, main arguments, and important details from the following document content:\n\n${chunk}`;
      break;
    case 'questions':
      systemPrompt = 'You are an expert at generating questions based on document content. Generate important questions that cover the main topics and concepts.';
      userPrompt = `Based on the following document content, generate important questions that cover the main topics and concepts:\n\n${chunk}`;
      break;
    default:
      systemPrompt = 'You are an expert document summarizer. Provide a comprehensive summary of the provided content.';
      userPrompt = `Please analyze the following document content and provide a comprehensive summary:\n\n${chunk}`;
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 2000
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Groq API error: ${response.status} ${errorData.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
}

// Function to consolidate multiple intermediate results into a final comprehensive result using Groq
async function consolidateResultsWithGroq(apiKey, intermediateResults, taskType) {
  const combinedContent = intermediateResults.map((result, index) =>
    `SECTION ${index + 1}:\n${result}\n\n`
  ).join('');

  let systemPrompt = '';
  let consolidationPrompt = '';

  switch (taskType) {
    case 'summary':
    case 'detailed-summary':
      systemPrompt = 'You are an expert document consolidator. Your task is to combine multiple sections of document analysis into a single, coherent, and comprehensive summary that maintains all key information, main points, supporting details, and structural elements from the original content. Ensure the summary proportionally covers every section and includes all major themes, arguments, data points, and conclusions.';
      consolidationPrompt = `You have received multiple sections of a comprehensive document analysis. Please consolidate these sections into a single, coherent, and comprehensive summary that maintains all key information, main points, supporting details, and structural elements from the original content. Ensure the summary proportionally covers every section, chapter, and significant topic throughout the full document length, regardless of whether the PDF contains 30, 40, or more pages. The summary must include all major themes, arguments, data points, conclusions, and relevant details that would be expected from a thorough review of the complete document:\n\n${combinedContent}`;
      break;
    case 'key-points':
      systemPrompt = 'You are an expert at organizing information. Your task is to consolidate multiple sections of key points into a single, organized list that represents the most important information from the entire document.';
      consolidationPrompt = `You have received multiple sections of key points extracted from a document. Please consolidate these into a single, organized list of the most important key points, main arguments, and important details from the entire document:\n\n${combinedContent}`;
      break;
    case 'questions':
      systemPrompt = 'You are an expert at organizing questions. Your task is to consolidate multiple sections of questions into a comprehensive set that covers all main topics from the entire document.';
      consolidationPrompt = `You have received multiple sections of questions generated from a document. Please consolidate these into a single, comprehensive set of important questions that cover all main topics and concepts from the entire document:\n\n${combinedContent}`;
      break;
    default:
      systemPrompt = 'You are an expert document consolidator. Your task is to combine multiple sections of document analysis into a single, coherent summary.';
      consolidationPrompt = `You have received multiple sections of document analysis. Please consolidate these sections into a single, coherent, comprehensive summary that maintains all key information:\n\n${combinedContent}`;
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: consolidationPrompt }
      ],
      temperature: 0.7,
      max_tokens: 4000
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Groq API error during consolidation: ${response.status} ${errorData.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
}

app.listen(PORT, () => {
  console.log(`✅ Backend Server running on http://localhost:${PORT}`);
  console.log(`   - YouTube API Key configured: ${!!YOUTUBE_API_KEY}`);
  console.log(`   - Available endpoints: /api/transcript, /api/playlist, /api/pdf-process`);
});
