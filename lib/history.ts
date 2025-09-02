export interface HistoryEntry {
  id: string;
  originalText: string;
  encodedText: string;
  emoji: string;
  timestamp: number;
}

const HISTORY_KEY = 'encryption_history';

export function getHistory(): HistoryEntry[] {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const historyJson = localStorage.getItem(HISTORY_KEY);
    return historyJson ? JSON.parse(historyJson) : [];
  } catch (error) {
    console.error("Failed to read history from localStorage", error);
    return [];
  }
}

export function addToHistory(entry: Omit<HistoryEntry, 'id' | 'timestamp'>): HistoryEntry[] {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const history = getHistory();
    const newEntry: HistoryEntry = {
      ...entry,
      id: new Date().getTime().toString(),
      timestamp: Date.now(),
    };
    const newHistory = [newEntry, ...history].slice(0, 50); // Keep max 50 entries
    localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
    return newHistory;
  } catch (error) {
    console.error("Failed to save history to localStorage", error);
    return getHistory(); // Return existing history on failure
  }
}

export function deleteFromHistory(id: string): HistoryEntry[] {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const history = getHistory();
    const newHistory = history.filter(entry => entry.id !== id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
    return newHistory;
  } catch (error) {
    console.error("Failed to delete history from localStorage", error);
    return getHistory();
  }
}

export function clearHistory(): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch (error) {
    console.error("Failed to clear history from localStorage", error);
  }
}
