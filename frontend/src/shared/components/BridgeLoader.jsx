import React, { useState, useEffect } from 'react';

export default function BridgeLoader({ onFinish }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let current = 0;
    let isCancelled = false;
    const startTime = Date.now();
    const TARGET_DURATION_MS = 4000; // Exactly 4 seconds

    const interval = setInterval(() => {
      if (isCancelled) return;
      const elapsed = Date.now() - startTime;
      
      let targetProgress = Math.min(100, Math.floor((elapsed / TARGET_DURATION_MS) * 100));
      
      if (targetProgress < 99) {
        const noise = Math.floor(Math.random() * 3) - 1;
        targetProgress = Math.max(current, Math.min(99, targetProgress + noise));
      }

      current = targetProgress;
      setProgress(current);

      if (elapsed >= TARGET_DURATION_MS || current >= 100) {
        setProgress(100);
        clearInterval(interval);
        if (onFinish) {
          setTimeout(onFinish, 180);
        }
      }
    }, 50);

    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [onFinish]);

  return (
    <div className="fixed inset-0 z-50 w-screen h-screen bg-slate-950 backdrop-blur-md overflow-hidden select-none">
      {/* Background Video with preload="none" for fast loading */}
      <video
        src="/Setu_Video.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="none"
        disablePictureInPicture
        disableRemotePlayback
        className="w-full h-full object-cover bg-transparent pointer-events-none opacity-80"
      />

      {/* Transparent Ambient Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none"></div>

      {/* Sleek Floating Top Badge with Setu_logo.png */}
      <div className="absolute top-6 left-6 md:top-8 md:left-10 flex items-center space-x-3 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-orange-500/20 shadow-2xl z-20">
        <div className="w-6 h-6 rounded-full overflow-hidden bg-transparent border-0 p-0 flex items-center justify-center">
          <img src="/Setu_logo.png" alt="Setu Logo" loading="lazy" className="w-full h-full object-contain" />
        </div>
        <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse shadow-[0_0_8px_#F97316]"></span>
        <span className="text-xs font-black text-white uppercase tracking-widest font-mono">
          AI Knowledge Bridge
        </span>
      </div>

      {/* Overlaid Bottom Fullscreen Progress Bar */}
      <div className="absolute bottom-8 left-6 right-6 md:bottom-12 md:left-16 md:right-16 z-20 max-w-5xl mx-auto space-y-3">
        <div className="flex items-center justify-between text-xs sm:text-sm font-mono tracking-widest uppercase">
          <div className="flex items-center space-x-2 text-slate-200">
            <svg className="w-4 h-4 text-orange-500 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
              <path d="M12 2C6.47715 2 2 6.47715 2 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
            <span className="font-bold text-white shadow-sm">INITIALIZING KNOWLEDGE SYSTEM</span>
          </div>
          <span className="text-orange-400 font-extrabold font-mono text-base tracking-wider drop-shadow-md">{progress}%</span>
        </div>

        {/* Vibrant Orange Transparent Glass Progress Track */}
        <div className="relative w-full h-2.5 bg-black/40 backdrop-blur-md rounded-full overflow-hidden border border-orange-500/20 shadow-2xl">
          <div
            className="h-full rounded-full transition-all duration-150 ease-out bg-gradient-to-r from-orange-600 via-amber-500 to-orange-400 relative shadow-[0_0_20px_rgba(249,115,22,0.9)]"
            style={{
              width: `${progress}%`,
            }}
          >
            {/* Leading Edge Light Pulse Particle */}
            {progress > 2 && (
              <div className="absolute right-0 top-0 bottom-0 w-3 bg-white rounded-full shadow-[0_0_12px_#FFFFFF] animate-pulse"></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
