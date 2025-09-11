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
    <div className="flex flex-wrap gap-1 mt-2">
      {emojiList.map((emoji) => (
        <Button
          key={emoji}
          variant="outline"
          className={`w-8 h-8 p-0 disabled:opacity-50 ${emoji === selectedEmoji ? "bg-accent border-purple-500" : ""}`}
          onClick={() => onEmojiSelect(emoji)}
          disabled={disabled}
        >
          {emoji}
        </Button>
      ))}
    </div>
  )
}

