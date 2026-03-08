
import { Animal } from '../types';

/**
 * Encodes the scientific name using encodeURIComponent — the most compatible
 * and corruption-proof method across WhatsApp, Telegram, iMessage, etc.
 */
export const encodeDiscovery = (animal: Animal): string => {
  try {
    return encodeURIComponent(animal.scientificName);
  } catch (e) {
    console.error("Encoding error", e);
    return "";
  }
};

export const decodeDiscovery = (encoded: string): string | null => {
  try {
    return decodeURIComponent(encoded);
  } catch (e) {
    console.error("Decoding error", e);
    return null;
  }
};

/**
 * Builds a clean, stable share URL that works after hosting on Vercel/Netlify.
 * Always uses window.location.origin to avoid path duplication bugs.
 */
export const buildShareUrl = (animal: Animal): string => {
  const encoded = encodeDiscovery(animal);
  const origin = window.location.origin;
  return `${origin}/?sn=${encoded}`;
};
