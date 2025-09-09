"use client"

import { useState } from "react"
import { useEmojiList } from "@/hooks/use-emoji-list"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Trash, ArrowUp, ArrowDown, RotateCcw } from "lucide-react"

export function EmojiManager() {
  const [mode, setMode] = useState<'emoji' | 'alphabet'>('emoji')
  const { emojis, alphabet } = useEmojiList()
  const [newItem, setNewItem] = useState("")

  const manager = mode === 'emoji' ? emojis : alphabet
  const list = manager.list

  const handleAddItem = () => {
    if (newItem) {
      manager.addItem(newItem)
      setNewItem("")
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Label>حروف</Label>
        <Switch
          checked={mode === 'emoji'}
          onCheckedChange={(checked) => setMode(checked ? 'emoji' : 'alphabet')}
        />
        <Label>ايموجي</Label>
      </div>

      <div className="flex w-full max-w-sm items-center space-x-2">
        <Input
          type="text"
          placeholder="أضف رمز جديد"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
        />
        <Button onClick={handleAddItem}>إضافة</Button>
      </div>

      <Button variant="outline" size="sm" onClick={manager.resetList}>
        <RotateCcw className="mr-2 h-4 w-4" />
        إعادة تعيين إلى الافتراضي
      </Button>

      <div className="max-h-64 overflow-y-auto rounded-md border p-2 space-y-2">
        {list.map((item, index) => (
          <div key={index} className="flex items-center justify-between rounded-md bg-muted p-2">
            <span>{item}</span>
            <div className="flex items-center gap-1">
              <Button size="icon" variant="ghost" disabled={index === 0} onClick={() => manager.reorderItem(index, index - 1)}>
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" disabled={index === list.length - 1} onClick={() => manager.reorderItem(index, index + 1)}>
                <ArrowDown className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="destructive" onClick={() => manager.deleteItem(index)}>
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
