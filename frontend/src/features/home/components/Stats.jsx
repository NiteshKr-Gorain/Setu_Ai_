// Stats & Platform Metrics Component
import React from 'react';

export default function Stats() {
  const metrics = [
    {
      id: 'stories',
      value: '1,200+',
      label: 'STORIES PRESERVED',
      iconColor: 'text-rose-500',
      iconBg: 'bg-rose-50',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
          <path d="M6 6h10" />
          <path d="M6 10h10" />
        </svg>
      )
    },
    {
      id: 'mentors',
      value: '850+',
      label: 'ACTIVE MENTORS',
      iconColor: 'text-orange-500',
      iconBg: 'bg-orange-50',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      )
    },
    {
      id: 'trust',
      value: '98%',
      label: 'TRUST RATING',
      iconColor: 'text-emerald-500',
      iconBg: 'bg-emerald-50',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="6" />
          <path d="m15.477 12.89 1.523 9.11-5-3-5 3 1.523-9.11" />
        </svg>
      )
    },
    {
      id: 'regions',
      value: '45+',
      label: 'REGIONS COVERED',
      iconColor: 'text-sky-500',
      iconBg: 'bg-sky-50',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      )
    }
  ];

  return (
    <section className="w-full py-16 sm:py-20 bg-white transition-colors duration-300 flex justify-center">
      <div className="w-full max-w-6xl xl:max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 xl:gap-14 items-center justify-center">
          
          {/* Left Column: Heading & Platform Metrics Narrative */}
          <div className="lg:col-span-5 flex flex-col items-center text-center lg:items-start lg:text-left space-y-4 sm:space-y-5 max-w-md mx-auto lg:mx-0">
            <span className="text-xs font-black uppercase tracking-widest text-orange-600">
              PLATFORM METRICS
            </span>

            <h2 className="text-3xl sm:text-4xl md:text-[44px] lg:text-5xl font-black text-slate-950 tracking-tight leading-[1.15]">
              Preserving History, <br />
              <span className="font-serif italic font-normal text-orange-600">One Story at a Time.</span>
            </h2>

            <p className="text-slate-600 text-sm sm:text-base leading-relaxed font-normal pt-1">
              Every bridge built is a legacy preserved. Through community dedication and intelligent tools, we are capturing wisdom before it fades away.
            </p>
          </div>

          {/* Right Column: 2x2 Metric Cards Grid */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 w-full max-w-xl mx-auto lg:max-w-none">
            {metrics.map((item) => (
              <div
                key={item.id}
                className="bg-[#fafaf9] hover:bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/70 hover:border-slate-300/80 shadow-2xs hover:shadow-lg transition-all duration-300 group flex flex-col justify-between space-y-5"
              >
                {/* Top Icon */}
                <div className={`w-10 h-10 rounded-2xl ${item.iconBg} ${item.iconColor} flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}>
                  {item.icon}
                </div>

                {/* Metric Value & Label */}
                <div className="space-y-1">
                  <p className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
                    {item.value}
                  </p>
                  <p className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                    {item.label}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
