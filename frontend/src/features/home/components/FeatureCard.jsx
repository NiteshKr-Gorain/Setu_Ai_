import React from 'react';

export default function FeatureCard({ icon, title, description, onClick }) {
  return (
    <div
      onClick={onClick}
      className="bg-white p-8 rounded-3xl border border-slate-100/80 shadow-xs hover:shadow-md hover:border-blue-200 transition-all duration-300 flex flex-col justify-between group text-left cursor-pointer"
    >
      <div className="space-y-4">
        {/* Icon Container */}
        <div className="w-12 h-12 rounded-2xl bg-blue-50/80 border border-blue-100/60 flex items-center justify-center text-xl text-blue-600 group-hover:scale-110 group-hover:bg-blue-100 transition-transform duration-300">
          {icon}
        </div>

        {/* Feature Title */}
        <h3 className="text-md font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
          {title}
        </h3>

        {/* Description */}
        <p className="text-slate-500 text-xs font-normal leading-relaxed">
          {description}
        </p>
      </div>

      {/* Interactive Explore Details Button */}
      <div className="pt-6 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-600 group-hover:text-blue-700 transition-colors">
        <span>Explore details</span>
        <span className="ml-1 transition-transform group-hover:translate-x-1.5 text-sm">→</span>
      </div>
    </div>
  );
}
