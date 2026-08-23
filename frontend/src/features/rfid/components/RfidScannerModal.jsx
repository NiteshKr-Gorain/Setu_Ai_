import React, { useState, useEffect } from 'react';
import { useRfidScanner } from '../useRfidScanner';
import { bindUserCard, bindKnowledgeTag, seedRfidTags } from '../api/rfidApi';
import { setTokens } from '../../../shared/api/client';
import { setStoredUser } from '../../auth/api/authApi';

// Pre-defined realistic simulation cards for testing and demos
const DEMO_CARDS = [
  {
    uid: 'RFID-SETU-HARBHAJAN',
    type: 'user_card',
    role: 'Elder Farmer',
    name: 'Harbhajan Singh',
    subtitle: 'Tap to Login as Elder Harbhajan',
    gradient: 'from-amber-600 to-emerald-700',
    icon: '🌾',
    badge: 'Smart ID Card',
  },
  {
    uid: 'RFID-SETU-SITADEVI',
    type: 'user_card',
    role: 'Master Artisan',
    name: 'Sita Devi',
    subtitle: 'Tap to Login as Artisan Sita Devi',
    gradient: 'from-purple-600 to-rose-600',
    icon: '🎨',
    badge: 'Smart ID Card',
  },
  {
    uid: 'RFID-SETU-ADMIN-01',
    type: 'user_card',
    role: 'Platform Admin',
    name: 'Nitesh Kumar',
    subtitle: 'Tap to Login as Platform Admin',
    gradient: 'from-blue-600 to-indigo-800',
    icon: '⚡',
    badge: 'Admin Badge',
  },
  {
    uid: 'RFID-KNOW-SEED-01',
    type: 'knowledge_passport',
    role: 'Agriculture Artifact',
    name: 'Ancestral Seed Preservation',
    subtitle: 'Physical Artifact Tag #01',
    gradient: 'from-emerald-600 to-teal-800',
    icon: '🌱',
    badge: 'Physical Tag',
  },
  {
    uid: 'RFID-KNOW-POTTERY-02',
    type: 'knowledge_passport',
    role: 'Crafts Artifact',
    name: 'Terracotta Kiln Firing',
    subtitle: 'Physical Artifact Tag #02',
    gradient: 'from-orange-600 to-amber-800',
    icon: '🏺',
    badge: 'Physical Tag',
  },
  {
    uid: 'RFID-KNOW-HERBAL-03',
    type: 'knowledge_passport',
    role: 'Ayurveda Artifact',
    name: 'Wild Herbal Kashayam',
    subtitle: 'Physical Artifact Tag #03',
    gradient: 'from-green-600 to-emerald-800',
    icon: '🌿',
    badge: 'Physical Tag',
  },
  {
    uid: 'RFID-NEW-DEMO-99',
    type: 'generic',
    role: 'Unregistered Tag',
    name: 'Blank Smart Tag #99',
    subtitle: 'Tap to test new tag binding flow',
    gradient: 'from-slate-600 to-slate-800',
    icon: '🏷️',
    badge: 'Unlinked Tag',
  },
];

