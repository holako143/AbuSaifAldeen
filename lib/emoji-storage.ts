import { EMOJI_LIST, ALPHABET_LIST } from "@/app/emoji";

export const EMOJI_STORAGE_KEY = "shifrishan-emoji-list";
export const ALPHABET_STORAGE_KEY = "shifrishan-alphabet-list";

const getList = (key: string, defaultList: string[]): string[] => {
    if (typeof window === "undefined") return defaultList;
    try {
        const storedList = localStorage.getItem(key);
        return storedList ? JSON.parse(storedList) : defaultList;
    } catch (error) {
        console.error(`Failed to parse list for key ${key}`, error);
        return defaultList;
    }
}

export const getCustomEmojiList = (): string[] => getList(EMOJI_STORAGE_KEY, EMOJI_LIST);
export const getCustomAlphabetList = (): string[] => getList(ALPHABET_STORAGE_KEY, ALPHABET_LIST);

const saveList = (key: string, list: string[]): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(list));
  } catch (error) {
    console.error(`Failed to save list to ${key}`, error);
  }
};

export const saveCustomEmojiList = (list: string[]): void => saveList(EMOJI_STORAGE_KEY, list);
export const saveCustomAlphabetList = (list: string[]): void => saveList(ALPHABET_STORAGE_KEY, list);

export const resetEmojiList = (): void => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(EMOJI_STORAGE_KEY);
};

export const resetAlphabetList = (): void => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ALPHABET_STORAGE_KEY);
};

/**
 * Moves a given item to the front of its list to mark it as recently used.
 * @param listKey The localStorage key for the list.
 * @param item The item to promote.
 */
export const promoteListItem = (listKey: string, item: string): void => {
    const defaultList = listKey === EMOJI_STORAGE_KEY ? EMOJI_LIST : ALPHABET_LIST;
    const currentList = getList(listKey, defaultList);

    const itemIndex = currentList.indexOf(item);

    // If item is not in the list or already at the front, do nothing.
    if (itemIndex <= 0) {
        return;
    }

    const newList = [...currentList];
    // Remove the item from its current position
    newList.splice(itemIndex, 1);
    // Add it to the beginning
    newList.unshift(item);

    saveList(listKey, newList);
}
