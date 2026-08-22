import React from 'react';
import ChatInput from './ChatInput';
import { Sparkles } from 'lucide-react';

export default function HomeView({ onSendMessage, onOpenVoiceMode, isLoading, selectedModel, setSelectedModel }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 min-h-0 text-slate-800 bg-[#f5f5f7] selection:bg-orange-500 selection:text-white">
      <div className="w-full max-w-5xl flex flex-col items-center gap-8 my-auto">
        {/* Brand Tag */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-50 border border-orange-200 text-orange-600 text-xs font-semibold shadow-sm">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Sardar Genji • FAISS MiniLM RAG &amp; Dual Search</span>
        </div>

        {/* Hero Greeting Text */}
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 text-center">
          What would you like to <span className="text-orange-500">explore</span> today?
        </h1>

        {/* Center Pill Input Bar */}
        <div className="w-full">
          <ChatInput
            onSendMessage={onSendMessage}
            onOpenVoiceMode={onOpenVoiceMode}
            isLoading={isLoading}
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
          />
        </div>
      </div>
    </div>
  );
}
