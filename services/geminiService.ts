
import { Message, RoadmapStep, Flashcard, QuizQuestion } from "../types";
import { getYouTubeThumbnailUrl, extractVideoId } from "../lib/youtubeUtils";

// Initialize API Key with robust checking
const getApiKey = () => {
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    // @ts-ignore
    return import.meta.env.VITE_GROQ_API_KEY || '';
  }
  return '';
};

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

// --- MODELS ---
const MODEL_VERSATILE = "llama-3.3-70b-versatile";
const MODEL_INSTANT = "llama-3.1-8b-instant";

const MOCK_DELAY = 1500;

// --- MOCK DATA GENERATORS ---
const getMockRoadmap = (topic: string): RoadmapStep[] => [
  {
    id: `mock-1-${Date.now()}`,
    title: `Introduction to ${topic}`,
    description: 'Fundamental concepts and overview of the subject.',
    duration: '10 min',
    status: 'pending',
    thumbnail: 'https://placehold.co/600x400/1e1e2e/FFF?text=Intro'
  },
  {
    id: `mock-2-${Date.now()}`,
    title: 'Core Principles',
    description: 'Deep dive into the main mechanics and theory.',
    duration: '25 min',
    status: 'pending',
    thumbnail: 'https://placehold.co/600x400/1e1e2e/FFF?text=Core'
  },
  {
    id: `mock-3-${Date.now()}`,
    title: 'Advanced Techniques',
    description: 'Mastering complex scenarios and edge cases.',
    duration: '40 min',
    status: 'pending',
    thumbnail: 'https://placehold.co/600x400/1e1e2e/FFF?text=Advanced'
  },
  {
    id: `mock-4-${Date.now()}`,
    title: 'Real-world Applications',
    description: 'Applying knowledge to practical projects.',
    duration: '30 min',
    status: 'pending',
    thumbnail: 'https://placehold.co/600x400/1e1e2e/FFF?text=Project'
  }
];

const getMockFlashcards = (topic: string = "general topic"): Flashcard[] => {
  const now = new Date().toISOString();
  const cleanTopic = topic.replace(/https?:\/\/[^\s]+/g, '').trim() || "general topic";
  return [
    { id: `m-1-${Date.now()}`, deck_id: 'mock-deck', front: `What is ${cleanTopic}?`, back: `A comprehensive field of study covering various aspects of ${cleanTopic}.`, interval: 0, ease_factor: 2.5, repetitions: 0, next_review_date: now, created_at: now, updated_at: now },
    { id: `m-2-${Date.now()}`, deck_id: 'mock-deck', front: 'Key Terminology', back: `Definition of important terms used in ${cleanTopic}.`, interval: 0, ease_factor: 2.5, repetitions: 0, next_review_date: now, created_at: now, updated_at: now },
    { id: `m-3-${Date.now()}`, deck_id: 'mock-deck', front: 'Common Pitfalls', back: `Mistakes to avoid when studying ${cleanTopic}.`, interval: 0, ease_factor: 2.5, repetitions: 0, next_review_date: now, created_at: now, updated_at: now },
    { id: `m-4-${Date.now()}`, deck_id: 'mock-deck', front: 'Best Practices', back: `Standard guidelines for optimal results in ${cleanTopic}.`, interval: 0, ease_factor: 2.5, repetitions: 0, next_review_date: now, created_at: now, updated_at: now },
    { id: `m-5-${Date.now()}`, deck_id: 'mock-deck', front: 'Future Trends', back: `Emerging technologies and methodologies in ${cleanTopic}.`, interval: 0, ease_factor: 2.5, repetitions: 0, next_review_date: now, created_at: now, updated_at: now },
  ];
};

