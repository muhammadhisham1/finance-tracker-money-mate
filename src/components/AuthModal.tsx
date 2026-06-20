import React, { useState } from 'react';
import { X, Mail, Lock, User, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
}

export function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const { signUp, signIn } = useAuth();
  const { showToast } = useToast();

  if (!isOpen) return null;

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setErrors({});

    try {
      if (mode === 'signup') {
        const { error } = await signUp(email, password, fullName);
        if (error) {
          if (error.message.includes('already registered')) {
            setErrors({ general: 'This email is already registered. Try signing in instead.' });
          } else {
            setErrors({ general: error.message });
          }
        } else {
          showToast('Account created successfully!', 'success');
          onClose();
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            setErrors({ general: 'Invalid email or password. Please try again.' });
          } else {
            setErrors({ general: error.message });
          }
        } else {
          showToast('Welcome back!', 'success');
          onClose();
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    setErrors({});
    setPassword('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in" onClick={onClose} />

      <div className="relative w-full max-w-md bg-gray-900 rounded-3xl border border-gray-700/50 shadow-2xl shadow-black/50 animate-scale-in overflow-hidden">
        {/* Gradient Header */}
        <div className="h-2 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500" />

        <div className="p-8">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 mb-4 shadow-lg shadow-cyan-500/25">
              <User className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">
              {mode === 'login' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-gray-400 mt-2">
              {mode === 'login'
                ? 'Sign in to access your dashboard'
                : 'Start your journey to financial freedom'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {errors.general && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">
                {errors.general}
              </div>
            )}

            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={`w-full pl-12 pr-4 py-3.5 bg-gray-800/50 rounded-xl text-white placeholder-gray-500 focus:outline-none transition-all ${
                    errors.email
                      ? 'border-2 border-rose-500 focus:ring-2 focus:ring-rose-500/50'
                      : 'border border-gray-700 focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent'
                  }`}
                />
              </div>
              {errors.email && <p className="mt-1.5 text-sm text-rose-400">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full pl-12 pr-12 py-3.5 bg-gray-800/50 rounded-xl text-white placeholder-gray-500 focus:outline-none transition-all ${
                    errors.password
                      ? 'border-2 border-rose-500 focus:ring-2 focus:ring-rose-500/50'
                      : 'border border-gray-700 focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="mt-1.5 text-sm text-rose-400">{errors.password}</p>}
            </div>

            {mode === 'signup' && (
              <p className="text-xs text-gray-500">
                By creating an account, you agree to our Terms of Service and Privacy Policy.
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-cyan-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Switch Mode */}
          <div className="mt-6 text-center">
            <p className="text-gray-400">
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button
                type="button"
                onClick={switchMode}
                className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
              >
                {mode === 'login' ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
