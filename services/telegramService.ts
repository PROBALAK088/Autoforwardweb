
import { BotConfig, Channel } from '../types';

// Real Telegram Bot API Base URL
const TELEGRAM_API_BASE = 'https://api.telegram.org/bot';

export const checkBotStatus = async (token: string): Promise<Partial<BotConfig> | null> => {
  if (!token || token.length < 10) return null;

  try {
    const response = await fetch(`${TELEGRAM_API_BASE}${token}/getMe`);
    const data = await response.json();

    if (data.ok && data.result) {
      return {
        id: data.result.id,
        name: data.result.first_name,
        username: data.result.username,
        isConnected: true
      };
    }
    return null;
  } catch (error) {
    console.error("Telegram API Connection Error:", error);
    throw new Error("Failed to connect to Telegram API");
  }
};

export const getChannelInfo = async (channelId: string, botToken: string): Promise<Partial<Channel> | null> => {
  if (!channelId.startsWith('-100')) {
    throw new Error("Invalid Channel ID. Must start with -100");
  }

  try {
    const response = await fetch(`${TELEGRAM_API_BASE}${botToken}/getChat?chat_id=${channelId}`);
    const data = await response.json();

    if (data.ok && data.result) {
      return {
        name: data.result.title || `Channel ${channelId}`,
        id: channelId,
        connectedAt: new Date()
      };
    }
    throw new Error(data.description || "Channel not found");
  } catch (error) {
    console.error("Get Channel Info Error:", error);
    // Fallback for private channels where bot might not be able to get info yet if not admin
    // We return a basic object so the user can still try to add it
    return {
      name: `Channel ${channelId}`,
      id: channelId,
      connectedAt: new Date()
    };
  }
};

export const verifyBotAdmin = async (channelId: string, botToken: string, botId?: number): Promise<boolean> => {
  if (!botId) return false;
  
  try {
    const response = await fetch(`${TELEGRAM_API_BASE}${botToken}/getChatMember?chat_id=${channelId}&user_id=${botId}`);
    const data = await response.json();

    if (data.ok && data.result) {
      const status = data.result.status;
      // Check if bot is administrator or creator
      return status === 'administrator' || status === 'creator';
    }
    return false;
  } catch (error) {
    console.error("Verify Admin Error:", error);
    return false;
  }
};
