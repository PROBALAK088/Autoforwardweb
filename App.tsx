
import React, { useEffect, useState, useCallback, useRef } from 'react';
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
  LogOut,
  Terminal,
  Check,
  XCircle,
  Clock,
  Rocket
} from 'lucide-react';
import { Toggle } from './components/Toggle';
import { SectionHeader } from './components/SectionHeader';
import { BotConnection } from './components/BotConnection';
import { BotCommands } from './components/BotCommands';
import { AdvancedSettings } from './components/AdvancedSettings';
import { Auth } from './components/Auth';
import { saveConfigToDB, loadConfigFromDB, testDatabaseConnection, getCurrentUser, logoutUser } from './services/mongoService';
import { verifyBotAdmin, copyMessage, getMessage } from './services/telegramService';
import { processCaption } from './services/captionService';
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
  const [logs, setLogs] = useState<{msg: string, type: 'info'|'success'|'error'|'warn'}[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);
  
  // Ref to handle cancellation
  const abortRef = useRef<boolean>(false);

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setCurrentUser(user);
      // Pass User ID to load specific config
      loadConfigFromDB(user.telegramId).then((data) => {
        setConfig(data);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Auto-scroll logs
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setLoading(true);
    // Pass User ID to load specific config
    loadConfigFromDB(user.telegramId).then((data) => {
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
    if (!config || !currentUser) return;
    setLoading(true);
    // Pass User ID to save to specific slot
    await saveConfigToDB(config, currentUser.telegramId);
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

  const addLog = (msg: string, type: 'info'|'success'|'error'|'warn' = 'info') => {
    const time = new Date().toLocaleTimeString([], {hour12: false});
    setLogs(prev => [...prev, {msg: `[${time}] ${msg}`, type}].slice(-100));
  };

  const stopJob = () => {
    abortRef.current = true;
    addLog("🛑 Stopping forwarding job...", 'warn');
    setJob(prev => ({ ...prev, status: 'PAUSED' }));
  };

  const startForwarding = async () => {
    if (!config?.bot.isConnected || !job.sourceId || !job.destinationId) {
      alert("Please ensure Bot is connected and channels are selected.");
      return;
    }

    abortRef.current = false;
    setLogs([]);
    
    let startId = 1;
    let endId = job.lastMessageId;

    if (job.skipCount > 0) {
        startId = job.skipCount;
    } else if (job.skipCount < 0) {
        startId = Math.max(1, endId + job.skipCount);
    }

    const total = endId - startId + 1;
    if (total <= 0) {
        alert("Invalid range. Start ID is greater than End ID.");
        return;
    }

    setJob(prev => ({ ...prev, status: 'RUNNING', progress: 0, processedCount: 0, totalMessages: total }));
    addLog(`🚀 Starting job: ID ${startId} to ${endId} (${total} msgs)`, 'info');
    
    let processed = 0;
    let consecutiveErrors = 0;

    for (let msgId = startId; msgId <= endId; msgId++) {
        if (abortRef.current) {
          addLog("⛔ Job aborted by user.", 'error');
          break;
        }

        try {
          // 1. Get Original Message to process caption
          const originalMsg = await getMessage(job.sourceId, msgId, config.bot.token);
          
          // 2. Prepare Caption
          let finalCaption = undefined;
          if (originalMsg && (config.captionRules.template || config.captionRules.prefix || config.captionRules.suffix || config.captionRules.replacements.length > 0)) {
             // Extract basic file info if available
             let filename = "";
             let filesize = 0;
             
             if (originalMsg.video) { filename = originalMsg.video.file_name || "video"; filesize = originalMsg.video.file_size || 0; }
             else if (originalMsg.document) { filename = originalMsg.document.file_name || "doc"; filesize = originalMsg.document.file_size || 0; }
             else if (originalMsg.audio) { filename = originalMsg.audio.file_name || "audio"; filesize = originalMsg.audio.file_size || 0; }

             // Process Caption
             finalCaption = processCaption(originalMsg.caption || originalMsg.text || "", filename, filesize, config.captionRules);
          }

          // 3. Copy Message
          const result = await copyMessage(
            job.destinationId, 
            job.sourceId, 
            msgId, 
            config.bot.token,
            finalCaption
          );
          
          if (result.success) {
            addLog(`✅ Copied message ${msgId}`, 'success');
            consecutiveErrors = 0;
          } else if (result.retryAfter) {
            addLog(`⏳ Rate limit hit! Sleeping for ${result.retryAfter}s...`, 'warn');
            await new Promise(r => setTimeout(r, (result.retryAfter! * 1000) + 100));
            msgId--; // Retry
            continue; 
          } else {
            // Smart Error Handling
            const errorLower = result.error?.toLowerCase() || "";
            
            // If message not found or empty, it's safe to skip
            if (errorLower.includes('message to copy not found') || errorLower.includes('message is empty') || result.errorCode === 400) {
               addLog(`⏩ Skipped ${msgId} (Not found/Empty)`, 'info');
               consecutiveErrors = 0; 
            } else {
               addLog(`⚠️ Error on ${msgId}: ${result.error}`, 'error');
               consecutiveErrors++;
            }
          }
        } catch (e) {
          addLog(`❌ System Exception on ${msgId}`, 'error');
          consecutiveErrors++;
        }

        // Safety break if too many REAL errors
        if (consecutiveErrors > 20) {
          addLog("⚠️ Too many connection errors. Pausing job to protect bot.", 'error');
          abortRef.current = true;
          break;
        }

        processed++;
        const progress = Math.floor((processed / total) * 100);
        
        setJob(prev => ({
          ...prev,
          progress,
          processedCount: processed
        }));

        // Dynamic delay
        await new Promise(r => setTimeout(r, 80)); 
    }

    setJob(prev => ({ ...prev, status: abortRef.current ? 'PAUSED' : 'COMPLETED' }));
    if (!abortRef.current) addLog("🏁 Job Completed Successfully.", 'success');
  };

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

  if (!currentUser) {
    return (
      <>
        <Auth onLogin={handleLogin} />
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
      <nav className="glass-panel border-b border-white/5 sticky top-0 z-50 px-6 py-3 flex justify-between items-center shadow-lg mb-6 backdrop-blur-xl">
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
            <BotConnection 
              config={config.bot} 
              onUpdate={(newBotConfig) => updateConfig(prev => ({ ...prev, bot: newBotConfig }))}
            />

            <section className="relative overflow-hidden rounded-2xl p-0.5 bg-gradient-to-br from-blue-500/30 to-purple-500/30 shadow-2xl">
              <div className="bg-telegram-surface/95 p-6 rounded-2xl backdrop-blur-md relative z-10 h-full">
                <div className="flex justify-between items-start mb-6">
                  <SectionHeader title="Forwarding Engine" icon={Zap} description="High-performance bulk forwarding." />
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

                {(job.status === 'RUNNING' || job.status === 'PAUSED' || job.status === 'COMPLETED') && (
                  <div className="bg-slate-900/80 rounded-xl p-6 border border-slate-700/50 space-y-4 shadow-inner">
                    <div className="flex justify-between items-end mb-2">
                      <div className="flex flex-col">
                        <span className={`font-bold text-lg flex items-center gap-2 ${job.status === 'RUNNING' ? 'text-telegram-accent animate-pulse' : job.status === 'COMPLETED' ? 'text-green-400' : 'text-yellow-400'}`}>
                          {job.status === 'RUNNING' && <><Activity size={16}/> Processing...</>}
                          {job.status === 'COMPLETED' && <><Check size={16}/> Completed</>}
                          {job.status === 'PAUSED' && <><Clock size={16}/> Stopped</>}
                        </span>
                        <span className="text-xs text-slate-500">Processed {job.processedCount} of {job.totalMessages} messages</span>
                      </div>
                      <span className="text-2xl font-mono font-bold text-white tracking-tighter">{job.progress}%</span>
                    </div>
                    
                    <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div 
                        className={`h-full transition-all duration-300 ${job.status === 'COMPLETED' ? 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)]' : 'bg-gradient-to-r from-telegram-primary to-purple-500 shadow-[0_0_15px_rgba(51,144,236,0.5)]'}`} 
                        style={{width: `${job.progress}%`}}
                      ></div>
                    </div>

                    {/* MATRIX LOG CONSOLE */}
                    <div className="bg-black rounded-lg border border-slate-800 p-4 h-48 overflow-y-auto custom-scrollbar font-mono text-xs shadow-inner">
                       {logs.length === 0 && <span className="text-slate-700 italic">Initializing forwarder sequence...</span>}
                       {logs.map((log, i) => (
                         <div key={i} className={`pb-1 flex items-start gap-2 ${
                           log.type === 'error' ? 'text-red-400' : 
                           log.type === 'warn' ? 'text-yellow-400' : 
                           log.type === 'success' ? 'text-green-400' : 'text-slate-400'
                         }`}>
                           <span className="opacity-50 min-w-[60px]">{log.msg.split(']')[0]}]</span>
                           <span>{log.msg.split(']')[1]}</span>
                         </div>
                       ))}
                       <div ref={logsEndRef} />
                    </div>

                    <div className="flex justify-end">
                       <button 
                         onClick={stopJob}
                         className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-4 py-2 rounded-lg border border-red-500/30 flex items-center gap-2 transition-all"
                       >
                         <XCircle size={18} /> Stop Operation
                       </button>
                    </div>
                  </div>
                )}

                {/* JOB WIZARD */}
                {showJobWizard && (
                  <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50 animate-fade-in">
                     <div className="flex items-center gap-2 mb-6 text-telegram-primary">
                        <span className="bg-telegram-primary/20 w-8 h-8 rounded-full flex items-center justify-center font-bold border border-telegram-primary/30">{wizardStep}</span>
                        <h3 className="text-lg font-bold text-white">
                          {wizardStep === 1 && "Select Channels"}
                          {wizardStep === 2 && "Configure Range"}
                          {wizardStep === 3 && "Review & Start"}
                        </h3>
                     </div>

                     {wizardStep === 1 && (
                       <div className="space-y-4">
                          <div className="grid md:grid-cols-2 gap-4">
                             <div>
                                <label className="block text-sm text-slate-400 mb-2">Source Channel</label>
                                <select 
                                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 outline-none focus:border-telegram-primary"
                                  value={job.sourceId}
                                  onChange={e => setJob({...job, sourceId: e.target.value})}
                                >
                                  <option value="">Select Source...</option>
                                  {config.channels.filter(c => c.type === ChannelType.SOURCE).map(c => (
                                    <option key={c.id} value={c.id}>{c.name} ({c.id})</option>
                                  ))}
                                </select>
                             </div>
                             <div>
                                <label className="block text-sm text-slate-400 mb-2">Target Channel</label>
                                <select 
                                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 outline-none focus:border-telegram-primary"
                                  value={job.destinationId}
                                  onChange={e => setJob({...job, destinationId: e.target.value})}
                                >
                                  <option value="">Select Target...</option>
                                  {config.channels.filter(c => c.type === ChannelType.DESTINATION).map(c => (
                                    <option key={c.id} value={c.id}>{c.name} ({c.id})</option>
                                  ))}
                                </select>
                             </div>
                          </div>
                          <div className="flex justify-end gap-3 mt-4">
                             <button onClick={() => setShowJobWizard(false)} className="px-4 py-2 text-slate-400 hover:text-white">Cancel</button>
                             <button 
                               disabled={!job.sourceId || !job.destinationId}
                               onClick={() => setWizardStep(2)}
                               className="bg-telegram-primary text-white px-6 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                             >
                               Next
                             </button>
                          </div>
                       </div>
                     )}

                     {wizardStep === 2 && (
                       <div className="space-y-4">
                          <div>
                             <label className="block text-sm text-slate-400 mb-2">Last Message ID in Source</label>
                             <input 
                               type="number" 
                               value={job.lastMessageId}
                               onChange={e => setJob({...job, lastMessageId: parseInt(e.target.value) || 0})}
                               className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3"
                               placeholder="e.g. 1050"
                             />
                             <p className="text-xs text-slate-500 mt-1">Go to source channel, right click latest post {'>'} Copy Link {'>'} Last number is ID</p>
                          </div>

                          <div>
                             <label className="block text-sm text-slate-400 mb-2">Skip Messages</label>
                             <div className="flex gap-2 mb-2">
                                <button onClick={() => setJob({...job, skipCount: 100})} className="bg-slate-700 px-3 py-1 rounded text-xs">+100 Start</button>
                                <button onClick={() => setJob({...job, skipCount: -100})} className="bg-slate-700 px-3 py-1 rounded text-xs">-100 End</button>
                             </div>
                             <input 
                               type="number" 
                               value={job.skipCount}
                               onChange={e => setJob({...job, skipCount: parseInt(e.target.value) || 0})}
                               className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3"
                             />
                             <p className="text-xs text-slate-500 mt-1">Positive: Start from ID X. Negative: Skip last X messages.</p>
                          </div>

                          <div className="flex justify-end gap-3 mt-4">
                             <button onClick={() => setWizardStep(1)} className="px-4 py-2 text-slate-400 hover:text-white">Back</button>
                             <button 
                               disabled={job.lastMessageId <= 0}
                               onClick={() => setWizardStep(3)}
                               className="bg-telegram-primary text-white px-6 py-2 rounded-lg disabled:opacity-50"
                             >
                               Next
                             </button>
                          </div>
                       </div>
                     )}

                     {wizardStep === 3 && (
                       <div className="space-y-4 text-center py-4">
                          <div className="mx-auto w-16 h-16 bg-telegram-primary/10 rounded-full flex items-center justify-center mb-4">
                             <Rocket size={32} className="text-telegram-primary" />
                          </div>
                          <h4 className="text-xl font-bold text-white">Ready to Launch</h4>
                          <p className="text-slate-400 max-w-md mx-auto">
                            Will forward approximately <b>{job.lastMessageId - (job.skipCount > 0 ? job.skipCount : 1)}</b> messages from source to destination.
                          </p>
                          
                          <div className="flex justify-center gap-3 mt-6">
                             <button onClick={() => setWizardStep(2)} className="px-4 py-2 text-slate-400 hover:text-white">Back</button>
                             <button 
                               onClick={() => {
                                 setShowJobWizard(false);
                                 startForwarding();
                               }}
                               className="bg-green-600 hover:bg-green-500 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-green-500/20 transition-transform active:scale-95 flex items-center gap-2"
                             >
                               <Play size={20} fill="currentColor" /> Start Forwarding
                             </button>
                          </div>
                       </div>
                     )}
                  </div>
                )}

              </div>
            </section>
            
            <div className="mt-8">
               <AdvancedSettings 
                 config={config.captionRules} 
                 onChange={(newRules) => updateConfig(prev => ({ ...prev, captionRules: newRules }))} 
               />
            </div>

          </div>

          {/* RIGHT COLUMN: SETTINGS */}
          <div className="space-y-6">
            
            {/* CHANNELS CARD */}
            <div className="glass-panel p-6 rounded-xl shadow-lg">
              <SectionHeader title="Connected Channels" icon={Link2} />
              <div className="space-y-4 mb-6">
                {config.channels.length === 0 && (
                  <div className="text-center py-8 border-2 border-dashed border-slate-700 rounded-xl">
                     <p className="text-slate-500">No channels connected</p>
                  </div>
                )}
                {config.channels.map(channel => (
                  <div key={channel.id} className="bg-slate-900/50 p-3 rounded-lg flex items-center justify-between group border border-slate-800/50 hover:border-slate-700 transition-colors">
                    <div>
                      <p className="font-medium text-sm text-slate-200">{channel.name}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 font-mono">{channel.id}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                          channel.type === ChannelType.SOURCE 
                            ? 'border-blue-500/30 text-blue-400 bg-blue-500/10' 
                            : 'border-purple-500/30 text-purple-400 bg-purple-500/10'
                        }`}>
                          {channel.type}
                        </span>
                      </div>
                    </div>
                    <button onClick={() => removeChannel(channel.id)} className="text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 p-2">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
                 <label className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-3 block">Connect New Channel</label>
                 <div className="space-y-3">
                    <input
                      type="text"
                      value={newChannelId}
                      onChange={e => setNewChannelId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm font-mono placeholder-slate-600 focus:border-telegram-primary outline-none"
                      placeholder="-100..."
                    />
                    <div className="flex gap-2">
                       <select
                         value={newChannelType}
                         onChange={e => setNewChannelType(e.target.value as ChannelType)}
                         className="bg-slate-950 border border-slate-700 rounded px-2 text-sm text-slate-300 outline-none"
                       >
                         <option value={ChannelType.SOURCE}>Source</option>
                         <option value={ChannelType.DESTINATION}>Target</option>
                       </select>
                       <button 
                         onClick={addChannel}
                         disabled={!newChannelId || verifyingChannel}
                         className="flex-1 bg-telegram-surface hover:bg-slate-700 border border-slate-600 text-white py-2 rounded text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                       >
                         {verifyingChannel ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Plus size={16} />}
                         Add
                       </button>
                    </div>
                 </div>
              </div>
            </div>
            
            <BotCommands />

            {/* BLACKLIST CARD */}
            <div className="glass-panel p-6 rounded-xl shadow-lg">
               <SectionHeader title="Blacklist" icon={ShieldAlert} description="Skip files containing these words." />
               <div className="flex gap-2 mb-4">
                 <input 
                    type="text"
                    value={newBlacklistPhrase}
                    onChange={e => setNewBlacklistPhrase(e.target.value)}
                    className="flex-1 bg-slate-900/80 border border-slate-700 rounded px-3 py-2 text-sm placeholder-slate-600 outline-none focus:border-red-500"
                    placeholder="e.g. casino"
                    onKeyDown={e => e.key === 'Enter' && addBlacklistPhrase()}
                 />
                 <button onClick={addBlacklistPhrase} className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-2 rounded border border-slate-600">
                    <Plus size={18} />
                 </button>
               </div>
               <div className="flex flex-wrap gap-2">
                  {config.blacklistPhrases.map(phrase => (
                    <span key={phrase} className="bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1 rounded-full text-xs flex items-center gap-1 group cursor-default">
                       {phrase}
                       <button onClick={() => deleteBlacklistPhrase(phrase)} className="text-red-500/50 group-hover:text-red-500"><Trash2 size={12}/></button>
                    </span>
                  ))}
                  {config.blacklistPhrases.length === 0 && <span className="text-slate-600 text-xs italic">No blacklist phrases active.</span>}
               </div>
            </div>

            {/* REMOVE WORDS CARD */}
            <div className="glass-panel p-6 rounded-xl shadow-lg">
               <SectionHeader title="Remove Words" icon={Scissors} description="Strip these words from captions." />
               <div className="flex gap-2 mb-4">
                 <input 
                    type="text"
                    value={newWord}
                    onChange={e => setNewWord(e.target.value)}
                    className="flex-1 bg-slate-900/80 border border-slate-700 rounded px-3 py-2 text-sm placeholder-slate-600 outline-none focus:border-yellow-500"
                    placeholder="e.g. Join Now"
                    onKeyDown={e => e.key === 'Enter' && addRemoveWord()}
                 />
                 <button onClick={addRemoveWord} className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-2 rounded border border-slate-600">
                    <Plus size={18} />
                 </button>
               </div>
               <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto custom-scrollbar">
                  {config.captionRules.removeWords.map(word => (
                    <span key={word} className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-3 py-1 rounded-full text-xs flex items-center gap-1 group cursor-default">
                       {word}
                       <button onClick={() => deleteRemoveWord(word)} className="text-yellow-500/50 group-hover:text-yellow-500"><Trash2 size={12}/></button>
                    </span>
                  ))}
               </div>
            </div>

            {/* TOGGLES CARD */}
            <div className="glass-panel p-6 rounded-xl shadow-lg">
               <SectionHeader title="Global Filters" icon={Settings} />
               <div className="space-y-0.5">
                  <Toggle 
                    label="Remove Links" 
                    checked={config.captionRules.removeLinks} 
                    onChange={v => updateConfig(prev => ({...prev, captionRules: {...prev.captionRules, removeLinks: v}}))}
                  />
                  <Toggle 
                    label="Remove Usernames" 
                    checked={config.captionRules.removeUsernames} 
                    onChange={v => updateConfig(prev => ({...prev, captionRules: {...prev.captionRules, removeUsernames: v}}))}
                  />
                  <Toggle 
                    label="Remove Emojis" 
                    checked={config.captionRules.removeEmojis} 
                    onChange={v => updateConfig(prev => ({...prev, captionRules: {...prev.captionRules, removeEmojis: v}}))}
                  />
                  <Toggle 
                    label="Single Line Spacing" 
                    checked={config.captionRules.singleLineSpace} 
                    onChange={v => updateConfig(prev => ({...prev, captionRules: {...prev.captionRules, singleLineSpace: v}}))}
                  />
                  <Toggle 
                    label="Fix Extensions" 
                    checked={config.captionRules.fixExtension} 
                    description="Ensure video files have extensions"
                    onChange={v => updateConfig(prev => ({...prev, captionRules: {...prev.captionRules, fixExtension: v}}))}
                  />
               </div>
            </div>

            {/* SIZE LIMITS */}
            <div className="glass-panel p-6 rounded-xl shadow-lg">
               <SectionHeader title="Size Limits" icon={HardDrive} description="Skip files outside range (MB)" />
               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Min (MB)</label>
                    <input 
                      type="number"
                      value={config.sizeLimits.min}
                      onChange={e => updateConfig(prev => ({...prev, sizeLimits: {...prev.sizeLimits, min: parseInt(e.target.value) || 0}}))}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-center"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Max (MB)</label>
                    <input 
                      type="number"
                      value={config.sizeLimits.max}
                      onChange={e => updateConfig(prev => ({...prev, sizeLimits: {...prev.sizeLimits, max: parseInt(e.target.value) || 0}}))}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-center"
                    />
                  </div>
               </div>
            </div>

          </div>
        </div>
      </main>

      {/* WATERMARK */}
      <div className="fixed bottom-6 right-6 z-50 pointer-events-none select-none opacity-50 hover:opacity-100 transition-opacity">
         <div className="glass-panel px-4 py-2 rounded-full flex items-center gap-2 shadow-lg">
            <div className="w-2 h-2 bg-telegram-accent rounded-full animate-pulse"></div>
            <span className="text-xs font-mono text-slate-300 font-bold">Telegram @SteveBotz</span>
         </div>
      </div>

    </div>
  );
};

export default App;
