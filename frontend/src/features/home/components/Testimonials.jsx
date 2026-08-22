// Testimonials imports
import React from 'react';
import TestimonialCard from './TestimonialCard';

// Testimonials component
export default function Testimonials() {
  // Testimonials data
  const testimonials = [
    {
      quote: "Sharing my zero-budget organic farming techniques with young agriculture students through Setu gave me a renewed sense of purpose.",
      name: "Ramesh Kumar",
      role: "Farmer & Elder (Bihar)",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&h=150&q=80"
    },
    {
      quote: "I learned ancient pottery methods directly from Sita Devi. Her patience and guidance helped me preserve a craft that was almost extinct in our district.",
      name: "Neha Patel",
      role: "Artisan Learner (Gujarat)",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80"
    },
    {
      quote: "Setu's AI verification makes it easy to understand the scientific reasons behind age-old Ayurvedic remedies.",
      name: "Dr. A. Sharma",
      role: "Ayurvedic Researcher (Kerala)",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80"
    }
  ];

  return (
    <section className="py-20 md:py-24 bg-slate-50/60 rounded-3xl border border-slate-100/80 transition-colors duration-300">
      <div className="w-full max-w-[1600px] 2xl:max-w-[1780px] mx-auto px-6 md:px-12 space-y-16">
        
        {/* Section header */}
        <div className="flex flex-col items-center text-center space-y-4 max-w-2xl mx-auto">
          <span className="text-xs font-extrabold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
            Community Voices
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight">
            Stories of Connection
          </h2>
          <p className="text-slate-500 text-sm md:text-base leading-relaxed font-normal">
            Read how Setu is transforming lives by linking wisdom keepers with eager learners.
          </p>
        </div>

        {/* Testimonials cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, idx) => (
            <TestimonialCard
              key={idx}
              quote={t.quote}
              name={t.name}
              role={t.role}
              avatar={t.avatar}
            />
          ))}
        </div>

      </div>
    </section>
  );
}
