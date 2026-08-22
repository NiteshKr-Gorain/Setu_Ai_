import React, { useState } from 'react';

function Footer({ currentView, onViewChange }) {
  const [subscribed, setSubscribed] = useState(false);
  const [emailInput, setEmailInput] = useState('');

  const handleNavClick = (viewId) => {
    if (onViewChange) {
      onViewChange(viewId);
    }
  };

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (emailInput.trim()) {
      setSubscribed(true);
      setEmailInput('');
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  return (
    <footer id="app-footer-navigation" className="bg-slate-950 text-slate-400 py-16 md:py-20 border-t border-slate-900 transition-colors duration-300">
      {/* Container aligned with Navbar max width */}
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 grid grid-cols-1 md:grid-cols-4 gap-12 text-left">

        {/* 1. Brand Info Column with Setu_logo.png */}
        <div className="space-y-4.5 md:col-span-1">
          <button
            onClick={() => handleNavClick('home')}
            className="flex items-center space-x-3.5 group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary rounded-2xl p-1 text-left"
            aria-label="Setu AI Knowledge Bridge Home"
          >
            <div className="w-11 h-11 rounded-2xl overflow-hidden group-hover:scale-105 transition-transform duration-300 flex items-center justify-center bg-transparent border-0 p-0">
              <img src="/Setu_logo.png" alt="Setu Logo" loading="lazy" className="w-full h-full object-contain" />
            </div>
            <div className="text-left">
              <span className="text-2xl font-black text-white tracking-tight block leading-none">Setu</span>
              <span className="text-[10px] font-bold text-brand-primary uppercase tracking-widest leading-none mt-1 block">AI Knowledge Bridge</span>
            </div>
          </button>
          <p className="text-xs md:text-sm text-slate-400 leading-relaxed font-normal">
            Preserving ancestral wisdom and connecting youth with senior storytellers across generations.
          </p>
        </div>

        {/* 2. Quick Platform Links */}
        <div className="space-y-3.5">
          <h4 className="text-xs md:text-sm font-bold text-slate-200 uppercase tracking-widest">Platform Navigation</h4>
          <ul className="space-y-2.5 text-xs md:text-sm font-medium">
            <li>
              <button
                onClick={() => handleNavClick('library')}
                className={`hover:text-brand-primary transition-colors cursor-pointer text-left ${currentView === 'library' ? 'text-brand-primary font-bold' : ''}`}
              >
                Knowledge Library
              </button>
            </li>
            <li>
              <button
                onClick={() => handleNavClick('community')}
                className={`hover:text-brand-primary transition-colors cursor-pointer text-left ${currentView === 'community' ? 'text-brand-primary font-bold' : ''}`}
              >
                Community Mentors
              </button>
            </li>
            <li>
              <button
                onClick={() => handleNavClick('schemes')}
                className={`hover:text-brand-primary transition-colors cursor-pointer text-left ${currentView === 'schemes' ? 'text-brand-primary font-bold' : ''}`}
              >
                Senior Schemes
              </button>
            </li>
            <li>
              <button
                onClick={() => handleNavClick('legacy')}
                className={`hover:text-brand-primary transition-colors cursor-pointer text-left ${currentView === 'legacy' ? 'text-brand-primary font-bold' : ''}`}
              >
                Legacy Archives
              </button>
            </li>
          </ul>
        </div>

        {/* 3. Community Resources */}
        <div className="space-y-3.5">
          <h4 className="text-xs md:text-sm font-bold text-slate-200 uppercase tracking-widest">Community Links</h4>
          <ul className="space-y-2.5 text-xs md:text-sm font-medium">
            <li>
              <button
                onClick={() => handleNavClick('community')}
                className="hover:text-brand-primary transition-colors cursor-pointer text-left"
              >
                Find a Mentor
              </button>
            </li>
            <li>
              <button
                onClick={() => handleNavClick('contribute')}
                className={`hover:text-brand-primary transition-colors cursor-pointer text-left ${currentView === 'contribute' ? 'text-brand-primary font-bold' : ''}`}
              >
                Share Knowledge &amp; Craft
              </button>
            </li>
            <li>
              <button
                onClick={() => handleNavClick('about')}
                className={`hover:text-brand-primary transition-colors cursor-pointer text-left ${currentView === 'about' ? 'text-brand-primary font-bold' : ''}`}
              >
                About Us &amp; Mission
              </button>
            </li>
          </ul>
        </div>

        {/* 4. Newsletter & Contact */}
        <div className="space-y-3.5">
          <h4 className="text-xs md:text-sm font-bold text-slate-200 uppercase tracking-widest">Stay Connected</h4>
          <p className="text-xs md:text-sm text-slate-400 leading-relaxed font-normal">
            Subscribe for monthly heritage stories and community updates.
          </p>
          {subscribed ? (
            <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs font-semibold rounded-xl">
              ✨ Thank you for subscribing to Setu!
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="flex space-x-2 pt-1">
              <input
                type="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="Your email address"
                className="bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs md:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-primary flex-grow font-medium"
              />
              <button type="submit" className="px-4.5 py-2.5 bg-brand-primary hover:bg-brand-hover text-white text-xs md:text-sm font-bold rounded-xl transition-all cursor-pointer shadow-md shadow-brand-primary/20 shrink-0">
                Join
              </button>
            </form>
          )}
        </div>

      </div>

      <div className="max-w-[1440px] mx-auto px-4 md:px-8 mt-12 pt-8 border-t border-slate-900 text-center text-xs md:text-sm text-slate-500 font-medium">
        <p>© 2026 Setu Platform. All rights reserved. Preserving traditional knowledge for future generations.</p>
      </div>
    </footer>
  );
}

export default React.memo(Footer);
