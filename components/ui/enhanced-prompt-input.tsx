import React, { useState, useRef } from "react";
import { 
  PromptInput, 
  PromptInputActions, 
  PromptInputTextarea 
} from "./prompt-input";
import { FileUpload, FileUploadTrigger } from "./file-upload";
import Microphone from "./microphone";
import { Button } from "./button";
import { Paperclip, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface EnhancedPromptInputProps {
  value: string;
  onValueChange: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  onFilesAdded?: (files: File[]) => void;
  onTranscript?: (transcript: string) => void;
}

const EnhancedPromptInput: React.FC<EnhancedPromptInputProps> = ({
  value,
  onValueChange,
  onSubmit,
  isLoading,
  disabled = false,
  placeholder = "Ask anything about your syllabus, code, or exams...",
  className = "",
  onFilesAdded,
  onTranscript
}) => {
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleFilesAdded = (newFiles: File[]) => {
    setAttachedFiles(prev => [...prev, ...newFiles]);
    onFilesAdded?.([...attachedFiles, ...newFiles]);
  };

  const removeFile = (index: number) => {
    const newFiles = attachedFiles.filter((_, i) => i !== index);
    setAttachedFiles(newFiles);
    onFilesAdded?.(newFiles);
  };

  const handleTranscript = (transcript: string) => {
    onValueChange(value + transcript);
    onTranscript?.(transcript);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className={cn("w-full", className)}>
      <FileUpload onFilesAdded={handleFilesAdded}>
        <PromptInput
          className="border-input bg-[#000] border border-white/15 shadow-[0_0_0_1px_rgba(15,23,42,0.6)] rounded-2xl"
          value={value}
          onValueChange={onValueChange}
          onSubmit={onSubmit}
          isLoading={isLoading}
          disabled={disabled}
        >
          {/* File attachments preview */}
          {attachedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 p-3 pb-0">
              {attachedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-1.5 text-xs"
                >
                  <Paperclip className="w-3 h-3 text-slate-400" />
                  <span className="truncate max-w-[120px]">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="text-slate-500 hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <PromptInputTextarea
            placeholder={placeholder}
            className="min-h-[44px] max-h-[180px] text-white placeholder:text-slate-500 text-sm md:text-base px-4 py-3"
            onKeyDown={handleKeyDown}
            ref={textareaRef}
          />
          
          <PromptInputActions className="justify-end gap-2 p-3 pt-0">
            <FileUploadTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="h-9 w-9 rounded-full p-0 hover:bg-white/10"
                disabled={disabled}
              >
                <Paperclip className="h-4 w-4 text-slate-400" />
              </Button>
            </FileUploadTrigger>
            
            {onTranscript && (
              <Microphone
                onTranscript={handleTranscript}
                disabled={disabled}
              />
            )}
            
            <Button
              size="sm"
              className="h-9 w-9 rounded-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:cursor-not-allowed flex items-center justify-center"
              onClick={onSubmit}
              disabled={!value.trim() || isLoading}
            >
              {isLoading ? (
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                  <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                </svg>
              )}
            </Button>
          </PromptInputActions>
        </PromptInput>
      </FileUpload>
    </div>
  );
};

export default EnhancedPromptInput;