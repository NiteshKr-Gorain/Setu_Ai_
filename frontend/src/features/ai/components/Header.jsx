import React from 'react';
import { Maximize2, Minimize2, Server, X, PanelLeft } from 'lucide-react';

export default function Header({ 
  activeChatTitle, 
  isBackendConnected, 
  onToggleSidebar, 
  onClose,
  isFullscreen,
  onToggleFullscreen
}) {
  return (
    <header className="flex items-center justify-between h-14 px-4 bg-[#f5f5f7]/90 backdrop-blur-md text-slate-800 border-b border-[#e2e8f0] sticky top-0 z-10">
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition-colors"
            title="Toggle Sidebar"
          >
            <PanelLeft className="w-5 h-5" />
          </button>
        )}
        {activeChatTitle && (
          <h2 className="text-sm font-medium text-slate-700 truncate max-w-xs md:max-w-md">
            {activeChatTitle}
          </h2>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Connection Status Badge */}
        <div
          title={isBackendConnected ? "Connected" : "Offline"}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
            isBackendConnected
              ? 'bg-orange-50 text-orange-700 border-orange-200'
              : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}
        >
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              isBackendConnected ? 'bg-orange-500' : 'bg-amber-400'
            }`} />
            <span className={`relative inline-flex rounded-full h-2 w-2 ${
              isBackendConnected ? 'bg-orange-500' : 'bg-amber-500'
            }`} />
          </span>
          <Server className="w-3.5 h-3.5 text-orange-600" />
          <span className="hidden sm:inline font-semibold">
            {isBackendConnected ? 'Connected' : 'Offline'}
          </span>
        </div>

        {/* Fullscreen / Minimize Toggle button */}
        {onToggleFullscreen && (
          <button 
            onClick={onToggleFullscreen}
            className={`p-2 rounded-lg transition-colors ${
              isFullscreen 
                ? 'text-orange-600 bg-orange-50 hover:bg-orange-100' 
                : 'text-slate-500 hover:text-orange-600 hover:bg-orange-50'
            }`}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
        )}

        {/* Modal Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-200/60 rounded-full transition-colors ml-1"
            title="Close Assistant"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </header>
  );
}
