import React from 'react';

export default function StepCard({ number, title, description }) {
  return (
    <div className="relative bg-white p-8 rounded-3xl border border-slate-100/80 shadow-xs flex flex-col justify-between text-left group hover:border-blue-100 transition-all duration-300">
      <div className="space-y-4">
        {/* Step Number Badge */}
        <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-extrabold text-lg flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-110 transition-transform duration-300">
          {number}
        </div>

        {/* Title */}
        <h3 className="text-md font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
          {title}
        </h3>

        {/* Description */}
        <p className="text-slate-500 text-xs font-normal leading-relaxed">
          {description}
        </p>
      </div>

      {/* Decorative Step Indicator Bar */}
      <div className="w-8 h-1 bg-slate-100 group-hover:bg-blue-600 group-hover:w-16 transition-all duration-300 mt-6 rounded-full"></div>
    </div>
  );
}
