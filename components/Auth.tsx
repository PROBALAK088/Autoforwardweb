
import React, { useState } from 'react';
import { User, Lock, MessageCircle, ShieldCheck, LogIn, UserPlus, AlertCircle } from 'lucide-react';
import { loginUser, registerUser } from '../services/mongoService';
import { User as UserType } from '../types';

interface AuthProps {
  onLogin: (user: UserType) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form States
  const [telegramId, setTelegramId] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isLogin) {
        // Login Logic
        const result = await loginUser(telegramId, password);
        if (result.success && result.user) {
          onLogin(result.user);
        } else {
          setError(result.message);
        }
      } else {
        // Sign Up Logic
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          setIsLoading(false);
          return;
        }
        
        const result = await registerUser(username, telegramId, password);
        if (result.success) {
          alert('Account created successfully! Please login.');
          setIsLogin(true);
          setPassword('');
          setConfirmPassword('');
        } else {
          setError(result.message);
        }
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative z-10">
      <div className="w-full max-w-md animate-fade-in">
        
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-telegram-primary to-blue-600 shadow-lg shadow-blue-500/30 mb-4">
            <MessageCircle size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">AutoGram Forwarder</h1>
          <p className="text-slate-400">
            {isLogin ? 'Welcome back! Login to manage your channels.' : 'Create an account to start automating.'}
          </p>
        </div>

        {/* Card */}
        <div className="glass-panel rounded-2xl p-8 shadow-2xl border border-white/10">
          
          <div className="flex gap-4 mb-8 bg-black/20 p-1 rounded-xl">
            <button
              onClick={() => { setIsLogin(true); setError(''); }}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-300 ${
                isLogin ? 'bg-telegram-primary text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(''); }}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-300 ${
                !isLogin ? 'bg-telegram-primary text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {!isLogin && (
              <div className="relative group">
                <User className="absolute left-3 top-3.5 text-slate-500 group-focus-within:text-telegram-primary transition-colors" size={18} />
                <input
                  type="text"
                  placeholder="Username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-950/50 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-telegram-primary focus:ring-1 focus:ring-telegram-primary transition-all"
                />
              </div>
            )}

            <div className="relative group">
              <ShieldCheck className="absolute left-3 top-3.5 text-slate-500 group-focus-within:text-telegram-primary transition-colors" size={18} />
              <input
                type="text"
                placeholder="Telegram User ID (e.g. 12345678)"
                required
                value={telegramId}
                onChange={(e) => setTelegramId(e.target.value)}
                className="w-full bg-slate-950/50 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-telegram-primary focus:ring-1 focus:ring-telegram-primary transition-all"
              />
            </div>

            <div className="relative group">
              <Lock className="absolute left-3 top-3.5 text-slate-500 group-focus-within:text-telegram-primary transition-colors" size={18} />
              <input
                type="password"
                placeholder="Password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950/50 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-telegram-primary focus:ring-1 focus:ring-telegram-primary transition-all"
              />
            </div>

            {!isLogin && (
              <div className="relative group">
                <Lock className="absolute left-3 top-3.5 text-slate-500 group-focus-within:text-telegram-primary transition-colors" size={18} />
                <input
                  type="password"
                  placeholder="Confirm Password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-950/50 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-telegram-primary focus:ring-1 focus:ring-telegram-primary transition-all"
                />
              </div>
            )}

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle size={14} />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-telegram-primary to-blue-600 hover:from-blue-500 hover:to-blue-600 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {isLogin ? <LogIn size={18} /> : <UserPlus size={18} />}
                  {isLogin ? 'Login' : 'Create Account'}
                </>
              )}
            </button>

          </form>
        </div>
        
        <div className="mt-8 text-center">
          <p className="text-xs text-slate-500">Secure Telegram Automation Platform</p>
        </div>
      </div>
    </div>
  );
};
