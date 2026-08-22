import React from 'react';

export default function TestimonialCard({ quote, name, role, avatar }) {
  return (
    <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xs flex flex-col justify-between text-left space-y-6">
      <p className="text-slate-600 text-xs font-normal leading-relaxed italic">
        "{quote}"
      </p>

      <div className="flex items-center space-x-3 pt-4 border-t border-slate-50">
        <img
          src={avatar}
          alt={name}
          loading="lazy"
          className="w-10 h-10 rounded-full object-cover border border-slate-100"
        />
        <div>
          <h4 className="text-xs font-bold text-slate-900">{name}</h4>
          <p className="text-[10px] text-slate-400 font-semibold">{role}</p>
        </div>
      </div>
    </div>
  );
}
