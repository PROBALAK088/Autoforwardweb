
import React from 'react';
import { OttData } from '../types';
import { Copy, Download, ExternalLink, Image as ImageIcon } from 'lucide-react';

interface PosterResultProps {
  data: OttData;
}

export const PosterResult: React.FC<PosterResultProps> = ({ data }) => {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Simple visual feedback could be added here
  };

  const jsonOutput = JSON.stringify(data, null, 2);

  return (
    <div className="glass-panel rounded-2xl overflow-hidden animate-fade-in flex flex-col md:flex-row">
      {/* Image Section */}
      <div className="md:w-1/2 bg-black/50 relative group min-h-[300px] flex items-center justify-center p-4">
        {data.poster ? (
          <img 
            src={data.poster} 
            alt={data.title} 
            className="max-h-[500px] w-full object-contain rounded-lg shadow-2xl"
          />
        ) : (
          <div className="flex flex-col items-center text-slate-500">
            <ImageIcon size={48} />
            <span>No Image Available</span>
          </div>
        )}
        
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
           <a 
             href={data.poster} 
             target="_blank" 
             rel="noreferrer"
             className="bg-white text-black px-4 py-2 rounded-full font-bold flex items-center gap-2 hover:bg-blue-50 transition-colors"
           >
             <ExternalLink size={16} /> View Full
           </a>
        </div>
      </div>

      {/* Details Section */}
      <div className="md:w-1/2 p-6 md:p-8 flex flex-col">
        <div className="mb-6">
           <div className="flex items-center gap-2 mb-2">
              <span className="bg-telegram-primary/20 text-telegram-primary px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">
                {data.ott || 'OTT'}
              </span>
              {data.year && (
                <span className="bg-slate-700/50 text-slate-300 px-2 py-1 rounded text-xs font-bold">
                  {data.year}
                </span>
              )}
           </div>
           <h2 className="text-3xl font-bold text-white mb-2">{data.title}</h2>
        </div>

        <div className="flex-1">
           <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium text-slate-400">JSON Response</h3>
              <button 
                onClick={() => copyToClipboard(jsonOutput)}
                className="text-xs text-blue-400 hover:text-white flex items-center gap-1"
              >
                <Copy size={12} /> Copy JSON
              </button>
           </div>
           <pre className="bg-slate-950/50 rounded-lg p-4 text-xs font-mono text-green-400 overflow-x-auto border border-white/5">
             {jsonOutput}
           </pre>
        </div>

        <div className="mt-6 pt-6 border-t border-white/10 flex gap-3">
           <button 
             onClick={() => copyToClipboard(data.poster)}
             className="flex-1 bg-telegram-surface hover:bg-slate-700 border border-slate-600 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all"
           >
             <Copy size={18} /> Copy Link
           </button>
           <a 
             href={data.poster}
             download={`poster_${data.title}.jpg`}
             target="_blank"
             className="flex-1 bg-telegram-primary hover:bg-blue-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-all"
           >
             <Download size={18} /> Download
           </a>
        </div>
      </div>
    </div>
  );
};
