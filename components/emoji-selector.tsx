"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
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
        direction: "rtl", // For correct right-to-left sliding
      }}
      className="w-full max-w-sm mx-auto"
    >
      <CarouselContent>
        {emojiList.map((emoji, index) => (
          <CarouselItem key={index} className="basis-1/8">
            <div className="p-1">
              <Button
                variant="outline"
                className={cn(
                    "w-10 h-10 p-0 text-lg",
                    "transition-all duration-200 ease-in-out",
                    disabled && "opacity-50",
                    emoji === selectedEmoji && "bg-primary text-primary-foreground border-ring scale-110"
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
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
}
