
import React, { useState } from 'react';
import { Bot, CheckCircle, AlertCircle, RefreshCw, ExternalLink } from 'lucide-react';
import { BotConfig } from '../types';
import { checkBotStatus } from '../services/telegramService';

interface BotConnectionProps {
  config: BotConfig;
  onUpdate: (newConfig: BotConfig) => void;
}

export const BotConnection: React.FC<BotConnectionProps> = ({ config, onUpdate }) => {
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');

  const handleCheck = async () => {
    setChecking(true);
    setError('');
    try {
      const result = await checkBotStatus(config.token);
      if (result) {
        onUpdate({
          ...config,
          ...result,
          isConnected: true
        });
      } else {
        setError('Invalid Token or Network Error');
        onUpdate({ ...config, isConnected: false });
      }
    } catch (e) {
      setError('Failed to connect to Telegram API');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-telegram-secondary to-slate-900 p-6 rounded-xl border border-slate-700 shadow-xl mb-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
      
      <div className="flex flex-col md:flex-row justify-between items-start gap-6 relative z-10">
        <div className="flex-1 w-full">
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-colors ${config.isConnected ? 'bg-green-500 shadow-green-500/30' : 'bg-telegram-primary shadow-blue-500/30'}`}>
              <Bot size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Telegram Bot Connection</h2>
              <p className="text-slate-400 text-sm">Connect your bot to enable auto-forwarding</p>
            </div>
          </div>
          
          <div className="mt-6 space-y-3">
            <label className="text-xs uppercase tracking-wider text-slate-500 font-semibold flex items-center gap-2">
              Bot Token
              <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline flex items-center gap-1 lowercase font-normal">
                (get from @BotFather <ExternalLink size={10}/>)
              </a>
            </label>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={config.token}
                onChange={(e) => onUpdate({...config, token: e.target.value, isConnected: false})}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 font-mono text-sm focus:border-telegram-primary focus:ring-1 focus:ring-telegram-primary outline-none text-yellow-400 placeholder-slate-700 transition-all"
                placeholder="123456789:ABCdefGHIjklMNOpqRS..."
              />
              <button 
                onClick={handleCheck}
                disabled={checking || !config.token}
                className="bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 text-white px-6 py-2 rounded-lg transition-all disabled:opacity-50 font-medium min-w-[100px] flex justify-center items-center"
              >
                {checking ? <RefreshCw className="animate-spin" size={18} /> : 'Connect'}
              </button>
            </div>
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-center gap-2 text-red-400 text-xs animate-in slide-in-from-top-2">
                <AlertCircle size={14} /> {error}
              </div>
            )}
          </div>
        </div>

        <div className="bg-slate-950/50 p-5 rounded-xl border border-slate-700/50 w-full md:w-80">
          <div className="flex items-center justify-between mb-4">
             <h3 className="text-sm font-medium text-slate-300">Connection Details</h3>
             {config.isConnected && <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>}
          </div>
          
          <div className="space-y-3">
             <div className="flex items-center justify-between group">
                <span className="text-sm text-slate-500">Status</span>
                {config.isConnected ? (
                  <span className="text-green-400 text-sm font-bold flex items-center gap-1 bg-green-400/10 px-2 py-0.5 rounded">
                    <CheckCircle size={14} /> Online
                  </span>
                ) : (
                  <span className="text-slate-400 text-sm bg-slate-800 px-2 py-0.5 rounded">Disconnected</span>
                )}
             </div>
             
             {config.isConnected ? (
               <>
                <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Bot Name</span>
                    <span className="text-slate-200 text-sm font-medium">{config.name}</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Username</span>
                    <a href={`https://t.me/${config.username}`} target="_blank" rel="noreferrer" className="text-blue-400 text-sm hover:underline">
                      @{config.username}
                    </a>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">ID</span>
                    <span className="text-slate-500 text-xs font-mono bg-slate-900 px-1 rounded">{config.id}</span>
                </div>
               </>
             ) : (
               <div className="py-6 text-center">
                 <p className="text-xs text-slate-600">Enter a valid token to view bot details</p>
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};
