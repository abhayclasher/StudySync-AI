
import React, { useState, useEffect, useRef } from 'react';
import YouTube from 'react-youtube';
import { RoadmapStep, Message, QuizQuestion, Flashcard, UserProfile } from '../types';
import { saveVideoNote, getVideoNotes, deleteVideoNote } from '../services/db';
import {
  MessageSquare,
  BrainCircuit,
  Gamepad2,
  Sparkles,
  ChevronRight,
  Send,
  Loader2,
  BookOpen,
  Dumbbell,
  CheckCircle,
  HelpCircle,
  RefreshCw,
  RotateCw,
  ChevronUp,
  ChevronDown,
  XCircle,
  Plus,
  Trash2,
  Clock,
  Save,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  sendMessageToGroq,
  generateQuiz,
  generateFlashcards,
  getYouTubeTranscript,
  generateVideoNotes
} from '../services/geminiService';
import MarkdownRenderer from './MarkdownRenderer';

// Component to render transcript with clickable timestamps
const TranscriptWithTimestamps = ({
  transcript,
  onTimestampClick
}: {
  transcript: string;
  onTimestampClick: (seconds: number) => void;
}) => {
  const parseTimestamp = (timestamp: string): number => {
    const match = timestamp.match(/\[?(\d{1,2}):(\d{2})\]?/);
    if (!match) return 0;
    const minutes = parseInt(match[1], 10);
    const seconds = parseInt(match[2], 10);
    return minutes * 60 + seconds;
  };

  const renderTranscript = () => {
    // Split transcript by lines
    const lines = transcript.split('\n');

    return lines.map((line, lineIndex) => {
      // Check if line starts with a timestamp pattern [MM:SS] or MM:SS
      const timestampMatch = line.match(/^(\[?\d{1,2}:\d{2}\]?)\s*(.*)/);

      if (timestampMatch) {
        const timestamp = timestampMatch[1];
        const text = timestampMatch[2];
        const seconds = parseTimestamp(timestamp);

        return (
          <div key={lineIndex} className="mb-2 group">
            <button
              onClick={() => onTimestampClick(seconds)}
              className="text-primary hover:text-primary/80 font-semibold mr-2 transition-colors cursor-pointer hover:underline"
            >
              {timestamp}
            </button>
            <span className="text-slate-300">{text}</span>
          </div>
        );
      }

      // Regular line without timestamp
      return (
        <div key={lineIndex} className="mb-2 text-slate-300">
          {line}
        </div>
      );
    });
  };

  return <div className="space-y-1">{renderTranscript()}</div>;
};

