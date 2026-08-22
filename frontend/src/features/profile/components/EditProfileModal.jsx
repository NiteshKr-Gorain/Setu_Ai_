import React, { useState } from 'react';

export default function EditProfileModal({ isOpen, onClose, currentProfile, onSave }) {
  const [name, setName] = useState(currentProfile?.name || '');
  const [title, setTitle] = useState(currentProfile?.title || '');
  const [location, setLocation] = useState(currentProfile?.location || '');
  const [bio, setBio] = useState(currentProfile?.bio || '');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      name: name.trim(),
      title: title.trim(),
      location: location.trim(),
      bio: bio.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 p-8 text-left space-y-6 animate-in fade-in zoom-in duration-200">
        
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h3 className="text-lg font-black text-slate-900">Edit Profile Details</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border-b border-slate-200 py-2 focus:outline-none focus:border-brand-primary font-medium"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Headline / Title</label>
            <input
              type="text"
              placeholder="E.g. Traditional Organic Farmer"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border-b border-slate-200 py-2 focus:outline-none focus:border-brand-primary font-medium"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Location</label>
            <input
              type="text"
              placeholder="E.g. Punjab, India"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full border-b border-slate-200 py-2 focus:outline-none focus:border-brand-primary font-medium"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bio / Summary</label>
            <textarea
              rows={4}
              placeholder="Tell the community about your background and interests..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full border border-slate-200 rounded-2xl p-3 focus:outline-none focus:border-brand-primary font-normal resize-none"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-brand-primary/10 cursor-pointer"
            >
              Save Profile
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
