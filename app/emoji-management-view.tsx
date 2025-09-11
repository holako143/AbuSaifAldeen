"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Trash2, Plus, Save, RotateCcw, GripVertical } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getCustomEmojiList, saveCustomEmojiList, resetEmojiList, getCustomAlphabetList, saveCustomAlphabetList, resetAlphabetList } from "@/lib/emoji-storage";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

function ListManager({ list, setList, onSave, onReset }: { list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, onSave: () => void, onReset: () => void }) {
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const [dragIndicator, setDragIndicator] = useState(false);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, position: number) => {
    dragItem.current = position;
    setDragIndicator(true);
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, position: number) => {
    dragOverItem.current = position;
  };

  const handleDragEnd = () => {
    if (dragItem.current !== null && dragOverItem.current !== null) {
      const newList = [...list];
      const draggedItemContent = newList.splice(dragItem.current, 1)[0];
      newList.splice(dragOverItem.current, 0, draggedItemContent);
      dragItem.current = null;
      dragOverItem.current = null;
      setList(newList);
    }
    setDragIndicator(false);
  };

  const handleItemChange = (index: number, value: string) => {
    const newList = [...list];
    newList[index] = value;
    setList(newList);
  };

  const handleAddItem = () => {
    setList([...list, ""]);
  };

  const handleRemoveItem = (index: number) => {
    const newList = list.filter((_, i) => i !== index);
    setList(newList);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2 max-h-96 overflow-y-auto pr-4">
        {list.map((item, index) => (
          <div
            key={index}
            className={cn(
              "flex items-center gap-2 p-1 rounded-lg transition-colors",
              dragIndicator && dragItem.current === index && "bg-primary/20",
              dragIndicator && dragOverItem.current === index && "border-b-2 border-primary"
            )}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragEnter={(e) => handleDragEnter(e, index)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => e.preventDefault()}
          >
            <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
            <Input
              value={item}
              onChange={(e) => handleItemChange(index, e.target.value)}
              className="flex-1"
              maxLength={2}
            />
            <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(index)}>
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        ))}
      </div>
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t">
          <Button variant="outline" size="sm" onClick={handleAddItem}>
            <Plus className="ml-2 h-4 w-4" />
            إضافة عنصر
          </Button>
          <div className="flex gap-2">
            <Button size="sm" onClick={onSave}>
                <Save className="ml-2 h-4 w-4" />
                حفظ القائمة
            </Button>
            <Button variant="secondary" size="sm" onClick={onReset}>
                <RotateCcw className="ml-2 h-4 w-4" />
                إعادة تعيين
            </Button>
          </div>
      </div>
    </div>
  );
}


export function EmojiManagementView() {
  const { toast } = useToast();
  const [emojiList, setEmojiList] = useState<string[]>([]);
  const [alphabetList, setAlphabetList] = useState<string[]>([]);
  const [useEmojiDefault, setUseEmojiDefault] = useState(true);

  useEffect(() => {
    setEmojiList(getCustomEmojiList());
    setAlphabetList(getCustomAlphabetList());
    const storedPreference = localStorage.getItem("shifrishan-default-mode");
    if (storedPreference) {
      setUseEmojiDefault(storedPreference === "emoji");
    }
  }, []);

  const handleToggleDefaultMode = (checked: boolean) => {
    setUseEmojiDefault(checked);
    localStorage.setItem("shifrishan-default-mode", checked ? "emoji" : "alphabet");
     toast({
      title: "تم تغيير الإعداد الافتراضي",
      description: `سيتم الآن استخدام ${checked ? 'الايقونات' : 'الحروف'} كخيار افتراضي في صفحة التشفير.`,
    });
  }

  const handleSaveEmojis = () => {
    const cleanedList = [...new Set(emojiList.filter(item => item.trim() !== ''))];
    saveCustomEmojiList(cleanedList);
    setEmojiList(cleanedList);
    toast({ title: "تم الحفظ!", description: "تم حفظ قائمة الإيموجي المخصصة." });
  };

  const handleResetEmojis = () => {
    resetEmojiList();
    setEmojiList(getCustomEmojiList());
    toast({ title: "تمت إعادة التعيين!", description: "تمت استعادة قائمة الإيموجي الافتراضية." });
  };

  const handleSaveAlphabets = () => {
    const cleanedList = [...new Set(alphabetList.filter(item => item.trim() !== ''))];
    saveCustomAlphabetList(cleanedList);
    setAlphabetList(cleanedList);
    toast({ title: "تم الحفظ!", description: "تم حفظ قائمة الحروف المخصصة." });
  };

  const handleResetAlphabets = () => {
    resetAlphabetList();
    setAlphabetList(getCustomAlphabetList());
    toast({ title: "تمت إعادة التعيين!", description: "تمت استعادة قائمة الحروف الافتراضية." });
  };


  return (
    <Card className="w-full max-w-3xl mx-auto animate-in">
      <CardHeader>
        <CardTitle>إدارة القوائم</CardTitle>
        <CardDescription>
          هنا يمكنك تخصيص قوائم الرموز المستخدمة في التشفير. اسحب وأفلت لترتيب العناصر.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="flex items-center space-x-2 mb-6 p-4 border rounded-lg">
          <Label htmlFor="default-mode-switch">استخدام الايقونات كوضع افتراضي</Label>
          <Switch id="default-mode-switch" checked={useEmojiDefault} onCheckedChange={handleToggleDefaultMode} />
        </div>
        <Tabs defaultValue="emojis" className="w-full">
          <TabsList className="grid w-full sm:grid-cols-2">
            <TabsTrigger value="emojis">إدارة الإيموجي</TabsTrigger>
            <TabsTrigger value="alphabets">إدارة الحروف</TabsTrigger>
          </TabsList>
          <TabsContent value="emojis">
            <Card className="border-0">
              <CardContent className="pt-6">
                <ListManager list={emojiList} setList={setEmojiList} onSave={handleSaveEmojis} onReset={handleResetEmojis} />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="alphabets">
            <Card className="border-0">
              <CardContent className="pt-6">
                 <ListManager list={alphabetList} setList={setAlphabetList} onSave={handleSaveAlphabets} onReset={handleResetAlphabets} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
