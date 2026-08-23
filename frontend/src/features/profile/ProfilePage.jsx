// Component imports
import React, { useState, useEffect } from 'react';
import ProfileSettingsModal from './components/ProfileSettingsModal';
import { useAuth } from '../auth/AuthContext';
import * as mentorsApi from '../../shared/api/mentorsApi';
import { fetchKnowledgeEntries } from '../library/api/knowledgeApi';
import UserStatusBadge from '../presence/components/UserStatusBadge';
import { bindUserCard } from '../rfid/api/rfidApi';

// Profile page
export default function ProfilePage({ userProfile, onLogout, onViewChange, onOpenRfid }) {
  // Auth state
  const { currentUser, patchLocalProfile } = useAuth();
  const user = userProfile || currentUser;

  // Tab state
  const [activeTab, setActiveTab] = useState('mentorship');
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // RFID Card state
  const [rfidCardUid, setRfidCardUid] = useState(user?.rfid_card_uid || '');
  const [rfidLabel, setRfidLabel] = useState('Personal Setu Smart Badge');
  const [rfidSaving, setRfidSaving] = useState(false);
  const [rfidMsg, setRfidMsg] = useState('');

  // Contributions state
  const [myContributions, setMyContributions] = useState([]);
  const [contribsLoading, setContribsLoading] = useState(true);

  // Mentor state
  const [_mentorProfile, setMentorProfile] = useState(null);
  const [_mentorLoading, setMentorLoading] = useState(true);
  const [mentorSaving, setMentorSaving] = useState(false);
  const [mentorMsg, setMentorMsg] = useState('');

  // Form fields
  const [mentorBio, setMentorBio] = useState('');
  const [yearsExp, setYearsExp] = useState(5);
  const [availability, setAvailability] = useState('Weekends, 2 hrs/week');
  const [categoriesInput, setCategoriesInput] = useState('Agriculture, Traditional Skills');

  // Settings tab
  const [settingsInitialTab, setSettingsInitialTab] = useState('edit_profile');

  // Profile data
  const profileData = {
    name: user?.name || 'Community Member',
    title: user?.role === 'contributor' ? 'Senior Heritage Contributor' : 'Youth Learner & Explorer',
    location: user?.location || 'India',
    bio: user?.bio || 'Passionate about connecting with elders, learning traditional techniques, and building intergenerational bridges.',
    avatar: user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&h=300&q=80',
    joinedDate: 'Joined July 2026',
    email: user?.email || 'user@example.com',
    role: user?.role || 'user',
  };

  // Load contributions
  useEffect(() => {
    let isMounted = true;
    setContribsLoading(true);
    fetchKnowledgeEntries()
      .then((items) => {
        if (isMounted) {
          setMyContributions(items.slice(0, 3));
        }
      })
      .catch(() => {
        if (isMounted) setMyContributions([]);
      })
      .finally(() => {
        if (isMounted) setContribsLoading(false);
      });
    return () => { isMounted = false; };
  }, []);

  // Load mentor
  useEffect(() => {
    let isMounted = true;
    setMentorLoading(true);
    mentorsApi
      .getMyMentorProfile()
      .then((data) => {
        if (isMounted && data) {
          setMentorProfile(data);
          setMentorBio(data.bio || '');
          setYearsExp(data.years_of_experience || 5);
          setAvailability(data.availability || 'Weekends, 2 hrs/week');
          setCategoriesInput((data.expertise_categories || []).join(', '));
        }
      })
      .catch(() => {
        // No mentor
      })
      .finally(() => {
        if (isMounted) setMentorLoading(false);
      });
    return () => { isMounted = false; };
  }, []);

  // Save profile
  const handleSaveProfile = (updatedFields) => {
    patchLocalProfile(updatedFields);
  };

  // Save mentor
  const handleSaveMentorProfile = async (e) => {
    e.preventDefault();
    setMentorSaving(true);
    setMentorMsg('');
    const cats = categoriesInput.split(',').map((c) => c.trim()).filter(Boolean);
    const payload = {
      bio: mentorBio.trim(),
      years_of_experience: Number(yearsExp),
      availability,
      expertise_categories: cats,
    };
    try {
      const result = await mentorsApi.upsertMentorProfile(payload);
      setMentorProfile(result);
      setMentorMsg('Mentor profile saved successfully!');
    } catch (err) {
      setMentorMsg(err.message || 'Could not save mentor profile.');
    } finally {
      setMentorSaving(false);
      setTimeout(() => setMentorMsg(''), 4000);
    }
  };

  // Save RFID card UID
  const handleSaveRfidCard = async (e) => {
    e.preventDefault();
    if (!rfidCardUid.trim()) return;
    setRfidSaving(true);
    setRfidMsg('');
    try {
      const res = await bindUserCard(rfidCardUid, rfidLabel);
      patchLocalProfile({ rfid_card_uid: res.tag_uid });
      setRfidMsg(`✅ Smart Badge '${res.tag_uid}' successfully paired with your profile!`);
    } catch (err) {
      setRfidMsg(`❌ ${err.message || 'Could not pair RFID card.'}`);
    } finally {
      setRfidSaving(false);
      setTimeout(() => setRfidMsg(''), 5000);
    }
  };

  // Render view
  return (
    <div className="pt-24 pb-16 min-h-screen bg-slate-50 text-slate-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-8">
        
        {/* Banner card */}
        <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-xs relative overflow-hidden text-center">
          {/* Background gradient decorative glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-to-br from-blue-100/30 via-amber-100/20 to-transparent rounded-full blur-2xl -z-10 -translate-y-1/3 pointer-events-none"></div>

          {/* Top Right Settings Button */}
          <div className="absolute top-6 right-6 z-10 flex items-center space-x-2">
            {onOpenRfid && (
              <button
                onClick={onOpenRfid}
                title="Open RFID Kiosk Scanner"
                className="px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 border border-amber-300 flex items-center space-x-1.5 text-xs font-bold transition-all duration-200 cursor-pointer shadow-3xs hover:scale-105 active:scale-95"
              >
                <span>📡</span>
                <span>RFID Kiosk Tap</span>
              </button>
            )}
            <button
              onClick={() => {
                setSettingsInitialTab('edit_profile');
                setIsSettingsModalOpen(true);
              }}
              title="Account & System Settings"
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 flex items-center space-x-1.5 text-xs font-bold transition-all duration-200 cursor-pointer shadow-3xs hover:scale-105 active:scale-95"
              aria-label="Account and Settings"
            >
              <span>⚙️</span>
              <span>Settings</span>
            </button>
          </div>

          {/* Profile Card Main Content */}
          <div className="flex flex-col items-center space-y-4 pt-2">
            {/* 1. Image at Center */}
            <div className="relative group mx-auto">
              <img
                src={profileData.avatar}
                alt={profileData.name}
                loading="lazy"
                className="w-36 h-36 sm:w-44 sm:h-44 rounded-full object-cover border-4 border-white shadow-xl ring-4 ring-orange-100/60 transition-transform duration-300 group-hover:scale-105 mx-auto"
                onError={(e) => {
                  e.target.src = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400";
                }}
              />
            </div>

            {/* 2. Name just below the image */}
            <div className="space-y-1 text-center">
              <div className="flex items-center justify-center space-x-2">
                <h1
                  className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight"
                  style={{ fontFamily: "'Poppins', system-ui, sans-serif" }}
                >
                  {profileData.name}
                </h1>
                {profileData.role === 'admin' ? (
                  <span className="text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 px-3 py-0.5 rounded-full uppercase tracking-wider shadow-3xs flex items-center space-x-1">
                    <span>⚡</span>
                    <span>Admin</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200/50 px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-3xs">
                    {profileData.role}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-center space-x-3">
                <p className="font-serif italic text-sm sm:text-base font-semibold text-brand-primary">{profileData.title}</p>
                <span className="text-slate-300">•</span>
                <span className="text-xs sm:text-sm text-slate-500 font-medium">📍 {profileData.location}</span>
                <span className="text-slate-300">•</span>
                <span className="text-xs sm:text-sm text-slate-500 font-medium flex items-center space-x-1">
                  <UserStatusBadge userId={user?.id || user?._id} showDotOnly={false} />
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-xs sm:text-sm text-slate-500 font-medium">
                  ✉️ {profileData.email}
                </span>
              </div>
            </div>

            {/* 3. Details after that */}
            <div className="w-full max-w-xl mx-auto space-y-4 text-center">
              <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] font-semibold text-slate-500">
                <span className="inline-flex items-center gap-1.5 bg-slate-100/70 px-3 py-1 rounded-full border border-slate-200/50">
                  📅 {profileData.joinedDate}
                </span>
              </div>

              {profileData.role === 'admin' && onViewChange && (
                <div className="pt-1">
                  <button
                    onClick={() => onViewChange('admin')}
                    className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold rounded-full transition-all shadow-md shadow-amber-500/20 cursor-pointer flex items-center space-x-2 mx-auto transform hover:scale-105 active:scale-95"
                  >
                    <span>⚡</span>
                    <span>Open Admin Control Dashboard</span>
                  </button>
                </div>
              )}

              {profileData.bio && (
                <div className="bg-slate-50/80 p-4 sm:p-5 rounded-2xl border border-slate-100 text-xs sm:text-sm text-slate-600 leading-relaxed shadow-3xs text-center">
                  <p className="font-serif italic">"{profileData.bio}"</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="flex border-b border-slate-200/60 space-x-6 text-left">
          <button
            onClick={() => setActiveTab('mentorship')}
            className={`pb-3 font-serif text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'mentorship'
                ? 'text-brand-primary border-b-2 border-brand-primary'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Mentor Profile &amp; Availability
          </button>
          <button
            onClick={() => setActiveTab('rfid')}
            className={`pb-3 font-serif text-sm font-semibold transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'rfid'
                ? 'text-brand-primary border-b-2 border-brand-primary'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <span>📡</span>
            <span>RFID Smart Badge</span>
          </button>
          <button
            onClick={() => setActiveTab('contributions')}
            className={`pb-3 font-serif text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'contributions'
                ? 'text-brand-primary border-b-2 border-brand-primary'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            My Contributions ({myContributions.length})
          </button>
        </div>

        {/* Tab contents */}
        <div className="max-h-[650px] overflow-y-auto custom-scrollbar p-1">
          {/* Mentorship tab */}
          {activeTab === 'mentorship' && (
            <div className="bg-white rounded-3xl border border-slate-100 p-8 text-left space-y-6 shadow-xs">
              <div className="space-y-1">
                <h3 className="font-serif text-lg sm:text-xl font-semibold text-slate-900">Become a Setu Mentor</h3>
                <p className="text-xs text-slate-400 font-normal">
                  List your expertise so youth learners can discover you in the Community mentor directory.
                </p>
              </div>

              {/* Status message */}
              {mentorMsg && (
                <div className="bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold px-4 py-2.5 rounded-2xl">
                  {mentorMsg}
                </div>
              )}

              {/* Mentor form */}
              <form onSubmit={handleSaveMentorProfile} className="space-y-4 text-xs font-semibold">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Expertise Categories (comma-separated)</label>
                  <input
                    type="text"
                    required
                    value={categoriesInput}
                    onChange={(e) => setCategoriesInput(e.target.value)}
                    className="w-full border-b border-slate-200 py-2 focus:outline-none focus:border-brand-primary font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Years of Experience</label>
                    <input
                      type="number"
                      min="1"
                      max="80"
                      required
                      value={yearsExp}
                      onChange={(e) => setYearsExp(e.target.value)}
                      className="w-full border-b border-slate-200 py-2 focus:outline-none focus:border-brand-primary font-medium"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Availability</label>
                    <input
                      type="text"
                      required
                      value={availability}
                      onChange={(e) => setAvailability(e.target.value)}
                      className="w-full border-b border-slate-200 py-2 focus:outline-none focus:border-brand-primary font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mentor Bio &amp; Offerings</label>
                  <textarea
                    rows={4}
                    required
                    value={mentorBio}
                    onChange={(e) => setMentorBio(e.target.value)}
                    className="w-full border border-slate-200 rounded-2xl p-3 focus:outline-none focus:border-brand-primary font-normal resize-none"
                  />
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={mentorSaving}
                  className="px-6 py-3 bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-brand-primary/10 cursor-pointer disabled:opacity-60"
                >
                  {mentorSaving ? 'Saving...' : 'Save Mentor Profile'}
                </button>
              </form>
            </div>
          )}

          {/* RFID Smart Badge tab */}
          {activeTab === 'rfid' && (
            <div className="bg-white rounded-3xl border border-slate-100 p-8 text-left space-y-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="font-serif text-lg sm:text-xl font-semibold text-slate-900 flex items-center space-x-2">
                    <span>📡</span>
                    <span>Setu RFID Smart Badge &amp; Offline Kiosk Pass</span>
                  </h3>
                  <p className="text-xs text-slate-400 font-normal">
                    Pair a physical 13.56MHz RFID card, keychain fob, or NFC tag to tap-and-login at village kiosks without typing passwords.
                  </p>
                </div>

                {onOpenRfid && (
                  <button
                    onClick={onOpenRfid}
                    className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 text-xs font-bold rounded-2xl transition-all shadow-sm cursor-pointer self-start sm:self-auto flex items-center space-x-1.5"
                  >
                    <span>⚡</span>
                    <span>Test Tap on Kiosk</span>
                  </button>
                )}
              </div>

              {/* Status banner */}
              {rfidMsg && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold px-4 py-2.5 rounded-2xl animate-fade-in">
                  {rfidMsg}
                </div>
              )}

              {/* Virtual Badge Preview Card */}
              <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-850 to-blue-950 text-white shadow-xl border border-slate-700 relative overflow-hidden max-w-md">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-6 rounded-md bg-amber-300 border border-amber-400 flex items-center justify-center p-0.5 shadow-xs">
                      <div className="w-full h-full border border-amber-600/40 rounded-xs flex items-center justify-center">
                        <span className="text-[7px] font-mono text-amber-950 font-black">CHIP</span>
                      </div>
                    </div>
                    <span className="text-xs font-mono tracking-widest text-slate-300">SETU IDENTITY</span>
                  </div>
                  <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    ● Active
                  </span>
                </div>

                <div className="space-y-1 mb-4">
                  <span className="text-[11px] text-amber-400 font-bold uppercase tracking-wider block">
                    {profileData.role === 'admin' ? '⚡ System Administrator' : profileData.role === 'contributor' ? '🌾 Master Heritage Contributor' : '🌱 Knowledge Explorer'}
                  </span>
                  <h4 className="text-xl font-black tracking-tight">{profileData.name}</h4>
                  <p className="text-xs text-slate-400 truncate">{profileData.email}</p>
                </div>

                <div className="pt-3 border-t border-slate-700/80 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-bold">RFID Card UID</span>
                    <span className="text-xs font-mono font-bold text-amber-300">
                      {user?.rfid_card_uid || rfidCardUid || `RFID-SETU-${user?._id ? String(user._id).slice(-6).toUpperCase() : 'PENDING'}`}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">13.56 MHz ISO/IEC 14443</span>
                </div>
              </div>

              {/* Pair / Change RFID Form */}
              <form onSubmit={handleSaveRfidCard} className="space-y-4 pt-2 max-w-md text-xs font-semibold">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Pair Physical RFID Tag UID
                  </label>
                  <input
                    type="text"
                    required
                    value={rfidCardUid}
                    onChange={(e) => setRfidCardUid(e.target.value)}
                    placeholder="e.g. RFID-SETU-HARBHAJAN or E28068900000"
                    className="w-full border border-slate-200 rounded-2xl px-4 py-2.5 font-mono text-slate-800 focus:outline-none focus:border-brand-primary"
                  />
                  <p className="text-[11px] text-slate-400 font-normal">
                    Scan your card with a USB reader while focused here, or type your card's hex/alphanumeric code.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Card / Badge Name Label
                  </label>
                  <input
                    type="text"
                    value={rfidLabel}
                    onChange={(e) => setRfidLabel(e.target.value)}
                    placeholder="e.g. Harbhajan's Pocket Badge"
                    className="w-full border border-slate-200 rounded-2xl px-4 py-2.5 text-slate-800 focus:outline-none focus:border-brand-primary font-medium"
                  />
                </div>

                <button
                  type="submit"
                  disabled={rfidSaving || !rfidCardUid.trim()}
                  className="px-6 py-2.5 bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-brand-primary/10 cursor-pointer disabled:opacity-50 flex items-center space-x-1.5"
                >
                  <span>{rfidSaving ? '⏳' : '🔗'}</span>
                  <span>{rfidSaving ? 'Pairing Card...' : 'Save & Link Smart Badge'}</span>
                </button>
              </form>
            </div>
          )}

          {/* Contributions tab */}
          {activeTab === 'contributions' && (
            <div className="space-y-4 text-left">
              <h3 className="font-serif text-lg sm:text-xl font-semibold text-slate-900">Submitted Knowledge Entries</h3>
              {contribsLoading ? (
                <div className="py-10 text-center text-xs font-bold text-slate-400">Loading your entries...</div>
              ) : myContributions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {myContributions.map((c) => (
                    <div key={c.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-3xs space-y-2 hover:shadow-md transition-all">
                      <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md uppercase">
                        {c.category}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 line-clamp-2">{c.title}</h4>
                      <p className="text-[11px] text-slate-500 line-clamp-2">{c.description}</p>
                      <span className="text-[9px] font-semibold text-emerald-600 block pt-2">✓ Verified on Setu</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white p-8 rounded-2xl border border-slate-100 text-center text-xs text-slate-400 italic">
                  You haven't shared any traditional knowledge entries yet.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Log Out Section */}
        <div className="pt-6 pb-2 border-t border-slate-200/60 flex flex-col items-center space-y-2 mt-4">
          <button
            onClick={onLogout}
            className="px-6 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 text-xs font-bold rounded-xl border border-rose-200/60 transition-all cursor-pointer hover:scale-105 active:scale-95 flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Log Out of Setu Account</span>
          </button>
          <p className="text-[11px] text-slate-400 font-medium">Logged in as {profileData.email}</p>
        </div>

      </div>

      {/* Settings modal */}
      <ProfileSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        currentProfile={profileData}
        onSaveSettings={handleSaveProfile}
        initialTab={settingsInitialTab}
      />
    </div>
  );
}
