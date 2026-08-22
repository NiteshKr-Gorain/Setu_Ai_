import React, { useState, useEffect, useRef } from 'react';

export default function Navbar({ currentView, onViewChange, currentUser, onLogout }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollYRef = useRef(0);

  // Scroll listener: on scroll down, navbar goes up; on scroll up, it comes down with rounded bottom corners
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          const prevScrollY = lastScrollYRef.current;

          if (currentScrollY <= 15) {
            setIsScrolled(false);
            setIsVisible(true);
          } else {
            setIsScrolled(true);

            // If scrolling down by more than 6px and past 60px, slide navbar up
            if (currentScrollY > prevScrollY + 6 && currentScrollY > 60 && !isMobileMenuOpen) {
              setIsVisible(false);
            }
            // If scrolling up by more than 6px or mobile menu is open, slide navbar down
            else if (currentScrollY < prevScrollY - 6 || isMobileMenuOpen) {
              setIsVisible(true);
            }
          }

          lastScrollYRef.current = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobileMenuOpen]);

  const handleNavClick = (viewId) => {
    onViewChange(viewId);
    setIsMobileMenuOpen(false);
  };

  const navLinks = [
    { label: 'Home', viewId: 'home', id: 'nav-link-home' },
    { label: 'Library', viewId: 'library', id: 'nav-link-library' },
    { label: 'Community', viewId: 'community', id: 'nav-link-community' },
    { label: 'Schemes', viewId: 'govt schemes', id: 'nav-link-schemes' },
    { label: 'Legacy Archives', viewId: 'legacy', id: 'nav-link-legacy' },
    { label: 'About Us', viewId: 'about us', id: 'nav-link-about' },
  ];

  return (
    <>
      <header
        id="app-header-navigation"
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ease-in-out ${
          isVisible ? 'translate-y-0' : '-translate-y-full'
        } ${
          isScrolled
            ? 'bg-white/90 backdrop-blur-xl border-b border-slate-200/80 shadow-md shadow-slate-900/5 rounded-b-2xl md:rounded-b-3xl'
            : 'bg-white/95 backdrop-blur-md border-b border-slate-100/90 shadow-3xs rounded-b-none'
        }`}
      >
        {/* Navbar container */}
        <div className="max-w-[1440px] mx-auto px-4 md:px-8 h-22 flex items-center justify-between">

          {/* 1. Brand Logo & Title Button */}
          <button
            id="nav-brand-button"
            onClick={() => handleNavClick('home')}
            className="flex items-center space-x-3.5 group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary rounded-2xl p-1"
            aria-label="Setu AI Knowledge Bridge Home"
          >
            <div className="w-11 h-11 rounded-2xl overflow-hidden group-hover:scale-105 transition-transform duration-300 flex items-center justify-center bg-transparent border-0 p-0">
              <img src="/Setu_logo.png" alt="Setu Logo" loading="lazy" className="w-full h-full object-contain" />
            </div>
            <div className="text-left">
              <span className="text-[22px] font-black text-slate-900 tracking-tight block leading-none">Setu</span>
              <span className="text-[10px] font-bold text-brand-primary uppercase tracking-widest leading-none mt-1 block">AI Knowledge Bridge</span>
            </div>
          </button>

          {/* 2. Desktop Navigation Container */}
          <nav id="desktop-main-nav" aria-label="Main Navigation" className="hidden lg:flex items-center space-x-1.5 bg-slate-50/90 p-1.5 rounded-full border border-slate-200/60 shadow-3xs">
            {navLinks.map((link) => {
              const isActive = currentView === link.viewId;
              return (
                <button
                  key={link.viewId}
                  id={link.id}
                  onClick={() => handleNavClick(link.viewId)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`px-4.5 py-2.5 rounded-full text-xs md:text-[13px] font-bold transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary ${
                    isActive
                      ? 'bg-white text-brand-primary shadow-xs'
                      : 'text-slate-650 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* 3. Action Control Area */}
          <div id="desktop-auth-actions" className="hidden lg:flex items-center space-x-3.5">
            {currentUser ? (
              <div className="flex items-center space-x-3">
                <button
                  id="nav-action-contribute"
                  onClick={() => handleNavClick('contribute')}
                  className="px-5 py-2.5 bg-brand-light hover:bg-brand-primary/10 text-brand-hover text-xs md:text-[13px] font-bold rounded-full transition-all cursor-pointer flex items-center space-x-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                >
                  <span>✍️</span>
                  <span>Share Knowledge</span>
                </button>
                <button
                  id="nav-action-profile"
                  onClick={() => handleNavClick('profile')}
                  aria-label="View Profile"
                  className={`flex items-center space-x-3 p-1.5 pl-3.5 rounded-full border transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary ${
                    currentView === 'profile'
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className="text-xs md:text-[13px] font-bold">{currentUser.name || 'Profile'}</span>
                  <img
                    id="nav-user-avatar"
                    src={currentUser.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"}
                    alt={currentUser.name || "User Avatar"}
                    loading="lazy"
                    className="w-8 h-8 rounded-full object-cover border border-slate-200"
                    onError={(e) => {
                      e.target.src = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100";
                    }}
                  />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <button
                  id="nav-auth-signin"
                  onClick={() => handleNavClick('signin')}
                  className="px-5.5 py-2.5 text-slate-700 hover:text-brand-primary text-xs md:text-[13px] font-bold rounded-full transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                >
                  Sign In
                </button>
                <button
                  id="nav-auth-signup"
                  onClick={() => handleNavClick('signup')}
                  className="px-5.5 py-2.5 bg-brand-primary hover:bg-brand-hover text-white text-xs md:text-[13px] font-bold rounded-full shadow-md shadow-brand-primary/20 transition-all cursor-pointer transform hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                >
                  Get Started
                </button>
              </div>
            )}
          </div>

          {/* 4. Mobile Navigation Toggle Control */}
          <button
            id="nav-mobile-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-navigation-drawer"
            className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary cursor-pointer"
            aria-label="Toggle Mobile Navigation Drawer"
          >
            <svg className="w-6.5 h-6.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

        </div>
      </header>

      {/* 5. Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div
          id="mobile-navigation-drawer"
          className="fixed inset-x-0 top-22 z-30 bg-white/95 backdrop-blur-xl border-b border-slate-200 p-6 shadow-xl rounded-b-2xl md:rounded-b-3xl lg:hidden animate-in slide-in-from-top-4 duration-200"
        >
          <nav aria-label="Mobile Navigation" className="flex flex-col space-y-3 text-left">
            {navLinks.map((link) => (
              <button
                key={link.viewId}
                id={`mobile-${link.id}`}
                onClick={() => handleNavClick(link.viewId)}
                aria-current={currentView === link.viewId ? 'page' : undefined}
                className={`px-4 py-3 rounded-2xl text-sm font-bold text-left transition-colors cursor-pointer ${
                  currentView === link.viewId
                    ? 'bg-brand-light text-brand-primary'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {link.label}
              </button>
            ))}

            <div className="pt-4 border-t border-slate-100 flex flex-col space-y-2">
              {currentUser ? (
                <>
                  <button
                    id="mobile-action-contribute"
                    onClick={() => handleNavClick('contribute')}
                    className="w-full py-3 bg-brand-light text-brand-hover text-xs font-bold rounded-2xl text-center cursor-pointer"
                  >
                    ✍️ Share Knowledge
                  </button>
                  <button
                    id="mobile-action-profile"
                    onClick={() => handleNavClick('profile')}
                    className="w-full py-3 bg-slate-900 text-white text-xs font-bold rounded-2xl text-center cursor-pointer"
                  >
                    My Profile ({currentUser.name})
                  </button>
                  <button
                    id="mobile-action-logout"
                    onClick={() => {
                      onLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full py-3 border border-slate-200 text-slate-600 text-xs font-bold rounded-2xl text-center cursor-pointer"
                  >
                    Log Out
                  </button>
                </>
              ) : (
                <>
                  <button
                    id="mobile-auth-signin"
                    onClick={() => handleNavClick('signin')}
                    className="w-full py-3 border border-slate-200 text-slate-700 text-xs font-bold rounded-2xl text-center cursor-pointer"
                  >
                    Sign In
                  </button>
                  <button
                    id="mobile-auth-signup"
                    onClick={() => handleNavClick('signup')}
                    className="w-full py-3 bg-brand-primary text-white text-xs font-bold rounded-2xl text-center shadow-md shadow-brand-primary/20 cursor-pointer"
                  >
                    Get Started
                  </button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
