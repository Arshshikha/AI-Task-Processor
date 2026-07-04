import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, Brain, ArrowRight, AlertTriangle } from 'lucide-react';

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 overflow-hidden">
      {/* Glow backgrounds */}
      <div className="glow-accent-blue" />
      <div className="glow-accent-purple" />

      <div className="w-full max-w-md z-10">
        {/* Branding header */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-indigo-600/20 p-3 rounded-2xl border border-indigo-500/30 mb-4 animate-pulse-slow">
            <Brain className="h-8 w-8 text-indigo-400" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white font-sans text-center">
            Sign in to AI Task Processor
          </h2>
          <p className="text-sm text-slate-400 mt-2">
            Execute operations and monitor logs in real-time
          </p>
        </div>

        {/* Login form Card */}
        <div className="glass-panel rounded-2xl p-8 shadow-2xl">
          {error && (
            <div className="mb-6 flex items-center gap-3 bg-red-950/30 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="glass-input pl-10 w-full rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm font-sans"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Password
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="glass-input pl-10 w-full rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm font-sans"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-3 text-sm font-semibold transition duration-200 border border-indigo-500/50 shadow-[0_4px_20px_rgba(99,102,241,0.25)] hover:shadow-[0_4px_25px_rgba(99,102,241,0.4)] disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-900/60 text-center">
            <span className="text-sm text-slate-400">
              Don't have an account?{' '}
              <Link to="/register" className="text-indigo-400 hover:text-indigo-300 hover:underline font-medium transition duration-200">
                Create one now
              </Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
