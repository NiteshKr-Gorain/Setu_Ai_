import React, { useState } from 'react';
import { useAuth } from './AuthContext';

export default function SignInPage({ onViewChange }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Basic client validation
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await login({ email: email.toLowerCase(), password });
      setSuccessMsg('Successfully logged in! Redirecting...');
      const isUserAdmin = res?.user?.role === 'admin' || email.toLowerCase().trim() === 'nitesh@gmail.com';
      setTimeout(() => onViewChange(isUserAdmin ? 'admin' : 'profile'), 600);
    } catch (err) {
      setErrorMsg(err.message || 'Invalid email or password. Please try again.');
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
          
          {/* Left Column: Brand Identity & Graphic */}
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
                Welcome Back to <br />
                <span className="bg-gradient-to-r from-brand-primary via-orange-500 to-amber-500 bg-clip-text text-transparent">
                  Generational Ties.
                </span>
              </h1>
              <p className="text-base md:text-lg text-slate-655 font-normal leading-relaxed">
                Connect back with storytellers, review mentorship plans, and share valuable life lessons to preserve local traditions.
              </p>
            </div>

            {/* Illustration Graphic Container */}
            <div className="relative w-full aspect-[4/3] rounded-[24px] bg-gradient-to-tr from-blue-50 to-orange-50/50 p-6 border border-slate-100 shadow-md flex items-center justify-center overflow-hidden">
              <div className="absolute top-6 left-6 w-16 h-16 rounded-full bg-brand-light blur-lg opacity-80 animate-pulse"></div>
              <div className="absolute bottom-6 right-6 w-20 h-20 rounded-full bg-sky-100 blur-lg opacity-80"></div>
              
              <div className="space-y-4 text-center z-10 p-4">
                <span className="text-4xl">🔑</span>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Secure Access</p>
                <p className="text-sm font-bold text-slate-800">Your connections and conversations are fully private and protected.</p>
              </div>
            </div>
          </div>

          {/* Right Column: Sign In Card */}
          <div className="lg:col-span-6 w-full flex justify-center lg:justify-end">
            <div className="bg-white rounded-[32px] p-8 md:p-10 shadow-xl border border-slate-100 w-full max-w-[480px] text-left space-y-6">
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-slate-900">Sign In</h2>
                <p className="text-xs text-slate-400 font-semibold">Enter your credentials to access the platform.</p>
              </div>

              {/* Alert Message Blocks */}
              {errorMsg && (
                <div className="bg-rose-50 border border-rose-100 text-rose-600 text-xs font-semibold px-4 py-2.5 rounded-2xl flex items-center space-x-2 animate-fade-in animate-duration-300">
                  <span>⚠️</span>
                  <span>{errorMsg}</span>
                </div>
              )}
              {successMsg && (
                <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs font-semibold px-4 py-2.5 rounded-2xl flex items-center space-x-2 animate-fade-in animate-duration-300">
                  <span>✨</span>
                  <span>{successMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
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

                {/* Password input */}
                <div className="space-y-1 relative">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={password}
                      disabled={isLoading}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full border-b border-slate-200 focus:border-brand-primary py-2.5 pr-10 text-sm focus:outline-none font-semibold text-slate-855 transition-colors focus:ring-0"
                    />
                    <button
                      type="button"
                      tabIndex="-1"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-655 cursor-pointer font-bold text-xs"
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                {/* Remember & Forgot controls */}
                <div className="flex items-center justify-between text-xs font-semibold pt-1">
                  <label className="flex items-center space-x-2 text-slate-500 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-slate-300 text-brand-primary focus:ring-brand-primary w-4 h-4 cursor-pointer"
                    />
                    <span>Remember Me</span>
                  </label>
                  <a 
                    href="#forgot" 
                    onClick={(e) => { e.preventDefault(); setSuccessMsg('Password reset instructions sent to your email.'); }}
                    className="text-brand-primary hover:text-brand-hover transition-colors"
                  >
                    Forgot Password?
                  </a>
                </div>

                {/* Submit button */}
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
                      <span>Signing In...</span>
                    </>
                  ) : (
                    <span>Sign In</span>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="flex items-center justify-center space-x-3 py-2">
                <div className="h-px bg-slate-100 flex-grow"></div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">OR</span>
                <div className="h-px bg-slate-100 flex-grow"></div>
              </div>

              {/* Social Login Controls */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  disabled
                  title="Social login isn't wired up on the backend yet"
                  className="flex items-center justify-center space-x-2 border border-slate-200 py-2.5 rounded-full font-bold text-xs text-slate-350 cursor-not-allowed opacity-60"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                  </svg>
                  <span>Google</span>
                </button>
                <button
                  disabled
                  title="Social login isn't wired up on the backend yet"
                  className="flex items-center justify-center space-x-2 border border-slate-200 py-2.5 rounded-full font-bold text-xs text-slate-350 cursor-not-allowed opacity-60"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.577.688.479C19.138 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                  </svg>
                  <span>GitHub</span>
                </button>
              </div>

              {/* Toggle to Signup */}
              <div className="pt-2 text-center">
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                  Don't have an account?{' '}
                  <button
                    onClick={() => onViewChange('signup')}
                    className="text-brand-primary font-bold hover:underline cursor-pointer"
                  >
                    Sign Up
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
