import React, { useState } from 'react';
import { AppConfig, CaptionRules } from '../types';
import { SectionHeader } from './SectionHeader';
import { FileCode, List, Plus, Trash2, RefreshCw, Type, Shield, Tag, Link2, LayoutTemplate } from 'lucide-react';

interface AdvancedSettingsProps {
  config: CaptionRules;
  onChange: (newRules: CaptionRules) => void;
}

const PLACEHOLDERS = [
  "{file_name}", "{file_size}", "{default_caption}", "{title}", "{language}", 
  "{quality}", "{year}", "{duration}", "{season}", "{episode}", "{ott}", 
  "{audio}", "{lib}", "{extension}", "{resolution}", "{fps}", "{bitrate}"
];

export const AdvancedSettings: React.FC<AdvancedSettingsProps> = ({ config, onChange }) => {
  const [newReplacement, setNewReplacement] = useState({ from: '', to: '' });
  const [newLang, setNewLang] = useState('');
  const [newQuality, setNewQuality] = useState('');
  const [newProtected, setNewProtected] = useState('');
  const [activeTab, setActiveTab] = useState<'template' | 'metadata' | 'replacements' | 'decorations'>('template');

  const addReplacement = () => {
    if (newReplacement.from) {
      onChange({
        ...config,
        replacements: [...config.replacements, newReplacement]
      });
      setNewReplacement({ from: '', to: '' });
    }
  };

  const removeReplacement = (index: number) => {
    onChange({
      ...config,
      replacements: config.replacements.filter((_, i) => i !== index)
    });
  };

  const addToList = (listKey: keyof CaptionRules, value: string, setter: (s: string) => void) => {
    if (value && Array.isArray(config[listKey])) {
      onChange({
        ...config,
        [listKey]: [...(config[listKey] as string[]), value]
      });
      setter('');
    }
  };

  const removeFromList = (listKey: keyof CaptionRules, value: string) => {
    if (Array.isArray(config[listKey])) {
      onChange({
        ...config,
        [listKey]: (config[listKey] as string[]).filter(i => i !== value)
      });
    }
  };

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 shadow-xl overflow-hidden">
      <div className="flex border-b border-slate-700 bg-slate-800/80">
        {[
          { id: 'template', icon: LayoutTemplate, label: 'Template' },
          { id: 'replacements', icon: RefreshCw, label: 'Replacements' },
          { id: 'metadata', icon: Tag, label: 'Metadata & Lists' },
          { id: 'decorations', icon: Link2, label: 'Buttons & Extra' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-4 flex items-center justify-center gap-2 text-sm font-medium transition-colors ${
              activeTab === tab.id 
                ? 'bg-telegram-surface text-telegram-primary border-b-2 border-telegram-primary' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <tab.icon size={16} />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="p-6 bg-telegram-surface">
        
        {/* TEMPLATE TAB */}
        {activeTab === 'template' && (
          <div className="space-y-6">
            <div>
              <SectionHeader title="Caption Template" icon={FileCode} description="Design how your messages will look." />
              <textarea
                value={config.template}
                onChange={(e) => onChange({ ...config, template: e.target.value })}
                className="w-full h-40 bg-slate-900 border border-slate-600 rounded-lg p-4 font-mono text-sm text-slate-200 focus:border-telegram-primary focus:ring-1 focus:ring-telegram-primary outline-none"
                placeholder="Enter your caption template..."
              />
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-slate-400 mb-3">Available Placeholders (Click to copy)</h4>
              <div className="flex flex-wrap gap-2">
                {PLACEHOLDERS.map(ph => (
                  <button
                    key={ph}
                    onClick={() => {
                      navigator.clipboard.writeText(ph);
                      // Optionally flash a toast here
                    }}
                    className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs font-mono text-blue-300 hover:bg-blue-500/20 hover:border-blue-400 transition-colors"
                  >
                    {ph}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* REPLACEMENTS TAB */}
        {activeTab === 'replacements' && (
          <div className="space-y-8">
            {/* Word Replacements */}
            <div>
              <SectionHeader title="Word Replacements" icon={RefreshCw} description="Automatically replace specific text in captions." />
              
              <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 mb-4">
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <label className="text-xs text-slate-500 mb-1 block">Original Word (Regex supported)</label>
                    <input
                      value={newReplacement.from}
                      onChange={e => setNewReplacement({...newReplacement, from: e.target.value})}
                      className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm"
                      placeholder="e.g. mkvCinemas"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-slate-500 mb-1 block">Replace With</label>
                    <input
                      value={newReplacement.to}
                      onChange={e => setNewReplacement({...newReplacement, to: e.target.value})}
                      className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm"
                      placeholder="e.g. MyChannel"
                    />
                  </div>
                  <button onClick={addReplacement} className="bg-blue-600 text-white p-2 rounded hover:bg-blue-500 h-[38px] w-[38px] flex items-center justify-center">
                    <Plus size={20} />
                  </button>
                </div>
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {config.replacements.length === 0 && <p className="text-center text-slate-500 py-4">No replacement rules set.</p>}
                {config.replacements.map((rule, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-slate-800 px-4 py-2 rounded border border-slate-700/50">
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-red-300 font-mono bg-red-500/10 px-2 py-0.5 rounded">{rule.from}</span>
                      <span className="text-slate-500">➜</span>
                      <span className="text-green-300 font-mono bg-green-500/10 px-2 py-0.5 rounded">{rule.to}</span>
                    </div>
                    <button onClick={() => removeReplacement(idx)} className="text-slate-500 hover:text-red-400">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Symbol Handling */}
            <div className="grid md:grid-cols-2 gap-6 pt-4 border-t border-slate-700">
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">Symbols to Remove</label>
                <input
                  value={config.symbolsToRemove}
                  onChange={e => onChange({...config, symbolsToRemove: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm font-mono tracking-widest"
                  placeholder="@#%^&*"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">Replace with Space</label>
                <input
                  value={config.symbolsToReplace}
                  onChange={e => onChange({...config, symbolsToReplace: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm font-mono tracking-widest"
                  placeholder="._-"
                />
              </div>
            </div>
          </div>
        )}

        {/* METADATA TAB */}
        {activeTab === 'metadata' && (
          <div className="space-y-8">
            {/* Languages */}
            <div>
              <SectionHeader title="Languages" icon={List} description="Languages to detect and tag in captions." />
              <div className="flex gap-2 mb-3">
                <input
                  value={newLang}
                  onChange={e => setNewLang(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm"
                  placeholder="e.g. Spanish"
                  onKeyDown={e => e.key === 'Enter' && addToList('customLanguages', newLang, setNewLang)}
                />
                <button onClick={() => addToList('customLanguages', newLang, setNewLang)} className="bg-slate-700 hover:bg-slate-600 text-white px-4 rounded">Add</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {config.customLanguages.map(lang => (
                  <span key={lang} className="bg-blue-500/10 text-blue-300 border border-blue-500/20 px-3 py-1 rounded-full text-xs flex items-center gap-1">
                    {lang} <button onClick={() => removeFromList('customLanguages', lang)}><Trash2 size={12} /></button>
                  </span>
                ))}
              </div>
            </div>

            {/* Qualities */}
            <div>
              <SectionHeader title="Qualities" icon={Tag} description="Quality tags to detect (e.g. 1080p)." />
              <div className="flex gap-2 mb-3">
                <input
                  value={newQuality}
                  onChange={e => setNewQuality(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm"
                  placeholder="e.g. 4K HDR"
                  onKeyDown={e => e.key === 'Enter' && addToList('customQualities', newQuality, setNewQuality)}
                />
                <button onClick={() => addToList('customQualities', newQuality, setNewQuality)} className="bg-slate-700 hover:bg-slate-600 text-white px-4 rounded">Add</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {config.customQualities.map(q => (
                  <span key={q} className="bg-purple-500/10 text-purple-300 border border-purple-500/20 px-3 py-1 rounded-full text-xs flex items-center gap-1">
                    {q} <button onClick={() => removeFromList('customQualities', q)}><Trash2 size={12} /></button>
                  </span>
                ))}
              </div>
            </div>

            {/* Protected Words */}
            <div>
              <SectionHeader title="Protected Words" icon={Shield} description="Words to ignore when removing symbols/cleaning." />
              <div className="flex gap-2 mb-3">
                <input
                  value={newProtected}
                  onChange={e => setNewProtected(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm"
                  placeholder="e.g. S01E01"
                  onKeyDown={e => e.key === 'Enter' && addToList('protectedWords', newProtected, setNewProtected)}
                />
                <button onClick={() => addToList('protectedWords', newProtected, setNewProtected)} className="bg-slate-700 hover:bg-slate-600 text-white px-4 rounded">Add</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {config.protectedWords.map(w => (
                  <span key={w} className="bg-green-500/10 text-green-300 border border-green-500/20 px-3 py-1 rounded-full text-xs flex items-center gap-1">
                    {w} <button onClick={() => removeFromList('protectedWords', w)}><Trash2 size={12} /></button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* DECORATIONS TAB */}
        {activeTab === 'decorations' && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Prefix (Top of message)</label>
                <textarea
                  value={config.prefix}
                  onChange={e => onChange({...config, prefix: e.target.value})}
                  className="w-full h-24 bg-slate-900 border border-slate-600 rounded p-3 text-sm"
                  placeholder="Text to add at the start..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Suffix (Bottom of message)</label>
                <textarea
                  value={config.suffix}
                  onChange={e => onChange({...config, suffix: e.target.value})}
                  className="w-full h-24 bg-slate-900 border border-slate-600 rounded p-3 text-sm"
                  placeholder="Text to add at the end..."
                />
              </div>
            </div>

            <div>
              <SectionHeader title="Button Editor" icon={Link2} description="Configure inline buttons. Format: [Text](buttonurl:link)" />
              <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
                <textarea
                  value={config.buttons}
                  onChange={e => onChange({...config, buttons: e.target.value})}
                  className="w-full h-32 bg-slate-950 border border-slate-800 rounded p-3 font-mono text-sm text-blue-300"
                  placeholder={"[Channel](buttonurl:https://t.me/mychannel) | [Site](buttonurl:https://mysite.com)\n[Support](buttonurl:https://t.me/support)"}
                />
                <p className="text-xs text-slate-500 mt-2">
                  Use <code>|</code> separator for buttons on the same row. New line for new row.
                </p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};