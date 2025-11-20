
import { OttData, ApiError } from '../types';

// Using CORS Proxy to allow browser to call these APIs
const PROXY_URL = 'https://corsproxy.io/?';

const APIs = {
  ASA: "https://hgbots.vercel.app/bypaas/asa.php?url=",
  AIRTEL: "https://hgbots.vercel.app/bypaas/airtel.php?url=",
  ZEE: "https://hgbots.vercel.app/bypaas/zee.php?url=",
  PRIME: "https://primevideo.pbx1bots.workers.dev/?url="
};

export const detectPlatform = (url: string): string => {
  if (url.includes('airtel')) return 'AIRTEL';
  if (url.includes('zee5') || url.includes('zee')) return 'ZEE';
  if (url.includes('amazon') || url.includes('primevideo')) return 'PRIME';
  return 'GENERIC'; // Handles sunnext, hulu, stage, adda, wetv, plex, iqiyi, aha, shemaroo, apple
};

export const fetchPosterData = async (url: string): Promise<OttData | ApiError> => {
  try {
    const platform = detectPlatform(url);
    let apiUrl = '';

    switch (platform) {
      case 'AIRTEL':
        apiUrl = `${APIs.AIRTEL}${url}`;
        break;
      case 'ZEE':
        apiUrl = `${APIs.ZEE}${url}`;
        break;
      case 'PRIME':
        apiUrl = `${APIs.PRIME}${url}`;
        break;
      default:
        apiUrl = `${APIs.ASA}${url}`;
        break;
    }

    // Use Proxy
    const finalUrl = `${PROXY_URL}${encodeURIComponent(apiUrl)}`;
    
    const response = await fetch(finalUrl);
    if (!response.ok) {
      return { error: true, message: `API Error: ${response.statusText}` };
    }

    const data = await response.json();

    if (!data) {
      return { error: true, message: "Empty response from API" };
    }

    // Normalize data based on Python script structure
    const poster = data.poster || data.landscape || "";
    const title = data.title || "No Title";
    const year = data.year || "";
    const ott = data.ott || "Unknown";

    if (!poster && !title) {
      return { error: true, message: "No poster or title found for this URL." };
    }

    return {
      title,
      poster,
      year,
      ott,
      landscape: data.landscape
    };

  } catch (e: any) {
    return { error: true, message: e.message || "Network Error" };
  }
};