// Enhanced YouTube Player with auto-save, resume, playback speed, and PiP
const YouTubeEmbed = React.forwardRef(({
    url,
    startTime,
    onTimeUpdate,
    onVideoEnd
}: {
    url: string;
    startTime?: number;
    onTimeUpdate?: (currentTime: number) => void;
    onVideoEnd?: () => void;
}, ref) => {
    const playerRef = React.useRef<any>(null);
    const saveIntervalRef = React.useRef<NodeJS.Timeout | null>(null);
    const iframeRef = React.useRef<HTMLIFrameElement | null>(null);
    
    // Expose player methods to parent component
    React.useImperativeHandle(ref, () => ({
        seekTo: (seconds: number, allowSeekAhead?: boolean) => {
            if (playerRef.current) {
                playerRef.current.seekTo(seconds, allowSeekAhead);
            }
        },
        getCurrentTime: () => {
            if (playerRef.current) {
                return playerRef.current.getCurrentTime();
            }
            return 0;
        }
    }));

  // Playback speed state (persisted in localStorage)
  const [playbackSpeed, setPlaybackSpeed] = React.useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('video_playback_speed');
      return saved ? parseFloat(saved) : 1;
    }
    return 1;
  });

  // Picture-in-Picture state
  const [isPiPActive, setIsPiPActive] = React.useState(false);

  const getYoutubeId = (url: string) => {
    try {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|\/live\/)([^#\&?]*).*/;
      const match = url.match(regExp);
      if (match && match[2] && match[2].length === 11) {
        return match[2];
      }
      const urlObj = new URL(url, window.location.origin);
      const vParam = urlObj.searchParams.get('v');
      if (vParam && vParam.length === 11) {
        return vParam;
      }
      return null;
    } catch (e) {
      console.warn("Error parsing YouTube URL:", e);
      return null;
    }
  };

  const videoId = getYoutubeId(url);

  const onReady = (event: any) => {
    playerRef.current = event.target;
    iframeRef.current = event.target.getIframe();

    // Apply saved playback speed
    if (playbackSpeed !== 1) {
      playerRef.current.setPlaybackRate(playbackSpeed);
    }

    // Start from saved timestamp if available
    if (startTime && startTime > 0) {
      playerRef.current.seekTo(startTime, true);
    }

    // Auto-save progress every 10 seconds
    saveIntervalRef.current = setInterval(() => {
      if (playerRef.current && onTimeUpdate) {
        const currentTime = playerRef.current.getCurrentTime();
        if (currentTime > 0) {
          onTimeUpdate(currentTime);
        }
      }
    }, 10000); // Save every 10 seconds
  };

  const onEnd = () => {
    // Clear interval when video ends
    if (saveIntervalRef.current) {
      clearInterval(saveIntervalRef.current);
    }
    // Trigger auto-complete
    if (onVideoEnd) {
      onVideoEnd();
    }
  };

  const onPause = () => {
    // Save immediately when user pauses
    if (playerRef.current && onTimeUpdate) {
      const currentTime = playerRef.current.getCurrentTime();
      if (currentTime > 0) {
        onTimeUpdate(currentTime);
      }
    }
  };

  // Handle playback speed change
  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    localStorage.setItem('video_playback_speed', speed.toString());
    if (playerRef.current) {
      playerRef.current.setPlaybackRate(speed);
    }
  };

  // Handle Picture-in-Picture toggle
  const togglePiP = async () => {
    if (!iframeRef.current) return;

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsPiPActive(false);
      } else {
        // For YouTube iframe, we need to request PiP on the video element inside
        const videoElement = iframeRef.current.contentDocument?.querySelector('video');
        if (videoElement) {
          await (videoElement as any).requestPictureInPicture();
          setIsPiPActive(true);
        }
      }
    } catch (error) {
      console.error('PiP error:', error);
    }
  };

  // Listen for PiP events
  React.useEffect(() => {
    const handlePiPChange = () => {
      setIsPiPActive(!!document.pictureInPictureElement);
    };

    document.addEventListener('enterpictureinpicture', handlePiPChange);
    document.addEventListener('leavepictureinpicture', handlePiPChange);

    return () => {
      document.removeEventListener('enterpictureinpicture', handlePiPChange);
      document.removeEventListener('leavepictureinpicture', handlePiPChange);
    };
  }, []);

  React.useEffect(() => {
    return () => {
      // Cleanup interval on unmount
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
      }
      // Save one last time before unmounting
      if (playerRef.current && onTimeUpdate) {
        const currentTime = playerRef.current.getCurrentTime();
        if (currentTime > 0) {
          onTimeUpdate(currentTime);
        }
      }
    };
  }, []);

  if (!videoId) {
    return <div className="w-full h-full bg-black flex items-center justify-center text-slate-500">Invalid Video URL: {url}</div>;
  }

  const opts = {
    width: '100%',
    height: '100%',
    playerVars: {
      autoplay: 0,
      rel: 0,
      modestbranding: 1,
    },
  };

  const speedOptions = [0.5, 0.75, 1, 1.25, 1.5, 2];

  return (
    <div className="relative w-full h-full group">
      <YouTube
        videoId={videoId}
        opts={opts}
        onReady={onReady}
        onEnd={onEnd}
        onPause={onPause}
        className="w-full h-full"
        iframeClassName="w-full h-full"
      />

      {/* Video Controls Overlay */}
      <div className="absolute bottom-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-30">
        {/* Playback Speed Selector */}
        <div className="relative">
          <select
            value={playbackSpeed}
            onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
            className="bg-black/80 backdrop-blur-md text-white text-xs font-bold px-3 py-2 rounded-lg border border-white/20 hover:border-primary/50 cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none pr-8"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='white' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 8px center',
            }}
          >
            {speedOptions.map(speed => (
              <option key={speed} value={speed}>
                {speed}x
              </option>
            ))}
          </select>
        </div>

        {/* Picture-in-Picture Button */}
        <button
          onClick={togglePiP}
          className={`p-2.5 rounded-lg backdrop-blur-md border transition-all ${isPiPActive
            ? 'bg-primary/90 border-primary text-white'
            : 'bg-black/80 border-white/20 text-white hover:border-primary/50 hover:bg-black/90'
            }`}
          title="Picture-in-Picture"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <rect x="13" y="11" width="8" height="7" rx="1" />
          </svg>
        </button>
      </div>
    </div>

  );
});

