import React, { useState, useEffect } from 'react';
import { ArrowRight, Shield, TrendingUp, PiggyBank, Bell, Building2, BarChart3, Target, Trophy, Wallet, CheckCircle, Star, Zap, Lock, Smartphone, Globe } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

export function LandingPage({ onGetStarted, onLogin }: LandingPageProps) {
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature(prev => (prev + 1) % 8);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    { icon: TrendingUp, title: 'Smart Analytics', description: 'Real-time insights into your spending patterns, income trends, and financial health.', color: 'from-cyan-500 to-blue-500' },
    { icon: Target, title: 'Savings Goals', description: 'Set ambitious goals and watch your progress with visual milestones and achievements.', color: 'from-emerald-500 to-teal-500' },
    { icon: PiggyBank, title: 'Budget Tracking', description: 'Create custom budgets per category and get instant alerts before overspending.', color: 'from-amber-500 to-orange-500' },
    { icon: Bell, title: 'Bill Reminders', description: 'Never miss a payment with smart reminders and upcoming bill forecasts.', color: 'from-rose-500 to-pink-500' },
    { icon: Building2, title: 'Multi-Account', description: 'Sync and manage multiple bank accounts, cards, and investment portfolios.', color: 'from-violet-500 to-purple-500' },
    { icon: Shield, title: 'Bank-Grade Security', description: 'Enterprise-level encryption and fraud detection keep your finances safe.', color: 'from-blue-500 to-indigo-500' },
    { icon: Trophy, title: 'Gamification', description: 'Earn badges, maintain streaks, and level up your financial literacy.', color: 'from-yellow-500 to-amber-500' },
    { icon: Globe, title: 'Multi-Currency', description: 'Track expenses in 12+ currencies with real-time exchange rate support.', color: 'from-teal-500 to-cyan-500' },
  ];

  const testimonials = [
    { name: 'Sarah M.', role: 'Freelancer', text: 'Finally, a finance app that makes saving actually fun!', rating: 5 },
    { name: 'James K.', role: 'Small Business Owner', text: 'The bill reminders alone have saved me hundreds in late fees.', rating: 5 },
    { name: 'Maria L.', role: 'Student', text: 'Perfect for tracking my expenses and building savings habits.', rating: 5 },
  ];

  const stats = [
    { value: '50K+', label: 'Active Users' },
    { value: '4.9', label: 'App Rating' },
    { value: '$2M+', label: 'User Savings' },
    { value: '100%', label: 'Free Forever' },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-gray-950 to-purple-500/10" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Header */}
      <header className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 shadow-lg shadow-cyan-500/25">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">MoneyMate</span>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={onLogin} className="px-5 py-2.5 text-gray-300 hover:text-white transition-colors font-medium">
                Sign In
              </button>
              <button onClick={onGetStarted} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-white font-medium rounded-xl transition-all hover:shadow-lg hover:shadow-cyan-500/25">
                Get Started <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 pt-16 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-400 text-sm mb-8 backdrop-blur-sm">
              <Zap className="w-4 h-4" />
              <span>The Future of Personal Finance</span>
            </div>

            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
                Master Your
              </span>
              <br />
              <span className="bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-500 bg-clip-text text-transparent">
                Financial Future
              </span>
            </h1>

            <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              Track expenses, manage budgets, achieve savings goals, and gain deep insights into your spending habits—all in one beautifully designed, secure platform.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button onClick={onGetStarted} className="group flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-white font-semibold rounded-2xl transition-all hover:shadow-xl hover:shadow-cyan-500/30 text-lg">
                Start Free Today
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button onClick={onLogin} className="flex items-center gap-2 px-8 py-4 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white font-semibold rounded-2xl transition-all backdrop-blur-sm">
                I Already Have an Account
              </button>
            </div>

            {/* Trust Badges */}
            <div className="flex items-center justify-center gap-6 mt-10 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-400" />
                256-bit Encryption
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                No Credit Card Required
              </div>
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                Works on All Devices
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Banner */}
      <section className="relative z-10 py-8 border-y border-gray-800/50 bg-gradient-to-r from-cyan-500/5 via-transparent to-purple-500/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">{stat.value}</p>
                <p className="text-sm text-gray-400 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Everything You Need to Manage Money
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Powerful features designed to help you save more, spend smarter, and reach your financial goals faster.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <div
                key={i}
                className={`group relative p-6 bg-gray-900/50 backdrop-blur-sm rounded-2xl border transition-all duration-300 cursor-pointer ${
                  activeFeature === i
                    ? 'border-cyan-500/50 bg-gray-900/80 shadow-xl shadow-cyan-500/10'
                    : 'border-gray-800/50 hover:border-gray-700'
                }`}
                onClick={() => setActiveFeature(i)}
              >
                <div className={`p-3 rounded-xl bg-gradient-to-br ${feature.color} w-fit mb-4`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{feature.description}</p>
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.color} opacity-0 ${activeFeature === i ? 'opacity-5' : ''} transition-opacity`} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative z-10 py-24 bg-gradient-to-b from-transparent via-gray-900/50 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Loved by Thousands
            </h2>
            <p className="text-lg text-gray-400">See what our users are saying</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <div key={i} className="p-6 bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800/50">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="w-5 h-5 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-gray-300 mb-4 italic">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-semibold">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="font-medium text-white">{t.name}</p>
                    <p className="text-sm text-gray-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative p-12 bg-gradient-to-br from-cyan-500/10 via-gray-900 to-purple-500/10 rounded-3xl border border-cyan-500/20 backdrop-blur-xl overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />

            <div className="relative text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Ready to Transform Your Finances?
              </h2>
              <p className="text-lg text-gray-400 mb-8 max-w-xl mx-auto">
                Join thousands of users who are taking control of their money. Start your journey to financial freedom today.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button onClick={onGetStarted} className="group flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-white font-semibold rounded-2xl transition-all hover:shadow-xl hover:shadow-cyan-500/30 text-lg">
                  Create Free Account
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              <div className="flex items-center justify-center gap-8 mt-8 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  Free forever
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  No credit card
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  Cancel anytime
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-gray-800/50 bg-gray-900/30 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white">MoneyMate</span>
            </div>
            <p className="text-sm text-gray-500">
              Built with React, TypeScript & Supabase
            </p>
            <p className="text-sm text-gray-500">
              © 2024 MoneyMate. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
