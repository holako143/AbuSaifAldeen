"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface EmojiSelectorProps {
  onEmojiSelect: (emoji: string) => void;
  disabled: boolean;
  selectedEmoji: string;
  emojiList: string[];
}

export function EmojiSelector({
  onEmojiSelect,
  disabled,
  selectedEmoji,
  emojiList,
}: EmojiSelectorProps) {
  return (
    <ScrollArea className="h-48 w-full">
      <div className="grid grid-cols-5 gap-1 p-2">
        {emojiList.map((emoji, index) => (
          <Button
            key={index}
            variant="ghost" // Use ghost variant for no border/background
            className={cn(
              "w-12 h-12 p-0 text-2xl rounded-lg",
              "transition-all duration-200 ease-in-out",
              "hover:bg-accent",
              disabled && "opacity-50 hover:bg-transparent",
              emoji === selectedEmoji &&
                "scale-150 bg-accent shadow-lg"
            )}
            onClick={() => onEmojiSelect(emoji)}
            disabled={disabled}
          >
            {emoji}
          </Button>
        ))}
      </div>
    </ScrollArea>
  );
}
