import React, { useState } from 'react';

/**
 * LazyImage Component
 * 
 * Implements native lazy loading (loading="lazy"), asynchronous image decoding,
 * a lightweight skeleton shimmer placeholder while loading, and smooth fade-in upon resolution.
 */
export default function LazyImage({
  src,
  alt = '',
  className = '',
  imgClassName = '',
  placeholderClassName = '',
  fallbackSrc,
  aspectRatio = '',
  ...props
}) {
  const [loaded, setLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const displaySrc = hasError && fallbackSrc ? fallbackSrc : src;

  return (
    <div className={`relative overflow-hidden ${aspectRatio} ${className}`}>
      {/* Lightweight Skeleton Placeholder with smooth pulse */}
      {!loaded && !hasError && (
        <div
          className={`absolute inset-0 bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 bg-[length:200%_100%] animate-pulse flex items-center justify-center ${placeholderClassName}`}
        >
          <span className="opacity-25 text-slate-400 text-sm select-none">🖼️</span>
        </div>
      )}

      {/* Fallback Display if Image Fails to Load */}
      {hasError && !fallbackSrc && (
        <div className="absolute inset-0 bg-slate-100 border border-slate-200/60 flex items-center justify-center text-slate-400 text-[10px] font-bold p-2 text-center select-none">
          <span>{alt || 'Visual'}</span>
        </div>
      )}

      {/* Actual Image with Lazy Loading & Asynchronous Decoding */}
      {displaySrc && (
        <img
          src={displaySrc}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setHasError(true)}
          className={`w-full h-full object-cover transition-opacity duration-500 ease-out ${
            loaded ? 'opacity-100' : 'opacity-0'
          } ${imgClassName}`}
          {...props}
        />
      )}
    </div>
  );
}
