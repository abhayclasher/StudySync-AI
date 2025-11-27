

import React, { useState, useRef, useEffect } from 'react';
import { Message, ChatSession } from '../types';
import { sendMessageToGroq, extractTextFromPDF, processPDFWithChunking } from '../services/geminiService';
import MarkdownRenderer from './MarkdownRenderer';
import { getChatSessions, createChatSession, saveChatMessage, getChatMessages } from '../services/db';
import {
  Send, Sparkles, Bot, User, Paperclip, FileText, X, Loader2, Plus,
  Search, BrainCircuit, PanelLeftClose, PanelLeftOpen, Zap, MessageSquare, History, Mic, Square
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { UserProfile } from '../types';

interface ChatInterfaceProps {
  user?: UserProfile;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ user }) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [attachedFile, setAttachedFile] = useState<{ name: string, content: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [model, setModel] = useState<'instant' | 'versatile'>('instant');
  const [isDeepThink, setIsDeepThink] = useState(false);

  // Voice input state
  const [isListening, setIsListening] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  // @ts-ignore - SpeechRecognition types are browser-specific
  const recognitionRef = useRef<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    loadSessions();
    const handleResize = () => {
      if (window.innerWidth < 1024) setIsSidebarOpen(false);
      else setIsSidebarOpen(true);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initialize speech recognition
  useEffect(() => {
    // @ts-ignore - SpeechRecognition types are browser-specific
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSpeechSupported(true);
      // @ts-ignore - SpeechRecognition constructor
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setInterimTranscript('');
      };

      // @ts-ignore - SpeechRecognition event types
      recognitionRef.current.onresult = (event: any) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            const finalTranscript = event.results[i][0].transcript;
            setInput(prev => prev + (prev ? ' ' : '') + finalTranscript);
            setInterimTranscript('');
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        setInterimTranscript(interim);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        setInterimTranscript('');
      };

      // @ts-ignore - SpeechRecognition error event types
      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        setInterimTranscript('');
      };
    }
  }, []);

  // Defer session loading to improve initial render performance
  useEffect(() => {
    const timer = setTimeout(() => {
      loadSessions();
    }, 150); // Load sessions after UI renders

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [input]);

  const loadSessions = async () => {
    const loaded = await getChatSessions();
    setSessions(loaded);
  };

  const startNewChat = async () => {
    setMessages([]);
    setActiveSessionId(null);
    setAttachedFile(null);
    setInput('');
    if (window.innerWidth < 768) setIsSidebarOpen(false);
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  const loadSession = async (id: string) => {
    if (activeSessionId === id) return;
    setActiveSessionId(id);
    setMessages([]);
    setIsLoading(true);
    try {
      const msgs = await getChatMessages(id);
      setMessages(msgs);
      if (window.innerWidth < 768) setIsSidebarOpen(false);
    } catch (e) {
      console.error("Failed to load session", e);
    } finally {
      setIsLoading(false);
      setTimeout(scrollToBottom, 100);
    }
  };

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(scrollToBottom, [messages, isLoading]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setIsUploading(true);
      try {
        // Check if the input suggests a summary request
        const isSummaryRequest = input.toLowerCase().includes('summarize') ||
                                input.toLowerCase().includes('summary') ||
                                input.toLowerCase().includes('analyze') ||
                                input.toLowerCase().includes('overview');
        
        let content;
        if (isSummaryRequest && file.type === 'application/pdf') {
          // Use chunked processing for PDF summarization requests
          content = await processPDFWithChunking(file, 'detailed-summary');
        } else {
          // Use regular extraction for other requests
          content = await extractTextFromPDF(file);
        }
        
        setAttachedFile({ name: file.name, content: content });
      } catch (err) {
        console.error(err);
        // Fallback to regular extraction if chunked processing fails
        try {
          const text = await extractTextFromPDF(file);
          setAttachedFile({ name: file.name, content: text });
        } catch (fallbackErr) {
          console.error('Fallback extraction also failed:', fallbackErr);
        }
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if ((!textToSend.trim() && !attachedFile) || isLoading) return;

    let currentSessionId = activeSessionId;
    if (!currentSessionId) {
      const title = textToSend.substring(0, 30) + (textToSend.length > 30 ? '...' : '');
      currentSessionId = await createChatSession(title);
      setActiveSessionId(currentSessionId);
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: textToSend,
      timestamp: new Date(),
      attachments: attachedFile ? [{ name: attachedFile.name, type: 'file' }] : undefined
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setIsLoading(true);

    await saveChatMessage(currentSessionId, userMsg, messages.length === 0 ? textToSend.substring(0, 30) : undefined);
    await loadSessions();

    const context = attachedFile ? `DOCUMENT CONTENT:\n${attachedFile.content}\n\n` : undefined;
    let prompt = textToSend;
    if (isDeepThink) prompt = `[Deep Thinking Mode] ${textToSend}`;

    try {
      const responseText = await sendMessageToGroq(messages, prompt, context, isDeepThink || model === 'versatile');
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMsg]);
      await saveChatMessage(currentSessionId, aiMsg);
      await loadSessions();
    } catch (e) {
      setMessages(prev => [...prev, { id: 'err', role: 'model', text: "Sorry, I couldn't connect to Groq.", timestamp: new Date() }]);
    } finally {
      setIsLoading(false);
      setAttachedFile(null);
    }
  };

  const toggleVoiceInput = () => {
    if (!isSpeechSupported) {
      console.warn('Speech recognition not supported in this browser');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
    }
  };

  return (
    <div className="flex h-full bg-[#020202] md:border md:border-white/10 md:rounded-3xl overflow-hidden relative md:shadow-2xl font-sans">
      {/* SIDEBAR */}
      <div className={`
        absolute inset-y-0 left-0 z-40 bg-[#050505] border-r border-white/5 w-[280px] transform transition-transform duration-300 ease-in-out flex flex-col
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0 md:flex md:flex-col ${!isSidebarOpen ? 'md:w-0 md:border-none' : ''}
      `}>
        <div className="p-4 border-b border-white/5 bg-black/20">
          <button
            onClick={startNewChat}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-3.5 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/20 group border border-white/10"
          >
            <Plus size={18} className="group-hover:rotate-90 transition-transform" />
            <span>New Session</span>
          </button>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden absolute top-4 right-4 text-slate-400 hover:text-white bg-white/5 p-1 rounded-lg"><PanelLeftClose size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4 custom-scrollbar space-y-1">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-3 flex items-center gap-2">
            <History size={12} /> Recent Chats
          </h3>
          {sessions.length === 0 && (
            <div className="flex flex-col items-center justify-center mt-10 opacity-50">
              <MessageSquare size={32} className="text-slate-600 mb-2" />
              <p className="text-center text-slate-500 text-xs italic">No chat history found</p>
            </div>
          )}
          {sessions.map(session => (
            <button
              key={session.id}
              onClick={() => loadSession(session.id)}
              className={`w-full text-left p-3 rounded-xl mb-1 transition-all group border relative overflow-hidden flex flex-col gap-1 ${activeSessionId === session.id
                ? 'bg-white/5 border-white/10 text-white shadow-md'
                : 'border-transparent text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`}
            >
              {activeSessionId === session.id && <div className="absolute left-0 top-3 bottom-3 w-1 bg-blue-500 rounded-r-full"></div>}
              <div className="text-sm font-medium truncate pl-2 pr-1">{session.title || 'Untitled Chat'}</div>
              <div className="text-[10px] opacity-60 truncate flex justify-between pl-2 text-slate-500 group-hover:text-slate-400 font-mono">
                <span>{new Date(session.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                <span>{new Date(session.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-white/5 bg-black/20">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-lg">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{user?.name || 'User'}</p>
              <p className="text-[10px] text-slate-500 truncate">Free Plan</p>
            </div>
          </div>
        </div>
      </div>

      {isSidebarOpen && <div className="md:hidden absolute inset-0 bg-black/60 z-30 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)}></div>}

      {/* MAIN CHAT */}
      <div className="flex-1 flex flex-col h-full relative min-w-0 bg-[#020202]">
        <div className="absolute inset-0 bg-gradient-to-b from-[#050505] to-black pointer-events-none" />

        {/* HEADER */}
        <header className="h-14 md:h-16 border-b border-white/5 flex items-center justify-between px-4 md:px-6 z-20 bg-black/80 backdrop-blur-md sticky top-0 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-colors">
              {isSidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
            </button>
            <div className="h-6 w-[1px] bg-white/10 mx-1 hidden md:block"></div>
            <div className="flex items-center bg-white/5 rounded-lg p-1 border border-white/5">
              <button onClick={() => setModel('instant')} className={`px-3 py-1.5 rounded-md text-[10px] md:text-xs font-bold transition-all ${model === 'instant' ? 'bg-white/10 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}>Fast</button>
              <button onClick={() => setModel('versatile')} className={`px-3 py-1.5 rounded-md text-[10px] md:text-xs font-bold transition-all flex items-center gap-1 ${model === 'versatile' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}>Smart <Sparkles size={10} /></button>
            </div>
          </div>
          <button
            onClick={() => setIsDeepThink(!isDeepThink)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all text-[10px] md:text-xs font-bold ${isDeepThink ? 'bg-purple-500/20 border-purple-500/50 text-purple-300' : 'bg-transparent border-transparent text-slate-400 hover:bg-white/5 hover:text-white'}`}
          >
            <BrainCircuit size={14} className="md:w-4 md:h-4" /> <span className="hidden sm:inline">Deep Think</span>
          </button>
        </header>

        {/* MESSAGES */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 md:space-y-8 custom-scrollbar z-10 pb-32 md:pb-8">
          {messages.length === 0 && !isLoading ? (
            <div className="h-full flex flex-col items-center justify-center max-w-3xl mx-auto animate-in fade-in zoom-in duration-300 px-4">
              <div className="text-center mb-10">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-3xl flex items-center justify-center mb-6 mx-auto shadow-2xl shadow-blue-900/30 ring-4 ring-black">
                  <Bot className="w-8 h-8 md:w-10 md:h-10 text-white" />
                </div>
                <h2 className="text-2xl md:text-4xl font-bold text-white mb-3 tracking-tight">Hello, {user?.name ? user.name.split(' ')[0] : 'Student'}</h2>
                <p className="text-slate-400 text-sm md:text-lg max-w-md mx-auto">I'm your personal AI tutor. Ask me anything about your studies.</p>
              </div>

              {/* Chat Templates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 w-full max-w-3xl">
                {[
                  {
                    icon: <Sparkles size={18} />,
                    title: 'Explain a Concept',
                    prompt: 'Explain [topic] in simple terms with examples',
                    color: 'from-purple-500/20 to-purple-600/10 border-purple-500/30 hover:border-purple-500/50'
                  },
                  {
                    icon: <BrainCircuit size={18} />,
                    title: 'Create a Quiz',
                    prompt: 'Create a 10-question quiz on [topic] with explanations',
                    color: 'from-blue-500/20 to-blue-600/10 border-blue-500/30 hover:border-blue-500/50'
                  },
                  {
                    icon: <FileText size={18} />,
                    title: 'Summarize Content',
                    prompt: 'Summarize the key points of [topic or document]',
                    color: 'from-green-500/20 to-green-600/10 border-green-500/30 hover:border-green-500/50'
                  },
                  {
                    icon: <Zap size={18} />,
                    title: 'Study Plan',
                    prompt: 'Create a 7-day study plan for [subject or exam]',
                    color: 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/30 hover:border-yellow-500/50'
                  }
                ].map((template, index) => (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setInput(template.prompt);
                      textareaRef.current?.focus();
                    }}
                    className={`flex items-start gap-3 p-4 rounded-xl border bg-gradient-to-br transition-all text-left ${template.color}`}
                  >
                    <div className="p-2 bg-white/10 rounded-lg flex-shrink-0">
                      {template.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-bold text-sm mb-1">{template.title}</h3>
                      <p className="text-slate-400 text-xs line-clamp-2">{template.prompt}</p>
                    </div>
                  </motion.button>
                ))}
              </div>

            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  key={msg.id} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex max-w-[95%] md:max-w-[80%] gap-2 md:gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg mt-1 ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-[#1a1a1a] border border-white/10 text-blue-400'}`}>
                      {msg.role === 'user' ? <User size={16} /> : <Sparkles size={16} />}
                    </div>
                    <div className={`px-4 py-3 md:px-6 md:py-4 rounded-2xl text-sm md:text-base leading-relaxed shadow-md ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-[#0a0a0a] border border-white/10 text-slate-300 rounded-tl-sm'}`}>
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="flex items-center gap-3 mb-3 pb-3 border-b border-white/20 bg-black/20 -mx-2 px-3 py-2 rounded-lg">
                          <div className="p-1.5 bg-white/10 rounded"><FileText size={14} /></div>
                          <span className="text-xs font-mono truncate opacity-90">{msg.attachments[0].name}</span>
                        </div>
                      )}
                      {msg.role === 'model' ? (
                        <div className="space-y-2">
                          <MarkdownRenderer content={msg.text} />
                        </div>
                      ) : (
                        <div className="whitespace-pre-wrap">{msg.text}</div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start gap-4">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-[#1a1a1a] border border-white/10 text-blue-400 flex items-center justify-center mt-1 shadow-lg"><Sparkles size={16} /></div>
                  <div className="bg-[#0a0a0a] border border-white/5 px-6 py-4 rounded-2xl rounded-tl-sm flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></span>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} className="h-4" />
            </>
          )}
        </div>

        {/* INPUT AREA - Sticky at bottom */}
        <div
          className="sticky bottom-0 left-0 right-0 p-3 md:p-6 z-20 bg-gradient-to-t from-[#020202] via-[#020202] to-transparent border-t border-white/5 md:border-none"
          style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
        >
          <div className="max-w-4xl mx-auto relative">
            <AnimatePresence>
              {attachedFile && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute -top-14 left-0 flex items-center gap-2 bg-[#1a1a1a] border border-white/10 px-3 py-2 rounded-xl shadow-lg z-10">
                  <FileText size={16} className="text-blue-400" />
                  <span className="text-xs text-white truncate max-w-[200px]">{attachedFile.name}</span>
                  <button onClick={() => setAttachedFile(null)} className="ml-2 hover:text-white text-slate-400 rounded-full hover:bg-white/10 p-1"><X size={12} /></button>
                </motion.div>
              )}
              {interimTranscript && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute -top-14 right-0 flex items-center gap-2 bg-[#1a1a1a] border border-white/10 px-3 py-2 rounded-xl shadow-lg z-10">
                  <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
                    <Mic size={16} className="text-green-400" />
                  </motion.div>
                  <span className="text-xs text-slate-300 italic max-w-[200px] truncate">{interimTranscript}</span>
                </motion.div>
              )}
            </AnimatePresence>
            <input type="file" ref={fileInputRef} className="hidden" accept="application/pdf" onChange={handleFileUpload} />
            <div className={`bg-[#0a0a0a] border transition-all rounded-[1.5rem] p-1.5 md:p-2 flex items-end gap-2 shadow-2xl ${input ? 'border-blue-500/30 ring-1 ring-blue-500/20' : 'border-white/10'} ${isListening ? 'ring-2 ring-green-500/50' : ''}`}>
              <button onClick={() => fileInputRef.current?.click()} className="p-2.5 md:p-3 text-slate-300 hover:text-white hover:bg-white/10 rounded-full transition-colors flex-shrink-0 mb-[1px]" title="Upload PDF" aria-label="Upload PDF document">
                {isUploading ? <Loader2 size={20} className="animate-spin" /> : <Paperclip size={20} />}
              </button>
              {isSpeechSupported && (
                <button
                  onClick={toggleVoiceInput}
                  className={`p-2.5 md:p-3 rounded-full flex-shrink-0 transition-all duration-300 mb-[1px] ${isListening ? 'bg-green-600 text-white shadow-lg shadow-green-600/20 animate-pulse' : 'text-slate-300 hover:text-white hover:bg-white/10'}`}
                  title={isListening ? 'Stop recording' : 'Start voice input'}
                  aria-label={isListening ? 'Stop voice recording' : 'Start voice input'}
                  aria-pressed={isListening}
                >
                  {isListening ? <Square size={20} /> : <Mic size={20} />}
                </button>
              )}
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Ask anything..."
                className="w-full bg-transparent text-white text-sm md:text-base p-2.5 md:p-3 min-h-[44px] max-h-[150px] focus:outline-none resize-none custom-scrollbar placeholder:text-slate-500 leading-relaxed"
                rows={1}
                aria-label="Chat message input"
                aria-describedby={interimTranscript ? "voice-recording" : undefined}
              />
              <button onClick={() => handleSend()} disabled={(!input.trim() && !attachedFile) || isLoading} className={`p-2.5 md:p-3 rounded-full flex-shrink-0 transition-all duration-300 mb-[1px] ${input.trim() || attachedFile ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:scale-105' : 'bg-white/5 text-slate-400 cursor-not-allowed'}`} aria-label="Send message">
                {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} className={input.trim() ? 'ml-0.5' : ''} />}
              </button>
            </div>
            <div className="text-center mt-2 hidden md:block">
              <p className="text-[10px] text-slate-500 flex items-center justify-center gap-1"><Zap size={10} /> Powered by Groq LPU™</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
