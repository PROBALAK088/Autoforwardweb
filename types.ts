
export interface OttData {
  title: string;
  poster: string;
  year?: string;
  ott?: string;
  landscape?: string;
}

export interface HistoryItem extends OttData {
  id: string;
  timestamp: number;
  originalUrl: string;
}

export interface ApiError {
  error: boolean;
  message: string;
}

export interface BotConfig {
  token: string;
  id?: number;
  name?: string;
  username?: string;
  isConnected: boolean;
}

export interface Channel {
  id: string;
  name: string;
  connectedAt: Date;
}

export interface TelegramMessage {
  message_id: number;
  chat: {
    id: number;
    title?: string;
    username?: string;
    type: string;
  };
  date: number;
  text?: string;
  caption?: string;
}

export interface ReplacementRule {
  from: string;
  to: string;
}

export interface CaptionRules {
  template: string;
  removeLinks: boolean;
  removeUsernames: boolean;
  removeEmojis: boolean;
  removeWords: string[];
  replacements: ReplacementRule[];
  symbolsToRemove: string;
  symbolsToReplace: string;
  prefix: string;
  suffix: string;
  singleLineSpace: boolean;
  customLanguages: string[];
  customQualities: string[];
  protectedWords: string[];
  buttons: string;
}

export interface AppConfig {
  bot: BotConfig;
  channels: Channel[];
  captionRules: CaptionRules;
}

export interface User {
  id: string;
  username: string;
  telegramId: string;
}
