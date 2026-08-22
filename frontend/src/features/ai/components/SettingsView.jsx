import React, { useState } from 'react';
import { Sun, Moon, Volume2, Database, Trash2, CheckCircle2, ShieldCheck, Cpu, Server, RefreshCw } from 'lucide-react';
import { clearLocalStorageCache, clearRecentChats } from '../../../shared/services/localStorageService';
import { ENV } from '../../../shared/config/env';

export default function SettingsView({ darkMode, setDarkMode, isBackendConnected, onRefreshBackendStatus }) {
  const [clearedMsg, setClearedMsg] = useState('');
  const [autoVoice, setAutoVoice] = useState(true);
  const [isPinging, setIsPinging] = useState(false);

  const handleResetCache = () => {
    clearLocalStorageCache();
    clearRecentChats();
    setClearedMsg('Local storage cache successfully reset!');
    setTimeout(() => setClearedMsg(''), 3000);
  };

  const handlePing = async () => {
    if (onRefreshBackendStatus) {
      setIsPinging(true);
      await onRefreshBackendStatus();
      setTimeout(() => setIsPinging(false), 500);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-6 md:p-8 overflow-y-auto max-w-4xl mx-auto w-full text-slate-800 bg-[#f5f5f7]">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900">Settings & Preferences</h2>
        <p className="text-xs text-slate-500 mt-1">
          Customize theme, backend integration, voice avatar, and data options
        </p>
      </div>

      {clearedMsg && (
        <div className="mb-6 p-3 bg-orange-50 border border-orange-200 text-orange-800 text-xs font-semibold rounded-xl flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-orange-600" />
          <span>{clearedMsg}</span>
        </div>
      )}

      <div className="space-y-4">
        {/* Backend Integration Panel */}
        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Server className="w-4 h-4 text-orange-500" />
              <span>FastAPI Backend Connection</span>
            </h3>
            <button
              onClick={handlePing}
              disabled={isPinging}
              className="px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-xs text-white rounded-xl font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-50 shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin' : ''}`} />
              <span>Test Connection</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
              <div>
                <p className="text-[11px] text-slate-400 font-medium">Server Endpoint</p>
                <p className="text-xs font-mono text-slate-800 font-semibold">{ENV.API_URL}</p>
              </div>
              <span className={`w-2.5 h-2.5 rounded-full ${isBackendConnected ? 'bg-orange-500 animate-pulse' : 'bg-amber-500'}`} />
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
              <div>
                <p className="text-[11px] text-slate-400 font-medium">Status & Engine</p>
                <p className="text-xs font-semibold text-slate-800">
                  {isBackendConnected ? 'Online (FastAPI + Keras 3)' : 'Offline (Local Cache Active)'}
                </p>
              </div>
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                isBackendConnected ? 'bg-orange-50 text-orange-600 border border-orange-200' : 'bg-amber-50 text-amber-600 border border-amber-200'
              }`}>
                {isBackendConnected ? 'CONNECTED' : 'DISCONNECTED'}
              </span>
            </div>
          </div>
        </div>

        {/* Appearance Settings */}
        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-3">Appearance</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600">
                {darkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </div>
              <div>
                <p className="font-semibold text-xs text-slate-900">Dark Mode Contrast</p>
                <p className="text-[11px] text-slate-500">Toggle interface appearance mode</p>
              </div>
            </div>

            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`relative w-12 h-6 rounded-full transition-colors p-0.5 ${
                darkMode ? 'bg-orange-500' : 'bg-slate-200'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                  darkMode ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Voice Avatar Settings */}
        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-3">Voice Settings</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600">
                <Volume2 className="w-4 h-4" />
              </div>
              <div>
                <p className="font-semibold text-xs text-slate-900">Speech Auto Synthesis</p>
                <p className="text-[11px] text-slate-500">Enable audio speech responses in Voice Avatar mode</p>
              </div>
            </div>

            <button
              onClick={() => setAutoVoice(!autoVoice)}
              className={`relative w-12 h-6 rounded-full transition-colors p-0.5 ${
                autoVoice ? 'bg-orange-500' : 'bg-slate-200'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                  autoVoice ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* AI Engine */}
        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-3">AI Engine Architecture</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center gap-3">
              <Cpu className="w-6 h-6 text-orange-500 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-slate-900">Keras 3 Neural Classifier</p>
                <p className="text-[10px] text-slate-500">Deep learning intent routing</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-orange-600 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-slate-900">Browser Local Storage Cache</p>
                <p className="text-[10px] text-slate-500">Zero-latency offline answer retrieval</p>
              </div>
            </div>
          </div>
        </div>

        {/* Reset Data */}
        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-3">Data Management</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center text-red-600">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <p className="font-semibold text-xs text-slate-900">Clear All Local Data</p>
                <p className="text-[11px] text-slate-500">Remove cached queries and chat history</p>
              </div>
            </div>

            <button
              onClick={handleResetCache}
              className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-2 shadow-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Reset Data</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