interface VideoPlayerProps {
    video: RoadmapStep;
    onBack: () => void;
    onComplete?: (timestamp?: number) => void;
    user?: UserProfile;
    courseId?: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ video, onBack, onComplete, user, courseId }) => {
    // Player ref for controlling video playback
    const playerRef = useRef<any>(null);
  // Right Panel Tabs
  const [activeAiTab, setActiveAiTab] = useState<'chat' | 'practice'>('chat');
  // Practice Sub-Tabs
  const [practiceMode, setPracticeMode] = useState<'quiz' | 'flashcards'>('quiz');

  // Left Panel Info Tabs
  const [activeInfoTab, setActiveInfoTab] = useState<'overview' | 'notes' | 'transcript'>('overview');

  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // AI Notes State
  const [aiNotes, setAiNotes] = useState<string | null>(null);
  const [aiNotesLoading, setAiNotesLoading] = useState(false);

  // User Notes State
  const [userNotes, setUserNotes] = useState<any[]>([]);
  const [currentNoteContent, setCurrentNoteContent] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [activeNoteTab, setActiveNoteTab] = useState<'user' | 'ai'>('user');

  // Transcript State
  const [transcript, setTranscript] = useState<string | null>(null);
  const [transcriptLoading, setTranscriptLoading] = useState(false);

  // Quiz State
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizState, setQuizState] = useState<Record<number, { selected: number | null; checked: boolean }>>({});

  // Flashcard State
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [flashcardLoading, setFlashcardLoading] = useState(false);
  const [flippedCardId, setFlippedCardId] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);

  // Timestamp tracking
  const lastSavedTimeRef = useRef<number>(0);

  // Handle auto-save of progress
  const handleTimeUpdate = async (currentTime: number) => {
    // Only save if time has changed significantly (avoid excessive saves)
    if (Math.abs(currentTime - lastSavedTimeRef.current) > 5) {
      lastSavedTimeRef.current = currentTime;
      // Save to database without marking as complete
      if (video.id && courseId) {
        try {
          const { updateVideoTimestamp } = await import('../services/db');
          await updateVideoTimestamp(courseId, video.id, currentTime);
        } catch (e) {
          console.error('Failed to save progress:', e);
        }
      }
    }
  };

  // Handle auto-complete when video ends
  const handleVideoEnd = () => {
    if (!isCompleted) {
      setIsCompleted(true);
      if (onComplete) {
        onComplete(lastSavedTimeRef.current);
      }
    }
  };

  useEffect(() => {
    // Only init chat if messages array is empty (first time loading)
    if (messages.length === 0) {
      const userName = user?.name ? user.name.split(' ')[0] : 'Student';
      setMessages([
        {
          id: 'init',
          role: 'model',
          text: `Hi ${userName}! I'm watching "${video.title}" with you. Ask me to summarize it, explain concepts, or quiz you!`,
          timestamp: new Date()
        }
      ]);
    }
  }, [video, user]);

  const handleSendChat = async () => {
    if (!chatInput.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: chatInput, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsChatLoading(true);

    if (!video.videoUrl) {
      const fallbackContext = "No video URL available for this content.";
      const response = await sendMessageToGroq(messages, chatInput, fallbackContext);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: response, timestamp: new Date() }]);
      setIsChatLoading(false);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      return;
    }
    const context = await getYouTubeTranscript(video.videoUrl);
    const response = await sendMessageToGroq(messages, chatInput, context);

    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: response, timestamp: new Date() }]);
    setIsChatLoading(false);
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const generateVideoQuiz = async () => {
    if (!video.videoUrl) {
      setQuizLoading(false);
      return;
    }
    setQuizLoading(true);
    const questions = await generateQuiz(video.videoUrl, true);
    setQuizQuestions(questions);
    setQuizLoading(false);
  };

  const generateVideoFlashcards = async () => {
    if (!video.videoUrl) {
      setFlashcardLoading(false);
      return;
    }
    setFlashcardLoading(true);
    const cards = await generateFlashcards(video.videoUrl, true);
    setFlashcards(cards);
    setFlashcardLoading(false);
  };

  const handleGenerateNotes = async () => {
    if (!video.videoUrl) {
      setAiNotes("No video URL available for this content.");
      setAiNotesLoading(false);
      return;
    }
    setAiNotesLoading(true);
    try {
      const generatedNotes = await generateVideoNotes(video.videoUrl);
      setAiNotes(generatedNotes);
    } catch (error) {
      console.error('Error generating notes:', error);
      setAiNotes(null); // Optionally clear notes or set an error message
    } finally {
      setAiNotesLoading(false);
    }
  };

  const loadTranscript = async () => {
    if (aiNotes || !video.videoUrl) return;
    setAiNotesLoading(true);
    const text = await getYouTubeTranscript(video.videoUrl);
    setTranscript(text);
    setTranscriptLoading(false);
  };

  // Load user notes
  useEffect(() => {
    const loadNotes = async () => {
      if (video.videoUrl) {
        const notes = await getVideoNotes(video.videoUrl);
        setUserNotes(notes);
      }
    };
    loadNotes();
  }, [video.videoUrl]);

  const handleSaveNote = async () => {
    if (!currentNoteContent.trim() || !video.videoUrl) return;

    setIsSavingNote(true);
    let timestamp = undefined;

    // If adding a new note with timestamp, get current time
    if (!editingNoteId && playerRef.current) {
      timestamp = Math.floor(playerRef.current.getCurrentTime());
    }

    const savedNote = await saveVideoNote(
      video.videoUrl,
      courseId,
      currentNoteContent,
      timestamp,
      editingNoteId || undefined
    );

    if (savedNote) {
      if (editingNoteId) {
        setUserNotes(prev => prev.map(n => n.id === editingNoteId ? savedNote : n));
      } else {
        setUserNotes(prev => [savedNote, ...prev]);
      }
      setCurrentNoteContent('');
      setEditingNoteId(null);
    }
    setIsSavingNote(false);
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!video.videoUrl) return;
    const success = await deleteVideoNote(noteId, video.videoUrl);
    if (success) {
      setUserNotes(prev => prev.filter(n => n.id !== noteId));
    }
  };

  const handleEditNote = (note: any) => {
    setCurrentNoteContent(note.content);
    setEditingNoteId(note.id);
  };

  const handleTimestampClick = (seconds: number) => {
    if (playerRef.current) {
      playerRef.current.seekTo(seconds);
    }
  };

  useEffect(() => {
    if (activeInfoTab === 'transcript') {
      loadTranscript();
    }
  }, [activeInfoTab]);

  const quickActions = [
    { label: 'Summarize', action: () => { setChatInput('Summarize this video'); handleSendChat(); } },
    { label: 'Key Points', action: () => { setChatInput('List the key takeaways'); handleSendChat(); } },
    { label: 'Explain Code', action: () => { setChatInput('Explain the code examples shown'); handleSendChat(); } },
  ];

  const handleMarkComplete = () => {
    if (isCompleted) return;
    setIsCompleted(true);
    // TODO: Pass actual timestamp if available
    if (onComplete) onComplete(0);
  };

  // Mobile Chat State
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1280);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="h-full flex flex-col xl:flex-row overflow-hidden bg-[#020202] relative">

      {/* LEFT PANEL: Video & Content */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto custom-scrollbar relative">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/10 to-transparent pointer-events-none" />

        <div className="w-full max-w-[95%] mx-auto p-3 md:p-6 pb-24 xl:pb-10 relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <button onClick={onBack} className="group flex items-center justify-center w-8 h-8 md:w-auto md:h-auto md:px-3 md:py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full md:rounded-lg text-slate-400 hover:text-white transition-all mr-3 md:mr-4">
                <ChevronRight className="rotate-180 relative right-[1px] md:right-0" size={16} />
                <span className="hidden md:inline ml-1 text-xs font-bold">Back</span>
              </button>
              <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3">
                <h2 className="text-base md:text-xl font-bold text-white truncate max-w-[180px] md:max-w-md tracking-tight">{video.title}</h2>
                <div className="flex gap-2">
                  {video.isLive && (
                    <span className="bg-red-500/20 text-red-400 border border-red-500/20 text-[10px] px-2 py-0.5 rounded-full animate-pulse font-bold flex items-center"><span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1"></span>LIVE</span>
                  )}
                  {video.isUpcoming && (
                    <span className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/20 text-[10px] px-2 py-0.5 rounded-full font-bold">UPCOMING</span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={handleMarkComplete}
              disabled={isCompleted}
              className={`px-3 py-1.5 md:px-5 md:py-2.5 rounded-xl text-xs md:text-sm font-bold flex items-center transition-all shadow-lg ${isCompleted ? 'bg-green-500/10 text-green-400 border border-green-500/20 cursor-default' : 'bg-primary hover:bg-primary/90 text-white shadow-primary/25 hover:shadow-primary/40 active:scale-95'}`}
            >
              {isCompleted ? <><CheckCircle size={14} className="mr-1.5" /> Done</> : 'Mark Complete'}
            </button>
          </div>

          {/* Video Frame */}
          <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.5)] border border-white/10 mb-6 z-10 group">
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-20" />
            <YouTubeEmbed
                url={video.videoUrl || ''}
                startTime={video.lastWatchedTimestamp}
                onTimeUpdate={handleTimeUpdate}
                onVideoEnd={handleVideoEnd}
                ref={playerRef}
            />
          </div>

          {/* Info Tabs Panel */}
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl flex flex-col overflow-hidden shadow-2xl min-h-[400px]">
            <div className="flex border-b border-white/5 bg-black/40 backdrop-blur-sm overflow-x-auto no-scrollbar p-1">
              {['overview', 'notes', 'transcript'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveInfoTab(tab as any)}
                  className={`flex-1 px-4 py-2.5 text-xs md:text-sm font-bold rounded-xl transition-all whitespace-nowrap capitalize ${activeInfoTab === tab ? 'bg-white/10 text-white shadow-inner' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="p-5 md:p-8">
              {/* OVERVIEW */}
              {activeInfoTab === 'overview' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                  <h3 className="text-lg md:text-2xl font-bold text-white mb-4">{video.title}</h3>
                  <p className="text-slate-400 text-sm md:text-base leading-relaxed mb-8">{video.description}</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 border border-white/5 p-4 rounded-2xl">
                      <p className="text-slate-500 text-[10px] uppercase font-bold mb-1 tracking-wider">Duration</p>
                      <p className="text-white font-mono text-lg">{video.duration}</p>
                    </div>
                    <div className="bg-white/5 border border-white/5 p-4 rounded-2xl">
                      <p className="text-slate-500 text-[10px] uppercase font-bold mb-1 tracking-wider">Status</p>
                      <div className="flex items-center">
                        <span className={`w-2 h-2 rounded-full mr-2 ${isCompleted ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]'}`}></span>
                        <p className="text-white capitalize font-medium">{isCompleted ? 'Completed' : 'In Progress'}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* NOTES */}
              {activeInfoTab === 'notes' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="min-h-[200px]">
                  {/* Notes Tabs */}
                  <div className="flex items-center gap-2 mb-4 bg-black/20 p-1 rounded-lg border border-white/5 w-fit">
                    <button
                      onClick={() => setActiveNoteTab('user')}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${activeNoteTab === 'user'
                          ? 'bg-white/10 text-white shadow-sm'
                          : 'text-slate-500 hover:text-slate-300'
                        }`}
                    >
                      My Notes
                    </button>
                    <button
                      onClick={() => setActiveNoteTab('ai')}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${activeNoteTab === 'ai'
                          ? 'bg-primary/20 text-primary shadow-sm'
                          : 'text-slate-500 hover:text-slate-300'
                        }`}
                    >
                      <Sparkles size={10} />
                      AI Notes
                    </button>
                  </div>

                  {activeNoteTab === 'user' ? (
                    <div className="space-y-4">
                      {/* Note Editor */}
                      <div className="bg-black/40 border border-white/10 rounded-xl p-4">
                        <textarea
                          value={currentNoteContent}
                          onChange={(e) => setCurrentNoteContent(e.target.value)}
                          placeholder="Type your note here..."
                          className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none resize-none min-h-[80px]"
                        />
                        <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/5">
                          <div className="text-xs text-slate-500">
                            {editingNoteId ? 'Editing note...' : 'New note'}
                          </div>
                          <div className="flex gap-2">
                            {editingNoteId && (
                              <button
                                onClick={() => {
                                  setEditingNoteId(null);
                                  setCurrentNoteContent('');
                                }}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition-colors"
                              >
                                Cancel
                              </button>
                            )}
                            <button
                              onClick={handleSaveNote}
                              disabled={!currentNoteContent.trim() || isSavingNote}
                              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isSavingNote ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                              {editingNoteId ? 'Update' : 'Save Note'}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Notes List */}
                      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                        {userNotes.length === 0 ? (
                          <div className="text-center py-8 text-slate-500 text-sm">
                            <FileText className="w-8 h-8 mx-auto mb-2 opacity-20" />
                            <p>No notes yet. Start typing above!</p>
                          </div>
                        ) : (
                          userNotes.map((note) => (
                            <div key={note.id} className="bg-white/5 border border-white/5 rounded-xl p-3 hover:border-white/10 transition-colors group">
                              <div className="flex justify-between items-start mb-2">
                                {note.timestamp !== undefined && (
                                  <button
                                    onClick={() => handleTimestampClick(note.timestamp)}
                                    className="flex items-center gap-1 text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded hover:bg-primary/20 transition-colors"
                                  >
                                    <Clock size={10} />
                                    {Math.floor(note.timestamp / 60)}:{String(note.timestamp % 60).padStart(2, '0')}
                                  </button>
                                )}
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
                                  <button
                                    onClick={() => handleEditNote(note)}
                                    className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
                                  >
                                    <FileText size={12} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteNote(note.id)}
                                    className="p-1.5 hover:bg-red-500/20 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>
                              <p className="text-sm text-slate-300 whitespace-pre-wrap">{note.content}</p>
                              <div className="mt-2 text-[10px] text-slate-600">
                                {new Date(note.created_at).toLocaleDateString()}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ) : (
                    // AI Notes Content
                    !aiNotes ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                          <BookOpen size={24} className="text-slate-400" />
                        </div>
                        <h4 className="text-white font-bold mb-2 text-lg">No notes yet</h4>
                        <p className="text-slate-500 text-sm mb-6 max-w-xs">Generate structured study notes from this video using AI.</p>
                        <button
                          onClick={handleGenerateNotes}
                          disabled={aiNotesLoading}
                          className="px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold text-sm flex items-center transition-all shadow-lg shadow-primary/20 hover:shadow-primary/40 active:scale-95"
                        >
                          {aiNotesLoading ? <Loader2 className="animate-spin mr-2" /> : <Sparkles className="mr-2 w-4 h-4" />}
                          Generate AI Notes
                        </button>
                      </div>
                    ) : (
                      <div className="prose prose-invert prose-sm max-w-none space-y-4">
                        <MarkdownRenderer content={aiNotes} />
                        <div className="mt-8 pt-6 border-t border-white/10 flex justify-end">
                          <button
                            onClick={handleGenerateNotes}
                            className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-400 hover:text-white flex items-center transition-colors"
                          >
                            <RefreshCw size={12} className="mr-2" /> Regenerate
                          </button>
                        </div>
                      </div>
                    )
                  )}
                </motion.div>
              )}

              {/* TRANSCRIPT */}
              {activeInfoTab === 'transcript' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="min-h-[200px]">
                  {transcriptLoading ? (
                    <div className="flex items-center justify-center py-20">
                      <Loader2 className="animate-spin text-primary w-8 h-8" />
                    </div>
                  ) : (
                    <div className="font-mono text-xs md:text-sm text-slate-400 leading-relaxed p-4 md:p-6 bg-black/40 border border-white/5 rounded-xl max-h-[500px] overflow-y-auto">
                      {transcript ? (
                        <TranscriptWithTimestamps
                          transcript={transcript}
                          onTimestampClick={(seconds) => {
                            if (playerRef.current) {
                              playerRef.current.seekTo(seconds);
                            }
                          }}
                        />
                      ) : (
                        <p className="text-slate-500 text-center py-8">No transcript available</p>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: AI Sidebar */}
      {/* RIGHT PANEL: AI Sidebar */}
      <motion.div
        className="fixed xl:relative bottom-0 left-0 right-0 xl:inset-auto z-50 w-full xl:w-[400px] flex-shrink-0 bg-[#050505] border-t xl:border-t-0 xl:border-l border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] xl:shadow-2xl flex flex-col will-change-transform"
        initial={false}
        animate={isMobile ? (isMobileChatOpen ? { y: 0 } : { y: "calc(85vh - 4rem)" }) : { y: 0 }}
        style={{ height: isMobile ? "85vh" : "auto" }}
        transition={{ type: "spring", damping: 30, stiffness: 300, mass: 0.8 }}
      >

        {/* AI Header */}
        <div
          className="p-4 border-b border-white/5 bg-black/50 backdrop-blur-md flex items-center justify-between flex-shrink-0 cursor-pointer xl:cursor-default h-16"
          onClick={() => setIsMobileChatOpen(!isMobileChatOpen)}
        >
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center mr-3 shadow-lg shadow-indigo-500/20">
              <Sparkles size={16} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">StudySync AI</h3>
              <p className="text-[10px] text-slate-400">Powered by Llama 3</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] font-bold text-green-500 uppercase">Online</span>
            </div>
            <div className="xl:hidden text-slate-400 bg-white/5 p-1.5 rounded-full">
              {isMobileChatOpen ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            </div>
          </div>
        </div>

        {/* Content Container */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#050505]">
          {/* Main Tabs */}
          <div className="px-4 pt-4 pb-2 flex-shrink-0">
            <div className="flex bg-black/40 p-1 rounded-xl border border-white/5 relative">
              {[
                { id: 'chat', label: 'Chat', icon: MessageSquare, activeClass: 'text-white' },
                { id: 'practice', label: 'Practice', icon: Dumbbell, activeClass: 'text-white' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={(e) => { e.stopPropagation(); setActiveAiTab(tab.id as any); }}
                  className={`flex-1 flex items-center justify-center py-2.5 rounded-lg text-xs font-bold transition-all relative z-10 ${activeAiTab === tab.id ? tab.activeClass : 'text-slate-500 hover:text-slate-300'}`}
                >
                  <tab.icon size={14} className={`mr-1.5 ${activeAiTab === tab.id ? (tab.id === 'chat' ? 'text-indigo-400' : 'text-emerald-400') : ''}`} />
                  {tab.label}
                  {activeAiTab === tab.id && (
                    <motion.div
                      className={`absolute inset-0 rounded-lg shadow-sm -z-10 ${tab.id === 'chat' ? 'bg-indigo-600/20 border border-indigo-500/30' : 'bg-emerald-600/20 border border-emerald-500/30'}`}
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden relative">

            {/* CHAT TAB */}
            {activeAiTab === 'chat' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="absolute inset-0 flex flex-col"
              >
                {/* Messages - with calculated height to leave room for quick actions and input */}
                <div
                  className="overflow-y-auto p-4 space-y-4 custom-scrollbar"
                  style={{
                    // Mobile: 85vh - 64px (header) - 56px (tabs) - 140px (quick actions + input) = calc(85vh - 260px)
                    // Desktop: 100% - 140px
                    height: 'calc(100% - 140px)',
                    maxHeight: 'calc(85vh - 260px)', // For mobile
                    minHeight: '150px'
                  }}
                >
                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-2xl p-3.5 text-sm shadow-md ${msg.role === 'user' ? 'bg-primary text-white rounded-tr-sm' : 'bg-[#1a1a1a] border border-white/5 text-slate-200 rounded-tl-sm'
                        }`}>
                        {msg.role === 'model' ? (
                          <MarkdownRenderer content={msg.text} />
                        ) : (
                          <div className="whitespace-pre-wrap">{msg.text}</div>
                        )}
                      </div>
                    </div>
                  ))}
                  {isChatLoading && (
                    <div className="flex justify-start"><div className="bg-[#1a1a1a] border border-white/5 rounded-2xl rounded-tl-sm p-3"><Loader2 className="animate-spin w-4 h-4 text-slate-400" /></div></div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Quick Actions - Fixed height */}
                <div className="px-4 py-2 flex gap-2 overflow-x-auto no-scrollbar flex-shrink-0" style={{ height: '48px', minHeight: '48px' }}>
                  {quickActions.map((qa, i) => (
                    <button
                      key={i}
                      onClick={qa.action}
                      className="whitespace-nowrap px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full text-[10px] font-bold text-slate-300 transition-colors flex items-center hover:border-primary/30"
                    >
                      <Sparkles size={10} className="mr-1.5 text-purple-400" /> {qa.label}
                    </button>
                  ))}
                </div>

                {/* Input - Fixed height with safe area for mobile keyboards */}
                <div
                  className="p-3 md:p-4 bg-black/50 border-t border-white/5 backdrop-blur-sm flex-shrink-0"
                  style={{
                    minHeight: '92px',
                    paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' // Account for mobile notches/home indicators
                  }}
                >
                  <div className="relative">
                    <input
                      className="w-full bg-[#111] border border-white/10 rounded-xl pl-4 pr-12 py-3 md:py-3.5 text-sm text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-slate-600"
                      placeholder="Ask about the video..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                    />
                    <button
                      onClick={handleSendChat}
                      disabled={!chatInput.trim() || isChatLoading}
                      className="absolute right-2 top-1.5 md:top-2 p-1.5 bg-primary rounded-lg text-white disabled:opacity-50 hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* PRACTICE TAB */}
            {activeAiTab === 'practice' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="absolute inset-0 flex flex-col"
              >

                {/* Sub Tabs */}
                <div className="px-4 pb-2">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setPracticeMode('quiz')}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${practiceMode === 'quiz' ? 'bg-purple-500/10 border-purple-500/50 text-purple-400' : 'bg-white/5 border-transparent text-slate-500 hover:text-white'}`}
                    >
                      Quiz
                    </button>
                    <button
                      onClick={() => setPracticeMode('flashcards')}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${practiceMode === 'flashcards' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-white/5 border-transparent text-slate-500 hover:text-white'}`}
                    >
                      Flashcards
                    </button>
                  </div>
                </div>

                {/* Flashcards Content */}
                {practiceMode === 'flashcards' && (
                  <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
                    {flashcards.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-64 text-center">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-5 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                          <BrainCircuit size={28} className="text-emerald-400" />
                        </div>
                        <h4 className="text-white font-bold mb-2">Generate Flashcards</h4>
                        <p className="text-slate-300 text-xs mb-6 px-8 leading-relaxed max-w-[280px] mx-auto">Create active recall cards from this video to boost your long-term retention.</p>
                        <button
                          onClick={generateVideoFlashcards}
                          disabled={flashcardLoading}
                          className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white rounded-xl font-bold text-xs flex items-center transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 active:scale-95"
                        >
                          {flashcardLoading ? <Loader2 className="animate-spin mr-2 w-3 h-3" /> : <Sparkles className="mr-2 w-3 h-3" />}
                          Generate Cards
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4 pb-10">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-emerald-400 tracking-wider flex items-center"><BrainCircuit size={12} className="mr-1.5" /> {flashcards.length} CARDS</span>
                          <button onClick={() => setFlashcards([])} className="text-[10px] font-bold text-red-400 hover:text-red-300 flex items-center bg-red-500/10 hover:bg-red-500/20 px-2.5 py-1.5 rounded-lg transition-colors"><RefreshCw size={10} className="mr-1.5" /> Reset</button>
                        </div>
                        {flashcards.map((card, i) => (
                          <div
                            key={i}
                            className="group perspective-1000 h-60 cursor-pointer"
                            onClick={() => setFlippedCardId(flippedCardId === card.id ? null : card.id)}
                          >
                            <motion.div
                              className="relative w-full h-full transition-all duration-500 transform-style-3d"
                              animate={{ rotateY: flippedCardId === card.id ? 180 : 0 }}
                            >
                              {/* Front */}
                              <div className="absolute inset-0 backface-hidden bg-[#0a0a0a] border border-white/10 p-6 rounded-2xl flex flex-col items-center justify-center text-center hover:border-emerald-500/30 transition-all shadow-lg group-hover:shadow-emerald-500/5">
                                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none" />
                                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center mb-3">
                                  <span className="text-emerald-400 font-bold text-xs">Q</span>
                                </div>
                                <p className="text-white text-sm font-medium leading-relaxed">{card.front}</p>
                                <div className="absolute bottom-4 text-[10px] text-slate-400 flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-full">
                                  <RotateCw size={10} /> Tap to flip
                                </div>
                              </div>
                              {/* Back */}
                              <div className="absolute inset-0 backface-hidden rotate-y-180 bg-[#0a0a0a] border border-emerald-500/30 p-6 rounded-2xl flex flex-col items-center justify-center text-center shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                                <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/10 to-transparent rounded-2xl pointer-events-none" />
                                <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
                                  <span className="text-emerald-400 font-bold text-xs">A</span>
                                </div>
                                <p className="text-slate-100 text-sm leading-relaxed font-medium">{card.back}</p>
                              </div>
                            </motion.div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Quiz Content */}
                {practiceMode === 'quiz' && (
                  <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
                    {quizQuestions.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-64 text-center">
                        <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-5 shadow-[0_0_15px_rgba(168,85,247,0.1)]">
                          <Gamepad2 size={28} className="text-purple-400" />
                        </div>
                        <h4 className="text-white font-bold mb-2">Take a Quiz</h4>
                        <p className="text-slate-300 text-xs mb-6 px-8 leading-relaxed max-w-[280px] mx-auto">Test your knowledge with AI-generated questions based on this video.</p>
                        <button
                          onClick={generateVideoQuiz}
                          disabled={quizLoading}
                          className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white rounded-xl font-bold text-xs flex items-center transition-all shadow-lg shadow-purple-600/20 hover:shadow-purple-600/40 active:scale-95"
                        >
                          {quizLoading ? <Loader2 className="animate-spin mr-2 w-3 h-3" /> : <Sparkles className="mr-2 w-3 h-3" />}
                          Create Quiz
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-6 pb-10">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-purple-400 tracking-wider flex items-center"><Gamepad2 size={12} className="mr-1.5" /> {quizQuestions.length} QUESTIONS</span>
                          <button onClick={() => { setQuizQuestions([]); setQuizState({}); }} className="text-[10px] font-bold text-red-400 hover:text-red-300 flex items-center bg-red-500/10 hover:bg-red-500/20 px-2.5 py-1.5 rounded-lg transition-colors"><RefreshCw size={10} className="mr-1.5" /> Reset</button>
                        </div>
                        {quizQuestions.map((q, i) => {
                          const qState = quizState[i] || { selected: null, checked: false };
                          return (
                            <div key={i} className="bg-[#111] border border-white/5 rounded-2xl p-5 shadow-sm">
                              <p className="text-white font-semibold mb-4 text-sm leading-relaxed"><span className="text-purple-400 mr-2">Q{i + 1}.</span>{q.question}</p>
                              <div className="space-y-2.5">
                                {q.options.map((opt, idx) => {
                                  let btnClass = "bg-black/40 border-white/5 text-slate-300 hover:bg-white/5 hover:border-purple-500/30";
                                  let indicatorClass = "border-white/10 text-slate-500 group-hover:border-purple-500 group-hover:text-purple-500 bg-black";

                                  if (qState.checked) {
                                    if (idx === q.correctAnswer) {
                                      btnClass = "bg-green-500/10 border-green-500/50 text-green-400";
                                      indicatorClass = "border-green-500 bg-green-500 text-black";
                                    } else if (idx === qState.selected) {
                                      btnClass = "bg-red-500/10 border-red-500/50 text-red-400";
                                      indicatorClass = "border-red-500 bg-red-500 text-white";
                                    } else {
                                      btnClass = "opacity-50 border-white/5 text-slate-500";
                                    }
                                  } else if (qState.selected === idx) {
                                    btnClass = "bg-purple-500/10 border-purple-500 text-white";
                                    indicatorClass = "border-purple-500 bg-purple-500 text-white";
                                  }

                                  return (
                                    <button
                                      key={idx}
                                      onClick={() => {
                                        if (!qState.checked) {
                                          setQuizState(prev => ({ ...prev, [i]: { ...prev[i], selected: idx } }));
                                        }
                                      }}
                                      disabled={qState.checked}
                                      className={`w-full text-left p-3 rounded-xl text-xs border cursor-pointer transition-all flex items-center group ${btnClass}`}
                                    >
                                      <div className={`w-6 h-6 rounded-full border mr-3 flex items-center justify-center text-[10px] font-bold transition-colors flex-shrink-0 ${indicatorClass}`}>
                                        {String.fromCharCode(65 + idx)}
                                      </div>
                                      <span className="flex-1 leading-relaxed">{opt}</span>
                                      {qState.checked && idx === q.correctAnswer && <CheckCircle size={14} className="text-green-500 ml-2 flex-shrink-0" />}
                                      {qState.checked && idx === qState.selected && idx !== q.correctAnswer && <XCircle size={14} className="text-red-500 ml-2 flex-shrink-0" />}
                                    </button>
                                  );
                                })}
                              </div>
                              {!qState.checked && qState.selected !== null && (
                                <button
                                  onClick={() => setQuizState(prev => ({ ...prev, [i]: { ...prev[i], checked: true } }))}
                                  className="mt-4 w-full py-2.5 bg-white hover:bg-slate-200 text-black rounded-xl text-xs font-bold transition-colors shadow-lg shadow-white/5"
                                >
                                  Check Answer
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

              </motion.div>
            )}

          </div>
        </div>
      </motion.div>

    </div>
  );
};

export default VideoPlayer;
