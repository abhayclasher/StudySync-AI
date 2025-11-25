
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { X, Mail, Lock, Loader2, ArrowRight, AlertCircle, Github } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(''); // Only for sign up
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setError("Supabase client not initialized. Check API keys.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
            },
          },
        });
        if (error) throw error;
        // Handle success/email confirmation instructions
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'github') => {
    if (!supabase) {
      setError("Supabase client not initialized.");
      return;
    }
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: typeof window !== 'undefined'
            ? `${window.location.origin}/auth/callback`
            : 'http://localhost:3000/auth/callback',
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center px-0 md:px-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            role="presentation"
            aria-hidden="true"
          />

          {/* Modal - Mobile: Slide up from bottom, Desktop: Scale from center */}
          <motion.div
            initial={{
              opacity: 0,
              y: 100,
              scale: 1
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1
            }}
            exit={{
              opacity: 0,
              y: 100,
              scale: 0.95
            }}
            transition={{
              type: "spring",
              damping: 25,
              stiffness: 300,
              duration: 0.3
            }}
            className="relative w-full md:max-w-md bg-[#09090b] border border-white/10 rounded-t-3xl md:rounded-3xl p-6 md:p-8 shadow-2xl overflow-hidden"
            style={{
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            {/* Drag handle - Mobile only */}
            <div
              className="md:hidden w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-6 cursor-grab active:cursor-grabbing"
              role="presentation"
              aria-hidden="true"
            />
            {/* Background decorative glows */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/20 blur-[80px] rounded-full pointer-events-none"></div>
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-secondary/20 blur-[80px] rounded-full pointer-events-none"></div>

            <button
              onClick={onClose}
              aria-label="Close authentication modal"
              className="absolute top-4 md:top-6 right-4 md:right-6 p-1 rounded-full text-slate-400 hover:bg-white/5 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <X size={20} />
            </button>

            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
                {isSignUp ? 'Create Account' : 'Welcome Back'}
              </h1>
              <p className="text-slate-400 text-sm">
                {isSignUp ? 'Join the community of learners.' : 'Sign in to access your courses.'}
              </p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-400 text-sm"
              >
                <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}

            <form onSubmit={handleAuth} className="space-y-5" role="form" aria-label={isSignUp ? 'Sign up form' : 'Sign in form'}>
              {isSignUp && (
                <div className="space-y-1.5">
                  <label htmlFor="full-name" className="text-xs font-bold text-slate-400 ml-1">FULL NAME</label>
                  <div className="relative group">
                    <input
                      id="full-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all"
                      placeholder="Enter your name"
                      required
                      autoComplete="name"
                      aria-required="true"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="email" className="text-xs font-bold text-slate-400 ml-1">EMAIL ADDRESS</label>
                <div className="relative group">
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all"
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                    aria-required="true"
                  />
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-white transition-colors" size={18} aria-hidden="true" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="password" className="text-xs font-bold text-slate-400 ml-1">PASSWORD</label>
                <div className="relative group">
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all"
                    placeholder="••••••••"
                    required
                    autoComplete={isSignUp ? "new-password" : "current-password"}
                    aria-required="true"
                  />
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-white transition-colors" size={18} aria-hidden="true" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                aria-label={isSignUp ? 'Create account' : 'Sign in'}
                className="w-full bg-white text-black hover:bg-slate-200 font-bold rounded-xl py-4 mt-2 flex items-center justify-center transition-all transform active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.1)] disabled:opacity-50 disabled:scale-100 focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                {loading ? (
                  <Loader2 className="animate-spin" aria-hidden="true" />
                ) : (
                  <>
                    {isSignUp ? 'Create Account' : 'Sign In'} <ArrowRight size={18} className="ml-2" aria-hidden="true" />
                  </>
                )}
              </button>
            </form>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase font-bold tracking-wider">
                <span className="bg-[#09090b] px-3 text-slate-500">Or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                onClick={() => handleSocialLogin('google')}
                aria-label="Sign in with Google"
                className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl py-3 transition-all text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <GoogleIcon aria-hidden="true" />
                <span>Google</span>
              </button>
              <button
                onClick={() => handleSocialLogin('github')}
                aria-label="Sign in with GitHub"
                className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl py-3 transition-all text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <Github className="w-5 h-5" aria-hidden="true" />
                <span>GitHub</span>
              </button>
            </div>

            <div className="mt-8 text-center">
              <p className="text-sm text-slate-500">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button
                  onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
                  aria-label={isSignUp ? 'Switch to sign in' : 'Switch to sign up'}
                  className="text-primary hover:text-primary/80 font-bold transition-colors ml-1 focus:outline-none focus:ring-2 focus:ring-primary/50 rounded px-1"
                >
                  {isSignUp ? 'Sign In' : 'Sign Up'}
                </button>
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AuthModal;
