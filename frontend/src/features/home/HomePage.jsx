// Home page imports
import React from 'react';
import Hero from './components/Hero';
import Features from './components/Features';
import HowItWorks from './components/HowItWorks';
import BridgingGenerations from './components/BridgingGenerations';
import Stats from './components/Stats';
import Testimonials from './components/Testimonials';

// Home page component
export default function HomePage({ onViewChange, currentUser }) {
  return (
    <div className="w-full flex flex-col items-center overflow-hidden">
      {/* Hero section */}
      <Hero
        onGetStarted={() => onViewChange(currentUser ? 'contribute' : 'signup')}
        onLearnMore={() => onViewChange('library')}
      />

      {/* Features container - Full Width */}
      <div className="w-full max-w-[1600px] 2xl:max-w-[1780px] mx-auto px-4 sm:px-6 md:px-10 lg:px-12 2xl:px-16 space-y-12 sm:space-y-16 mt-4 sm:mt-6">
        <Features onViewChange={onViewChange} />
      </div>

      {/* How it works - Full Width Section */}
      <div className="w-full my-8 sm:my-14">
        <HowItWorks onViewChange={onViewChange} />
      </div>

      {/* Bridging Generations - Just after How Setu Works */}
      <div className="w-full my-4 sm:my-8">
        <BridgingGenerations onJoinClick={() => onViewChange(currentUser ? 'library' : 'signup')} />
      </div>

      {/* Platform Metrics Section (Replaces old Stats banner) */}
      <div className="w-full my-4 sm:my-8">
        <Stats />
      </div>

      {/* Testimonials container - Full Width */}
      <div className="w-full max-w-[1600px] 2xl:max-w-[1780px] mx-auto px-4 sm:px-6 md:px-10 lg:px-12 2xl:px-16 space-y-12 sm:space-y-16 pb-16">
        <Testimonials />
      </div>
    </div>
  );
}
