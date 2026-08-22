import React from 'react';

export default function AboutUsPage({ onViewChange, onSignUpClick }) {
  return (
    <div className="pt-24 pb-16 min-h-screen bg-slate-50 text-slate-800 transition-colors duration-300">

      {/* 1. Hero Section */}
      <section className="relative py-20 bg-gradient-to-b from-blue-50/50 via-white to-slate-50 overflow-hidden border-b border-slate-100">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-br from-amber-100/30 to-blue-100/30 rounded-full blur-3xl -z-10 translate-x-1/4 -translate-y-1/4"></div>
        <div className="max-w-4xl mx-auto px-6 md:px-12 text-center space-y-6">
          <span className="inline-flex items-center space-x-1.5 bg-brand-light/60 border border-brand-primary/10 rounded-full px-4 py-1.5 text-xs font-semibold text-brand-hover tracking-wide uppercase">
            <span>✨ Introducing Setu</span>
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Bridging Generations, <br />
            <span className="text-brand-primary">Preserving Wisdom</span>
          </h1>
          <p className="text-base text-slate-550 leading-relaxed font-normal max-w-2xl mx-auto">
            Setu is a digital bridge built to unite the curiosity of youth with the deep, lived experiences of our elders. By passing down life stories, language dialects, and ancestral crafts, we keep the torch of human wisdom lit for generations to come.
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 md:px-12 py-12 space-y-20">

        {/* 2. Our Mission & Vision */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
          <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-xs space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl font-bold">
              🎯
            </div>
            <h3 className="text-xl font-extrabold text-slate-900">Our Mission</h3>
            <p className="text-xs text-slate-550 leading-relaxed font-normal">
              To empower seniors to share their priceless knowledge, traditions, and life lessons, while providing youth with authentic mentorship, cultural preservation, and intergenerational connection.
            </p>
          </div>

          <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-xs space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl font-bold">
              👁️
            </div>
            <h3 className="text-xl font-extrabold text-slate-900">Our Vision</h3>
            <p className="text-xs text-slate-550 leading-relaxed font-normal">
              A world where age is celebrated as a fountain of wisdom, where traditional knowledge thrives alongside modern innovation, and where no elder ever feels forgotten or isolated.
            </p>
          </div>
        </section>

        {/* 3. The Problem & Solution */}
        <section className="bg-white border border-slate-100 rounded-3xl p-8 md:p-12 shadow-xs text-left space-y-8">
          <div className="text-center md:text-left space-y-2">
            <h2 className="text-2xl font-extrabold text-slate-900">Why Setu Exists</h2>
            <p className="text-xs text-slate-400 font-normal">
              Addressing the growing gap between generations in a fast-paced digital era.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <span className="text-2xl">⏳</span>
              <h4 className="font-bold text-sm text-slate-800">Fading Oral Traditions</h4>
              <p className="text-xs text-slate-500 leading-relaxed font-normal">
                Centuries of agricultural wisdom, folk medicine, and artisanal crafts risk vanishing without structured digital documentation.
              </p>
            </div>

            <div className="space-y-3">
              <span className="text-2xl">💔</span>
              <h4 className="font-bold text-sm text-slate-800">Elderly Isolation</h4>
              <p className="text-xs text-slate-500 leading-relaxed font-normal">
                Many seniors feel disconnected from society, despite holding priceless expertise that could enrich young minds and local communities.
              </p>
            </div>

            <div className="space-y-3">
              <span className="text-2xl">🌉</span>
              <h4 className="font-bold text-sm text-slate-800">The Setu Solution</h4>
              <p className="text-xs text-slate-500 leading-relaxed font-normal">
                An interactive AI-guided platform connecting young seekers with senior mentors, verifying traditional knowledge, and preserving heritage archives.
              </p>
            </div>
          </div>
        </section>

        {/* 4. Core Values Section with Interactive Details Navigation */}
        <section className="text-left space-y-8">
          <div className="text-center md:text-left space-y-2">
            <h2 className="text-2xl font-extrabold text-slate-900">Our Core Values</h2>
            <p className="text-xs text-slate-400 font-normal">
              The ethical compass that guides every interaction on Setu. Click any core value to explore details.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div
              onClick={() => onViewChange && onViewChange('community')}
              className="bg-white border border-slate-100 rounded-2xl p-6 shadow-3xs space-y-3 flex flex-col justify-between hover:shadow-md hover:border-blue-200 transition-all duration-300 cursor-pointer group"
            >
              <div className="space-y-3">
                <span className="text-xl">🤝</span>
                <h4 className="font-bold text-xs text-slate-800 group-hover:text-blue-600 transition-colors">Respect</h4>
                <p className="text-[10px] text-slate-500 leading-relaxed font-normal">
                  We approach our elders with deep respect for their lived histories, recognizing them as active custodians of wisdom.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-50 flex items-center justify-between text-xs font-bold text-blue-600 group-hover:text-blue-700">
                <span>Explore details</span>
                <span className="ml-1 transition-transform group-hover:translate-x-1.5">→</span>
              </div>
            </div>

            <div
              onClick={() => onViewChange && onViewChange('community')}
              className="bg-white border border-slate-100 rounded-2xl p-6 shadow-3xs space-y-3 flex flex-col justify-between hover:shadow-md hover:border-blue-200 transition-all duration-300 cursor-pointer group"
            >
              <div className="space-y-3">
                <span className="text-xl">💬</span>
                <h4 className="font-bold text-xs text-slate-800 group-hover:text-blue-600 transition-colors">Connection</h4>
                <p className="text-[10px] text-slate-500 leading-relaxed font-normal">
                  We believe that mutual storytelling breaks down isolation, nurturing empathy, dialogue, and cross-generational friendships.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-50 flex items-center justify-between text-xs font-bold text-blue-600 group-hover:text-blue-700">
                <span>Explore details</span>
                <span className="ml-1 transition-transform group-hover:translate-x-1.5">→</span>
              </div>
            </div>

            <div
              onClick={() => onViewChange && onViewChange('legacy')}
              className="bg-white border border-slate-100 rounded-2xl p-6 shadow-3xs space-y-3 flex flex-col justify-between hover:shadow-md hover:border-blue-200 transition-all duration-300 cursor-pointer group"
            >
              <div className="space-y-3">
                <span className="text-xl">🔖</span>
                <h4 className="font-bold text-xs text-slate-800 group-hover:text-blue-600 transition-colors">Preservation</h4>
                <p className="text-[10px] text-slate-500 leading-relaxed font-normal">
                  We actively capture traditional practices, dying dialects, and recipes, keeping heritage relevant in a digital age.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-50 flex items-center justify-between text-xs font-bold text-blue-600 group-hover:text-blue-700">
                <span>Explore details</span>
                <span className="ml-1 transition-transform group-hover:translate-x-1.5">→</span>
              </div>
            </div>

            <div
              onClick={() => onViewChange && onViewChange('schemes')}
              className="bg-white border border-slate-100 rounded-2xl p-6 shadow-3xs space-y-3 flex flex-col justify-between hover:shadow-md hover:border-blue-200 transition-all duration-300 cursor-pointer group"
            >
              <div className="space-y-3">
                <span className="text-xl">🏡</span>
                <h4 className="font-bold text-xs text-slate-800 group-hover:text-blue-600 transition-colors">Community</h4>
                <p className="text-[10px] text-slate-500 leading-relaxed font-normal">
                  We foster a safe, warm, and supportive village environment where knowledge is shared freely and every user finds belonging.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-50 flex items-center justify-between text-xs font-bold text-blue-600 group-hover:text-blue-700">
                <span>Explore details</span>
                <span className="ml-1 transition-transform group-hover:translate-x-1.5">→</span>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Impact Section */}
        <section className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 md:p-12 text-white text-center shadow-md">
          <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="text-2xl md:text-3xl font-extrabold">Ready to Bridge the Knowledge Gap?</h2>
            <p className="text-xs md:text-sm text-blue-100 leading-relaxed font-normal">
              Whether you want to learn traditional crafts from senior masters or contribute your family’s ancestral recipes, your journey starts here.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <button
                onClick={onSignUpClick}
                className="w-full sm:w-auto px-8 py-3.5 bg-white text-blue-700 hover:bg-blue-50 text-xs font-bold rounded-full shadow-md transition-all transform hover:-translate-y-0.5 cursor-pointer"
              >
                Join Setu Today
              </button>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
