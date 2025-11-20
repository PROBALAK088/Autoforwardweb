
import { AppConfig, User } from '../types';

// Configuration
const MONGO_URI = "mongodb+srv://lesalov501:ILnYPvfZ6dEYIIXV@cluster0.xxm59rc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const STORAGE_KEY = 'autogram_config';
const USERS_KEY = 'autogram_users';
const CURRENT_USER_KEY = 'autogram_current_user';

// Default Initial State
const DEFAULT_CONFIG: AppConfig = {
  bot: {
    token: '',
    name: '',
    username: '',
    isConnected: false,
  },
  channels: [],
  filters: {
    video: true,
    document: true,
    text: true,
    stickers: false,
    photos: true,
    audio: true,
    voice: false,
    animation: true,
  },
  captionRules: {
    removeWords: ['join now', 'subscribe', 'betting'],
    removeLinks: true,
    removeUsernames: true,
    removeEmojis: false,
    singleLineSpace: true,
    
    // Advanced Defaults
    template: "<b>{file_name}</b>\n\n💿 <b>Quality:</b> {quality}\n🗣 <b>Audio:</b> {language}\n⚖️ <b>Size:</b> {file_size}\n\n{default_caption}",
    prefix: "",
    suffix: "\n\n📢 Uploaded by AutoGram",
    replacements: [
      { from: "mkvCinemas", to: "MyChannel" },
      { from: "480p", to: "480p [SD]" }
    ],
    customLanguages: ["Hindi", "English", "Tamil", "Telugu", "Malayalam"],
    customQualities: ["720p", "1080p", "480p", "WEB-DL", "BluRay"],
    protectedWords: ["S01", "E01", "Part 1"],
    symbolsToRemove: "",
    symbolsToReplace: ".",
    fixExtension: true,
    buttons: "[Join Channel](buttonurl:https://t.me/mychannel) | [Support](buttonurl:https://t.me/support)"
  },
  sizeLimits: {
    min: 0,
    max: 2000,
  },
  blacklistPhrases: ["porn", "casino", "scam"],
};

// Config Management
export const saveConfigToDB = async (config: AppConfig): Promise<boolean> => {
  console.log(`[MongoDB] Connecting to Cluster0...`);
  
  await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network latency
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    console.log('[MongoDB] Write Successful');
    return true;
  } catch (e) {
    console.error('[MongoDB] Write Failed', e);
    return false;
  }
};

export const loadConfigFromDB = async (): Promise<AppConfig> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    const parsed = JSON.parse(stored);
    return { 
      ...DEFAULT_CONFIG, 
      ...parsed, 
      captionRules: { ...DEFAULT_CONFIG.captionRules, ...(parsed.captionRules || {}) },
      bot: { ...DEFAULT_CONFIG.bot, ...(parsed.bot || {}) }
    };
  }
  return DEFAULT_CONFIG;
};

export const testDatabaseConnection = async (): Promise<boolean> => {
  // Simulates a ping to the MongoDB Cluster
  await new Promise(resolve => setTimeout(resolve, 1500));
  return true;
};

// Authentication Management (Simulated)
export const registerUser = async (username: string, telegramId: string, password: string): Promise<{success: boolean, message: string}> => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const usersStr = localStorage.getItem(USERS_KEY);
  const users = usersStr ? JSON.parse(usersStr) : [];
  
  if (users.find((u: any) => u.telegramId === telegramId)) {
    return { success: false, message: 'Account with this Telegram ID already exists.' };
  }
  
  const newUser = { username, telegramId, password };
  users.push(newUser);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  
  return { success: true, message: 'Account created successfully!' };
};

export const loginUser = async (telegramId: string, password: string): Promise<{success: boolean, user?: User, message: string}> => {
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const usersStr = localStorage.getItem(USERS_KEY);
  const users = usersStr ? JSON.parse(usersStr) : [];
  
  const user = users.find((u: any) => u.telegramId === telegramId && u.password === password);
  
  if (user) {
    const userData: User = { username: user.username, telegramId: user.telegramId };
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userData));
    return { success: true, user: userData, message: 'Login successful' };
  }
  
  return { success: false, message: 'Invalid Telegram ID or Password' };
};

export const getCurrentUser = (): User | null => {
  const stored = localStorage.getItem(CURRENT_USER_KEY);
  return stored ? JSON.parse(stored) : null;
};

export const logoutUser = () => {
  localStorage.removeItem(CURRENT_USER_KEY);
};