const getMockQuiz = (): QuizQuestion[] => [
  { id: `q-1-${Date.now()}`, question: 'Which of the following is a key principle?', options: ['Complexity', 'Simplicity', 'Redundancy', 'Obscurity'], correctAnswer: 1, type: 'multiple-choice' },
  { id: `q-2-${Date.now()}`, question: 'When should you apply this technique?', options: ['Never', 'Always', 'In specific context', 'Randomly'], correctAnswer: 2, type: 'multiple-choice' },
  { id: `q-3-${Date.now()}`, question: 'What is the expected outcome?', options: ['Failure', 'Success', 'Confusion', 'Nothing'], correctAnswer: 1, type: 'multiple-choice' },
];


// --- HELPER FUNCTIONS ---
const callGroq = async (messages: any[], model: string = MODEL_VERSATILE, jsonMode: boolean = false) => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("GROQ_API_KEY is missing");

  const body: any = {
    model: model,
    messages: messages,
    temperature: 0.7,
    max_tokens: 4096
  };

  if (jsonMode) {
    body.response_format = { type: "json_object" };
  }

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || "Groq API Error");
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || "";
};

// Helper to clean JSON string if Llama adds extra text
const cleanAndParseJSON = (text: string) => {
  try {
    // Remove markdown code blocks if present
    let cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    // Sometimes Llama puts text before the JSON, try to find the first { or [
    const firstBracket = cleaned.search(/[\{\[]/);
    const lastBracket = cleaned.search(/[\}\]]$/);

    if (firstBracket !== -1 && lastBracket !== -1) {
      cleaned = cleaned.substring(firstBracket, lastBracket + 1);
    }
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("JSON Parse Error:", e);
    return [];
  }
};

// Helper to extract video ID from YouTube URL
const extractVideoIdFromUrl = (url: string): string | null => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|\/live\/)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

