// Component imports
import React, { useState, useEffect } from 'react';
import {
  exportHistoryAsJSON,
  clearLocalStorageCache,
  getSavedTextSizePreference,
  applyTextSizePreference,
  FONT_SIZE_PRESETS
} from '../../../shared/services/localStorageService';
import {
  getSavedThemePreference,
  applyThemePreference,
  THEME_PRESETS
} from '../../../shared/services/themeService';

// Avatar presets
const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&h=300&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=300&h=300&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&h=300&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&h=300&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&h=300&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&h=300&q=80'
];

// Clean SVG Icons
const UserIcon = () => (
  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const PaletteIcon = () => (
  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 21a4 4 0 01-4-4c0-1.423.593-2.73 1.543-3.666C5.525 12.35 6 11.2 6 10a6 6 0 0112 0c0 1.2.475 2.35 1.457 3.334A5.19 5.19 0 0121 17a4 4 0 01-4 4h-2a2 2 0 01-2-2 1.002 1.002 0 00-1-1H9.828a1.002 1.002 0 00-.707.293L7.707 20.707A1 1 0 017 21z" />
  </svg>
);

const TextIcon = () => (
  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 12h10M4 18h7" />
  </svg>
);

const LockIcon = () => (
  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const BellIcon = () => (
  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const ShieldIcon = () => (
  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const DataIcon = () => (
  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
  </svg>
);

const CloseIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

// Settings modal component
export default function ProfileSettingsModal({
  isOpen,
  onClose,
  currentProfile,
  onSaveSettings,
  initialTab = 'edit_profile'
}) {
  // Tab state
  const [activeTab, setActiveTab] = useState(initialTab);

  // Profile state
  const [name, setName] = useState(currentProfile?.name || '');
  const [title, setTitle] = useState(currentProfile?.title || '');
  const [location, setLocation] = useState(currentProfile?.location || '');
  const [bio, setBio] = useState(currentProfile?.bio || '');
  const [avatar, setAvatar] = useState(currentProfile?.avatar || AVATAR_PRESETS[0]);
  const [profileSavedMsg, setProfileSavedMsg] = useState('');

  // Theme state
  const [currentTheme, setCurrentTheme] = useState(() => getSavedThemePreference());
  
  // Text size
  const [textSizeState, setTextSizeState] = useState(() => getSavedTextSizePreference());
  const [textSizeSavedMsg, setTextSizeSavedMsg] = useState('');

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [passMsg, setPassMsg] = useState({ type: '', text: '' });

  // Notifications state
  const [emailDigest, setEmailDigest] = useState(true);
  const [mentorAlerts, setMentorAlerts] = useState(true);
  const [communityReplies, setCommunityReplies] = useState(true);

  // Privacy state
  const [profileVisibility, setProfileVisibility] = useState('public');
  const [showEmailOnProfile, setShowEmailOnProfile] = useState(false);
  const [allowDirectMessages, setAllowDirectMessages] = useState('everyone');

  // Preferences state
  const [language, setLanguage] = useState('en');
  const [statusMsg, setStatusMsg] = useState('');

  // Sync state
  useEffect(() => {
    if (isOpen) {
      if (initialTab) {
        setActiveTab(initialTab);
      }
      if (currentProfile) {
        setName(currentProfile.name || '');
        setTitle(currentProfile.title || '');
        setLocation(currentProfile.location || '');
        setBio(currentProfile.bio || '');
        setAvatar(currentProfile.avatar || AVATAR_PRESETS[0]);
      }
      setTextSizeState(getSavedTextSizePreference());
      setCurrentTheme(getSavedThemePreference());
    }
  }, [isOpen, initialTab, currentProfile]);

  // Lock scroll
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Modal check
  if (!isOpen) return null;

  // Save profile
  const handleSaveProfile = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setProfileSavedMsg('Name cannot be empty.');
      return;
    }

    const updatedData = {
      name: name.trim(),
      title: title.trim(),
      location: location.trim(),
      bio: bio.trim(),
      avatar: avatar.trim() || currentProfile?.avatar || AVATAR_PRESETS[0]
    };

    if (onSaveSettings) {
      onSaveSettings(updatedData);
    }

    setProfileSavedMsg('Profile changes saved successfully.');
    setStatusMsg('Profile changes saved successfully.');
    setTimeout(() => {
      setProfileSavedMsg('');
      setStatusMsg('');
    }, 3500);
  };

  // Select theme
  const handleSelectTheme = (themeId) => {
    const applied = applyThemePreference(themeId);
    setCurrentTheme(applied);
    const themeObj = THEME_PRESETS.find((t) => t.id === themeId);
    setStatusMsg(`Applied ${themeObj?.name || 'theme'} successfully.`);
    setTimeout(() => setStatusMsg(''), 3000);
  };

  // Select preset
  const handleSelectPreset = (presetId) => {
    const updated = applyTextSizePreference(presetId);
    setTextSizeState(updated);
    setTextSizeSavedMsg(`Applied ${updated.scale}% font scale.`);
    setTimeout(() => setTextSizeSavedMsg(''), 3000);
  };

  // Slider change
  const handleSliderChange = (e) => {
    const scaleVal = parseFloat(e.target.value);
    const updated = applyTextSizePreference(scaleVal);
    setTextSizeState(updated);
  };

  // Step size
  const handleStepSize = (delta) => {
    const currentScale = textSizeState.scale || 100;
    const newScale = Math.min(135, Math.max(80, currentScale + delta));
    const updated = applyTextSizePreference(newScale);
    setTextSizeState(updated);
    setTextSizeSavedMsg(`Scale set to ${updated.scale}%`);
    setTimeout(() => setTextSizeSavedMsg(''), 2500);
  };

  // Reset scale
  const handleResetTextSize = () => {
    const updated = applyTextSizePreference('default');
    setTextSizeState(updated);
    setTextSizeSavedMsg('Text size reset to default (100%)');
    setTimeout(() => setTextSizeSavedMsg(''), 3000);
  };

  // Submit password
  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setPassMsg({ type: '', text: '' });

    if (newPassword.length < 6) {
      setPassMsg({ type: 'error', text: 'New password must be at least 6 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassMsg({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    if (onSaveSettings) {
      onSaveSettings({ passwordUpdated: true });
    }

    setPassMsg({ type: 'success', text: 'Password updated successfully.' });
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');

    setTimeout(() => {
      setPassMsg({ type: '', text: '' });
    }, 4000);
  };

  // Save general
  const handleSaveGeneralSettings = (e) => {
    e.preventDefault();
    if (onSaveSettings) {
      onSaveSettings({
        emailDigest,
        mentorAlerts,
        communityReplies,
        profileVisibility,
        showEmailOnProfile,
        allowDirectMessages,
        language
      });
    }
    setStatusMsg('Preferences saved successfully.');
    setTimeout(() => {
      setStatusMsg('');
    }, 2500);
  };

  // Clear cache
  const handleClearCache = () => {
    clearLocalStorageCache();
    setStatusMsg('Browser cached data cleared.');
    setTimeout(() => setStatusMsg(''), 3000);
  };

  // Export data
  const handleExportData = () => {
    exportHistoryAsJSON();
    setStatusMsg('Account data exported successfully.');
    setTimeout(() => setStatusMsg(''), 3000);
  };

  const navItems = [
    { id: 'edit_profile', label: 'Profile', icon: UserIcon },
    { id: 'theme', label: 'Theme & Appearance', icon: PaletteIcon },
    { id: 'text_size', label: 'Display & Text', icon: TextIcon },
    { id: 'security', label: 'Security', icon: LockIcon },
    { id: 'notifications', label: 'Notifications', icon: BellIcon },
    { id: 'privacy', label: 'Privacy', icon: ShieldIcon },
    { id: 'preferences', label: 'Data & Storage', icon: DataIcon },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Modal Card Container */}
      <div
        className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[85vh] min-h-[580px] max-h-[800px] text-left relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Settings</h3>
            <p className="text-xs text-slate-500 mt-0.5">Manage your account settings and preferences.</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Close Settings"
            aria-label="Close Settings"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Global Feedback Banner */}
        {statusMsg && (
          <div className="bg-emerald-50 border-b border-emerald-200 text-emerald-800 px-6 py-2.5 text-xs font-medium flex items-center space-x-2 shrink-0">
            <CheckIcon />
            <span>{statusMsg}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
          
          {/* Sidebar Tabs */}
          <div className="w-full md:w-56 bg-slate-50/70 border-r border-slate-200 p-3 space-y-1 shrink-0 overflow-x-auto md:overflow-y-auto">
            {navItems.map((item) => {
              const IconComp = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-medium transition-colors flex items-center space-x-2.5 cursor-pointer ${
                    isActive
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  <IconComp />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Main Content Area */}
          <div className="flex-1 p-6 md:p-8 overflow-y-auto space-y-6 custom-scrollbar">
            
            {/* 1. Edit Profile Tab */}
            {activeTab === 'edit_profile' && (
              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">Profile Information</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Update your public display name, title, location, and biography.
                  </p>
                </div>

                {/* Profile Card Preview */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Profile Preview
                  </span>
                  <div className="flex items-center space-x-3.5">
                    <img
                      src={avatar || AVATAR_PRESETS[0]}
                      alt="Avatar Preview"
                      className="w-12 h-12 rounded-full object-cover border border-slate-200 shrink-0"
                    />
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-semibold text-slate-900 truncate">{name || 'Your Name'}</span>
                        <span className="text-[10px] font-medium bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md uppercase">
                          {currentProfile?.role || 'User'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 truncate">{title || 'Headline or Title'}</p>
                      <p className="text-[11px] text-slate-400 truncate">📍 {location || 'Location'}</p>
                    </div>
                  </div>
                </div>

                {/* Avatar Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700">Avatar Image</label>
                  <div className="flex items-center gap-3">
                    {AVATAR_PRESETS.map((presetImg, idx) => {
                      const isSelected = avatar === presetImg;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setAvatar(presetImg)}
                          className={`w-10 h-10 rounded-full p-0.5 border-2 transition-all cursor-pointer ${
                            isSelected ? 'border-slate-900 ring-1 ring-slate-900' : 'border-transparent hover:border-slate-300'
                          }`}
                        >
                          <img
                            src={presetImg}
                            alt={`Avatar Option ${idx + 1}`}
                            className="w-full h-full rounded-full object-cover"
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Form Fields */}
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter full name"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition-all font-normal"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Headline / Title</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="E.g. Traditional Artisan & Educator"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition-all font-normal"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Location</label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="E.g. Punjab, India"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition-all font-normal"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Bio</label>
                    <textarea
                      rows={3}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Write a brief bio about your interests and skills..."
                      className="w-full bg-white border border-slate-200 rounded-lg p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition-all resize-none font-normal"
                    />
                  </div>
                </div>

                {/* Submit Action */}
                <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    Changes apply immediately to your profile.
                  </span>
                  <div className="flex items-center space-x-3">
                    {profileSavedMsg && (
                      <span className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg flex items-center space-x-1.5">
                        <CheckIcon />
                        <span>Saved</span>
                      </span>
                    )}
                    <button
                      type="submit"
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs cursor-pointer"
                    >
                      Save Profile Changes
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* 2. Theme & Appearance Tab */}
            {activeTab === 'theme' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">Theme &amp; Appearance</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Choose your preferred website color theme and visual style.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {THEME_PRESETS.map((preset) => {
                    const isSelected = currentTheme === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleSelectTheme(preset.id)}
                        className={`p-4 rounded-xl border text-left transition-all cursor-pointer relative ${
                          isSelected
                            ? 'bg-white border-slate-900 ring-2 ring-slate-900/10 shadow-xs'
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2.5">
                            <div
                              className="w-6 h-6 rounded-full border border-slate-300 shadow-2xs flex items-center justify-center shrink-0"
                              style={{ backgroundColor: preset.bgPreview }}
                            >
                              <div
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: preset.accentPreview }}
                              />
                            </div>
                            <span className="text-xs font-semibold text-slate-900">{preset.name}</span>
                          </div>
                          {isSelected && (
                            <span className="text-[10px] font-semibold bg-slate-900 text-white px-2 py-0.5 rounded-md flex items-center space-x-1">
                              <CheckIcon />
                              <span>Active</span>
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-slate-500 font-normal leading-relaxed">
                          {preset.description}
                        </p>
                      </button>
                    );
                  })}
                </div>

                <div className="pt-4 border-t border-slate-200 flex justify-end">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}

            {/* 3. Display & Text Tab */}
            {activeTab === 'text_size' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">Display &amp; Text Sizing</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Adjust font scale for optimal reading comfort.
                  </p>
                </div>

                {/* Quick Presets */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700">Presets</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {FONT_SIZE_PRESETS.map((preset) => {
                      const isActive = textSizeState.preset === preset.id || Math.abs(textSizeState.scale - preset.scale) < 2;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => handleSelectPreset(preset.id)}
                          className={`p-3.5 rounded-xl border text-left transition-colors cursor-pointer ${
                            isActive
                              ? 'bg-white border-slate-900 ring-1 ring-slate-900 shadow-xs'
                              : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-slate-900">{preset.label}</span>
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${
                              isActive ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-700'
                            }`}>
                              {preset.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 font-normal">
                            {preset.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Slider */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-900">Custom Font Scale</span>
                    <button
                      type="button"
                      onClick={handleResetTextSize}
                      className="text-xs text-slate-600 hover:text-slate-900 underline font-medium cursor-pointer"
                    >
                      Reset to Default (100%)
                    </button>
                  </div>

                  <div className="flex items-center space-x-4">
                    <button
                      type="button"
                      onClick={() => handleStepSize(-5)}
                      className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                      title="Decrease font size"
                    >
                      A-
                    </button>

                    <div className="flex-1 space-y-1">
                      <input
                        type="range"
                        min="80"
                        max="135"
                        step="2.5"
                        value={textSizeState.scale}
                        onChange={handleSliderChange}
                        className="w-full accent-slate-900 cursor-pointer h-1.5 bg-slate-200 rounded-lg appearance-none"
                      />
                      <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                        <span>Compact (80%)</span>
                        <span className="text-slate-900 font-semibold">{textSizeState.scale}%</span>
                        <span>Large (135%)</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleStepSize(5)}
                      className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                      title="Increase font size"
                    >
                      A+
                    </button>
                  </div>
                </div>

                {/* Done */}
                <div className="pt-4 border-t border-slate-200 flex justify-end">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}

            {/* 4. Security Tab */}
            {activeTab === 'security' && (
              <form onSubmit={handlePasswordSubmit} className="space-y-5">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">Security &amp; Password</h4>
                  <p className="text-xs text-slate-500 mt-1">Update your password to ensure account security.</p>
                </div>

                {passMsg.text && (
                  <div className={`p-3 rounded-lg text-xs font-medium border ${
                    passMsg.type === 'error' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    {passMsg.text}
                  </div>
                )}

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Current Password</label>
                    <input
                      type={showPass ? 'text' : 'password'}
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">New Password</label>
                    <input
                      type={showPass ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Confirm New Password</label>
                    <input
                      type={showPass ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800"
                    />
                  </div>

                  <div className="flex items-center space-x-2 pt-1">
                    <input
                      type="checkbox"
                      id="show-pass-check"
                      checked={showPass}
                      onChange={(e) => setShowPass(e.target.checked)}
                      className="rounded border-slate-300 text-slate-900 focus:ring-slate-800 cursor-pointer"
                    />
                    <label htmlFor="show-pass-check" className="text-xs text-slate-600 font-medium cursor-pointer">
                      Show password
                    </label>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    Update Password
                  </button>
                </div>
              </form>
            )}

            {/* 5. Notifications Tab */}
            {activeTab === 'notifications' && (
              <form onSubmit={handleSaveGeneralSettings} className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">Notification Preferences</h4>
                  <p className="text-xs text-slate-500 mt-1">Configure your email and application alerts.</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                    <div>
                      <p className="text-xs font-semibold text-slate-900">Monthly Knowledge Digest</p>
                      <p className="text-[11px] text-slate-500">Receive monthly summaries of top contributions.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={emailDigest}
                      onChange={(e) => setEmailDigest(e.target.checked)}
                      className="w-4 h-4 rounded text-slate-900 accent-slate-900 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                    <div>
                      <p className="text-xs font-semibold text-slate-900">Mentorship Alerts</p>
                      <p className="text-[11px] text-slate-500">Notifications when learners request mentorship.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={mentorAlerts}
                      onChange={(e) => setMentorAlerts(e.target.checked)}
                      className="w-4 h-4 rounded text-slate-900 accent-slate-900 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                    <div>
                      <p className="text-xs font-semibold text-slate-900">Discussion Replies</p>
                      <p className="text-[11px] text-slate-500">Alerts for replies to your community posts.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={communityReplies}
                      onChange={(e) => setCommunityReplies(e.target.checked)}
                      className="w-4 h-4 rounded text-slate-900 accent-slate-900 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    Save Preferences
                  </button>
                </div>
              </form>
            )}

            {/* 6. Privacy Tab */}
            {activeTab === 'privacy' && (
              <form onSubmit={handleSaveGeneralSettings} className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">Privacy &amp; Visibility</h4>
                  <p className="text-xs text-slate-500 mt-1">Control your profile visibility and messaging settings.</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Profile Directory Visibility</label>
                    <select
                      value={profileVisibility}
                      onChange={(e) => setProfileVisibility(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-slate-800"
                    >
                      <option value="public">Public (Visible in directory)</option>
                      <option value="connections">Connections Only</option>
                      <option value="private">Private (Hidden)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Direct Message Permissions</label>
                    <select
                      value={allowDirectMessages}
                      onChange={(e) => setAllowDirectMessages(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-slate-800"
                    >
                      <option value="everyone">Everyone</option>
                      <option value="connections">Approved Connections Only</option>
                      <option value="none">Nobody</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                    <div>
                      <p className="text-xs font-semibold text-slate-900">Show Email on Profile</p>
                      <p className="text-[11px] text-slate-500">Allow users to view your email address.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={showEmailOnProfile}
                      onChange={(e) => setShowEmailOnProfile(e.target.checked)}
                      className="w-4 h-4 rounded text-slate-900 accent-slate-900 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    Save Privacy Settings
                  </button>
                </div>
              </form>
            )}

            {/* 7. Data & Storage Tab */}
            {activeTab === 'preferences' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">Language &amp; Data Storage</h4>
                  <p className="text-xs text-slate-500 mt-1">Manage system language and local browser data.</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Preferred Language</label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-slate-800"
                    >
                      <option value="en">English</option>
                      <option value="pa">Punjabi (ਪੰਜਾਬੀ)</option>
                      <option value="hi">Hindi (हिंदी)</option>
                      <option value="ta">Tamil (தமிழ்)</option>
                      <option value="bn">Bengali (বাংলা)</option>
                    </select>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <h5 className="text-xs font-semibold text-slate-900">Account Data &amp; Cache</h5>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-normal">
                      Export your account history or clear local browser cache.
                    </p>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={handleExportData}
                        className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                      >
                        Export Account Data (JSON)
                      </button>

                      <button
                        type="button"
                        onClick={handleClearCache}
                        className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-rose-50 hover:border-rose-200 text-rose-600 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                      >
                        Clear Browser Cache
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 flex justify-end">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}

          </div>

        </div>

        {/* Toast Notification */}
        {profileSavedMsg && (
          <div className="fixed bottom-6 right-6 z-[100] bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg border border-slate-800 flex items-center space-x-2.5 text-xs font-medium animate-in slide-in-from-bottom-2 duration-150">
            <CheckIcon />
            <span>{profileSavedMsg}</span>
          </div>
        )}

      </div>
    </div>
  );
}
