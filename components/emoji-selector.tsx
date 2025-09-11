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
    <div className="w-full flex justify-center">
        <Carousel
          opts={{
            align: "start",
            axis: "y",
          }}
          className="w-20"
        >
          <CarouselContent className="h-48">
            {emojiList.map((emoji, index) => (
              <CarouselItem key={index} className="pt-1 basis-1/3">
                <div className="p-1">
                  <Button
                    variant="outline"
                    className={cn(
                      "w-14 h-14 p-0 text-2xl rounded-full",
                      "transition-all duration-200 ease-in-out",
                      "hover:scale-110",
                      disabled && "opacity-50 hover:scale-100",
                      emoji === selectedEmoji &&
                        "ring-2 ring-primary ring-offset-2 ring-offset-background"
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
    </div>
  );
}
