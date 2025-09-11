import { EMOJI_LIST, ALPHABET_LIST } from "@/app/emoji";

const EMOJI_STORAGE_KEY = "shifrishan-emoji-list";
const ALPHABET_STORAGE_KEY = "shifrishan-alphabet-list";

/**
 * Retrieves the custom emoji list from localStorage, falling back to the default.
 */
export const getCustomEmojiList = (): string[] => {
  if (typeof window === "undefined") return EMOJI_LIST;
  try {
    const storedList = localStorage.getItem(EMOJI_STORAGE_KEY);
    return storedList ? JSON.parse(storedList) : EMOJI_LIST;
  } catch (error) {
    console.error("Failed to parse custom emoji list", error);
    return EMOJI_LIST;
  }
};

/**
 * Retrieves the custom alphabet list from localStorage, falling back to the default.
 */
export const getCustomAlphabetList = (): string[] => {
  if (typeof window === "undefined") return ALPHABET_LIST;
  try {
    const storedList = localStorage.getItem(ALPHABET_STORAGE_KEY);
    return storedList ? JSON.parse(storedList) : ALPHABET_LIST;
  } catch (error) {
    console.error("Failed to parse custom alphabet list", error);
    return ALPHABET_LIST;
  }
};

/**
 * Saves a custom list to localStorage.
 * @param key - The storage key.
 * @param list - The list of strings to save.
 */
const saveList = (key: string, list: string[]): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(list));
  } catch (error) {
    console.error(`Failed to save list to ${key}`, error);
  }
};

/**
 * Saves the custom emoji list.
 */
export const saveCustomEmojiList = (list: string[]): void => {
  saveList(EMOJI_STORAGE_KEY, list);
};

/**
 * Saves the custom alphabet list.
 */
export const saveCustomAlphabetList = (list: string[]): void => {
  saveList(ALPHABET_STORAGE_KEY, list);
};

/**
 * Resets the custom emoji list to default by removing it from localStorage.
 */
export const resetEmojiList = (): void => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(EMOJI_STORAGE_KEY);
};

/**
 * Resets the custom alphabet list to default by removing it from localStorage.
 */
export const resetAlphabetList = (): void => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ALPHABET_STORAGE_KEY);
};
