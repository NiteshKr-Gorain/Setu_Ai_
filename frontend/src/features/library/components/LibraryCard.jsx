import React from 'react';
import { getCategoryVisual } from '../../../shared/utils/categoryVisuals';

function LibraryCard({
  item,
  onReadMore,
  onAiSummary,
  onBookmark,
  isBookmarked
}) {
  const visual = getCategoryVisual(item.category);
  return (
    <div className="bg-white rounded-3xl border border-slate-100/80 shadow-xs hover:shadow-md hover:border-blue-100 transition-all duration-300 overflow-hidden flex flex-col h-full group">
      {/* Cover Placeholder */}
      <div className={`relative aspect-video w-full overflow-hidden bg-gradient-to-br ${visual.gradient} flex items-center justify-center`}>
        <span className="text-5xl opacity-80 transition-transform duration-500 group-hover:scale-110">{visual.emoji}</span>

        {item.status && item.status !== 'completed' && (
          <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg text-[9px] font-bold bg-slate-900/80 text-white uppercase tracking-wide">
            {item.status === 'failed' ? '⚠ Processing failed' : '⏳ Processing…'}
          </span>
        )}
        
        {/* Play Icon Overlay for Videos */}
        {item.contentType === 'Video' && (
          <div className="absolute inset-0 bg-slate-900/20 flex items-center justify-center pointer-events-none transition-all duration-300 group-hover:bg-slate-900/30">
            <div className="w-12 h-12 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center shadow-lg transform transition-transform duration-300 group-hover:scale-110">
              <svg className="w-5 h-5 text-blue-600 ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        )}

        {/* Audio Waveform Overlay for Audios */}
        {item.contentType === 'Audio' && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900/80 to-transparent p-3 pt-8 flex items-end justify-between pointer-events-none">
            <div className="flex items-end space-x-1">
              <span className="w-1 h-3 bg-white/95 rounded-full animate-pulse"></span>
              <span className="w-1 h-5 bg-white/95 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></span>
              <span className="w-1 h-4 bg-white/95 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></span>
              <span className="w-1 h-6 bg-white/95 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }}></span>
              <span className="w-1 h-3 bg-white/95 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></span>
              <span className="w-1 h-5 bg-white/95 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></span>
              <span className="w-1 h-4 bg-white/95 rounded-full animate-pulse" style={{ animationDelay: '0.6s' }}></span>
              <span className="w-1 h-2 bg-white/95 rounded-full animate-pulse" style={{ animationDelay: '0.7s' }}></span>
            </div>
            <span className="text-[10px] text-white font-bold tracking-wider uppercase bg-blue-600/90 px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm">
              <span>🎧</span> Audio
            </span>
          </div>
        )}

        {/* PDF Guide Tag Overlay for PDFs */}
        {item.contentType === 'PDF' && (
          <div className="absolute top-4 right-14 pointer-events-none">
            <span className="flex items-center px-2.5 py-1 rounded-lg text-[9px] font-bold bg-rose-600 text-white shadow-md border border-rose-500/20 uppercase tracking-wide">
              📄 PDF Guide
            </span>
          </div>
        )}
        
        {/* Category Badge */}
        <span className="absolute top-4 left-4 px-3 py-1 rounded-full text-[11px] font-bold bg-white/90 text-blue-600 shadow-sm border border-slate-100">
          {item.category}
        </span>
        
        {/* Bookmark Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onBookmark(item.id);
          }}
          className={`absolute top-4 right-4 p-2 rounded-full transition-all duration-200 shadow-sm cursor-pointer z-10 ${
            isBookmarked
              ? 'bg-amber-500 text-white hover:bg-amber-600'
              : 'bg-white/90 text-slate-400 hover:text-amber-500 hover:bg-white'
          }`}
          aria-label="Bookmark"
        >
          <svg className="w-4 h-4" fill={isBookmarked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </button>
      </div>

      {/* Card Content */}
      <div className="p-6 flex-grow flex flex-col justify-between text-left space-y-4">
        <div className="space-y-2.5">
          {/* Metadata: Contributor & Read Time */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold tracking-wide uppercase">
            <span>By {item.contributor}</span>
            <span className="flex items-center gap-1">⏱️ {item.readTime}</span>
          </div>

          {/* Title */}
          <h3 className="text-md font-bold text-slate-800 group-hover:text-blue-600 transition-colors leading-snug line-clamp-2">
            {item.title}
          </h3>

          {/* Short Description */}
          <p className="text-slate-500 text-xs font-normal line-clamp-3 leading-relaxed">
            {item.description}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={() => onReadMore(item)}
            className="w-full py-2 px-3 bg-blue-50/60 hover:bg-blue-100/70 text-blue-600 text-xs font-bold rounded-xl transition-all text-center flex items-center justify-center space-x-1 cursor-pointer"
          >
            <span>Read More</span>
            <span className="text-[10px] font-normal transition-transform group-hover:translate-x-0.5">→</span>
          </button>
          <button
            onClick={() => onAiSummary(item)}
            className="w-full py-2 px-3 bg-amber-50/60 hover:bg-amber-100/70 text-amber-600 text-xs font-bold rounded-xl transition-all text-center flex items-center justify-center space-x-1 cursor-pointer"
          >
            <span>✨ AI Summary</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default React.memo(LibraryCard);

