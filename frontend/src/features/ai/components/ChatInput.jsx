import React, { useState, useRef, useEffect } from 'react';
import { Plus, Mic, FileText, X, ArrowUp, Sparkles } from 'lucide-react';

export default function ChatInput({ onSendMessage, onOpenVoiceMode, isLoading }) {
  const [prompt, setPrompt] = useState('');
  const [attachedFile, setAttachedFile] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);

  // Real-time Voice Typing Speech Recognition Setup
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        setPrompt((prev) => {
          const trimmed = prev.trim();
          return trimmed ? `${trimmed} ${finalTranscript.trim()}` : finalTranscript.trim();
        });
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      console.warn('Voice typing error:', event.error);
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_e) {}
      }
    };
  }, []);

  const toggleVoiceTyping = () => {
    if (!recognitionRef.current) {
      if (onOpenVoiceMode) onOpenVoiceMode();
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current.stop();
      } catch (_err) {}
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.warn('Start voice error:', err);
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setAttachedFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    if ((!prompt.trim() && !attachedFile) || isLoading) return;

    if (isListening && recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (_err) {}
      setIsListening(false);
    }

    let finalPrompt = prompt.trim();
    if (attachedFile) {
      finalPrompt = `[Attached File: ${attachedFile.name}]\n${finalPrompt}`;
    }

    setPrompt('');
    setAttachedFile(null);
    onSendMessage(finalPrompt);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6">
      {/* Attached file preview */}
      {attachedFile && (
        <div className="mb-2 inline-flex items-center gap-2 px-3.5 py-1.5 bg-orange-50 border border-orange-200 text-orange-800 text-xs rounded-xl shadow-xs">
          <FileText className="w-4 h-4 text-orange-600" />
          <span className="truncate max-w-xs font-medium">{attachedFile.name}</span>
          <button
            type="button"
            onClick={() => setAttachedFile(null)}
            className="p-1 hover:bg-orange-100 rounded-full transition-colors"
          >
            <X className="w-3.5 h-3.5 text-orange-600" />
          </button>
        </div>
      )}

      {/* Main Search Bar */}
      <form
        onSubmit={handleSubmit}
        className={`relative flex items-center bg-white border rounded-full px-5 py-3.5 shadow-lg min-h-[60px] transition-colors duration-200 ${
          isListening
            ? 'border-orange-500 ring-2 ring-orange-500/20'
            : 'border-[#e2e8f0] focus-within:border-orange-400 focus-within:ring-4 focus-within:ring-orange-500/15'
        }`}
      >
        {/* Plus attachment button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2 text-slate-400 hover:text-orange-600 rounded-full hover:bg-orange-50 transition-colors shrink-0"
          title="Attach media or files"
        >
          <Plus className="w-5 h-5" />
        </button>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Input text field */}
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isListening ? 'Listening... Speak into mic to type...' : 'Ask anything or click mic to type with voice...'}
          className="flex-1 bg-transparent border-none outline-none text-slate-800 placeholder-slate-400 text-base sm:text-lg px-4 focus:ring-0 font-normal"
        />

        {/* Right side controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Real-time Voice Typing Microphone Button */}
          <button
            type="button"
            onClick={toggleVoiceTyping}
            className={`p-2 rounded-full transition-colors ${
              isListening
                ? 'bg-orange-500 text-white shadow-xs'
                : 'text-slate-500 hover:text-orange-600 hover:bg-orange-50'
            }`}
            title={isListening ? 'Stop Voice Typing' : 'Click mic to type with your voice'}
          >
            <Mic className={`w-5 h-5 ${isListening ? 'text-white' : 'text-orange-500'}`} />
          </button>

          {/* Action Button: Send Message when prompt has text, OR Open AI Voice Mode when empty */}
          {prompt.trim() ? (
            <button
              type="submit"
              disabled={isLoading}
              className="w-10 h-10 rounded-full bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center shadow-md shadow-orange-500/20 transition-colors disabled:opacity-50"
              title="Send message"
            >
              <ArrowUp className="w-5 h-5 stroke-[2.5]" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenVoiceMode}
              className="w-10 h-10 rounded-full bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center shadow-md shadow-orange-500/20 transition-colors"
              title="AI Voice Mode - Open Interactive AI Video Avatar"
            >
              <Sparkles className="w-4 h-4 text-white" />
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
