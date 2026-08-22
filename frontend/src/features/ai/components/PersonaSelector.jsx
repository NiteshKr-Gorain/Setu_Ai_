import React from 'react';
import { Sparkles, Check } from 'lucide-react';

export default function PersonaSelector({
  personas = [],
  selectedPersonaId = 'genji',
  onSelectPersona
}) {
  return (
    <div className="w-full max-w-4xl flex flex-col gap-3.5">
      {/* Section Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-orange-400" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-amber-200">
            Select Knowledge Master Persona
          </h3>
        </div>
        <span className="text-xs text-stone-400 hidden sm:inline">
          Choose a mentor persona for tailored vocal cadence and knowledge domain
        </span>
      </div>

      {/* Model Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {personas.map((p) => {
          const isSelected = p.id === selectedPersonaId;
          return (
            <div
              key={p.id}
              onClick={() => onSelectPersona(p)}
              className={`relative cursor-pointer rounded-2xl p-4 border transition-all duration-200 flex flex-col justify-between gap-3 ${
                isSelected
                  ? 'bg-stone-900 border-orange-500 shadow-xl shadow-orange-600/20 scale-[1.02] ring-1 ring-orange-500/50'
                  : 'bg-stone-950/70 border-white/10 hover:border-amber-500/30 hover:bg-stone-900/60'
              }`}
            >
              {/* Selected Badge */}
              {isSelected && (
                <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-md">
                  <Check className="w-3.5 h-3.5" />
                </div>
              )}

              {/* Persona Monogram & Name */}
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm text-white shadow-md shrink-0"
                  style={{ backgroundColor: p.theme_color || '#ea580c' }}
                >
                  {p.name.charAt(0)}
                </div>
                <div className="flex flex-col pr-6 min-w-0 flex-1">
                  <span className="text-xs font-bold text-stone-100 truncate block">{p.name}</span>
                  <span className="text-[10px] text-orange-400 font-medium line-clamp-1">{p.role}</span>
                </div>
              </div>

              {/* Description */}
              <p className="text-[11px] text-stone-400 line-clamp-2 leading-relaxed">
                {p.description}
              </p>

              {/* Bottom Action Strip */}
              <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[10px] text-stone-400 font-mono-code">
                <span>{p.accent}</span>
                <span
                  className={`px-2 py-0.5 rounded-full font-bold transition-colors ${
                    isSelected
                      ? 'bg-orange-500/20 text-orange-300'
                      : 'bg-stone-800 text-stone-400'
                  }`}
                >
                  {isSelected ? 'ACTIVE' : 'SELECT'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
