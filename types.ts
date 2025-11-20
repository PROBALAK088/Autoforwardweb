
export enum ChannelType {
  SOURCE = 'SOURCE',
  DESTINATION = 'DESTINATION'
}

export interface User {
  username: string;
  telegramId: string;
}

export interface Channel {
  id: string;
  name: string;
  type: ChannelType;
  connectedAt: Date;
}

export interface FileSizeLimit {
  min: number; // in MB
  max: number; // in MB
}

export interface ContentFilters {
  video: boolean;
  document: boolean;
  text: boolean;
  stickers: boolean;
  photos: boolean;
  audio: boolean;
  voice: boolean;
  animation: boolean; // GIFs
}

export interface ReplacementRule {
  from: string;
  to: string;
}

export interface CaptionRules {
  removeWords: string[];
  removeLinks: boolean;
  removeUsernames: boolean;
  removeEmojis: boolean;
  singleLineSpace: boolean;
  
  // Advanced Features
  template: string;
  prefix: string;
  suffix: string;
  replacements: ReplacementRule[];
  customLanguages: string[];
  customQualities: string[];
  protectedWords: string[];
  symbolsToRemove: string;
  symbolsToReplace: string;
  fixExtension: boolean;
  buttons: string; // Stored as string representation for easier editing (e.g., [Text](url))
}

export interface BotConfig {
  id?: number;
  token: string;
  name: string;
  username: string;
  isConnected: boolean;
}

export interface AppConfig {
  bot: BotConfig;
  channels: Channel[];
  filters: ContentFilters;
  captionRules: CaptionRules;
  sizeLimits: FileSizeLimit;
  blacklistPhrases: string[];
}

export interface ForwardJob {
  id: string;
  sourceId: string;
  destinationId: string;
  lastMessageId: number;
  skipCount: number; // Positive to skip start, negative to skip end
  progress: number;
  status: 'IDLE' | 'RUNNING' | 'COMPLETED' | 'PAUSED';
  totalMessages: number;
  processedCount: number;
}

// Telegram API Types
export interface TelegramMessage {
  message_id: number;
  chat: {
    id: number;
    title?: string;
  };
  caption?: string;
  text?: string; // For text-only messages
  video?: { file_name?: string; file_size?: number; mime_type?: string };
  document?: { file_name?: string; file_size?: number; mime_type?: string };
  audio?: { file_name?: string; file_size?: number; mime_type?: string };
  photo?: any[];
}
