// Hero imports
import React, { useState, useEffect } from 'react';
import setu1 from '../../../assets/setu1.png';
import setu2 from '../../../assets/setu2.png';
import setu3 from '../../../assets/setu3.png';
import heroPattern from '../../../assets/hero-pattern.png';

const SLIDE_IMAGES = [
  { src: setu1, alt: 'Setu Traditional Wisdom 1' },
  { src: setu2, alt: 'Setu Traditional Wisdom 2' },
  { src: setu3, alt: 'Setu Traditional Wisdom 3' }
];

// Hero component
export default function Hero({ onGetStarted, onLearnMore }) {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDE_IMAGES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Dynamic floating badge positions that animate smoothly on each slide change
  const getStorytellerStyle = (slide) => {
    switch (slide) {
      case 0:
        // Top-Left
        return {
          top: '0%',
          left: '0%',
          transform: 'translate(-10px, -14px)',
        };
      case 1:
        // Top-Right
        return {
          top: '0%',
          left: '100%',
          transform: 'translate(calc(-100% + 10px), -14px)',
        };
      case 2:
      default:
        // Bottom-Left
        return {
          top: '100%',
          left: '0%',
          transform: 'translate(-10px, calc(-100% + 14px))',
        };
    }
  };

  const getVerifiedStyle = (slide) => {
    switch (slide) {
      case 0:
        // Bottom-Right
        return {
          top: '100%',
          left: '100%',
          transform: 'translate(calc(-100% + 10px), calc(-100% + 14px))',
        };
      case 1:
        // Bottom-Left
        return {
          top: '100%',
          left: '0%',
          transform: 'translate(-10px, calc(-100% + 14px))',
        };
      case 2:
      default:
        // Top-Right
        return {
          top: '0%',
          left: '100%',
          transform: 'translate(calc(-100% + 10px), -14px)',
        };
    }
  };

  return (
    <section className="relative w-full pt-28 pb-12 sm:pt-32 sm:pb-16 lg:pt-36 lg:pb-24 bg-white text-slate-900 overflow-hidden transition-colors duration-300">
      {/* Decorative gradient blobs */}
      <div className="absolute top-0 right-0 w-[320px] sm:w-[500px] h-[320px] sm:h-[500px] bg-gradient-to-br from-blue-100/30 to-orange-100/25 rounded-full blur-3xl z-0 translate-x-1/3 -translate-y-1/4 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[350px] sm:w-[600px] h-[350px] sm:h-[600px] bg-gradient-to-tr from-amber-100/30 via-orange-100/20 to-blue-50/40 rounded-full blur-3xl z-0 -translate-x-1/4 translate-y-1/4 pointer-events-none"></div>

      <div className="w-full max-w-[1600px] 2xl:max-w-[1780px] mx-auto px-6 sm:px-10 md:px-14 lg:px-16 2xl:px-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 xl:gap-16 items-center">
          
          {/* Left column - Content with generous left spacing and background pattern */}
          <div className="lg:col-span-7 relative flex flex-col items-center text-center lg:items-start lg:text-left space-y-6 sm:space-y-7 max-w-2xl mx-auto lg:mx-0 pl-2 sm:pl-6 lg:pl-12 xl:pl-16 2xl:pl-20">

            {/* Pattern backdrop behind the Keeping Traditional Wisdom Alive headline */}
            <div className="absolute -top-12 -left-6 sm:-top-16 sm:-left-12 lg:-left-14 w-[340px] sm:w-[480px] md:w-[560px] h-[340px] sm:h-[480px] md:h-[560px] pointer-events-none -z-10 select-none overflow-hidden opacity-85 sm:opacity-95">
              <img
                src={heroPattern}
                alt="Traditional Pattern"
                className="w-full h-full object-contain object-left-top mix-blend-multiply"
              />
            </div>

            {/* Main headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-black tracking-tight leading-[1.15] sm:leading-[1.12] text-slate-950 relative z-10">
              Keeping <span className="bg-gradient-to-r from-brand-primary via-orange-500 to-amber-500 bg-clip-text text-transparent">Traditional Wisdom</span> Alive.
            </h1>

            {/* Subtitle */}
            <p className="text-slate-600 text-sm sm:text-base md:text-lg font-normal leading-relaxed max-w-xl relative z-10">
              Connecting elders and youth to share life experiences, preserve cultural heritage, and build meaningful mentorships backed by intelligent verification.
            </p>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 w-full sm:w-auto pt-1 sm:pt-2 relative z-10">
              <button
                type="button"
                onClick={onGetStarted}
                className="px-7 sm:px-8 py-3.5 sm:py-4 bg-brand-primary hover:bg-brand-hover text-white text-sm sm:text-base font-bold rounded-full shadow-lg shadow-brand-primary/25 hover:shadow-brand-primary/35 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer flex items-center justify-center space-x-2"
              >
                <span>Explore Wisdom</span>
                <span>→</span>
              </button>
              <button
                type="button"
                onClick={onLearnMore}
                className="px-7 sm:px-8 py-3.5 sm:py-4 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 text-sm sm:text-base font-bold rounded-full transition-all duration-200 text-center cursor-pointer shadow-2xs hover:shadow-xs"
              >
                Learn More
              </button>
            </div>

            {/* Metrics indicator */}
            <div className="pt-6 sm:pt-8 border-t border-slate-100/90 w-full grid grid-cols-3 gap-3 sm:gap-6 text-center lg:text-left relative z-10">
              <div>
                <p className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">1,200+</p>
                <p className="text-[10px] sm:text-[11px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">Stories Shared</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">850+</p>
                <p className="text-[10px] sm:text-[11px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">Mentors Connected</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">98%</p>
                <p className="text-[10px] sm:text-[11px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">Verified Trust</p>
              </div>
            </div>

          </div>

          {/* Right column - Image Slider with right spacing & Animated Swapping Badges */}
          <div className="lg:col-span-5 relative w-full flex items-center justify-center lg:justify-end px-2 sm:px-4 lg:px-0 pr-0 sm:pr-4 lg:pr-10 xl:pr-16 2xl:pr-20">
            <div className="relative w-full max-w-[290px] sm:max-w-[380px] md:max-w-[420px] lg:max-w-[460px] xl:max-w-[480px] aspect-square">
              
              {/* Glow backdrop */}
              <div className="absolute inset-0 bg-gradient-to-tr from-brand-primary/20 via-orange-400/20 to-amber-300/25 rounded-3xl blur-2xl transform scale-95 -z-10 pointer-events-none"></div>
              
              {/* Image container with 5s continuous slider */}
              <div className="w-full h-full rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-100 shadow-xl sm:shadow-2xl bg-white p-2.5 sm:p-4 flex items-center justify-center relative">
                <div className="relative w-full h-full overflow-hidden rounded-xl sm:rounded-2xl">
                  {SLIDE_IMAGES.map((image, index) => (
                    <img
                      key={index}
                      src={image.src}
                      alt={image.alt}
                      loading={index === 0 ? 'eager' : 'lazy'}
                      className={`absolute inset-0 w-full h-full object-cover rounded-xl sm:rounded-2xl transition-all duration-1000 ease-in-out ${
                        index === currentSlide
                          ? 'opacity-100 scale-100 z-10'
                          : 'opacity-0 scale-105 z-0 pointer-events-none'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Storyteller badge - dynamically glides across sides on each slide */}
              <div
                style={getStorytellerStyle(currentSlide)}
                className="absolute z-20 bg-white/95 backdrop-blur-md px-3 py-2 sm:p-3.5 rounded-xl sm:rounded-2xl border border-slate-100/90 shadow-lg sm:shadow-xl flex items-center space-x-2.5 sm:space-x-3 text-left transition-all duration-1000 ease-in-out select-none whitespace-nowrap"
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-amber-100 text-amber-700 font-bold flex items-center justify-center text-xs sm:text-sm border border-amber-200 shrink-0">
                  👵
                </div>
                <div>
                  <p className="text-[11px] sm:text-xs font-bold text-slate-900 leading-tight">Senior Storyteller</p>
                  <p className="text-[9px] sm:text-[10px] text-slate-400 font-medium">Shared 14 Heritage Tales</p>
                </div>
              </div>

              {/* Verified badge - dynamically glides across sides on each slide */}
              <div
                style={getVerifiedStyle(currentSlide)}
                className="absolute z-20 bg-white/95 backdrop-blur-md px-3 py-2 sm:p-3.5 rounded-xl sm:rounded-2xl border border-slate-100/90 shadow-lg sm:shadow-xl flex items-center space-x-2.5 sm:space-x-3 text-left transition-all duration-1000 ease-in-out select-none whitespace-nowrap"
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-xs sm:text-sm border border-emerald-200 shrink-0">
                  ✓
                </div>
                <div>
                  <p className="text-[11px] sm:text-xs font-bold text-slate-900 leading-tight">Verified Knowledge</p>
                  <p className="text-[9px] sm:text-[10px] text-emerald-600 font-bold">100% Authenticated</p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