export default function RfidScannerModal({
  isOpen,
  onClose,
  currentUser,
  onLoginSuccess,
  onSelectKnowledge,
  onViewChange,
}) {
  const [activeTab, setActiveTab] = useState('cards'); // 'cards' | 'manual' | 'bind'
  const [manualUid, setManualUid] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [isTapping, setIsTapping] = useState(false);
  const [activeTapUid, setActiveTapUid] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [isSeeding, setIsSeeding] = useState(false);

  // Binding tab state
  const [bindUid, setBindUid] = useState('');
  const [bindLabel, setBindLabel] = useState('');
  const [bindType, setBindType] = useState('user'); // 'user' | 'knowledge'
  const [bindEntryId, setBindEntryId] = useState('');
  const [bindLoading, setBindLoading] = useState(false);

  // Hardware Scanner Hook
  const { isScanning, scanTag, nfcSupported, isNfcActive, startNfcScanning } = useRfidScanner({
    enabled: isOpen,
    onScanResult: (res) => handleScanResponse(res),
  });

  // Handle scan resolution from hook or simulator
  const handleScanResponse = (result) => {
    setScanResult(result);
    setIsTapping(false);

    if (result.status === 'authenticated' && result.auth_data) {
      const tokens = {
        access_token: result.auth_data.access_token,
        refresh_token: result.auth_data.refresh_token,
      };

      // Store tokens and user profile
      setTokens(tokens);
      setStoredUser(result.auth_data.user);

      if (onLoginSuccess) {
        onLoginSuccess(tokens, result.auth_data.user);
      }

      setFeedbackMsg(`🎉 Successfully Logged In as ${result.auth_data.user.name}! Your session is active across Setu.`);

      // If user was on signin or signup screen, redirect them to home/admin
      const currentHash = window.location.hash.toLowerCase();
      const isAuthPage = currentHash.includes('signin') || currentHash.includes('signup') || currentHash.includes('login');
      
      if (isAuthPage) {
        setTimeout(() => {
          if (onViewChange) {
            onViewChange(result.auth_data.user.role === 'admin' ? 'admin' : 'home');
          }
          onClose();
        }, 1500);
      }
    } else if (result.status === 'knowledge_retrieved' && result.knowledge_data) {
      setFeedbackMsg(`📜 Knowledge Passport loaded: ${result.knowledge_data.title}`);
      if (onSelectKnowledge) {
        onSelectKnowledge(result.knowledge_data);
      }
    } else if (result.status === 'unregistered') {
      setFeedbackMsg(`⚠️ Tag '${result.tag_uid}' is unregistered.`);
      setBindUid(result.tag_uid);
    }
  };

  // Trigger simulated card tap
  const handleCardTap = async (card) => {
    setActiveTapUid(card.uid);
    setIsTapping(true);
    setFeedbackMsg(`📡 Reading ${card.name}...`);
    setScanResult(null);

    // Realistic small sensor latency
    setTimeout(async () => {
      await scanTag(card.uid, 'virtual_card_deck');
    }, 450);
  };

  // Submit manual UID
  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualUid.trim()) return;
    handleCardTap({ uid: manualUid.trim(), name: `Manual Tag (${manualUid.trim()})` });
  };

  // Seed sample cards
  const handleSeed = async () => {
    setIsSeeding(true);
    try {
      const res = await seedRfidTags();
      setFeedbackMsg(`✅ ${res.message || 'Seeded successfully!'}`);
    } catch (err) {
      setFeedbackMsg(`❌ Seeding error: ${err.message}`);
    } finally {
      setIsSeeding(false);
    }
  };

  // Bind new tag
  const handleBindSubmit = async (e) => {
    e.preventDefault();
    if (!bindUid.trim()) return;
    setBindLoading(true);
    try {
      if (bindType === 'user') {
        const res = await bindUserCard(bindUid, bindLabel || 'My Smart Badge');
        setFeedbackMsg(`✅ Smart Badge '${res.tag_uid}' linked to your profile!`);
      } else {
        if (!bindEntryId.trim()) {
          throw new Error('Please enter a Knowledge Entry ID');
        }
        const res = await bindKnowledgeTag(bindUid, bindEntryId, bindLabel || 'Artifact Tag');
        setFeedbackMsg(`✅ Physical Tag '${res.tag_uid}' linked to knowledge entry!`);
      }
      setActiveTab('cards');
    } catch (err) {
      setFeedbackMsg(`❌ Binding error: ${err.message}`);
    } finally {
      setBindLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-xl text-amber-400 shadow-inner">
              📡
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-black tracking-tight text-white">Setu RFID & Smart Card Hub</h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1"></span> Live Scanner Active
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Tap physical cards on USB/NFC reader or click virtual cards below.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleSeed}
              disabled={isSeeding}
              title="Initialize/Seed default test RFID cards"
              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer transition-all flex items-center space-x-1"
            >
              <span>{isSeeding ? '⏳' : '⚡'}</span>
              <span>{isSeeding ? 'Seeding...' : 'Seed Data'}</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 pt-3 space-x-2">
          <button
            onClick={() => setActiveTab('cards')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all cursor-pointer flex items-center space-x-2 ${
              activeTab === 'cards'
                ? 'bg-slate-850 text-amber-400 border-t-2 border-amber-400 border-x border-slate-700/80 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>🎴</span>
            <span>Virtual Card Deck</span>
          </button>

          <button
            onClick={() => setActiveTab('manual')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all cursor-pointer flex items-center space-x-2 ${
              activeTab === 'manual'
                ? 'bg-slate-850 text-amber-400 border-t-2 border-amber-400 border-x border-slate-700/80 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>⌨️</span>
            <span>Manual / USB Input</span>
          </button>

          <button
            onClick={() => setActiveTab('bind')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all cursor-pointer flex items-center space-x-2 ${
              activeTab === 'bind'
                ? 'bg-slate-850 text-amber-400 border-t-2 border-amber-400 border-x border-slate-700/80 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>🔗</span>
            <span>Pair New Card</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-900/90">
          
          {/* Status / Feedback Banner */}
          {feedbackMsg && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center justify-between animate-fade-in shadow-inner">
              <div className="flex items-center space-x-2">
                <span>📡</span>
                <span>{feedbackMsg}</span>
              </div>
              <button
                onClick={() => setFeedbackMsg('')}
                className="text-amber-400 hover:text-amber-200 text-xs cursor-pointer ml-3 font-bold"
              >
                ✕
              </button>
            </div>
          )}

          {/* TAB 1: Virtual Card Deck Simulator */}
          {activeTab === 'cards' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Tap Any Card Below to Test Instant Resolution
                </span>
                <span className="text-[11px] text-slate-500 italic">
                  Simulates tapping physical 13.56MHz RFID / NFC badges
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {DEMO_CARDS.map((card) => {
                  const isCurrentTap = isTapping && activeTapUid === card.uid;
                  return (
                    <div
                      key={card.uid}
                      onClick={() => handleCardTap(card)}
                      className={`relative p-4 rounded-2xl bg-gradient-to-br ${card.gradient} bg-opacity-80 border border-white/20 text-white shadow-lg cursor-pointer transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] group overflow-hidden ${
                        isCurrentTap ? 'ring-4 ring-amber-400 ring-offset-2 ring-offset-slate-900 animate-pulse' : ''
                      }`}
                    >
                      {/* Chip & NFC Antenna Graphic */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-6 rounded-md bg-amber-300/90 border border-amber-400/80 shadow-xs flex items-center justify-center p-0.5">
                            <div className="w-full h-full border border-amber-600/40 rounded-xs flex items-center justify-center">
                              <span className="text-[8px] font-mono text-amber-900 font-black">CHIP</span>
                            </div>
                          </div>
                          <span className="text-xs opacity-80 font-mono tracking-widest">SETU PASS</span>
                        </div>
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-black/30 backdrop-blur-xs border border-white/20">
                          {card.badge}
                        </span>
                      </div>

                      {/* Card Identity */}
                      <div className="space-y-0.5 mb-3">
                        <div className="text-[11px] font-medium opacity-80 flex items-center space-x-1">
                          <span>{card.icon}</span>
                          <span>{card.role}</span>
                        </div>
                        <h4 className="text-base font-extrabold tracking-tight truncate">{card.name}</h4>
                        <p className="text-[10px] opacity-75 truncate">{card.subtitle}</p>
                      </div>

                      {/* Card Footer / UID */}
                      <div className="pt-2 border-t border-white/20 flex items-center justify-between">
                        <span className="text-[11px] font-mono tracking-wider opacity-90 font-semibold">
                          {card.uid}
                        </span>
                        <span className="text-[11px] font-bold bg-white/20 group-hover:bg-white text-white group-hover:text-slate-900 px-2.5 py-0.5 rounded-full transition-colors">
                          {isCurrentTap ? 'Scanning...' : 'Tap Card ⚡'}
                        </span>
                      </div>

                      {/* Concentric wave animation when tapped */}
                      {isCurrentTap && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-24 h-24 rounded-full border-4 border-amber-300/60 animate-ping"></div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: Manual UID & USB Hardware Listener */}
          {activeTab === 'manual' && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-2xl text-blue-400">
                    🔌
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Physical USB Wedge Reader Support</h4>
                    <p className="text-xs text-slate-400">
                      Connect any USB RFID/NFC reader (e.g. RC522, PN532, Sycreader). Tapping any card will automatically be captured anywhere in the app!
                    </p>
                  </div>
                </div>

                {nfcSupported && (
                  <div className="pt-2 border-t border-slate-700 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-300">Web NFC (Android / Chrome)</p>
                      <p className="text-[11px] text-slate-400">Read built-in phone NFC tags directly</p>
                    </div>
                    <button
                      onClick={startNfcScanning}
                      disabled={isNfcActive}
                      className={`px-3 py-1.5 text-xs font-bold rounded-xl cursor-pointer transition-all ${
                        isNfcActive
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-blue-600 hover:bg-blue-500 text-white'
                      }`}
                    >
                      {isNfcActive ? '📡 NFC Active' : 'Start NFC Reader'}
                    </button>
                  </div>
                )}
              </div>

              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                    Enter or Paste RFID Card UID
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      data-rfid-input="true"
                      value={manualUid}
                      onChange={(e) => setManualUid(e.target.value)}
                      placeholder="e.g. RFID-SETU-HARBHAJAN or E28068900000"
                      className="flex-1 px-4 py-3 bg-slate-950 border border-slate-700 rounded-2xl text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                    />
                    <button
                      type="submit"
                      disabled={isScanning || !manualUid.trim()}
                      className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 text-slate-950 font-extrabold text-sm rounded-2xl transition-all cursor-pointer shadow-md"
                    >
                      {isScanning ? 'Scanning...' : 'Dispatch Tap ⚡'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: Pair / Bind New Card */}
          {activeTab === 'bind' && (
            <form onSubmit={handleBindSubmit} className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    RFID Card UID
                  </label>
                  <input
                    type="text"
                    required
                    value={bindUid}
                    onChange={(e) => setBindUid(e.target.value)}
                    placeholder="e.g. RFID-NEW-CARD-1234"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-2xl text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Card / Tag Label
                  </label>
                  <input
                    type="text"
                    value={bindLabel}
                    onChange={(e) => setBindLabel(e.target.value)}
                    placeholder="e.g. Harbhajan's Pocket Badge"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Tag Binding Target
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setBindType('user')}
                      className={`p-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-2 ${
                        bindType === 'user'
                          ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span>🪪</span>
                      <span>Link to My User Account</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setBindType('knowledge')}
                      className={`p-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-2 ${
                        bindType === 'knowledge'
                          ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span>🏺</span>
                      <span>Link to Knowledge Artifact</span>
                    </button>
                  </div>
                </div>

                {bindType === 'knowledge' && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Knowledge Entry ID or Passport ID
                    </label>
                    <input
                      type="text"
                      required={bindType === 'knowledge'}
                      value={bindEntryId}
                      onChange={(e) => setBindEntryId(e.target.value)}
                      placeholder="e.g. 64b0f0a4ac952b1b36c7a31c or SETU-PASS-SEED-01"
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-2xl text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={bindLoading || !bindUid.trim()}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold text-sm rounded-2xl transition-all cursor-pointer shadow-md disabled:opacity-50"
                >
                  {bindLoading ? 'Binding Tag...' : 'Save & Link RFID Tag 🔗'}
                </button>
              </div>
            </form>
          )}

          {/* Last Scan Result Card */}
          {scanResult && (
            <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-3 animate-fade-in shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-base">
                    {scanResult.status === 'authenticated' ? '✅' : scanResult.status === 'knowledge_retrieved' ? '📜' : '⚠️'}
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Latest Scan Result: {scanResult.tag_uid}
                  </span>
                </div>
                <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                  scanResult.status === 'authenticated'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : scanResult.status === 'knowledge_retrieved'
                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}>
                  {scanResult.status}
                </span>
              </div>

              {/* Authenticated User View */}
              {scanResult.auth_data && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-lg">
                        👤
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-white">{scanResult.auth_data.user.name}</h4>
                        <p className="text-xs text-slate-400">{scanResult.auth_data.user.email} • Role: <span className="text-amber-400 font-bold uppercase">{scanResult.auth_data.user.role}</span></p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-700/60 px-3 py-1 rounded-xl shadow-xs">
                      ✅ Authenticated
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
                    <button
                      onClick={() => {
                        if (onViewChange) onViewChange('profile');
                        onClose();
                      }}
                      className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center space-x-1.5"
                    >
                      <span>👤</span>
                      <span>Go to Profile</span>
                    </button>

                    <button
                      onClick={() => {
                        if (onViewChange) onViewChange('contribute');
                        onClose();
                      }}
                      className="px-3.5 py-1.5 bg-emerald-600/80 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 shadow-xs"
                    >
                      <span>✍️</span>
                      <span>Share Knowledge</span>
                    </button>

                    {scanResult.auth_data.user.role === 'admin' && (
                      <button
                        onClick={() => {
                          if (onViewChange) onViewChange('admin');
                          onClose();
                        }}
                        className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 shadow-xs"
                      >
                        <span>⚡</span>
                        <span>Admin Dashboard</span>
                      </button>
                    )}

                    <button
                      onClick={onClose}
                      className="px-3.5 py-1.5 bg-slate-900 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold rounded-xl transition-all cursor-pointer ml-auto"
                    >
                      Continue Browsing →
                    </button>
                  </div>
                </div>
              )}

              {/* Knowledge Passport View */}
              {scanResult.knowledge_data && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-black text-white">{scanResult.knowledge_data.title}</h4>
                    <span className="text-[10px] font-mono text-amber-400 bg-amber-950/40 border border-amber-700/50 px-2 py-0.5 rounded-md">
                      {scanResult.knowledge_data.passport_id}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2">{scanResult.knowledge_data.description}</p>
                  <div className="flex items-center space-x-3 text-[11px] text-slate-400">
                    <span>Category: <strong className="text-slate-200">{scanResult.knowledge_data.category}</strong></span>
                    <span>Trust Score: <strong className="text-emerald-400">100% Verified</strong></span>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-end">
                    <button
                      onClick={() => {
                        if (onViewChange) onViewChange('library');
                        onClose();
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md flex items-center space-x-1.5"
                    >
                      <span>📖</span>
                      <span>Open in Knowledge Library & AI Audio</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Unregistered Tag View */}
              {scanResult.status === 'unregistered' && (
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-400">
                    This tag is not yet associated with any user or artifact.
                  </p>
                  <button
                    onClick={() => {
                      setBindUid(scanResult.tag_uid);
                      setActiveTab('bind');
                    }}
                    className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Pair Tag Now 🔗
                  </button>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Kiosk Hardware Interface: Ready</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer transition-colors"
          >
            Close Scanner
          </button>
        </div>

      </div>
    </div>
  );
}
