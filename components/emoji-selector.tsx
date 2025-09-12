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
    <ScrollArea className="h-48 w-full rounded-md border p-4">
      <div className="grid grid-cols-5 gap-2">
        {emojiList.map((emoji, index) => (
          <Button
            key={index}
            variant="outline"
            className={cn(
              "w-12 h-12 p-0 text-xl rounded-lg",
              "transition-all duration-200 ease-in-out",
              "hover:scale-110",
              disabled && "opacity-50 hover:scale-100",
              emoji === selectedEmoji &&
                "ring-2 ring-primary ring-offset-2 ring-offset-background scale-110"
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
