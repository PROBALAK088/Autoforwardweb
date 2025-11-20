
import React from 'react';
import { Terminal, Command } from 'lucide-react';

export const BotCommands: React.FC = () => {
  const commands = [
    { cmd: '/start', desc: 'Start the bot and check status' },
    { cmd: '/set_cap', desc: 'Set custom caption template' },
    { cmd: '/del_cap', desc: 'Delete custom caption' },
    { cmd: '/set_buttons', desc: 'Configure inline buttons' },
    { cmd: '/batch_edit', desc: 'Start bulk editing messages' },
    { cmd: '/stop_batch_edit', desc: 'Stop current bulk operation' },
    { cmd: '/set_prefix', desc: 'Set message prefix text' },
    { cmd: '/set_suffix', desc: 'Set message suffix text' },
    { cmd: '/remove_words', desc: 'Add words to removal list' },
    { cmd: '/blacklist_words', desc: 'Add phrases to blacklist' },
  ];

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden">
      <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center gap-2">
        <Terminal size={16} className="text-green-400" />
        <span className="text-sm font-mono font-bold text-slate-300">Bot Command Reference</span>
      </div>
      <div className="p-4 max-h-60 overflow-y-auto custom-scrollbar">
        <div className="grid gap-2">
          {commands.map((item, idx) => (
            <div key={idx} className="flex items-start gap-3 p-2 hover:bg-slate-800/50 rounded transition-colors">
              <code className="text-xs font-bold text-blue-400 bg-blue-900/20 px-2 py-1 rounded min-w-[120px]">
                {item.cmd}
              </code>
              <span className="text-sm text-slate-400">{item.desc}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-slate-950 px-4 py-2 border-t border-slate-800 text-[10px] text-slate-500 text-center">
        Send these commands directly to your bot in Telegram
      </div>
    </div>
  );
};
