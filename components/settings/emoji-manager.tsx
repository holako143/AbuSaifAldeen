"use client"

import { useState } from "react"
import { useEmojiList } from "@/hooks/use-emoji-list"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Trash, ArrowUp, ArrowDown, RotateCcw, PlusCircle } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"

export function EmojiManager() {
  const { lists, addList, deleteList, updateList, resetListToDefault, activeList, setActiveListId } = useEmojiList();
  const { toast } = useToast();
  
  const [newListName, setNewListName] = useState("");
  const [newListSymbols, setNewListSymbols] = useState("");
  const [itemToAdd, setItemToAdd] = useState("");

  const currentList = activeList;

  const handleAddList = () => {
    if (newListName && newListSymbols) {
      // Use a simple split, can be improved with regex for better emoji handling
      const symbols = Array.from(newListSymbols);
      addList(newListName, symbols);
      setNewListName("");
      setNewListSymbols("");
      toast({ title: "New list created!" });
    } else {
      toast({ title: "Please provide a name and symbols for the new list.", variant: "destructive" });
    }
  };

  const handleAddItem = () => {
    if (itemToAdd && currentList) {
      const newSymbols = [...currentList.symbols, itemToAdd];
      updateList(currentList.id, newSymbols);
      setItemToAdd("");
    }
  };

  const handleDeleteItem = (index: number) => {
    if (currentList) {
      const newSymbols = [...currentList.symbols];
      newSymbols.splice(index, 1);
      updateList(currentList.id, newSymbols);
    }
  };

  const handleReorderItem = (fromIndex: number, toIndex: number) => {
    if (currentList) {
      const newSymbols = [...currentList.symbols];
      const [movedItem] = newSymbols.splice(fromIndex, 1);
      newSymbols.splice(toIndex, 0, movedItem);
      updateList(currentList.id, newSymbols);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="w-full max-w-xs">
          <Label htmlFor="list-select">اختر قائمة للتعديل</Label>
          <Select value={activeList?.id} onValueChange={(id) => setActiveListId(id)}>
            <SelectTrigger id="list-select">
              <SelectValue placeholder="Select a list" />
            </SelectTrigger>
            <SelectContent>
              {lists.map(list => (
                <SelectItem key={list.id} value={list.id}>{list.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">
              <PlusCircle className="mr-2 h-4 w-4" />
              إنشاء قائمة جديدة
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إنشاء قائمة رموز جديدة</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Input
                placeholder="اسم القائمة"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
              />
              <Textarea
                placeholder="ألصق الرموز هنا"
                value={newListSymbols}
                onChange={(e) => setNewListSymbols(e.target.value)}
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">إلغاء</Button>
              </DialogClose>
              <DialogClose asChild>
                <Button onClick={handleAddList}>إنشاء</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {currentList && (
        <div className="space-y-4 pt-4 border-t">
          <div className="flex w-full max-w-sm items-center space-x-2">
            <Input
              type="text"
              placeholder="أضف رمز جديد"
              value={itemToAdd}
              onChange={(e) => setItemToAdd(e.target.value)}
            />
            <Button onClick={handleAddItem}>إضافة</Button>
          </div>

          <div className="flex gap-2">
            {currentList.isDefault && (
              <Button variant="outline" size="sm" onClick={() => resetListToDefault(currentList.id)}>
                <RotateCcw className="mr-2 h-4 w-4" />
                إعادة تعيين إلى الافتراضي
              </Button>
            )}
            {currentList.isDeletable && (
               <Button variant="destructive" size="sm" onClick={() => deleteList(currentList.id)}>
                <Trash className="mr-2 h-4 w-4" />
                حذف هذه القائمة
              </Button>
            )}
          </div>

          <div className="max-h-64 overflow-y-auto rounded-md border p-2 space-y-2">
            {currentList.symbols.map((item, index) => (
              <div key={index} className="flex items-center justify-between rounded-md bg-muted p-2">
                <span>{item}</span>
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="ghost" disabled={index === 0} onClick={() => handleReorderItem(index, index - 1)}>
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" disabled={index === currentList.symbols.length - 1} onClick={() => handleReorderItem(index, index + 1)}>
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="destructive" onClick={() => handleDeleteItem(index)}>
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
