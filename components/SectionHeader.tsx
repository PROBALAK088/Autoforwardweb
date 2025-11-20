import React from 'react';
import { LucideIcon } from 'lucide-react';

interface SectionHeaderProps {
  title: string;
  icon: LucideIcon;
  description?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, icon: Icon, description }) => {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 text-telegram-primary mb-1">
        <Icon size={20} />
        <h2 className="text-xl font-bold text-white">{title}</h2>
      </div>
      {description && <p className="text-slate-400 text-sm ml-7">{description}</p>}
    </div>
  );
};