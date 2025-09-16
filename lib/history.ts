import { db } from './db';

export interface HistoryEntry {
  id: number; // Changed to number to match Dexie's auto-incrementing key
  inputText: string;
  outputText: string;
  mode: "encode" | "decode";
  timestamp: number;
}

/**
 * Retrieves the history from IndexedDB, sorted by timestamp descending.
 * @returns A promise that resolves to an array of HistoryEntry objects.
 */
export const getHistory = async (): Promise<HistoryEntry[]> => {
  if (typeof window === "undefined") return [];
  // orderBy('timestamp').reverse() is how you sort in descending order with Dexie
  return db.history.orderBy('timestamp').reverse().toArray();
};

/**
 * Adds a new entry to the history.
 * @param newEntry - The HistoryEntry object to add, without id and timestamp.
 */
export const addToHistory = async (newEntry: Omit<HistoryEntry, 'id' | 'timestamp'>): Promise<void> => {
  if (!newEntry.inputText || !newEntry.outputText) {
    return; // Don't save empty entries
  }
  const entry = {
    ...newEntry,
    timestamp: Date.now(),
  };
  await db.history.add(entry);
};

/**
 * Deletes an entry from the history by its ID.
 * @param id - The ID of the entry to delete.
 */
export const deleteFromHistory = async (id: number): Promise<void> => {
  await db.history.delete(id);
};

/**
 * Clears the entire history from IndexedDB.
 */
export const clearHistory = async (): Promise<void> => {
  await db.history.clear();
};

/**
 * Imports a new set of history entries, replacing the old one.
 * @param newHistory - The array of HistoryEntry objects to import.
 */
export const importHistory = async (newHistory: HistoryEntry[]): Promise<boolean> => {
  // Basic validation
  if (Array.isArray(newHistory) && newHistory.every(item => 'inputText' in item && 'outputText' in item && 'mode' in item && 'timestamp' in item)) {
    await db.transaction('rw', db.history, async () => {
      await db.history.clear();
      // Dexie's bulkAdd handles adding multiple records at once
      await db.history.bulkAdd(newHistory);
    });
    return true;
  }
  return false;
};
