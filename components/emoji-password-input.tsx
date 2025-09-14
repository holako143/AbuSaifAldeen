"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { EmojiSelector } from "@/components/emoji-selector";
import { getCustomEmojiList } from "@/lib/emoji-storage";
import { useTranslation } from "@/hooks/use-translation";
import { X } from "lucide-react";

interface EmojiPasswordInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function EmojiPasswordInput({ value, onChange }: EmojiPasswordInputProps) {
  const { t } = useTranslation();
  const [emojiList] = useState(getCustomEmojiList());
  const selectedEmojis = value ? Array.from(value) : [];

  const handleEmojiSelect = (emoji: string) => {
    onChange(value + emoji);
  };

  const handleRemoveEmoji = (index: number) => {
    const newEmojis = [...selectedEmojis];
    newEmojis.splice(index, 1);
    onChange(newEmojis.join(""));
  };

  return (
    <div className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap p-2 border rounded-lg min-h-[40px]">
            {selectedEmojis.map((emoji, index) => (
                <div key={index} className="relative group">
                    <span className="text-2xl">{emoji}</span>
                    <button
                        onClick={() => handleRemoveEmoji(index)}
                        className="absolute -top-2 -right-2 bg-red-500 rounded-full h-4 w-4 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label={`Remove ${emoji}`}
                    >
                        <X className="h-3 w-3" />
                    </button>
                </div>
            ))}
        </div>
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" className="w-full">{t('vaultPage.emojiPassword.add')}</Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
                <EmojiSelector onEmojiSelect={handleEmojiSelect} selectedEmoji={""} emojiList={emojiList} />
            </PopoverContent>
        </Popover>
    </div>
  );
}
