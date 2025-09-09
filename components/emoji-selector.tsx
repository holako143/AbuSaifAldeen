"use client"

import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { ArrowUp, ArrowDown } from "lucide-react"

interface EmojiSelectorProps {
  onEmojiSelect: (emoji: string) => void
  disabled: boolean
  selectedEmoji: string
  emojiList: string[]
}

export function EmojiSelector({ onEmojiSelect, disabled, selectedEmoji, emojiList }: EmojiSelectorProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const handleScroll = (direction: 'up' | 'down') => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
      const scrollAmount = clientHeight * 0.8; // Scroll by 80% of the visible height

      if (direction === 'down') {
        scrollRef.current.scrollTop += scrollAmount
      } else {
        scrollRef.current.scrollTop -= scrollAmount
      }
    }
  }

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        className="h-32 overflow-y-auto p-1 rounded-md border scroll-smooth"
      >
        <div className="flex flex-wrap gap-4 justify-center items-center mt-2">
          {emojiList.map((emoji) => (
            <Button
              key={emoji}
              variant="ghost"
              className={`w-10 h-10 p-0 text-2xl disabled:opacity-50 transition-transform duration-200 ${
                emoji === selectedEmoji
                  ? "animate-scale-up-subtle rounded-lg"
                  : "scale-100 hover:scale-110"
              }`}
              onClick={() => onEmojiSelect(emoji)}
              disabled={disabled}
            >
              {emoji}
            </Button>
          ))}
        </div>
      </div>
      <div className="absolute top-1 right-1 flex flex-col space-y-1">
        <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => handleScroll('up')}>
          <ArrowUp className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => handleScroll('down')}>
          <ArrowDown className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
