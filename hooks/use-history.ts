import { useState, useEffect } from 'react';

import type { Algorithm } from '@/lib/encoders';

export interface HistoryItem {
  id:string;
  text: string;
  date: string;
  mode: 'encode' | 'decode';
  result: string;
  algorithm: Algorithm;
  emoji?: string;
}

const HISTORY_STORAGE_KEY = 'encryption-history';

export function useHistory() {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      }
    } catch (error) {
      console.error("Error reading history from localStorage", error);
    }
  }, []);

  const addHistoryItem = (item: Omit<HistoryItem, 'id' | 'date'>) => {
    const newItem: HistoryItem = {
      ...item,
      id: new Date().toISOString(),
      date: new Date().toLocaleString(),
    };
    const updatedHistory = [newItem, ...history];
    setHistory(updatedHistory);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updatedHistory));
  };

  const deleteHistoryItem = (id: string) => {
    const updatedHistory = history.filter(item => item.id !== id);
    setHistory(updatedHistory);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updatedHistory));
  };
  
  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(HISTORY_STORAGE_KEY);
  }

  const replaceHistory = (newHistory: HistoryItem[]) => {
    if (Array.isArray(newHistory)) {
      setHistory(newHistory);
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(newHistory));
    } else {
      console.error("Invalid history format provided for import.");
    }
  };

  return { history, addHistoryItem, deleteHistoryItem, clearHistory, replaceHistory };
}
