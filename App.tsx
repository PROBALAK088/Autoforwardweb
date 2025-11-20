
import React, { useEffect, useState, useCallback } from 'react';
import { 
  Settings, 
  FileText, 
  Send, 
  Save, 
  Database, 
  Trash2, 
  Plus, 
  Play, 
  AlertCircle,
  Link2,
  Type,
  Scissors,
  HardDrive,
  Zap,
  ShieldAlert,
  Activity,
  Server,
  LogOut
} from 'lucide-react';
import { Toggle } from './components/Toggle';
import { SectionHeader } from './components/SectionHeader';
import { BotConnection } from './components/BotConnection';
import { BotCommands } from './components/BotCommands';
import { AdvancedSettings } from './components/AdvancedSettings';
import { Auth } from './components/Auth';
import { saveConfigToDB, loadConfigFromDB, testDatabaseConnection, getCurrentUser, logoutUser } from './services/mongoService';
import { verifyBotAdmin } from './services/telegramService';
import { AppConfig, ChannelType, ForwardJob, User } from './types';

const initialJobState: ForwardJob = {
  id: 'job-1',
  sourceId: '',
  destinationId: '',
  lastMessageId: 0,
  skipCount: 0,
  progress: 0,
  status: 'IDLE',
  totalMessages: 100,
  processedCount: 0
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [newWord, setNewWord] = useState('');
  const [newBlacklistPhrase, setNewBlacklistPhrase] = useState('');
  const [newChannelId, setNewChannelId] = useState('');
  const [newChannelType, setNewChannelType] = useState<ChannelType>(ChannelType.SOURCE);
  const [verifyingChannel, setVerifyingChannel] = useState(false);
  const [dbStatus, setDbStatus] = useState<'idle' | 'checking' | 'connected' | 'error'>('idle');
  
  // Job State
  const [job, setJob] = useState<ForwardJob>(initialJobState);
  const [showJobWizard, setShowJobWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);

  useEffect(() => {
    // Check for logged in user
    const user = getCurrentUser();
    if (user) {
      setCurrentUser(user);
      // Load config only if user exists
      loadConfigFromDB().then((data) => {
        setConfig(data);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setLoading(true);
    loadConfigFromDB().then((data) => {
      setConfig(data);
      setLoading(false);
    });
  };

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    setConfig(null);
  };

  const handleSave = async () => {
    if (!config) return;
    setLoading(true);
    await saveConfigToDB(config);
    setLoading(false);
  };

  const checkDbConnection = async () => {
    setDbStatus('checking');
    try {
      const success = await testDatabaseConnection();
      setDbStatus(success ? 'connected' : 'error');
      setTimeout(() => setDbStatus('idle'), 3000);
    } catch (e) {
      setDbStatus('error');
    }
  };

  const updateConfig = useCallback((updater: (prev: AppConfig) => AppConfig) => {
    setConfig((prev) => {
      if (!prev) return null;
      return updater(prev);
    });
  }, []);

  const addChannel = async () => {
    if (!newChannelId || !config?.bot.isConnected) return;
    
    setVerifyingChannel(true);
    const isAdmin = await verifyBotAdmin(newChannelId, config.bot.token, config.bot.id);
    setVerifyingChannel(false);

    if (isAdmin) {
      updateConfig(prev => ({
        ...prev,
        channels: [
          ...prev.channels,
          {
            id: newChannelId,
            name: `Channel ${newChannelId}`, 
            type: newChannelType,
            connectedAt: new Date()
          }
        ]
      }));
      setNewChannelId('');
    } else {
      alert("⚠️ Admin Verification Failed\n\nPlease ensure:\n1. The bot is added to the channel\n2. The bot is promoted to Admin\n3. The Channel ID is correct (starts with -100)");
    }
  };

  const removeChannel = (id: string) => {
    updateConfig(prev => ({
      ...prev,
      channels: prev.channels.filter(c => c.id !== id)
    }));
  };

  const addRemoveWord = () => {
    if (!newWord || !config) return;
    if (config.captionRules.removeWords.includes(newWord)) return;
    
    updateConfig(prev => ({
      ...prev,
      captionRules: {
        ...prev.captionRules,
        removeWords: [...prev.captionRules.removeWords, newWord]
      }
    }));
    setNewWord('');
  };

  const deleteRemoveWord = (word: string) => {
    updateConfig(prev => ({
      ...prev,
      captionRules: {
        ...prev.captionRules,
        removeWords: prev.captionRules.removeWords.filter(w => w !== word)
      }
    }));
  };

  const addBlacklistPhrase = () => {
    if (!newBlacklistPhrase || !config) return;
    if (config.blacklistPhrases.includes(newBlacklistPhrase)) return;
    
    updateConfig(prev => ({
      ...prev,
      blacklistPhrases: [...prev.blacklistPhrases, newBlacklistPhrase]
    }));
    setNewBlacklistPhrase('');
  };

  const deleteBlacklistPhrase = (phrase: string) => {
    updateConfig(prev => ({
      ...prev,
      blacklistPhrases: prev.blacklistPhrases.filter(p => p !== phrase)
    }));
  };

  const startForwarding = () => {
    setJob(prev => ({ ...prev, status: 'RUNNING', progress: 0, processedCount: 0 }));
    const total = 100; 
    const interval = setInterval(() => {
      setJob(prev => {
        if (prev.progress >= 100) {
          clearInterval(interval);
          return { ...prev, status: 'COMPLETED', progress: 100, processedCount: total };
        }
        return { 
          ...prev, 
          progress: prev.progress + 1, 
          processedCount: Math.floor((prev.progress + 1) / 100 * total) 
        };
      });
    }, 100);
  };

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-telegram-dark text-white relative overflow-hidden">
        <div className="absolute w-64 h-64 bg-telegram-primary/20 rounded-full blur-[100px]"></div>
        <div className="animate-pulse flex flex-col items-center relative z-10">
          <div className="w-16 h-16 bg-telegram-surface rounded-2xl flex items-center justify-center border border-telegram-primary/30 shadow-2xl mb-4">
             <Database className="w-8 h-8 text-telegram-primary animate-bounce" />
          </div>
          <p className="text-telegram-primary font-bold tracking-wider">LOADING SYSTEM...</p>
        </div>
      </div>
    );
  }

  // Auth Guard
  if (!currentUser) {
    return (
      <>
        <Auth onLogin={handleLogin} />
        {/* Watermark on Auth Page */}
        <div className="fixed bottom-4 right-6 z-50 pointer-events-none">
          <div className="glass-panel px-4 py-2 rounded-full flex items-center gap-2 shadow-lg">
            <div className="w-2 h-2 bg-telegram-accent rounded-full animate-pulse"></div>
            <span className="text-xs font-mono text-slate-300 opacity-80">Telegram @SteveBotz</span>
          </div>
        </div>
      </>
    );
  }

  if (!config) return null;

  return (
    <div className="min-h-screen text-white pb-20 font-sans relative z-10">
      {/* Navbar */}
      <nav className="glass-panel border-b border-white/5 sticky top-0 z-50 px-6 py-3 flex justify-between items-center shadow-lg mb-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-tr from-telegram-primary to-blue-400 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Send className="text-white" fill="white" size={20} />
          </div>
          <div>
            <h1 className="font-bold text-xl leading-tight tracking-tight text-white">AutoGram</h1>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-[10px] font-mono text-green-400 uppercase tracking-wider">
                <Activity size={10} className="animate-pulse"/>
                Online
              </div>
              <span className="text-[10px] text-slate-500">|</span>
              <span className="text-[10px] text-slate-400 font-mono">User: {currentUser.telegramId}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-black/20 rounded-lg border border-white/5">
             <div className={`w-2 h-2 rounded-full transition-all duration-500 ${dbStatus === 'connected' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : dbStatus === 'error' ? 'bg-red-500' : 'bg-slate-500'}`}></div>
             <span className="text-xs text-slate-400 font-mono">DB: Cluster0</span>
             <button 
              onClick={checkDbConnection} 
              className="ml-2 text-slate-500 hover:text-white disabled:animate-spin transition-colors"
              disabled={dbStatus === 'checking'}
            >
               <Server size={12} />
             </button>
           </div>
           <button 
            onClick={handleSave}
            className="bg-green-600 hover:bg-green-500 active:scale-95 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold transition-all shadow-lg shadow-green-900/20 border border-green-500/20"
          >
            <Save size={16} />
            <span className="hidden sm:inline">Save</span>
          </button>
          <button 
            onClick={handleLogout}
            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 p-2 rounded-lg border border-red-500/20 transition-all"
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4 space-y-6">
        
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Bot Connection Section */}
            <BotConnection 
              config={config.bot} 
              onUpdate={(newBotConfig) => updateConfig(prev => ({ ...prev, bot: newBotConfig }))}
            />

             {/* Forwarding Job Wizard */}
            <section className="relative overflow-hidden rounded-2xl p-0.5 bg-gradient-to-br from-blue-500/20 to-purple-500/20 shadow-2xl">
              <div className="bg-telegram-surface/90 p-6 rounded-2xl backdrop-blur-sm relative z-10 h-full">
                <div className="flex justify-between items-start mb-6">
                  <SectionHeader title="Forwarding Operations" icon={Zap} description="Bulk forward messages between channels." />
                  {!showJobWizard && job.status === 'IDLE' && (
                    <button 
                      onClick={() => { setShowJobWizard(true); setWizardStep(1); }}
                      disabled={config.channels.length < 2}
                      className="bg-white text-telegram-dark hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-2.5 rounded-full font-bold flex items-center gap-2 transition-all shadow-lg shadow-white/10"
                    >
                      Create Task <Play size={16} fill="currentColor" />
                    </button>
                  )}
                </div>

                {/* Status: Running */}
                {job.status === 'RUNNING' && (
                  <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
                    <div className="flex justify-between items-end mb-2">
                      <div className="flex flex-col">
                        <span className="text-telegram-accent font-bold text-lg animate-pulse">Processing...</span>
                        <span className="text-xs text-slate-500">Forwarding messages {job.processedCount} / {job.totalMessages}</span>
                      </div>
                      <span className="text-2xl font-mono font-bold text-white">{job.progress}%</span>
                    </div>
                    <div className="w-full h-4 bg-slate-950 rounded-full overflow-hidden border border-slate-700">
                      <div className="h-full bg-gradient-to-r from-telegram-primary to-purple-500 transition-all duration-300 shadow-[0_0_15px_rgba(59,130,246,0.5)]" style={{width: `${job.progress}%`}}></div>
                    </div>
                    <div className="flex gap-4 justify-end mt-6">
                      <button 
                        onClick={() => setJob(prev => ({...prev, status: 'IDLE', progress: 0}))}
                        className="text-red-400 hover:bg-red-500/10 px-4 py-2 rounded-md text-sm transition-colors border border-transparent hover:border-red-500/20"
                      >
                        Abort Operation
                      </button>
                    </div>
                  </div>
                )}

                {/* Wizard Form */}
                {showJobWizard && job.status === 'IDLE' && (
                  <div className="space-y-6 bg-slate-800/40 p-6 rounded-xl border border-slate-700/50 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    
                    {/* Wizard Step 1: Channels */}
                    {wizardStep === 1 && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium text-white">Step 1: Select Channels</h3>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs text-slate-400 mb-1 uppercase font-bold tracking-wider">Source</label>
                            <div className="grid gap-2">
                              {config.channels.filter(c => c.type === ChannelType.SOURCE).map(c => (
                                <button
                                  key={c.id}
                                  onClick={() => setJob(prev => ({...prev, sourceId: c.id}))}
                                  className={`text-left p-3 rounded-lg border transition-all ${job.sourceId === c.id ? 'bg-telegram-primary/20 border-telegram-primary ring-1 ring-telegram-primary' : 'bg-slate-900/50 border-slate-600 hover:bg-slate-800'}`}
                                >
                                  <div className="text-sm font-medium">{c.name}</div>
                                  <div className="text-xs text-slate-500">{c.id}</div>
                                </button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs text-slate-400 mb-1 uppercase font-bold tracking-wider">Destination</label>
                            <div className="grid gap-2">
                              {config.channels.filter(c => c.type === ChannelType.DESTINATION).map(c => (
                                <button
                                  key={c.id}
                                  onClick={() => setJob(prev => ({...prev, destinationId: c.id}))}
                                  className={`text-left p-3 rounded-lg border transition-all ${job.destinationId === c.id ? 'bg-purple-500/20 border-purple-500 ring-1 ring-purple-500' : 'bg-slate-900/50 border-slate-600 hover:bg-slate-800'}`}
                                >
                                  <div className="text-sm font-medium">{c.name}</div>
                                  <div className="text-xs text-slate-500">{c.id}</div>
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                          <button onClick={() => setShowJobWizard(false)} className="px-4 py-2 text-slate-400 hover:text-white transition-colors">Cancel</button>
                          <button 
                            disabled={!job.sourceId || !job.destinationId}
                            onClick={() => setWizardStep(2)} 
                            className="bg-telegram-primary hover:bg-blue-500 text-white px-6 py-2 rounded-lg disabled:opacity-50 transition-all shadow-lg shadow-blue-500/20"
                          >
                            Next: Configure Range
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Wizard Step 2: Range & Skip */}
                    {wizardStep === 2 && (
                      <div className="space-y-6">
                        <h3 className="text-lg font-medium text-white">Step 2: Range & Filters</h3>
                        
                        <div>
                          <label className="block text-xs text-slate-400 mb-2 uppercase font-bold tracking-wider">Last Message ID to Forward</label>
                          <div className="flex items-center gap-3">
                              <input 
                                type="number" 
                                className="flex-1 bg-slate-950/80 border border-slate-600 rounded-lg p-3 text-lg font-mono focus:border-telegram-primary outline-none"
                                placeholder="e.g. 5000"
                                onChange={(e) => setJob(prev => ({...prev, lastMessageId: parseInt(e.target.value)}))}
                              />
                              <div className="p-3 bg-slate-900 rounded-lg border border-slate-700">
                                <span className="text-xs text-slate-500 block">Start ID</span>
                                <span className="font-mono">1</span>
                              </div>
                          </div>
                        </div>

                        <div className="bg-orange-500/5 border border-orange-500/20 p-4 rounded-xl">
                          <div className="flex justify-between items-center mb-3">
                            <label className="text-sm font-bold text-orange-400 flex items-center gap-2">
                              <Type size={16} /> Skip Messages
                            </label>
                          </div>
                          <p className="text-xs text-slate-400 mb-4">
                            Select how many messages to skip from the queue.
                          </p>
                          <div className="grid grid-cols-4 gap-3">
                              {[
                                { label: '-100 (End)', val: -100 },
                                { label: '300 (Start)', val: 300 },
                                { label: '-10 (End)', val: -10 },
                                { label: '10 (Start)', val: 10 }
                              ].map(opt => (
                                <button 
                                  key={opt.val}
                                  onClick={() => setJob(prev => ({...prev, skipCount: opt.val}))}
                                  className={`px-2 py-3 text-xs font-medium rounded-lg border transition-all ${job.skipCount === opt.val ? 'bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/20' : 'bg-slate-900 border-slate-600 text-slate-400 hover:bg-slate-800'}`}
                                >
                                  {opt.label}
                                </button>
                              ))}
                          </div>
                        </div>

                        <div className="flex justify-between pt-4 border-t border-slate-700">
                          <button onClick={() => setWizardStep(1)} className="text-slate-400 hover:text-white transition-colors">Back</button>
                          <button 
                            disabled={!job.lastMessageId}
                            onClick={() => { setShowJobWizard(false); startForwarding(); }}
                            className="bg-green-600 hover:bg-green-500 text-white px-8 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-green-600/20 disabled:opacity-50 disabled:shadow-none transition-all"
                          >
                            Start Forwarding <Send size={16} />
                          </button>
                        </div>
                      </div>
                    )}

                  </div>
                )}
              </div>
            </section>
          </div>

          <div className="space-y-6">
             {/* Command Reference */}
             <BotCommands />

             {/* Connections */}
             <section className="glass-panel rounded-2xl p-6 shadow-xl">
              <SectionHeader 
                title="Channel Manager" 
                icon={Link2} 
                description="Connect source/target channels."
              />
              
              <div className="space-y-4">
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                  <div className="space-y-3">
                    {!config.bot.isConnected && (
                      <div className="bg-yellow-500/10 border border-yellow-500/20 p-2 rounded text-xs text-yellow-200 flex gap-2 items-center">
                        <AlertCircle size={12} /> Bot required
                      </div>
                    )}
                    
                    <input
                      type="text"
                      value={newChannelId}
                      disabled={!config.bot.isConnected}
                      onChange={(e) => setNewChannelId(e.target.value)}
                      placeholder="-100xxxxxxxxxx"
                      className="w-full bg-slate-950 border border-slate-600 rounded-lg px-3 py-2.5 text-sm focus:border-telegram-primary outline-none disabled:opacity-50 font-mono text-center tracking-wide"
                    />
                    
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setNewChannelType(ChannelType.SOURCE)}
                        className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-all ${newChannelType === ChannelType.SOURCE ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'border-slate-600 text-slate-500 hover:bg-slate-700'}`}
                      >
                        Source
                      </button>
                      <button 
                        onClick={() => setNewChannelType(ChannelType.DESTINATION)}
                        className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-all ${newChannelType === ChannelType.DESTINATION ? 'bg-purple-500/20 border-purple-500 text-purple-400' : 'border-slate-600 text-slate-500 hover:bg-slate-700'}`}
                      >
                        Target
                      </button>
                    </div>

                    <button 
                      onClick={addChannel}
                      disabled={!config.bot.isConnected || !newChannelId || verifyingChannel}
                      className="w-full bg-telegram-primary hover:bg-blue-600 disabled:bg-slate-700 disabled:text-slate-500 text-white py-2 rounded-lg font-medium transition-all flex justify-center items-center gap-2 text-sm shadow-lg shadow-blue-500/20"
                    >
                      {verifyingChannel ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : 'Add Channel'}
                    </button>
                  </div>
                </div>

                {/* Connected List */}
                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                  {config.channels.length === 0 && (
                    <p className="text-center text-slate-500 text-xs py-4 italic">No channels connected</p>
                  )}
                  {config.channels.map(channel => (
                    <div key={channel.id} className="flex items-center justify-between bg-slate-800/80 p-3 rounded-lg border border-slate-700/50 hover:bg-slate-800 transition-colors">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className={`w-8 h-8 shrink-0 rounded-md flex items-center justify-center text-xs font-bold border ${channel.type === ChannelType.SOURCE ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' : 'bg-purple-500/10 text-purple-400 border-purple-500/30'}`}>
                          {channel.type === ChannelType.SOURCE ? "SRC" : "TGT"}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-xs text-slate-200 truncate">{channel.name}</p>
                          <p className="text-[10px] text-slate-500 font-mono truncate">{channel.id}</p>
                        </div>
                      </div>
                      <button onClick={() => removeChannel(channel.id)} className="text-slate-600 hover:text-red-400 p-1.5 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Advanced Caption Settings */}
        <section className="glass-panel rounded-2xl p-1 shadow-xl">
          <div className="p-6 pb-2">
            <SectionHeader title="Advanced Caption Editor" icon={FileText} description="Configure templates, replacements, and metadata extraction." />
          </div>
          <AdvancedSettings 
            config={config.captionRules} 
            onChange={(newRules) => updateConfig(prev => ({ ...prev, captionRules: newRules }))} 
          />
        </section>

        <div className="grid md:grid-cols-2 gap-8">
          {/* File Type Toggles */}
          <section className="glass-panel rounded-2xl p-6 shadow-xl h-full">
            <SectionHeader title="Content Filters" icon={Settings} description="Toggle specific message types." />
            <div className="space-y-1">
              <Toggle 
                label="Videos" 
                checked={config.filters.video} 
                onChange={(v) => updateConfig(prev => ({...prev, filters: {...prev.filters, video: v}}))} 
              />
              <Toggle 
                label="Documents / Files" 
                checked={config.filters.document} 
                onChange={(v) => updateConfig(prev => ({...prev, filters: {...prev.filters, document: v}}))} 
              />
              <Toggle 
                label="Text Messages" 
                checked={config.filters.text} 
                onChange={(v) => updateConfig(prev => ({...prev, filters: {...prev.filters, text: v}}))} 
              />
              <Toggle 
                label="Photos" 
                checked={config.filters.photos} 
                onChange={(v) => updateConfig(prev => ({...prev, filters: {...prev.filters, photos: v}}))} 
              />
              <Toggle 
                label="Stickers" 
                checked={config.filters.stickers} 
                onChange={(v) => updateConfig(prev => ({...prev, filters: {...prev.filters, stickers: v}}))} 
              />
              <Toggle 
                label="Voice Messages" 
                checked={config.filters.voice} 
                onChange={(v) => updateConfig(prev => ({...prev, filters: {...prev.filters, voice: v}}))} 
              />
            </div>
          </section>

          {/* Size Limits */}
          <section className="glass-panel rounded-2xl p-6 shadow-xl flex flex-col">
             <SectionHeader title="File Size Limits" icon={HardDrive} description="Control bandwidth usage by limiting file sizes." />
             <div className="flex-1 flex flex-col justify-center space-y-8 mt-2">
                <div className="relative pt-6">
                  <label className="absolute top-0 left-0 text-sm font-medium text-slate-400">Min Size</label>
                  <div className="flex items-center gap-4">
                    <input 
                      type="range" 
                      min="0" 
                      max="500" 
                      value={config.sizeLimits.min}
                      onChange={(e) => updateConfig(prev => ({...prev, sizeLimits: {...prev.sizeLimits, min: parseInt(e.target.value)}}))}
                      className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-telegram-primary hover:accent-blue-400"
                    />
                    <div className="w-20 text-right font-mono text-telegram-primary font-bold">{config.sizeLimits.min} MB</div>
                  </div>
                </div>
                
                <div className="relative pt-6">
                  <label className="absolute top-0 left-0 text-sm font-medium text-slate-400">Max Size</label>
                  <div className="flex items-center gap-4">
                    <input 
                      type="range" 
                      min="1" 
                      max="4000" 
                      value={config.sizeLimits.max}
                      onChange={(e) => updateConfig(prev => ({...prev, sizeLimits: {...prev.sizeLimits, max: parseInt(e.target.value)}}))}
                      className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-telegram-primary hover:accent-blue-400"
                    />
                    <div className="w-20 text-right font-mono text-telegram-primary font-bold">{config.sizeLimits.max} MB</div>
                  </div>
                </div>

                <div className="bg-blue-900/20 border border-blue-500/20 p-4 rounded-lg flex gap-3">
                  <AlertCircle className="text-blue-400 shrink-0" size={20} />
                  <div className="space-y-1">
                     <p className="text-sm font-medium text-blue-200">Limit Adjustment</p>
                     <p className="text-xs text-blue-300/70">Files smaller than Min or larger than Max will be skipped automatically during the forwarding process.</p>
                  </div>
                </div>
             </div>
          </section>
        </div>

        {/* Basic Cleaners & Blacklist */}
        <section className="glass-panel rounded-2xl p-6 shadow-xl">
          <SectionHeader title="Quick Filters & Blacklist" icon={Scissors} description="Sanitize message text and block content." />
          
          <div className="grid lg:grid-cols-3 gap-8 mt-6">
            {/* Remove Words */}
            <div className="space-y-4">
               <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Remove Words</h3>
               <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/50">
                <div className="flex gap-2 mb-4">
                  <input 
                    type="text"
                    value={newWord}
                    onChange={(e) => setNewWord(e.target.value)}
                    placeholder="e.g. @spam_channel"
                    className="flex-1 bg-slate-950 border border-slate-600 rounded-lg px-4 py-2.5 text-sm focus:border-telegram-primary outline-none"
                    onKeyDown={(e) => e.key === 'Enter' && addRemoveWord()}
                  />
                  <button onClick={addRemoveWord} className="bg-slate-700 hover:bg-slate-600 text-white px-4 rounded-lg transition-colors">Add</button>
                </div>
                <div className="flex flex-wrap gap-2 min-h-[80px]">
                  {config.captionRules.removeWords.map(word => (
                    <span key={word} className="inline-flex items-center gap-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1.5 rounded-full text-sm">
                      {word}
                      <button onClick={() => deleteRemoveWord(word)} className="hover:text-white transition-colors ml-1"><Trash2 size={12} /></button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Blacklist Words */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-2"><ShieldAlert size={14}/> Blacklist Phrases</h3>
              <div className="bg-red-900/10 p-4 rounded-xl border border-red-500/20">
                <div className="flex gap-2 mb-4">
                  <input 
                    type="text"
                    value={newBlacklistPhrase}
                    onChange={(e) => setNewBlacklistPhrase(e.target.value)}
                    placeholder="Skip message if contains..."
                    className="flex-1 bg-slate-950 border border-red-900/40 rounded-lg px-4 py-2.5 text-sm focus:border-red-500 outline-none"
                    onKeyDown={(e) => e.key === 'Enter' && addBlacklistPhrase()}
                  />
                  <button onClick={addBlacklistPhrase} className="bg-red-900/40 hover:bg-red-800/40 text-red-200 px-4 rounded-lg transition-colors">Add</button>
                </div>
                <div className="flex flex-wrap gap-2 min-h-[80px]">
                  {config.blacklistPhrases.map(phrase => (
                    <span key={phrase} className="inline-flex items-center gap-1 bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1.5 rounded-full text-sm">
                      {phrase}
                      <button onClick={() => deleteBlacklistPhrase(phrase)} className="hover:text-white transition-colors ml-1"><Trash2 size={12} /></button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Toggles */}
            <div className="space-y-1 border-l border-slate-700/50 pl-0 lg:pl-6">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Basic Toggles</h3>
              <Toggle 
                label="Remove Links" 
                checked={config.captionRules.removeLinks} 
                onChange={(v) => updateConfig(prev => ({...prev, captionRules: {...prev.captionRules, removeLinks: v}}))} 
                description="Strips http/https/t.me"
              />
              <Toggle 
                label="Remove Usernames" 
                checked={config.captionRules.removeUsernames} 
                onChange={(v) => updateConfig(prev => ({...prev, captionRules: {...prev.captionRules, removeUsernames: v}}))} 
                description="Removes @mentions"
              />
              <Toggle 
                label="Remove Emojis" 
                checked={config.captionRules.removeEmojis} 
                onChange={(v) => updateConfig(prev => ({...prev, captionRules: {...prev.captionRules, removeEmojis: v}}))} 
                description="Cleans all unicode emojis"
              />
              <Toggle 
                label="Single Line Spacing" 
                checked={config.captionRules.singleLineSpace} 
                onChange={(v) => updateConfig(prev => ({...prev, captionRules: {...prev.captionRules, singleLineSpace: v}}))} 
                description="Collapses multiple empty lines"
              />
              <Toggle 
                label="Fix Extension" 
                checked={config.captionRules.fixExtension} 
                onChange={(v) => updateConfig(prev => ({...prev, captionRules: {...prev.captionRules, fixExtension: v}}))} 
                description="Ensures filename has correct ext"
              />
            </div>
          </div>
        </section>
      </main>
      
      {/* Watermark */}
      <div className="fixed bottom-4 right-6 z-50 pointer-events-none">
        <div className="glass-panel px-4 py-2 rounded-full flex items-center gap-2 shadow-lg border-telegram-primary/30">
           <div className="w-2 h-2 bg-telegram-accent rounded-full animate-pulse shadow-[0_0_8px_#00dcff]"></div>
           <span className="text-xs font-mono text-blue-200 font-bold tracking-wide drop-shadow-md">Telegram @SteveBotz</span>
        </div>
      </div>
    </div>
  );
};

export default App;