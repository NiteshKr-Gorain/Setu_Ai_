import React, { useState } from 'react';
import { Globe, ExternalLink, ChevronDown, ChevronUp, CheckCircle2, Zap } from 'lucide-react';

export default function SearchIntelligenceHUD({
  sources = [],
  _searchPerformed = true,
  latencyMs = 0,
  lastQuery = ''
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!sources || sources.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-2xl bg-stone-900/75 backdrop-blur-md border border-amber-500/20 rounded-2xl p-3 shadow-xl flex flex-col gap-2">
      {/* HUD Header Strip: Click to expand */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between cursor-pointer hover:bg-stone-800/50 p-1.5 rounded-xl transition-colors"
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-7 h-7 rounded-lg bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400 shrink-0">
            <Globe className="w-4 h-4" />
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-amber-100 shrink-0">
                Verified Web Search Intelligence
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono-code font-bold shrink-0">
                {sources.length} Sources Verified
              </span>
            </div>
            {lastQuery && (
              <span className="text-[11px] text-stone-400 truncate max-w-full block">
                Topic: "{lastQuery}"
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-2">
          {latencyMs > 0 && (
            <div className="flex items-center gap-1 text-[11px] text-amber-300/80 font-mono-code">
              <Zap className="w-3 h-3 text-amber-400" />
              <span>{latencyMs}ms</span>
            </div>
          )}
          <button
            className="p-1 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors"
            title={isExpanded ? "Collapse citations" : "Expand citations"}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Citations List */}
      {isExpanded && (
        <div className="mt-2 flex flex-col gap-2 pt-2 border-t border-amber-500/15 animate-fadeIn">
          {sources.map((src, idx) => (
            <div
              key={idx}
              className="p-2.5 rounded-xl bg-stone-950/70 border border-white/5 hover:border-orange-500/30 transition-all flex flex-col gap-1"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-amber-200 flex items-center gap-1.5 line-clamp-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  {src.title}
                </span>
                {src.url && src.url !== '#' && (
                  <a
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-orange-400 hover:text-orange-300 flex items-center gap-1 transition-colors shrink-0 bg-stone-900 px-2 py-0.5 rounded-md border border-white/5"
                  >
                    <span>View Link</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <p className="text-[11px] text-stone-300 leading-relaxed line-clamp-2">
                {src.snippet}
              </p>
              <span className="text-[10px] text-stone-500 font-mono-code">
                Source: {src.source}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
