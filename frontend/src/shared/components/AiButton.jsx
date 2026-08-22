import React, { useState } from 'react';
import { useAuth } from '../../features/auth/AuthContext';
import AiModalContainer from '../../features/ai/components/AiModalContainer';

export default function AiButton() {
  const { currentUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const handleButtonClick = () => {
    setIsOpen(true);
  };

  return (
    <>
      {/* Full Setu AI Assistant Interface Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
          <AiModalContainer
            userProfile={currentUser}
            onClose={() => setIsOpen(false)}
          />
        </div>
      )}

      {/* Floating Round AI Button Fixed at Right Bottom Corner */}
      <div className="fixed bottom-6 right-6 z-40 flex items-center group">
        {/* Tooltip on hover (positioned to the left of the button) */}
        <div className="absolute right-16 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-300 transform translate-x-2 group-hover:translate-x-0 whitespace-nowrap bg-slate-900/90 backdrop-blur-md text-white text-xs font-semibold px-3.5 py-2 rounded-xl shadow-xl border border-slate-700/50 flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
          <span>Setu AI Assistant</span>
        </div>

        {/* Ambient Ring Glow */}
        <div className="absolute -inset-1.5 bg-gradient-to-r from-[#FF9F43] via-amber-400 to-[#E08A32] rounded-full blur-md opacity-70 group-hover:opacity-100 group-hover:blur-lg transition-all duration-300 animate-pulse pointer-events-none"></div>

        {/* Main Round Floating Button */}
        <button
          id="floating-ai-button"
          onClick={handleButtonClick}
          aria-label="Setu AI Assistant"
          className="relative w-14 h-14 rounded-full bg-gradient-to-br from-[#FF9F43] via-amber-500 to-[#E08A32] text-white shadow-xl shadow-amber-500/40 hover:shadow-2xl hover:shadow-amber-500/60 flex items-center justify-center border-2 border-white/40 transform hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer overflow-hidden"
        >
          {/* Sparkle subtle background animation */}
          <div className="absolute inset-0 bg-white/20 rounded-full opacity-0 hover:opacity-100 transition-opacity duration-300"></div>

          {/* AI Sparkles Icon */}
          <svg
            className="w-7 h-7 text-white drop-shadow-md transition-transform duration-300 group-hover:rotate-12"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </button>
      </div>
    </>
  );
}
