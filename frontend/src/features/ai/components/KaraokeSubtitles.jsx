import React, { useState } from 'react';
import { VolumeX, Play, Sparkles, Copy, Check } from 'lucide-react';

export default function KaraokeSubtitles({
  words = [],
  currentWordIndex = -1,
  spokenText = '',
  isSpeaking = false,
  isProcessing = false,
  onStopSpeech,
  onPlaySpeech,
  onReplaySpeech,
  _themeColor = '#ea580c'
}) {
  const [copied, setCopied] = useState(false);
  const handlePlay = onPlaySpeech || onReplaySpeech;

  const handleCopy = () => {
    if (!spokenText) return;
    navigator.clipboard.writeText(spokenText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full h-[145px] sm:h-[158px] shrink-0 bg-stone-900/85 backdrop-blur-2xl border border-amber-500/25 rounded-2xl sm:rounded-3xl p-3 sm:p-4 shadow-2xl flex flex-col justify-between select-none">
      {/* Subtitle Header Bar: Actions Group */}
      <div className="flex items-center justify-between gap-2 border-b border-amber-500/15 pb-1.5 shrink-0 h-7 sm:h-8">
        <div className="flex items-center gap-2 shrink-0 min-w-0">
          <div className="relative flex items-center justify-center">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
            {isSpeaking && (
              <span className="absolute w-4 h-4 rounded-full bg-orange-500/40 animate-ping" />
            )}
          </div>
          <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-amber-200/90 font-mono-code flex items-center gap-1.5 truncate">
            Avatar's Spoken Answer
          </span>
          {isSpeaking && (
            <div className="flex items-center gap-0.5 ml-1 shrink-0">
              <span className="w-1 h-2.5 bg-orange-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1 h-3.5 bg-amber-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1 h-2 bg-orange-500 rounded-full animate-bounce" />
            </div>
          )}
        </div>

        {/* Action Controls Group */}
        <div className="flex items-center gap-1.5 shrink-0 ml-auto">
          {/* Copy Response Button */}
          {spokenText && (
            <button
              onClick={handleCopy}
              className="btn-action-secondary !py-0.5 !px-2 !text-[11px] !rounded-full cursor-pointer"
              title="Copy answer to clipboard"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-300 font-semibold">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 text-stone-400" />
                  <span>Copy</span>
                </>
              )}
            </button>
          )}

          {/* Play Spoken Audio Button */}
          {spokenText && !isSpeaking && (
            <button
              onClick={handlePlay}
              className="btn-action-secondary !py-0.5 !px-2.5 !text-[11px] !rounded-full hover:!border-orange-500/50 text-amber-200 flex items-center gap-1 shadow-sm cursor-pointer"
              title="Play spoken voice explanation"
            >
              <Play className="w-3 h-3 text-orange-400 fill-orange-400" />
              <span className="font-semibold">Play</span>
            </button>
          )}

          {/* Stop / Mute Voice Button (Active when speaking) */}
          {isSpeaking && (
            <button
              onClick={onStopSpeech}
              className="flex items-center gap-1 py-0.5 px-2.5 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-300 text-[11px] font-semibold border border-red-500/40 transition-colors animate-pulse cursor-pointer"
              title="Stop Speech"
            >
              <VolumeX className="w-3 h-3 text-red-400" />
              <span>Stop Voice</span>
            </button>
          )}
        </div>
      </div>

      {/* Subtitle Box with Word-by-Word Karaoke Highlight & Smooth Internal Scroll */}
      <div className="flex-1 min-h-0 w-full overflow-y-auto custom-scrollbar px-2 py-1 text-center flex flex-col items-center">
        <div className="my-auto w-full max-w-xl">
          {isProcessing ? (
            <div className="flex items-center justify-center gap-2 text-amber-200/90 text-xs sm:text-sm font-medium animate-pulse py-1">
              <Sparkles className="w-3.5 h-3.5 text-orange-400 animate-spin shrink-0" />
              <span>Finding verified traditional facts and formulating explanation...</span>
            </div>
          ) : words.length > 0 && isSpeaking ? (
            <p className="text-xs sm:text-sm md:text-base font-medium leading-relaxed">
              {words.map((word, idx) => (
                <span
                  key={idx}
                  className={`inline-block mx-0.5 transition-all duration-150 ${
                    idx === currentWordIndex
                      ? 'text-amber-300 font-extrabold scale-105 border-b-2 border-orange-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                      : idx < currentWordIndex
                      ? 'text-stone-400'
                      : 'text-stone-100'
                  }`}
                >
                  {word}
                </span>
              ))}
            </p>
          ) : (
            <p className="text-xs sm:text-sm md:text-base font-medium text-stone-200 leading-relaxed">
              {spokenText || "Ready. Ask your mentor any traditional or scientific question, and listen to the gentle voice explanation."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
