import { db } from './db';
import { EMOJI_LIST, ALPHABET_LIST } from "@/app/emoji";

export const EMOJI_STORAGE_KEY = "emoji-list";
export const ALPHABET_STORAGE_KEY = "alphabet-list";

const getList = async (key: string, defaultList: string[]): Promise<string[]> => {
    if (typeof window === "undefined") return defaultList;
    try {
        const record = await db.appState.get(key);
        return record ? record.value : defaultList;
    } catch (error) {
        console.error(`Failed to get list for key ${key}`, error);
        return defaultList;
    }
}

export const getCustomEmojiList = async (): Promise<string[]> => getList(EMOJI_STORAGE_KEY, EMOJI_LIST);
export const getCustomAlphabetList = async (): Promise<string[]> => getList(ALPHABET_STORAGE_KEY, ALPHABET_LIST);

const saveList = async (key: string, list: string[]): Promise<void> => {
  if (typeof window === "undefined") return;
  try {
    await db.appState.put({ key, value: list });
  } catch (error) {
    console.error(`Failed to save list to ${key}`, error);
  }
};

export const saveCustomEmojiList = async (list: string[]): Promise<void> => saveList(EMOJI_STORAGE_KEY, list);
export const saveCustomAlphabetList = async (list: string[]): Promise<void> => saveList(ALPHABET_STORAGE_KEY, list);

export const resetEmojiList = async (): Promise<void> => {
  if (typeof window === "undefined") return;
  await db.appState.delete(EMOJI_STORAGE_KEY);
};

export const resetAlphabetList = async (): Promise<void> => {
  if (typeof window === "undefined") return;
  await db.appState.delete(ALPHABET_STORAGE_KEY);
};

/**
 * Moves a given item to the front of its list to mark it as recently used.
 * @param listKey The key for the list in the appState table.
 * @param item The item to promote.
 */
export const promoteListItem = async (listKey: string, item: string): Promise<void> => {
    const defaultList = listKey === EMOJI_STORAGE_KEY ? EMOJI_LIST : ALPHABET_LIST;
    const currentList = await getList(listKey, defaultList);

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

    await saveList(listKey, newList);
}
