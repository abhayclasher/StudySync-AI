import React, { useState, useRef } from 'react';
import { DocumentData, Message } from '../types';
import { extractTextFromPDF, sendMessageToGroq, processPDFWithChunking } from '../services/geminiService';
import { UploadCloud, FileText, X, MessageSquare, Loader2, Send, Bot, User, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MarkdownRenderer from './MarkdownRenderer';

interface DocumentUploadProps {
  documents: DocumentData[];
  setDocuments: React.Dispatch<React.SetStateAction<DocumentData[]>>;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({ documents, setDocuments }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  
  // Chat State
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const activeDoc = documents.find(d => d.id === activeDocId);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files) as File[];
    if (files.length > 0) processFile(files[0]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = async (file: File) => {
    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file.');
      return;
    }

    setIsProcessing(true);
    try {
      // Use chunked processing for better handling of large PDFs
      const content = await processPDFWithChunking(file, 'detailed-summary');
      
      const newDoc: DocumentData = {
        id: Date.now().toString(),
        name: file.name,
        size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
        content: content,
        uploadDate: new Date()
      };
      
      setDocuments(prev => [newDoc, ...prev]);
    } catch (error) {
      console.error("Upload failed", error);
      // Fallback to regular extraction if chunked processing fails
      try {
        const content = await extractTextFromPDF(file);
        const newDoc: DocumentData = {
          id: Date.now().toString(),
          name: file.name,
          size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
          content: content,
          uploadDate: new Date()
        };
        
        setDocuments(prev => [newDoc, ...prev]);
      } catch (fallbackError) {
        console.error('Fallback extraction also failed:', fallbackError);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const startChat = (doc: DocumentData) => {
    setActiveDocId(doc.id);
    setChatMessages([
      { 
        id: 'init', 
        role: 'model', 
        text: `I've analyzed "${doc.name}". I can summarize it, explain key concepts, or answer specific questions.`, 
        timestamp: new Date() 
      }
    ]);
  };

  const handleSend = async () => {
    if (!input.trim() || !activeDoc) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsChatLoading(true);

    const response = await sendMessageToGroq(chatMessages, input, activeDoc.content);

    const aiMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: response,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, aiMsg]);
    setIsChatLoading(false);
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6 h-auto lg:h-[calc(100vh-8rem)]">
      {/* Left: Upload & List */}
      <div className="lg:col-span-1 space-y-6 flex flex-col h-auto lg:h-full">
        {/* Upload Area */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`
            border-2 border-dashed rounded-xl p-6 md:p-8 text-center transition-all duration-300 cursor-pointer relative overflow-hidden flex flex-col justify-center items-center
            ${isDragging ? 'border-primary bg-primary/10 scale-[1.02]' : 'border-white/10 bg-[#050505] hover:border-white/30 hover:bg-white/5'}
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById('fileInput')?.click()}
        >
          <input type="file" id="fileInput" className="hidden" accept=".pdf" onChange={handleFileSelect} />
          
          {isProcessing ? (
            <div className="flex flex-col items-center justify-center py-4">
              <Loader2 className="w-8 h-8 md:w-10 md:h-10 text-primary animate-spin mb-4" />
              <p className="text-slate-300 font-medium text-sm md:text-base">Analyzing Document...</p>
            </div>
          ) : (
            <>
              <div className="w-12 h-12 md:w-16 md:h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 text-primary group-hover:scale-110 transition-transform">
                <UploadCloud className="w-6 h-6 md:w-8 md:h-8" />
              </div>
              <h3 className="text-base md:text-lg font-semibold text-white mb-2">Upload Study PDF</h3>
              <p className="text-xs md:text-sm text-slate-400">Drag & drop or click to browse</p>
              <p className="text-[10px] md:text-xs text-slate-500 mt-4 border border-white/10 px-2 py-1 rounded">Supports PDF up to 10MB</p>
            </>
          )}
        </motion.div>

        {/* Document List */}
        <div className="flex-1 overflow-y-auto bg-[#050505] border border-white/5 rounded-xl p-4 min-h-[200px] lg:min-h-0">
          <h3 className="text-xs font-bold text-slate-500 mb-4 uppercase tracking-wider flex items-center">
            <FileText size={12} className="mr-2" /> Your Library
          </h3>
          <div className="space-y-3">
            <AnimatePresence>
              {documents.map((doc) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className={`
                    group p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between relative overflow-hidden
                    ${activeDocId === doc.id 
                      ? 'bg-primary/10 border-primary/30 shadow-[0_0_15px_rgba(124,58,237,0.1)]' 
                      : 'bg-white/5 border-transparent hover:bg-white/10'}
                  `}
                  onClick={() => startChat(doc)}
                >
                   {activeDocId === doc.id && (
                     <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
                   )}
                  <div className="flex items-center overflow-hidden">
                    <FileText className={`w-8 h-8 mr-3 flex-shrink-0 ${activeDocId === doc.id ? 'text-primary' : 'text-slate-400'}`} />
                    <div className="truncate">
                      <h4 className="text-sm font-medium text-white truncate">{doc.name}</h4>
                      <p className="text-xs text-slate-500">{doc.size}</p>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setDocuments(docs => docs.filter(d => d.id !== doc.id));
                      if (activeDocId === doc.id) setActiveDocId(null);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded transition-all"
                  >
                    <X size={14} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
            {documents.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-slate-600 text-sm">
                <AlertCircle size={24} className="mb-2 opacity-50" />
                No documents yet
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right: Chat Area */}
      <div className="lg:col-span-2 bg-[#050505] border border-white/5 rounded-xl flex flex-col overflow-hidden relative shadow-xl h-[600px] lg:h-full">
        {!activeDoc ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 p-8 text-center bg-grid-white/[0.02]">
            <div className="w-20 h-20 md:w-24 md:h-24 bg-white/5 rounded-full flex items-center justify-center mb-6 animate-pulse">
              <MessageSquare className="w-8 h-8 md:w-10 md:h-10 opacity-50 text-primary" />
            </div>
            <h3 className="text-lg md:text-xl font-bold text-white mb-2">Document Chat</h3>
            <p className="max-w-md text-sm md:text-base">Select a document from the left to start an AI-powered conversation about its content.</p>
          </div>
        ) : (
          <>
            <div className="p-4 border-b border-white/5 bg-black flex justify-between items-center z-10">
              <div className="flex items-center">
                <FileText className="w-5 h-5 text-primary mr-2" />
                <span className="font-medium text-white truncate max-w-[150px] md:max-w-md text-sm md:text-base">{activeDoc.name}</span>
              </div>
              <span className="text-[10px] px-2 py-1 bg-green-500/10 text-green-400 rounded border border-green-500/20 flex items-center whitespace-nowrap">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse"></span>
                Active
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-[#050505]">
              {chatMessages.map((msg) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={msg.id} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                   <div className={`flex max-w-[90%] md:max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className={`
                        w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1
                        ${msg.role === 'user' ? 'ml-3 bg-primary/20 text-primary' : 'mr-3 bg-white/10 text-slate-300'}
                      `}>
                        {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                      </div>
                      <div className={`
                        p-3 md:p-4 rounded-2xl text-sm leading-relaxed
                        ${msg.role === 'user'
                          ? 'bg-primary text-white rounded-tr-none shadow-lg shadow-primary/10'
                          : 'bg-white/5 text-slate-200 border border-white/5 rounded-tl-none'}
                      `}>
                        {msg.role === 'model' ? (
                          <MarkdownRenderer content={msg.text} />
                        ) : (
                          <div className="whitespace-pre-wrap">{msg.text}</div>
                        )}
                      </div>
                   </div>
                </motion.div>
              ))}
              {isChatLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/5 p-4 rounded-2xl rounded-tl-none flex gap-1 ml-11">
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="p-3 md:p-4 bg-black border-t border-white/5">
              <div className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask specifically about this document..."
                  className="w-full bg-black text-white pl-4 pr-12 py-3 md:py-3.5 rounded-xl border border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 focus:outline-none transition-all text-sm md:text-base"
                />
                <button 
                  onClick={handleSend}
                  disabled={!input.trim() || isChatLoading}
                  className="absolute right-2 top-1.5 md:top-2 p-1.5 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-all hover:scale-105"
                >
                  <Send size={16} className="md:w-[18px] md:h-[18px]" />
                </button>
              </div>
              <div className="text-center mt-2">
                <p className="text-[10px] text-slate-600">Groq AI can analyze text from your uploaded PDFs.</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DocumentUpload;