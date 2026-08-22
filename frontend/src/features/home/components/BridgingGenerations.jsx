// Bridging Generations Feature Component
import React from 'react';
import elderWisdomImg from '../../../assets/elder_wisdom.png';

export default function BridgingGenerations({ onJoinClick }) {
  return (
    <section className="w-full py-16 sm:py-20 bg-white relative overflow-hidden transition-colors duration-300">
      {/* Background ambient decorative glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] sm:w-[900px] h-[350px] bg-gradient-to-r from-orange-100/30 via-amber-50/20 to-blue-100/20 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="w-full max-w-[1600px] 2xl:max-w-[1780px] mx-auto px-4 sm:px-6 md:px-10 lg:px-12 2xl:px-16 space-y-12 sm:space-y-16">
        
        {/* Section Header */}
        <div className="flex flex-col items-center text-center space-y-2.5 max-w-2xl mx-auto">
          <span className="text-xs font-black uppercase tracking-widest text-orange-600">
            SETU
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight uppercase leading-tight">
            Bridging Generations
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm md:text-base font-normal leading-relaxed">
            Together, we create a stronger, wiser, and more connected future.
          </p>
        </div>

        {/* Bridge Connection Layout */}
        <div className="max-w-5xl mx-auto flex flex-col items-center space-y-8 sm:space-y-10">
          
          {/* Main Bridge Row: Elder -> Bridge Illustration -> Youth */}
          <div className="w-full flex flex-col md:flex-row items-center justify-between gap-6 md:gap-4 lg:gap-8">
            
            {/* Left: Share Wisdom & Experience (Elder) */}
            <div className="flex items-center space-x-3.5 sm:space-x-4 shrink-0">
              <div className="text-right hidden sm:block">
                <span className="text-[11px] font-black uppercase tracking-wider text-orange-600 block">
                  SHARE
                </span>
                <span className="text-xs sm:text-sm font-extrabold text-slate-900 block leading-tight">
                  Wisdom &amp; Experience
                </span>
              </div>

              {/* Elder Avatar - Wise Elder with quill & parchment */}
              <div className="relative group">
                <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full p-1 bg-gradient-to-tr from-orange-400 to-amber-300 shadow-lg shadow-orange-500/15 group-hover:scale-105 transition-transform duration-300">
                  <img
                    src={elderWisdomImg}
                    alt="Wise elder sharing traditional wisdom and writing"
                    loading="lazy"
                    className="w-full h-full rounded-full object-cover object-top border-2 border-white"
                  />
                </div>
              </div>

              {/* Mobile text below */}
              <div className="text-left sm:hidden">
                <span className="text-[10px] font-black uppercase tracking-wider text-orange-600 block">
                  SHARE
                </span>
                <span className="text-xs font-bold text-slate-900 block">
                  Wisdom &amp; Experience
                </span>
              </div>
            </div>

            {/* Center: Suspension Bridge SVG Illustration */}
            <div className="flex-1 w-full max-w-[460px] px-2 flex items-center justify-center">
              <svg
                viewBox="0 0 460 110"
                className="w-full h-auto overflow-visible select-none drop-shadow-xs"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Baseline Roadway */}
                <path
                  d="M 5 88 L 455 88"
                  stroke="#EA580C"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />

                {/* Left Bridge Tower */}
                <path
                  d="M 70 88 L 70 20 M 58 88 L 58 35 L 70 20 L 82 35 L 82 88"
                  stroke="#EA580C"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <line x1="58" y1="50" x2="82" y2="50" stroke="#EA580C" strokeWidth="1.5" />
                <line x1="58" y1="68" x2="82" y2="68" stroke="#EA580C" strokeWidth="1.5" />

                {/* Right Bridge Tower */}
                <path
                  d="M 390 88 L 390 20 M 378 88 L 378 35 L 390 20 L 402 35 L 402 88"
                  stroke="#EA580C"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <line x1="378" y1="50" x2="402" y2="50" stroke="#EA580C" strokeWidth="1.5" />
                <line x1="378" y1="68" x2="402" y2="68" stroke="#EA580C" strokeWidth="1.5" />

                {/* Left Side Anchor Cable */}
                <path
                  d="M 5 88 Q 36 68 70 20"
                  stroke="#EA580C"
                  strokeWidth="1.8"
                  strokeDasharray="3 3"
                />

                {/* Main Suspended Parabolic Cable */}
                <path
                  d="M 70 20 Q 230 78 390 20"
                  stroke="#EA580C"
                  strokeWidth="2.2"
                />

                {/* Right Side Anchor Cable */}
                <path
                  d="M 390 20 Q 424 68 455 88"
                  stroke="#EA580C"
                  strokeWidth="1.8"
                  strokeDasharray="3 3"
                />

                {/* Vertical Cable Hangers */}
                <line x1="110" y1="36" x2="110" y2="88" stroke="#EA580C" strokeWidth="1" strokeDasharray="2.5 2" />
                <line x1="150" y1="50" x2="150" y2="88" stroke="#EA580C" strokeWidth="1" strokeDasharray="2.5 2" />
                <line x1="190" y1="63" x2="190" y2="88" stroke="#EA580C" strokeWidth="1" strokeDasharray="2.5 2" />
                <line x1="230" y1="69" x2="230" y2="88" stroke="#EA580C" strokeWidth="1" strokeDasharray="2.5 2" />
                <line x1="270" y1="63" x2="270" y2="88" stroke="#EA580C" strokeWidth="1" strokeDasharray="2.5 2" />
                <line x1="310" y1="50" x2="310" y2="88" stroke="#EA580C" strokeWidth="1" strokeDasharray="2.5 2" />
                <line x1="350" y1="36" x2="350" y2="88" stroke="#EA580C" strokeWidth="1" strokeDasharray="2.5 2" />

                {/* Animated Pulsing Light Flowing along the Bridge Deck */}
                <circle r="4" fill="#F97316" className="filter drop-shadow-md">
                  <animateMotion
                    path="M 5 88 L 70 88 L 390 88 L 455 88"
                    dur="2.5s"
                    repeatCount="indefinite"
                  />
                </circle>

                {/* Reverse Energy Particle */}
                <circle r="3" fill="#3B82F6" opacity="0.8">
                  <animateMotion
                    path="M 455 88 L 390 88 L 70 88 L 5 88"
                    dur="3.2s"
                    repeatCount="indefinite"
                  />
                </circle>
              </svg>
            </div>

            {/* Right: Gain Knowledge & Inspiration (Youth) */}
            <div className="flex items-center space-x-3.5 sm:space-x-4 shrink-0">
              {/* Youth Avatar */}
              <div className="relative group">
                <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full p-1 bg-gradient-to-tr from-blue-400 to-indigo-300 shadow-lg shadow-blue-500/15 group-hover:scale-105 transition-transform duration-300">
                  <img
                    src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&h=300&q=80"
                    alt="Young Learner gaining knowledge"
                    loading="lazy"
                    className="w-full h-full rounded-full object-cover border-2 border-white"
                    onError={(e) => {
                      e.target.src = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300";
                    }}
                  />
                </div>
              </div>

              {/* Text */}
              <div className="text-left">
                <span className="text-[11px] font-black uppercase tracking-wider text-blue-600 block">
                  GAIN
                </span>
                <span className="text-xs sm:text-sm font-extrabold text-slate-900 block leading-tight">
                  Knowledge &amp; Inspiration
                </span>
              </div>
            </div>

          </div>

          {/* Center Call to Action Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={onJoinClick}
              className="px-8 py-3.5 sm:px-10 sm:py-4 bg-gradient-to-r from-orange-500 to-brand-primary hover:from-orange-600 hover:to-brand-hover text-white text-xs sm:text-sm font-bold rounded-full shadow-lg shadow-orange-500/25 hover:shadow-orange-500/35 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer flex items-center justify-center space-x-2"
            >
              <span>Join Setu Today</span>
              <span>→</span>
            </button>
          </div>

        </div>

      </div>
    </section>
  );
}
