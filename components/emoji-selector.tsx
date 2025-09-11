"use client";

import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

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
    <Carousel
      opts={{
        align: "start",
        direction: "rtl",
        dragFree: true, // Allows for a more fluid, free-scrolling feel
      }}
      className="w-full max-w-xs sm:max-w-sm md:max-w-md mx-auto"
    >
      <CarouselContent className="-ml-1">
        {emojiList.map((emoji, index) => (
          <CarouselItem key={index} className="pl-1 basis-auto">
            <div className="p-1">
              <Button
                variant="outline"
                className={cn(
                  "w-12 h-12 p-0 text-xl rounded-full",
                  "transition-all duration-200 ease-in-out",
                  "hover:scale-110",
                  disabled && "opacity-50 hover:scale-100",
                  emoji === selectedEmoji &&
                    "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-background scale-125 shadow-lg"
                )}
                onClick={() => onEmojiSelect(emoji)}
                disabled={disabled}
              >
                {emoji}
              </Button>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  );
}
