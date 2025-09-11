export interface HistoryEntry {
  id: string;
  inputText: string;
  outputText: string;
  mode: "encode" | "decode";
  timestamp: number;
}

const HISTORY_STORAGE_KEY = "shifrishan-history";

/**
 * Retrieves the history from localStorage.
 * @returns An array of HistoryEntry objects.
 */
export const getHistory = (): HistoryEntry[] => {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const historyJson = localStorage.getItem(HISTORY_STORAGE_KEY);
    return historyJson ? JSON.parse(historyJson) : [];
  } catch (error) {
    console.error("Failed to parse history from localStorage", error);
    return [];
  }
};

/**
 * Saves the entire history to localStorage.
 * @param history - The array of HistoryEntry objects to save.
 */
const saveHistory = (history: HistoryEntry[]): void => {
  if (typeof window === "undefined") {
    return;
  }
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
  } catch (error) {
    console.error("Failed to save history to localStorage", error);
  }
};

/**
 * Adds a new entry to the history.
 * @param newEntry - The HistoryEntry object to add.
 */
export const addToHistory = (newEntry: Omit<HistoryEntry, 'id' | 'timestamp'>): void => {
  if (!newEntry.inputText || !newEntry.outputText) {
    return; // Don't save empty entries
  }
  const history = getHistory();
  const entry: HistoryEntry = {
    ...newEntry,
    id: `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
  };
  // Add to the beginning of the array
  const updatedHistory = [entry, ...history];
  saveHistory(updatedHistory);
};

/**
 * Deletes an entry from the history by its ID.
 * @param id - The ID of the entry to delete.
 */
export const deleteFromHistory = (id: string): void => {
  const history = getHistory();
  const updatedHistory = history.filter((entry) => entry.id !== id);
  saveHistory(updatedHistory);
};

/**
 * Clears the entire history from localStorage.
 */
export const clearHistory = (): void => {
  saveHistory([]);
};

/**
 * Imports a new set of history entries, replacing the old one.
 * @param newHistory - The array of HistoryEntry objects to import.
 */
export const importHistory = (newHistory: HistoryEntry[]): boolean => {
  // Basic validation to ensure the imported data has the right structure
  if (Array.isArray(newHistory) && newHistory.every(item => 'id' in item && 'inputText' in item && 'outputText' in item)) {
    saveHistory(newHistory);
    return true;
  }
  return false;
};
