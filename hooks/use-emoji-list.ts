"use client"

import { useState, useEffect, useCallback } from 'react';
import { EMOJI_LIST as defaultEmojis, ALPHABET_LIST as defaultAlphabet } from '@/app/emoji';

const LISTS_STORAGE_KEY = 'shiffration-symbol-lists';

export interface SymbolList {
  id: string;
  name: string;
  symbols: string[];
  isDefault: boolean;
  isDeletable: boolean;
}

const defaultLists: SymbolList[] = [
  {
    id: 'default-emojis',
    name: 'Default Emojis',
    symbols: defaultEmojis,
    isDefault: true,
    isDeletable: false,
  },
  {
    id: 'default-alphabet',
    name: 'Default Alphabet',
    symbols: defaultAlphabet,
    isDefault: true,
    isDeletable: false,
  }
];

export function useEmojiList() {
  const [lists, setLists] = useState<SymbolList[]>([]);
  const [activeListId, setActiveListId] = useState<string>('default-emojis');

  useEffect(() => {
    try {
      const storedLists = localStorage.getItem(LISTS_STORAGE_KEY);
      if (storedLists) {
        setLists(JSON.parse(storedLists));
      } else {
        setLists(defaultLists);
      }
    } catch (error) {
      console.error(`Error reading lists from localStorage`, error);
      setLists(defaultLists);
    }
  }, []);

  const saveLists = (newLists: SymbolList[]) => {
    setLists(newLists);
    localStorage.setItem(LISTS_STORAGE_KEY, JSON.stringify(newLists));
  };

  const addList = (name: string, symbols: string[]) => {
    if (!name || symbols.length === 0) return;
    const newList: SymbolList = {
      id: new Date().toISOString(),
      name,
      symbols,
      isDefault: false,
      isDeletable: true,
    };
    saveLists([...lists, newList]);
  };

  const deleteList = (id: string) => {
    const listToDelete = lists.find(l => l.id === id);
    if (!listToDelete || !listToDelete.isDeletable) return;
    saveLists(lists.filter(l => l.id !== id));
  };

  const updateList = (id: string, updatedSymbols: string[]) => {
    saveLists(lists.map(l => l.id === id ? { ...l, symbols: updatedSymbols } : l));
  };
  
  const resetListToDefault = (id: string) => {
      const listToReset = lists.find(l => l.id === id);
      const defaultList = defaultLists.find(l => l.id === id);
      if (listToReset && defaultList) {
          updateList(id, defaultList.symbols);
      }
  }

  const activeList = lists.find(l => l.id === activeListId) || lists[0];

  return {
    lists,
    addList,
    deleteList,
    updateList,
    resetListToDefault,
    activeList,
    setActiveListId
  };
}
