
import { BotConfig, Channel, TelegramMessage } from '../types';

// CORS Proxy to bypass browser restrictions when calling Telegram API
// We use corsproxy.io as it supports POST requests reasonably well.
const PROXY_URL = 'https://corsproxy.io/?';
const TELEGRAM_API_BASE = 'https://api.telegram.org/bot';

const getApiUrl = (token: string, method: string, params = '') => {
  const url = `${TELEGRAM_API_BASE}${token}/${method}${params ? '?' + params : ''}`;
  return `${PROXY_URL}${encodeURIComponent(url)}`;
};

export const checkBotStatus = async (token: string): Promise<Partial<BotConfig> | null> => {
  if (!token || token.length < 10) return null;

  try {
    const response = await fetch(getApiUrl(token, 'getMe'));
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
    // Don't throw, just return null so UI shows error state gracefully
    return null;
  }
};

export const getChannelInfo = async (channelId: string, botToken: string): Promise<Partial<Channel> | null> => {
  if (!channelId.startsWith('-100')) {
    throw new Error("Invalid Channel ID. Must start with -100");
  }

  try {
    const response = await fetch(getApiUrl(botToken, 'getChat', `chat_id=${channelId}`));
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
    const response = await fetch(getApiUrl(botToken, 'getChatMember', `chat_id=${channelId}&user_id=${botId}`));
    const data = await response.json();

    if (data.ok && data.result) {
      const status = data.result.status;
      return status === 'administrator' || status === 'creator';
    }
    return false;
  } catch (error) {
    console.error("Verify Admin Error:", error);
    return false;
  }
};

export const getMessage = async (
  chatId: string,
  messageId: number,
  botToken: string
): Promise<TelegramMessage | null> => {
  // Limitation: Standard Bot API cannot "get" a message by ID directly without Webhooks.
  // Returning null to signal that we must rely on blind copying or user-provided templates.
  return null;
};

interface CopyMessageResult {
  success: boolean;
  retryAfter?: number;
  error?: string;
  errorCode?: number;
  messageId?: number;
}

export const copyMessage = async (
  chatId: string,
  fromChatId: string,
  messageId: number,
  botToken: string,
  newCaption?: string,
  parseMode: string = 'HTML',
  replyMarkup?: any
): Promise<CopyMessageResult> => {
  try {
    const body: any = {
      chat_id: chatId,
      from_chat_id: fromChatId,
      message_id: messageId,
      parse_mode: parseMode
    };

    if (newCaption !== undefined) {
      body.caption = newCaption;
    }
    
    if (replyMarkup) {
      body.reply_markup = replyMarkup;
    }

    const response = await fetch(getApiUrl(botToken, 'copyMessage'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    
    // Handle Proxy Errors (HTML response instead of JSON)
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") === -1) {
        const text = await response.text();
        console.error("Proxy Error:", text);
        return { success: false, error: "CORS Proxy Error (Try refreshing)" };
    }

    const data = await response.json();

    if (data.ok) {
      return { success: true, messageId: data.result.message_id };
    }

    // Handle Rate Limits
    if (data.error_code === 429) {
      const retryAfter = data.parameters?.retry_after || 5;
      return { success: false, retryAfter };
    }

    // Return specific Telegram error description
    return { 
        success: false, 
        error: data.description || "Unknown API Error", 
        errorCode: data.error_code 
    };

  } catch (error: any) {
    console.error("Copy Message Network Error:", error);
    return { success: false, error: error.message || "Network Connection Failed" };
  }
};
