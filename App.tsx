
import React, { useState, useEffect } from 'react';
import { Search, Film, History, Trash2, Loader2, ExternalLink, Sparkles } from 'lucide-react';
import { fetchPosterData, detectPlatform } from './services/ottService';
import { PosterResult } from './components/PosterResult';
import { OttData, HistoryItem } from './types';

const App: React.FC = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OttData | null>(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('ott_history');
    if (saved) {
      setHistory(JSON.parse(saved));
    }
  }, []);

  const addToHistory = (data: OttData, originalUrl: string) => {
    const newItem: HistoryItem = {
      ...data,
      id: Date.now().toString(),
      timestamp: Date.now(),
      originalUrl
    };
    const newHistory = [newItem, ...history].slice(0, 10); // Keep last 10
    setHistory(newHistory);
    localStorage.setItem('ott_history', JSON.stringify(newHistory));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('ott_history');
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError('');
    setResult(null);

    const res = await fetchPosterData(url);

    if ('error' in res && res.error) {
      setError(res.message);
    } else {
      setResult(res as OttData);
      addToHistory(res as OttData, url);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen pb-20 relative z-10">
      
      {/* Header */}
      <header className="glass-panel border-b border-white/5 sticky top-0 z-50 px-6 py-4 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-telegram-primary to-cyan-400 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Film className="text-white" size={20} />
            </div>
            <h1 className="font-bold text-xl text-white tracking-tight">
              OTT <span className="text-telegram-accent font-light">Poster Extractor</span>
            </h1>
          </div>
          <div className="text-xs text-slate-400 font-mono hidden sm:block">
            Powered by Hgbotz API
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6 space-y-10">
        
        {/* Search Section */}
        <section className="text-center space-y-6 mt-8">
          <h2 className="text-3xl md:text-5xl font-bold text-white">
            Extract High-Quality <br/>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-telegram-primary to-cyan-400">
              Movie & Series Posters
            </span>
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">
            Paste a link from supported platforms (SunNext, Zee5, Prime, Airtel, Hulu, etc.) to get JSON metadata and HD posters instantly.
          </p>
          
          <form onSubmit={handleSearch} className="max-w-3xl mx-auto relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-telegram-primary to-cyan-400 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-200"></div>
            <div className="relative flex bg-slate-900 rounded-xl overflow-hidden shadow-2xl border border-white/10">
              <div className="pl-4 flex items-center justify-center text-slate-500">
                <Sparkles size={20} />
              </div>
              <input 
                type="text" 
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste OTT Link here (e.g., https://www.zee5.com/movies/...)"
                className="flex-1 bg-transparent text-white px-4 py-5 outline-none placeholder-slate-600"
              />
              <button 
                type="submit"
                disabled={loading || !url}
                className="bg-white text-black px-8 font-bold hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" /> : <Search size={20} />}
                <span className="hidden sm:inline">Extract</span>
              </button>
            </div>
          </form>
          
          <div className="flex justify-center gap-4 text-xs text-slate-500 flex-wrap">
             <span>Supported:</span>
             <span className="px-2 py-1 bg-white/5 rounded border border-white/5">Zee5</span>
             <span className="px-2 py-1 bg-white/5 rounded border border-white/5">Prime Video</span>
             <span className="px-2 py-1 bg-white/5 rounded border border-white/5">Airtel Xstream</span>
             <span className="px-2 py-1 bg-white/5 rounded border border-white/5">SunNXT</span>
             <span className="px-2 py-1 bg-white/5 rounded border border-white/5">Hulu</span>
             <span>& more</span>
          </div>
        </section>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-center animate-fade-in">
            {error}
          </div>
        )}

        {/* Result Display */}
        {result && <PosterResult data={result} />}

        {/* History Section */}
        {history.length > 0 && (
          <section className="pt-10 border-t border-white/5">
            <div className="flex items-center justify-between mb-6">
               <div className="flex items-center gap-2 text-slate-300">
                 <History size={20} />
                 <h3 className="text-xl font-bold">Recent extractions</h3>
               </div>
               <button onClick={clearHistory} className="text-slate-500 hover:text-red-400 flex items-center gap-1 text-sm transition-colors">
                 <Trash2 size={14} /> Clear History
               </button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
               {history.map(item => (
                 <div key={item.id} className="group relative bg-slate-900/50 rounded-lg overflow-hidden border border-white/5 hover:border-telegram-primary/50 transition-all">
                    <img src={item.poster} alt={item.title} className="w-full aspect-[2/3] object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent p-3 flex flex-col justify-end">
                       <p className="text-white font-bold text-sm truncate">{item.title}</p>
                       <p className="text-slate-400 text-xs">{item.ott}</p>
                    </div>
                    <button 
                      onClick={() => { setUrl(item.originalUrl); handleSearch(); }}
                      className="absolute top-2 right-2 bg-telegram-primary text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all shadow-lg"
                      title="Re-extract"
                    >
                      <ExternalLink size={12} />
                    </button>
                 </div>
               ))}
            </div>
          </section>
        )}

      </main>

      {/* Footer/Watermark */}
      <div className="fixed bottom-4 right-4 z-50 pointer-events-none opacity-60">
         <div className="glass-panel px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-[10px] font-mono text-slate-300">API: Hgbotz</span>
         </div>
      </div>

    </div>
  );
};

export default App;
