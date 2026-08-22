import React, { useState, useEffect } from 'react';
import {
  X, Volume2, Sliders, Check, Play, RefreshCw,
  Cpu, Sparkles, Plus, Trash2, Key, Database, ExternalLink, Zap
} from 'lucide-react';
import {
  fetchCustomKnowledge, addCustomKnowledge, deleteCustomKnowledge, saveApiKeys
} from '../services/avatarApi';

const POPULAR_OPENROUTER_MODELS = [
  { id: 'openrouter/free', name: 'OpenRouter Free (Auto-Selects Best Free Model)', tag: '100% Free' },
  { id: 'deepseek/deepseek-chat', name: 'DeepSeek V3 (Chat)', tag: 'Top Reasoning' },
  { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Meta Llama 3.3 70B Instruct', tag: 'Fast 70B' },
  { id: 'openai/gpt-4o-mini', name: 'OpenAI GPT-4o Mini', tag: 'Fast & Smart' },
  { id: 'anthropic/claude-3.5-haiku', name: 'Anthropic Claude 3.5 Haiku', tag: 'Conversational' }
];


export default function SettingsModal({
  isOpen,
  onClose,
  useNeuralVoice,
  setUseNeuralVoice,
  availableVoices = [],
  selectedVoiceIndex,
  setSelectedVoiceIndex,
  speechRate,
  setSpeechRate,
  speechPitch,
  setSpeechPitch,
  onTestVoice,
  selectedLang,
  _supportedLanguages = []
}) {
  const [activeTab, setActiveTab] = useState('openrouter'); // 'openrouter' | 'voice' | 'knowledge'
  const [isPlayingTest, setIsPlayingTest] = useState(false);

  // OpenRouter & API Key State
  const [openrouterKey, setOpenrouterKey] = useState('');
  const [openrouterModel, setOpenrouterModel] = useState('google/gemini-2.0-flash-exp:free');
  const [customModelInput, setCustomModelInput] = useState('');
  const [isSavingKeys, setIsSavingKeys] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [apiStatus, setApiStatus] = useState({});

  // Custom Knowledge State
  const [knowledgeList, setKnowledgeList] = useState([]);
  const [newTopic, setNewTopic] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [isAddingEntry, setIsAddingEntry] = useState(false);
  const [isLoadingKnowledge, setIsLoadingKnowledge] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    setIsLoadingKnowledge(true);
    try {
      const data = await fetchCustomKnowledge();
      setKnowledgeList(data.knowledge || []);
      setApiStatus(data.api_status || {});
      if (data.api_status?.openrouter_model) {
        setOpenrouterModel(data.api_status.openrouter_model);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingKnowledge(false);
    }
  };

  const handleSaveOpenRouter = async (e) => {
    e.preventDefault();
    setIsSavingKeys(true);
    const selectedModel = customModelInput.trim() || openrouterModel;
    try {
      await saveApiKeys({
        openrouter_key: openrouterKey.trim(),
        openrouter_model: selectedModel
      });
      setSaveSuccessMsg('OpenRouter connected successfully! Avatar now answers all questions.');
      setTimeout(() => setSaveSuccessMsg(''), 4000);
      setOpenrouterKey('');
      await loadData();
    } catch (err) {
      console.error('Error saving OpenRouter configuration:', err);
    } finally {
      setIsSavingKeys(false);
    }
  };

  const handleAddQnA = async (e) => {
    e.preventDefault();
    if (!newTopic.trim() || !newAnswer.trim()) return;
    setIsAddingEntry(true);
    try {
      await addCustomKnowledge({
        topic: newTopic.trim(),
        answer: newAnswer.trim(),
        category: 'Custom Q&A',
        language: selectedLang
      });
      setNewTopic('');
      setNewAnswer('');
      await loadData();
    } catch (err) {
      console.error('Error adding knowledge:', err);
    } finally {
      setIsAddingEntry(false);
    }
  };

  const handleDeleteItem = async (id) => {
    try {
      await deleteCustomKnowledge(id);
      await loadData();
    } catch (err) {
      console.error('Error deleting knowledge item:', err);
    }
  };

  const handleTestClick = async () => {
    setIsPlayingTest(true);
    if (onTestVoice) {
      await onTestVoice();
    }
    setTimeout(() => setIsPlayingTest(false), 2200);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-stone-900/95 border border-amber-500/30 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col gap-4 text-stone-100 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-orange-600/20 border border-orange-500/30 text-orange-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-100 flex items-center gap-2">
                OpenRouter & Avatar Settings
              </h2>
              <p className="text-xs text-stone-400">Configure AI model gateway, speech audio, or custom knowledge</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 Clean Tabs */}
        <div className="flex rounded-2xl bg-stone-950/80 p-1 border border-amber-500/15 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('openrouter')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'openrouter'
                ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            OpenRouter AI
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('voice')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'voice'
                ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            Voice & Audio
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('knowledge')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'knowledge'
                ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            Custom Data
          </button>
        </div>

        {/* ================= TAB 1: OPENROUTER AI ================= */}
        {activeTab === 'openrouter' && (
          <form onSubmit={handleSaveOpenRouter} className="flex flex-col gap-4">
            
            {/* Status Banner */}
            <div className="p-3 bg-stone-950 border border-amber-500/20 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${apiStatus.has_openrouter ? 'bg-green-400 shadow-sm shadow-green-400/50' : 'bg-stone-600'}`} />
                <span className="text-xs font-bold text-stone-200">
                  {apiStatus.has_openrouter ? 'OpenRouter Connected' : 'OpenRouter Not Connected'}
                </span>
              </div>
              {apiStatus.openrouter_model && (
                <span className="text-[10px] font-mono-code px-2 py-0.5 rounded-lg bg-orange-600/20 text-orange-300 border border-orange-500/30 truncate max-w-[160px]">
                  {apiStatus.openrouter_model}
                </span>
              )}
            </div>

            {/* API Key Input */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-amber-200 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-orange-400" />
                  OpenRouter API Key
                </label>
                <a
                  href="https://openrouter.ai/keys"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-orange-400 hover:text-orange-300 flex items-center gap-1 underline"
                >
                  Get OpenRouter Key <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <input
                type="password"
                placeholder="sk-or-v1-xxxxxxxxxxxxxxxxxxxx..."
                value={openrouterKey}
                onChange={(e) => setOpenrouterKey(e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-xs text-stone-100 focus:border-orange-500 focus:outline-none"
              />
              <p className="text-[10px] text-stone-400">
                With OpenRouter, you can use any free or premium model (Gemini, DeepSeek, Claude, Llama 3, GPT-4o) with a single key.
              </p>
            </div>

            {/* Model Selection */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-amber-200 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-orange-400" />
                Choose AI Model
              </label>
              <select
                value={openrouterModel}
                onChange={(e) => {
                  setOpenrouterModel(e.target.value);
                  setCustomModelInput('');
                }}
                className="w-full bg-stone-950 border border-amber-500/25 rounded-xl px-3.5 py-2.5 text-xs text-stone-100 focus:border-orange-500 focus:outline-none"
              >
                {POPULAR_OPENROUTER_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} [{m.tag}]
                  </option>
                ))}
              </select>
            </div>

            {/* Custom Model ID (Optional) */}
            <div className="flex flex-col gap-1">
              <span className="text-[11px] text-stone-400">Or enter custom OpenRouter Model ID (optional):</span>
              <input
                type="text"
                placeholder="e.g. qwen/qwen-2.5-72b-instruct"
                value={customModelInput}
                onChange={(e) => setCustomModelInput(e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-1.5 text-xs text-stone-200 focus:border-orange-500 focus:outline-none"
              />
            </div>

            {/* Save Button */}
            <button
              type="submit"
              disabled={isSavingKeys || (!openrouterKey.trim() && !openrouterModel)}
              className="btn-action-primary !py-2.5 !rounded-xl !text-xs font-bold flex items-center justify-center gap-1.5"
            >
              {isSavingKeys ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              Save OpenRouter Configuration
            </button>

            {saveSuccessMsg && (
              <p className="text-xs text-green-400 font-medium text-center">{saveSuccessMsg}</p>
            )}
          </form>
        )}

        {/* ================= TAB 2: VOICE & AUDIO ================= */}
        {activeTab === 'voice' && (
          <div className="flex flex-col gap-4">
            
            {/* Speech Engine */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-amber-200/80 font-mono-code flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-orange-400" />
                Speech Engine
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setUseNeuralVoice(true)}
                  className={`p-3 rounded-2xl border text-left transition-all flex flex-col gap-1 ${
                    useNeuralVoice
                      ? 'bg-gradient-to-br from-orange-600/20 to-amber-600/20 border-orange-500 text-amber-200 shadow-md shadow-orange-600/10'
                      : 'bg-stone-950/60 border-stone-800 text-stone-400 hover:border-stone-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-100">HD Studio Voice</span>
                    {useNeuralVoice && <Check className="w-3.5 h-3.5 text-orange-400" />}
                  </div>
                  <span className="text-[10px] text-stone-400">Microsoft Neural TTS</span>
                </button>

                <button
                  type="button"
                  onClick={() => setUseNeuralVoice(false)}
                  className={`p-3 rounded-2xl border text-left transition-all flex flex-col gap-1 ${
                    !useNeuralVoice
                      ? 'bg-gradient-to-br from-orange-600/20 to-amber-600/20 border-orange-500 text-amber-200 shadow-md shadow-orange-600/10'
                      : 'bg-stone-950/60 border-stone-800 text-stone-400 hover:border-stone-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-100">Installed Voice</span>
                    {!useNeuralVoice && <Check className="w-3.5 h-3.5 text-orange-400" />}
                  </div>
                  <span className="text-[10px] text-stone-400">Browser / System Voice</span>
                </button>
              </div>
            </div>

            {/* Installed Voices */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-amber-200 flex items-center justify-between">
                <span>Installed System Voices</span>
                <span className="text-[10px] text-stone-400">{availableVoices.length} found</span>
              </label>
              <select
                value={selectedVoiceIndex}
                onChange={(e) => setSelectedVoiceIndex(Number(e.target.value))}
                className="w-full bg-stone-950 border border-amber-500/25 rounded-xl px-3 py-2 text-xs text-stone-100 focus:border-orange-500 focus:outline-none"
              >
                {availableVoices.length === 0 ? (
                  <option value="0">Default System Voice</option>
                ) : (
                  availableVoices.map((voice, idx) => (
                    <option key={`${voice.name}-${idx}`} value={idx}>
                      {voice.name} ({voice.lang})
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Speed & Pitch Controls */}
            <div className="flex flex-col gap-3 bg-stone-950/70 border border-amber-500/15 rounded-2xl p-3.5">
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-stone-300 flex items-center gap-1">
                    <Sliders className="w-3 h-3 text-orange-400" />
                    Speech Speed
                  </span>
                  <span className="text-amber-300 font-mono-code font-bold">{speechRate.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.80"
                  max="1.30"
                  step="0.05"
                  value={speechRate}
                  onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                  className="w-full accent-orange-500 h-1.5 bg-stone-800 rounded-lg cursor-pointer"
                />
              </div>

              <div className="flex flex-col gap-1 pt-2 border-t border-stone-800">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-stone-300">Voice Pitch</span>
                  <span className="text-amber-300 font-mono-code font-bold">{speechPitch.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.85"
                  max="1.20"
                  step="0.05"
                  value={speechPitch}
                  onChange={(e) => setSpeechPitch(parseFloat(e.target.value))}
                  className="w-full accent-orange-500 h-1.5 bg-stone-800 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            {/* Test Voice Sample */}
            <button
              type="button"
              onClick={handleTestClick}
              disabled={isPlayingTest}
              className="btn-action-secondary !py-2.5 !rounded-xl !text-xs flex items-center justify-center gap-1.5"
            >
              {isPlayingTest ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-orange-400" />
                  <span>Playing Voice Preview...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 text-orange-400" />
                  <span>Test Voice Sample</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* ================= TAB 3: CUSTOM DATA (Q&A) ================= */}
        {activeTab === 'knowledge' && (
          <div className="flex flex-col gap-4">
            
            {/* Add Q&A Form */}
            <form onSubmit={handleAddQnA} className="bg-stone-950/70 border border-amber-500/20 rounded-2xl p-3.5 flex flex-col gap-2.5">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-orange-400" />
                Train Specific Question & Answer
              </span>
              <input
                type="text"
                placeholder="Topic or Question (e.g., 'What is our company project?')"
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-100 focus:border-orange-500 focus:outline-none"
              />
              <textarea
                rows={2}
                placeholder="Direct Answer (What the avatar speaks)..."
                value={newAnswer}
                onChange={(e) => setNewAnswer(e.target.value)}
                className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-100 focus:border-orange-500 focus:outline-none resize-none"
              />
              <button
                type="submit"
                disabled={isAddingEntry || !newTopic.trim() || !newAnswer.trim()}
                className="btn-action-primary !py-2 !rounded-xl !text-xs font-bold flex items-center justify-center gap-1.5"
              >
                {isAddingEntry ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                Add Custom Topic
              </button>
            </form>

            {/* List of Trained Items */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs font-bold text-stone-300">
                <span className="flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-orange-400" />
                  Trained Topics ({knowledgeList.length})
                </span>
                <button
                  type="button"
                  onClick={loadData}
                  className="text-orange-400 hover:text-orange-300 text-[11px] flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Refresh
                </button>
              </div>

              {isLoadingKnowledge ? (
                <div className="p-3 text-center text-xs text-stone-400">Loading topics...</div>
              ) : knowledgeList.length === 0 ? (
                <div className="p-4 text-center text-xs text-stone-500 border border-dashed border-stone-800 rounded-2xl">
                  No custom topics added yet. Add one above!
                </div>
              ) : (
                <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-1">
                  {knowledgeList.map((item) => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-xl bg-stone-950 border border-stone-800 flex items-start justify-between gap-2 hover:border-amber-500/30 transition-colors"
                    >
                      <div className="flex flex-col gap-1 min-w-0">
                        <span className="text-xs font-bold text-amber-200 truncate">
                          {item.topic}
                        </span>
                        <p className="text-[11px] text-stone-400 line-clamp-2 leading-relaxed">
                          {item.answer}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1 text-stone-500 hover:text-red-400 hover:bg-stone-900 rounded-lg transition-colors shrink-0"
                        title="Delete topic"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* Footer Done */}
        <div className="flex items-center justify-end pt-2 border-t border-stone-800">
          <button
            type="button"
            onClick={onClose}
            className="btn-action-primary !py-2.5 !px-6 !rounded-2xl !text-xs font-bold"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
}
