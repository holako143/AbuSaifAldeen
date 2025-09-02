import { EMOJI_LIST, ALPHABET_LIST } from "@/app/emoji";

export interface Alphabets {
  emojis: string[];
  letters: string[];
}

const ALPHABETS_KEY = 'custom_alphabets';

// Gets the alphabets. If not in localStorage, initializes from defaults.
export function getAlphabets(): Alphabets {
  if (typeof window === 'undefined') {
    return { emojis: EMOJI_LIST, letters: ALPHABET_LIST };
  }
  try {
    const storedAlphabets = localStorage.getItem(ALPHABETS_KEY);
    if (storedAlphabets) {
      return JSON.parse(storedAlphabets);
    } else {
      // Initialize with defaults if nothing is stored
      const defaultAlphabets = { emojis: EMOJI_LIST, letters: ALPHABET_LIST };
      localStorage.setItem(ALPHABETS_KEY, JSON.stringify(defaultAlphabets));
      return defaultAlphabets;
    }
  } catch (error) {
    console.error("Failed to read alphabets from localStorage", error);
    // Return defaults in case of error
    return { emojis: EMOJI_LIST, letters: ALPHABET_LIST };
  }
}

// Updates the alphabets in localStorage.
export function updateAlphabets(newAlphabets: Alphabets): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    localStorage.setItem(ALPHABETS_KEY, JSON.stringify(newAlphabets));
  } catch (error) {
    console.error("Failed to save alphabets to localStorage", error);
  }
}
