import React, { useState } from 'react';
import { useAuth } from '../AuthContext';

export default function AuthModal({ isOpen, onClose, onSuccess, initialMode = 'signin' }) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState(initialMode); // 'signin' or 'signup'
  
  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      if (mode === 'signin') {
        await login({ email: email.toLowerCase().trim(), password });
      } else {
        await register({ name: name.trim(), email: email.toLowerCase().trim(), password, role });
      }
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs text-sans">
      <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl border border-slate-100 p-8 text-left space-y-6 animate-in fade-in zoom-in duration-200">
        
        {/* Header & Close */}
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-black text-slate-900">
            {mode === 'signin' ? 'Welcome Back' : 'Create Setu Account'}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>

        {errorMsg && (
          <div className="bg-rose-50 border border-rose-100 text-rose-600 text-xs font-semibold px-4 py-2 rounded-xl">
            {errorMsg}
          </div>
        )}

        {/* Auth Mode Toggle */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-50 rounded-2xl border border-slate-100 text-xs font-bold">
          <button
            onClick={() => { setMode('signin'); setErrorMsg(''); }}
            className={`py-2 rounded-xl transition-all ${mode === 'signin' ? 'bg-white text-brand-primary shadow-xs' : 'text-slate-400'}`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setMode('signup'); setErrorMsg(''); }}
            className={`py-2 rounded-xl transition-all ${mode === 'signup' ? 'bg-white text-brand-primary shadow-xs' : 'text-slate-400'}`}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
          {mode === 'signup' && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
              <input
                type="text"
                required
                placeholder="Anand Patel"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border-b border-slate-200 py-2 focus:outline-none focus:border-brand-primary font-medium"
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
            <input
              type="email"
              required
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border-b border-slate-200 py-2 focus:outline-none focus:border-brand-primary font-medium"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border-b border-slate-200 py-2 focus:outline-none focus:border-brand-primary font-medium"
            />
          </div>

          {mode === 'signup' && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Joining Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-white text-xs font-semibold"
              >
                <option value="user">Youth Learner</option>
                <option value="contributor">Elder / Mentor</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold rounded-full transition-all shadow-md shadow-brand-primary/10 cursor-pointer disabled:opacity-60"
          >
            {isLoading ? 'Processing...' : mode === 'signin' ? 'Sign In & Continue' : 'Complete Registration & Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
