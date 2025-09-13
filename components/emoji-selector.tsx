"use client";

import { useEffect, useRef, createRef } from "react";
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
  const itemRefs = useRef(emojiList.map(() => createRef<HTMLButtonElement>()));

  useEffect(() => {
    const selectedIndex = emojiList.findIndex(e => e === selectedEmoji);
    if (selectedIndex !== -1) {
      const ref = itemRefs.current[selectedIndex];
      if (ref && ref.current) {
        // A short delay can make the scroll animation feel more intentional on load
        setTimeout(() => {
          ref.current?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }, 100);
      }
    }
  }, [selectedEmoji, emojiList]);

  return (
    <ScrollArea className="h-48 w-full animate-in" style={{ animationDelay: "0.2s" }}>
      <div className="grid grid-cols-5 gap-1 p-2">
        {emojiList.map((emoji, index) => (
          <Button
            key={index}
            ref={itemRefs.current[index]}
            variant="ghost"
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
