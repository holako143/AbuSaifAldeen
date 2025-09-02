"use client"

import { Button } from "@/components/ui/button"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"

interface EmojiSelectorProps {
  onEmojiSelect: (emoji: string) => void
  disabled: boolean
  selectedEmoji: string
  emojiList: string[]
}

export function EmojiSelector({ onEmojiSelect, disabled, selectedEmoji, emojiList }: EmojiSelectorProps) {
  return (
    <div className="relative w-full max-w-xs mx-auto py-4">
      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent>
          {emojiList.map((emoji) => (
            <CarouselItem key={emoji} className="basis-1/6">
              <div className="p-1">
                <Button
                  variant="outline"
                  className={`w-10 h-10 p-0 text-lg disabled:opacity-50 ${emoji === selectedEmoji ? "bg-accent border-purple-500" : ""}`}
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
    </div>
  )
}