// Helper to extract video IDs from playlist URL (when API key is missing)
const extractVideoIdsFromPlaylistUrl = (url: string): string[] => {
  // For a playlist URL like https://www.youtube.com/playlist?list=PL...
  // or https://www.youtube.com/watch?v=xxx&list=PL...&index=2
  const videoIds: string[] = [];

  try {
    const urlObj = new URL(url, window.location.origin);

    // If it's a watch URL with a list parameter, try to get the video ID from v parameter
    const videoId = urlObj.searchParams.get('v');
    if (videoId && videoId.length === 11) {
      videoIds.push(videoId);
    }

    // For playlist URLs, we can't extract all videos without the YouTube API,
    // but we can at least handle the case where a watch URL contains both video and playlist info
  } catch (e) {
    console.warn("Error parsing playlist URL:", e);
    // Fallback to regex if URL parsing fails
    const videoIdMatch = url.match(/[?&]v=([^&#]*)/);
    if (videoIdMatch && videoIdMatch[1] && videoIdMatch[1].length === 11) {
      videoIds.push(videoIdMatch[1]);
    }
  }

  return videoIds;
};

// --- EXPORTS ---

/**
 * Formats raw transcript text with timestamps at 10-second intervals
 */
const formatTranscriptWithTimestamps = (rawTranscript: string): string => {
  // If already has timestamps, return as is
  if (rawTranscript.match(/\[?\d{1,2}:\d{2}\]?/)) {
    return rawTranscript;
  }

  // Split into sentences
  const sentences = rawTranscript
    .split(/(?<=[.!?])\s+/)
    .filter(s => s.trim().length > 0);

  if (sentences.length === 0) return rawTranscript;

  // Distribute across 10-second intervals
  let formatted = '';
  let currentTime = 0;
  const interval = 10; // seconds
  const sentencesPerInterval = Math.max(1, Math.floor(sentences.length / 30)); // ~5 minutes of content

  sentences.forEach((sentence, idx) => {
    if (idx % sentencesPerInterval === 0) {
      const mins = Math.floor(currentTime / 60);
      const secs = currentTime % 60;
      formatted += `\n[${mins}:${secs.toString().padStart(2, '0')}] `;
      currentTime += interval;
    }
    formatted += sentence.trim() + ' ';
  });

  return formatted.trim();
};

/**
 * Fetches YouTube transcript via Vercel Serverless Function (/api/transcript)
 */
export const getYouTubeTranscript = async (url: string): Promise<string> => {
  try {
    // Check if URL is valid before making the request
    if (!url || url.trim() === '') {
      throw new Error("Invalid YouTube URL provided");
    }

    // Use relative path for serverless deployment
    const response = await fetch('/api/transcript', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });

    if (response.ok) {
      const data = await response.json();
      if (data.transcript) {
        console.log('📝 Raw transcript received, formatting...');
        const formatted = formatTranscriptWithTimestamps(data.transcript);
        console.log('✅ Transcript formatted with timestamps');
        return formatted;
      }
    }
    throw new Error("Backend transcript fetch failed");
  } catch (e) {
    console.warn("Backend unavailable. Returning formatted mock data.", e);
    // Try to extract a meaningful topic from the URL
    let topic = "the provided content";
    try {
      const urlObj = new URL(url, window.location.origin);
      const titleParam = urlObj.searchParams.get('title');
      if (titleParam) {
        topic = decodeURIComponent(titleParam);
      } else if (url.includes('youtube.com/watch')) {
        topic = "the YouTube video";
      } else if (url.includes('youtu.be')) {
        topic = "the YouTube video";
      }
    } catch (urlError) {
      // Ignore URL parsing errors
    }

    // Return formatted mock transcript
    const mockText = `This video provides a comprehensive overview of ${topic}. We'll explore the fundamental concepts and principles that form the foundation of this subject. Understanding these basics is crucial for anyone looking to master this area. The key takeaways include practical applications and real-world examples. We'll also discuss advanced techniques and best practices. By the end of this video, you'll have a solid understanding of the core concepts. Let's dive deeper into the specific details and methodologies. These approaches have been proven effective in various scenarios. Remember to practice these concepts regularly for best results.`;

    return formatTranscriptWithTimestamps(mockText);
  }
};

/**
 * Sends a message to Groq Chat
 */
export const sendMessageToGroq = async (
  history: Message[],
  newMessage: string,
  context?: string,
  useHighReasoning: boolean = false
): Promise<string> => {
  try {
    const apiKey = getApiKey();
    if (!apiKey) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return "I'm currently in Demo Mode because the VITE_GROQ_API_KEY is missing. I can't analyze live data, but I'm ready to help you explore the app's features!";
    }

    const model = useHighReasoning ? MODEL_VERSATILE : MODEL_INSTANT;

    let systemInstruction = `You are StudySync AI, an incredibly fast and intelligent study assistant powered by Groq.
    
    🎯 **RESPONSE STRUCTURE REQUIREMENTS:**
    
    **ALWAYS format responses with clear visual hierarchy and organization:**
    
    1. **START with a clear purpose statement** - Briefly explain what you'll help with
    2. **USE descriptive headings** - Use ## for main sections, ### for subsections
    3. **ORGANIZE with lists** - Use numbered lists (1., 2., 3.) for sequences, bullet points (-) for collections
    4. **HIGHLIGHT key information** - Use **bold** for important terms, \`code\` for technical terms
    5. **BREAK up content** - Use paragraphs, not walls of text
    6. **ADD visual elements** - Use tables for comparisons, blockquotes for emphasis when appropriate
    
    📋 **MANDATORY FORMATTING RULES:**
    
    - **NEVER** send raw, unformatted text blocks
    - **ALWAYS** use proper Markdown formatting
    - **INCLUDE** at least one of these: headings, lists, tables, or code blocks
    - **USE** spacing and structure to improve readability
    - **HIGHLIGHT** key terms and concepts with formatting
    - **ORGANIZE** information in logical sections with clear headings
    
    🚫 **PROHIBITED:**
    - Plain text without formatting
    - Long paragraphs without breaks
    - Repetitive content without value
    - Missing visual hierarchy
    
    ✅ **EXPECTED OUTPUT STRUCTURE:**
    \`\`\`markdown
    ## Clear Heading
    
    Brief introduction explaining this section.
    
    ### Key Points
    1. **First point** - detailed explanation
    2. **Second point** - detailed explanation
    3. **Third point** - detailed explanation
    
    ### Additional Information
    - Supporting detail
    - Related concept
    - Practical application
    \`\`\`
    
    Guidelines:
    1. Be concise, accurate, and helpful
    2. When answering, prioritize the provided context (documents/videos)
    3. If the answer is not in the context, state that clearly, then offer general knowledge if applicable
    4. Do NOT repeat words or phrases unnecessarily
    5. Do NOT use the user's name repeatedly in your response
    6. Answer directly and professionally`;

    if (context) {
      systemInstruction += `\n\n=== CONTEXT START ===\n${context}\n=== CONTEXT END ===\n\nAnswer the user's question based on the context above. Format your response with clear headings and organized points.`;
    }

    const groqMessages = [
      { role: "system", content: systemInstruction },
      ...history.map(msg => ({
        role: msg.role === 'model' ? 'assistant' : 'user',
        content: msg.text
      })),
      { role: "user", content: newMessage }
    ];

    return await callGroq(groqMessages, model);
  } catch (error) {
    console.error("Groq Chat Error:", error);
    return "Sorry, I encountered an error connecting to the Groq LPU. Please check your API Key.";
  }
};

/**
 * Generates study notes from video context
 */
export const generateVideoNotes = async (videoUrl: string): Promise<string> => {
  try {
    const apiKey = getApiKey();
    if (!apiKey) {
      await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
      return "# Demo Notes\n\n> **Note:** These are placeholder notes because the API Key is missing.\n\n## Key Concepts\n\n1. **Introduction**: The video introduces the main topic and its relevance.\n2. **Core Mechanism**: Explains how the system functions at a high level.\n3. **Examples**: Provides real-world use cases.\n\n## Summary\n\nThe speaker emphasizes the importance of understanding the fundamentals before diving into advanced topics. Several examples were shown to illustrate the point.";
    }

    if (!videoUrl || videoUrl.trim() === '') {
      return "# Video Notes\n\n> **Note:** No video URL provided for transcript generation.\n\nUnable to generate notes without a valid video URL.";
    }
    const transcript = await getYouTubeTranscript(videoUrl);

    const messages = [
      { role: "system", content: "You are an expert tutor." },
      {
        role: "user", content: `Create structured, easy-to-read study notes based on the following video transcript. 
      Use Markdown formatting with headers, bullet points, and code blocks if necessary. 
      Highlight key definitions and takeaways. 
      
      Transcript: ${transcript.substring(0, 15000)}`
      } // Truncate to fit context if needed
    ];

    return await callGroq(messages, MODEL_VERSATILE);
  } catch (error) {
    console.error("Groq Notes Error:", error);
    return "Failed to generate notes. Please try again.";
  }
};

/**
 * Generates a study roadmap.
 */
export const generateRoadmap = async (input: string): Promise<RoadmapStep[]> => {
  try {
    const apiKey = getApiKey();
    if (!apiKey) {
      await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
      return getMockRoadmap(input);
    }

    const isUrl = input.includes('http');

    // 1. HANDLE YOUTUBE PLAYLIST, INDIVIDUAL VIDEOS, OR TOPIC SEARCH
    if (input.trim() !== '') {
      try {
        // Use relative path for serverless deployment - now using unified video endpoint
        // This endpoint now handles URLs AND search queries
        const response = await fetch('/api/video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: input })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.error) {
            console.warn("YouTube API Error:", data.error, data.details);
            // If YouTube API key is not configured or has permission issues, fall back to URL parsing
            throw new Error(data.error || 'YouTube API error');
          }
          if (!data.items || data.items.length === 0) {
            // If no items returned, fall back to URL parsing
            throw new Error('No videos found in playlist');
          }

          // Handle both playlist and individual video responses
          return data.items.map((item: any) => ({
            id: item.id || `vid-${Date.now()}-${Math.random()}`,
            title: item.title || "Untitled Video",
            description: item.description || "No description available",
            duration: item.duration || '15 min',
            status: item.status || 'pending',
            videoUrl: item.videoUrl || input,
            thumbnail: item.thumbnail || `https://placehold.co/1280x720/1e1e2e/FFF?text=${encodeURIComponent(item.title?.substring(0, 20) || 'Video')}`,
            // Live stream specific fields
            isLive: item.isLive || false,
            isUpcoming: item.isUpcoming || false,
            isCompleted: item.isCompleted || false,
            liveStreamingDetails: item.liveStreamingDetails || null
          }));
        } else {
          let errorData;
          try {
            // Try to parse as JSON first
            errorData = await response.clone().json();
          } catch (jsonError) {
            console.warn("Failed to parse error response as JSON:", jsonError);
            // If response is not JSON, read as text to see what we got
            try {
              const errorText = await response.clone().text();
              console.warn("Error response text:", errorText);
              throw new Error(`Server returned status ${response.status}: ${errorText.substring(0, 200)}`);
            } catch (textError) {
              console.warn("Failed to read error response text:", textError);
              throw new Error(`Server returned status ${response.status}: Unable to read response`);
            }
          }

          console.warn("Playlist API Error Response:", errorData);

          // Always throw an error to trigger the fallback mechanism
          // The specific error handling will happen in the catch block
          throw new Error(errorData.message || errorData.error || 'Failed to fetch playlist');
        }
      } catch (e) {
        console.warn("Failed to fetch playlist, falling back to parsing playlist URL or LLM generation", e);

        // Enhanced fallback: try to extract information from the URL directly
        try {
          const urlObj = new URL(input, window.location.origin);
          const listId = urlObj.searchParams.get('list');

          // If it's a playlist URL, create a single entry for the playlist
          if (listId) {
            // Extract a more meaningful title from the URL if possible
            const playlistTitle = urlObj.searchParams.get('title') ||
              input.split('/').pop()?.split('?')[0] ||
              `Playlist: ${listId.substring(0, 15)}...`;

            // Create a single entry representing the playlist since we can't access its contents
            // BUT, if we have a video ID in the URL as well, we might want to show that video + others
            // For now, if the API failed to fetch the playlist, we can't get the other videos easily without an API key.
            // So we will try to at least get the current video if it exists, or just the playlist placeholder.

            const videoId = extractVideoIdFromUrl(input);
            if (videoId) {
              return [{
                id: `vid-${Date.now()}-0`,
                title: playlistTitle, // Use playlist title to indicate it's part of a list
                description: "Video from playlist (Full playlist fetch failed - check API configuration)",
                duration: '15 min',
                status: 'pending',
                videoUrl: `https://www.youtube.com/watch?v=${videoId}&list=${listId}`,
                thumbnail: getYouTubeThumbnailUrl(videoId)
              }];
            }

            return [{
              id: `playlist-${listId}-${Date.now()}`,
              title: playlistTitle,
              description: "YouTube playlist. Content not accessible via API - showing as single entry.",
              duration: 'Varies',
              status: 'pending',
              videoUrl: input,
              thumbnail: `https://placehold.co/600x400/1e1e2e/FFF?text=${encodeURIComponent(playlistTitle.substring(0, 20))}`
            }];
          }
        } catch (urlError) {
          console.warn("Error parsing playlist URL for fallback:", urlError);
        }

        // If it's a single video URL, try to extract video ID and create a single-step roadmap
        const videoId = extractVideoIdFromUrl(input);
        if (videoId) {
          // Try to get a better title from URL parameters or construct from video ID
          let videoTitle = "Video Lesson";
          try {
            const urlObj = new URL(input, window.location.origin);
            // Check if there's a title parameter or try to get a meaningful name
            const titleParam = urlObj.searchParams.get('title');
            if (titleParam) {
              videoTitle = decodeURIComponent(titleParam);
            } else {
              // Try to extract a meaningful name from the URL
              const pathname = urlObj.pathname;
              if (pathname.includes('/watch')) {
                videoTitle = "YouTube Video";
              } else if (pathname.includes('/embed')) {
                videoTitle = "Embedded Video";
              } else {
                // Extract from the path if possible
                const pathParts = pathname.split('/');
                if (pathParts.length > 1) {
                  videoTitle = pathParts[pathParts.length - 1].replace(/[-_]/g, ' ');
                }
              }
            }
          } catch (e) {
            console.warn("Error parsing URL for title:", e);
          }

          return [{
            id: `vid-${Date.now()}-0`,
            title: videoTitle,
            description: "A YouTube video lesson from the provided URL.",
            duration: '15 min',
            status: 'pending',
            videoUrl: input, // Use the original URL which should contain the video ID
            thumbnail: getYouTubeThumbnailUrl(videoId)
          }];
        } else {
          // If it's not a single video URL, try to parse playlist URL for video IDs
          const videoIds = extractVideoIdsFromPlaylistUrl(input);
          if (videoIds.length > 0) {
            // Create roadmap steps for each video ID found in the playlist URL
            return videoIds.slice(0, 5).map((id, index) => ({
              id: `vid-${Date.now()}-${index}`,
              title: `Video ${index + 1}`,
              description: `Part of a YouTube playlist.`,
              duration: '15 min',
              status: 'pending',
              videoUrl: `https://www.youtube.com/watch?v=${id}`,
              thumbnail: getYouTubeThumbnailUrl(id)
            }));
          } else {
            // If all fallbacks fail, create a generic entry with the best possible title
            let fallbackTitle = "Learning Content";
            try {
              const urlObj = new URL(input, window.location.origin);
              const hostname = urlObj.hostname.replace('www.', '');
              fallbackTitle = hostname.includes('youtube') ? "YouTube Content" : hostname;
            } catch (e) {
              console.warn("Error extracting title from URL:", e);
            }

            return [{
              id: `fallback-${Date.now()}`,
              title: fallbackTitle,
              description: "Content from external source.",
              duration: 'Varies',
              status: 'pending',
              videoUrl: input,
              thumbnail: `https://placehold.co/600x400/1e1e2e/FFF?text=${encodeURIComponent(fallbackTitle.substring(0, 20))}`
            }];
          }
        }
      }
    }

    // 2. FALLBACK TO LLM GENERATION
    // Extract a clean topic name from the URL if it's a YouTube URL, otherwise use the input as is
    let topicName = input;
    if (isUrl) {
      try {
        const urlObj = new URL(input, window.location.origin);
        // If it's a YouTube URL, try to extract a meaningful name
        if (input.includes('youtube.com/playlist')) {
          // Extract title from playlist URL or use a generic name
          const listParam = urlObj.searchParams.get('list');
          const titleParam = urlObj.searchParams.get('title');

          // Try to get a more meaningful title from the URL
          if (titleParam) {
            topicName = decodeURIComponent(titleParam);
          } else if (listParam) {
            topicName = `Playlist: ${listParam.substring(0, 15)}...`;
          } else {
            topicName = "YouTube Playlist";
          }
        } else if (input.includes('youtube.com/watch') || input.includes('youtu.be')) {
          // For individual video URLs, try to extract title from URL parameters or use video ID
          const titleParam = urlObj.searchParams.get('title');
          const videoId = extractVideoIdFromUrl(input);

          if (titleParam) {
            topicName = decodeURIComponent(titleParam);
          } else if (videoId) {
            topicName = `Video: ${videoId}`;
          } else {
            topicName = "YouTube Video Series";
          }
        }
      } catch (e) {
        console.warn("Error parsing URL for topic name:", e);
        // Fallback to original logic if URL parsing fails
        if (input.includes('youtube.com/playlist')) {
          const listParam = input.match(/[?&]list=([^&#]*)/);
          topicName = listParam ? `Playlist: ${listParam[1].substring(0, 15)}...` : "YouTube Playlist";
        } else if (input.includes('youtube.com/watch') || input.includes('youtu.be')) {
          topicName = "YouTube Video Series";
        }
      }
    }

    // Ensure topicName is not a URL
    if (topicName.includes('http') || topicName.includes('www.') || topicName.includes('.com')) {
      topicName = "YouTube Study Course";
    }

    const messages = [
      { role: "system", content: "You are a curriculum designer. Return ONLY a JSON array of objects." },
      { role: "user", content: `Create a 5-step study roadmap for: "${topicName}". Do NOT include URLs in the titles. \n\nFormat: JSON Array of objects { "title": "string", "description": "string", "duration": "string" (e.g. "15 min"), "searchQuery": "string" (for YouTube search) }` }
    ];

    const jsonStr = await callGroq(messages, MODEL_VERSATILE, true);
    const steps = cleanAndParseJSON(jsonStr);

    if (Array.isArray(steps)) {
      return steps.map((s: any, i: number) => ({
        id: `step-${Date.now()}-${i}`,
        title: s.title.replace(/\s*[-–]\s*YouTube\s*$/, ''), // Clean up any YouTube suffixes
        description: s.description,
        duration: s.duration,
        status: 'pending',
        // Note: In a real app, we'd search YouTube for 's.searchQuery' to get a real video URL
        thumbnail: `https://placehold.co/600x400/1e1e2e/FFF?text=${encodeURIComponent(s.title.substring(0, 20))}`
      }));
    }

    return getMockRoadmap(topicName);
  } catch (error) {
    console.error("Roadmap Generation Error:", error);
    const cleanTopic = input.includes('http') ? 'Study Course' : input;
    return getMockRoadmap(cleanTopic);
  }
};

export const generateFlashcards = async (input: string, isYouTube: boolean = false): Promise<Flashcard[]> => {
  try {
    const apiKey = getApiKey();
    if (!apiKey) {
      await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
      // Extract topic for mock flashcards
      let topic = input;
      if (isYouTube) {
        try {
          const urlObj = new URL(input, window.location.origin);
          const titleParam = urlObj.searchParams.get('title');
          if (titleParam) {
            topic = decodeURIComponent(titleParam);
          } else {
            topic = "YouTube video content";
          }
        } catch (e) {
          topic = "YouTube video content";
        }
      }
      return getMockFlashcards(topic);
    }

    let context = input;
    if (isYouTube) {
      if (!input || input.trim() === '') {
        context = "No video URL provided for transcript generation.";
      } else {
        context = await getYouTubeTranscript(input);
      }
    }

    const messages = [
      { role: "system", content: "You are a teacher creating flashcards. Return ONLY a JSON array of objects with 'front' and 'back' properties." },
      { role: "user", content: `Create 10 flashcards based on this content: "${context.substring(0, 10000)}...". \n\nFormat: JSON Array of objects { "front": "Concept/Term", "back": "Short, concise fact or definition (max 15 words)" }` }
    ];

    const jsonStr = await callGroq(messages, MODEL_INSTANT, true);
    const data = cleanAndParseJSON(jsonStr);

    let items = [];
    if (Array.isArray(data)) items = data;
    else if (data.flashcards) items = data.flashcards;
    else if (data.cards) items = data.cards;

    const now = new Date().toISOString();
    return items.map((item: any, i: number) => ({
      id: `fc-${Date.now()}-${i}`,
      deck_id: 'generated-deck',
      front: item.front || item.question,
      back: item.back || item.answer,
      interval: 0,
      ease_factor: 2.5,
      repetitions: 0,
      next_review_date: now,
      created_at: now,
      updated_at: now
    }));

  } catch (error) {
    console.error("Generate Flashcards Error:", error);
    // Extract topic for mock flashcards
    let topic = input;
    if (isYouTube) {
      try {
        const urlObj = new URL(input, window.location.origin);
        const titleParam = urlObj.searchParams.get('title');
        if (titleParam) {
          topic = decodeURIComponent(titleParam);
        } else {
          topic = "YouTube video content";
        }
      } catch (e) {
        topic = "YouTube video content";
      }
    }
    return getMockFlashcards(topic);
  }
};

export const generateQuiz = async (input: string, isYouTube: boolean = false, difficulty: 'standard' | 'hard' | 'rapid' = 'standard'): Promise<QuizQuestion[]> => {
  try {
    const apiKey = getApiKey();
    if (!apiKey) {
      await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
      return getMockQuiz();
    }

    let context = input;
    if (isYouTube) {
      if (!input || input.trim() === '') {
        context = "No video URL provided for transcript generation.";
      } else {
        context = await getYouTubeTranscript(input);
      }
    }

    let prompt = `Create 5 multiple choice questions based on this content: "${context.substring(0, 10000)}...".`;

    if (difficulty === 'hard') {
      prompt = `Create 5 complex, multi-step reasoning multiple choice questions based on this content: "${context.substring(0, 10000)}...". Focus on advanced concepts, edge cases, and critical thinking. The questions should be challenging.`;
    } else if (difficulty === 'rapid') {
      prompt = `Create 10 short, concise, rapid-fire multiple choice questions based on this content: "${context.substring(0, 10000)}...". Questions should be fact-based and quick to read.`;
    }

    const messages = [
      { role: "system", content: "You are a teacher creating a quiz. Return ONLY a JSON array." },
      { role: "user", content: `${prompt} \n\nFormat: JSON Array of objects { "question": "string", "options": ["string", "string", "string", "string"], "correctAnswer": number (0-3) }` }
    ];

    const jsonStr = await callGroq(messages, MODEL_VERSATILE, true);
    const data = cleanAndParseJSON(jsonStr);

    let items = [];
    if (Array.isArray(data)) items = data;
    else if (data.questions) items = data.questions;
    else if (data.quiz) items = data.quiz;

    return items.map((item: any, i: number) => ({
      id: `qz-${Date.now()}-${i}`,
      question: item.question,
      options: item.options,
      correctAnswer: item.correctAnswer,
      type: 'multiple-choice'
    }));

  } catch (error) {
    console.error("Generate Quiz Error:", error);
    return getMockQuiz();
  }
};

export const extractTextFromPDF = async (file: File): Promise<string> => {
  try {
    // Dynamically import pdfjs-dist
    const pdfjsLib = await import('pdfjs-dist');

    // Use the bundled worker from the package
    // @ts-ignore - worker path may not have types
    const workerSrc = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc.default || workerSrc;

    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Load PDF document
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let fullText = '';

    // Extract text from each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += `\n\n--- Page ${pageNum} ---\n${pageText}`;
    }


    return fullText || '[PDF appears to be empty or contains only images]';
  } catch (error) {
    console.error('PDF extraction error:', error);
    return `[Error extracting PDF: ${file.name}]\n\nUnable to read PDF content. The file may be corrupted, password-protected, or contain only images.`;
  }
};

/**
 * Generates an AI-powered test series based on topic, difficulty, and optional reference papers
 * Hybrid Approach: Uses AI knowledge + optional user-provided previous papers
 */
export const generateTestSeries = async (
  topic: string,
  questionCount: number,
  difficulty: 'easy' | 'medium' | 'hard',
  examType?: string,
  referencePapers?: string
): Promise<any[]> => {
  try {
    const apiKey = getApiKey();
    if (!apiKey) {
      await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
      return getMockQuiz();
    }

    const response = await fetch('/api/generate-test-series', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic,
        questionCount,
        difficulty,
        examType,
        referencePapers
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate test series');
    }

    const data = await response.json();
    return data.questions || [];
  } catch (error) {
    console.error('Test series generation error:', error);
    throw error;
  }
};
