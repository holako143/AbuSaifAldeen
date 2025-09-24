import { useState, useEffect } from 'react';
import { getCustomEmojiList, getCustomAlphabetList } from "@/lib/emoji-storage";

export function useAppLists() {
    const [emojiList, setEmojiList] = useState<string[]>([]);
    const [alphabetList, setAlphabetList] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchLists = async () => {
            setIsLoading(true);
            const [emojis, alphabets] = await Promise.all([
                getCustomEmojiList(),
                getCustomAlphabetList()
            ]);
            setEmojiList(emojis);
            setAlphabetList(alphabets);
            setIsLoading(false);
        };
        fetchLists();
    }, []);

    return { emojiList, alphabetList, isLoading };
}