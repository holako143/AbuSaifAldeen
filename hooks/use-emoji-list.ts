import { useState, useEffect } from 'react';
import { EMOJI_LIST as defaultEmojis, ALPHABET_LIST as defaultAlphabet } from '@/app/emoji';

const EMOJI_STORAGE_KEY = 'custom-emoji-list';
const ALPHABET_STORAGE_KEY = 'custom-alphabet-list';

function useStoredList(key: string, defaultList: string[]) {
  const [list, setList] = useState<string[]>([]);

  useEffect(() => {
    try {
      const storedList = localStorage.getItem(key);
      if (storedList) {
        setList(JSON.parse(storedList));
      } else {
        setList(defaultList);
      }
    } catch (error) {
      console.error(`Error reading ${key} from localStorage`, error);
      setList(defaultList);
    }
  }, [key, defaultList]);

  const updateList = (newList: string[]) => {
    setList(newList);
    localStorage.setItem(key, JSON.stringify(newList));
  };

  const addItem = (item: string) => {
    if (item && !list.includes(item)) {
      updateList([...list, item]);
    }
  };

  const deleteItem = (index: number) => {
    const newList = [...list];
    newList.splice(index, 1);
    updateList(newList);
  };

  const reorderItem = (fromIndex: number, toIndex: number) => {
    const newList = [...list];
    const [movedItem] = newList.splice(fromIndex, 1);
    newList.splice(toIndex, 0, movedItem);
    updateList(newList);
  };
  
  const resetList = () => {
    updateList(defaultList);
  }

  return { list, addItem, deleteItem, reorderItem, resetList };
}

export function useEmojiList() {
    const emojis = useStoredList(EMOJI_STORAGE_KEY, defaultEmojis);
    const alphabet = useStoredList(ALPHABET_STORAGE_KEY, defaultAlphabet);

    return {
        emojis,
        alphabet
    }
}
