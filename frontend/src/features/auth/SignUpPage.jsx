import React, { useState } from 'react';
import { useAuth } from './AuthContext';

export default function SignUpPage({ onViewChange }) {
  const { register } = useAuth();

  // Form Field States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('user'); // 'user' (youth/learner) or 'contributor' (elder/expert)
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Status Message States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Form Client Validations
    if (!name.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    if (!agreedToTerms) {
      setErrorMsg('You must agree to the Terms of Service & Community Guidelines.');
      return;
    }

    setIsLoading(true);

    try {
      await register({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password,
        role: selectedRole,
      });

      setSuccessMsg('Account created successfully! Welcome to Setu.');
      setTimeout(() => {
        onViewChange('profile');
      }, 700);
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed. Please check your details and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="relative pt-32 pb-24 md:pt-40 md:pb-36 bg-gradient-to-b from-blue-50/50 via-white to-white overflow-hidden min-h-screen flex items-center">
      {/* Background Decorative Blobs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-blue-100/40 to-orange-100/30 rounded-full blur-3xl -z-10 translate-x-1/3 -translate-y-1/4"></div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-brand-light/35 to-blue-50/40 rounded-full blur-3xl -z-10 -translate-x-1/4 translate-y-1/4"></div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Brand Identity & Value Props */}
          <div className="lg:col-span-6 flex flex-col items-start text-left space-y-8 max-w-xl">
            <a 
              href="#/home" 
              onClick={(e) => { e.preventDefault(); onViewChange('home'); }}
              className="flex items-center space-x-3 text-brand-primary cursor-pointer"
            >
              <div className="w-10 h-10 rounded-2xl overflow-hidden bg-transparent border-0 p-0 flex items-center justify-center">
                <img src="/Setu_logo.png" alt="Setu Logo" loading="lazy" className="w-full h-full object-contain" />
              </div>
              <span className="text-2xl font-bold tracking-tight text-slate-800">Setu</span>
            </a>

            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
                Join the <br />
                <span className="bg-gradient-to-r from-brand-primary via-orange-500 to-amber-500 bg-clip-text text-transparent">
                  Intergenerational Bridge.
                </span>
              </h1>
              <p className="text-base md:text-lg text-slate-655 font-normal leading-relaxed">
                Connect with elders, learn traditional arts and sustainable wisdom, or share your valuable lived experiences with the next generation.
              </p>
            </div>

            {/* Platform Highlights */}
            <div className="space-y-4 w-full pt-2">
              <div className="flex items-start space-x-3 bg-white/80 backdrop-blur-xs p-4 rounded-2xl border border-slate-100 shadow-3xs">
                <span className="text-xl">👴</span>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">For Elder Storytellers</h4>
                  <p className="text-xs text-slate-500 font-normal">Share crafts, traditional recipes, and life lessons with curious youth learners.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 bg-white/80 backdrop-blur-xs p-4 rounded-2xl border border-slate-100 shadow-3xs">
                <span className="text-xl">🎓</span>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">For Youth Learners</h4>
                  <p className="text-xs text-slate-500 font-normal">Discover ancestral techniques, local history, and form authentic mentorships.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Sign Up Card */}
          <div className="lg:col-span-6 w-full flex justify-center lg:justify-end">
            <div className="bg-white rounded-[32px] p-8 md:p-10 shadow-xl border border-slate-100 w-full max-w-[500px] text-left space-y-6">
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-slate-900">Create Account</h2>
                <p className="text-xs text-slate-400 font-semibold">Join Setu to start sharing and learning.</p>
              </div>

              {/* Alert Blocks */}
              {errorMsg && (
                <div className="bg-rose-50 border border-rose-100 text-rose-600 text-xs font-semibold px-4 py-2.5 rounded-2xl flex items-center space-x-2">
                  <span>⚠️</span>
                  <span>{errorMsg}</span>
                </div>
              )}
              {successMsg && (
                <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs font-semibold px-4 py-2.5 rounded-2xl flex items-center space-x-2">
                  <span>✨</span>
                  <span>{successMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Role Selector Tabs */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">I want to join as</label>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-slate-50 rounded-2xl border border-slate-100">
                    <button
                      type="button"
                      onClick={() => setSelectedRole('user')}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        selectedRole === 'user'
                          ? 'bg-white text-brand-primary shadow-xs border border-slate-200/50'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      🎓 Youth Learner
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedRole('contributor')}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        selectedRole === 'contributor'
                          ? 'bg-white text-brand-primary shadow-xs border border-slate-200/50'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      👴 Elder / Mentor
                    </button>
                  </div>
                </div>

                {/* Full Name */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g., Anand Patel"
                    value={name}
                    disabled={isLoading}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border-b border-slate-200 focus:border-brand-primary py-2.5 text-sm focus:outline-none font-semibold text-slate-850 transition-colors focus:ring-0"
                  />
                </div>

                {/* Email Address */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    disabled={isLoading}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border-b border-slate-200 focus:border-brand-primary py-2.5 text-sm focus:outline-none font-semibold text-slate-850 transition-colors focus:ring-0"
                  />
                </div>

                {/* Password & Confirm Password Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1 relative">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Password</label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={password}
                      disabled={isLoading}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full border-b border-slate-200 focus:border-brand-primary py-2.5 text-sm focus:outline-none font-semibold text-slate-850 transition-colors focus:ring-0"
                    />
                  </div>
                  <div className="space-y-1 relative">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Confirm Password</label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={confirmPassword}
                      disabled={isLoading}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full border-b border-slate-200 focus:border-brand-primary py-2.5 text-sm focus:outline-none font-semibold text-slate-850 transition-colors focus:ring-0"
                    />
                  </div>
                </div>

                {/* Show Password toggle */}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[11px] font-bold text-slate-400 hover:text-slate-650 cursor-pointer"
                  >
                    {showPassword ? 'Hide password' : 'Show password'}
                  </button>
                </div>

                {/* Terms Agreement Checkbox */}
                <div className="flex items-start space-x-2 pt-1">
                  <input
                    type="checkbox"
                    id="terms"
                    required
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-brand-primary focus:ring-brand-primary w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="terms" className="text-xs text-slate-500 leading-tight font-medium cursor-pointer">
                    I agree to Setu's <a href="#terms" className="text-brand-primary underline font-bold">Terms of Service</a> &amp; <a href="#privacy" className="text-brand-primary underline font-bold">Community Guidelines</a>.
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 mt-2 bg-brand-primary hover:bg-brand-hover text-white text-sm font-bold rounded-full transition-all duration-200 cursor-pointer shadow-md shadow-brand-primary/10 flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <span>Complete Registration</span>
                  )}
                </button>
              </form>

              {/* Toggle to Sign In */}
              <div className="pt-2 text-center border-t border-slate-100">
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                  Already have an account?{' '}
                  <button
                    onClick={() => onViewChange('signin')}
                    className="text-brand-primary font-bold hover:underline cursor-pointer"
                  >
                    Sign In
                  </button>
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
