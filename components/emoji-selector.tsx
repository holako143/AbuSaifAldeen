"use client"

import { Button } from "@/components/ui/button"

interface EmojiSelectorProps {
  onEmojiSelect: (emoji: string) => void
  disabled: boolean
  selectedEmoji: string
  emojiList: string[]
}

export function EmojiSelector({ onEmojiSelect, disabled, selectedEmoji, emojiList }: EmojiSelectorProps) {
  return (
    <div
      className="h-[150px] overflow-y-auto p-1 rounded-md border"
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
  )
}
