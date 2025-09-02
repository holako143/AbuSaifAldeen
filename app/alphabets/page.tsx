"use client"

import { useEffect, useState } from "react"
import { getAlphabets, updateAlphabets, Alphabets } from "@/lib/alphabets"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { X } from "lucide-react"

export default function AlphabetsPage() {
  const [alphabets, setAlphabets] = useState<Alphabets>({ emojis: [], letters: [] });
  const [newEmoji, setNewEmoji] = useState("");
  const [newLetter, setNewLetter] = useState("");

  useEffect(() => {
    setAlphabets(getAlphabets());
  }, []);

  const handleAdd = (type: keyof Alphabets) => {
    const value = type === 'emojis' ? newEmoji : newLetter;
    if (!value || alphabets[type].includes(value)) return; // Prevent empty or duplicate entries

    const newAlphabets = { ...alphabets, [type]: [...alphabets[type], value] };
    setAlphabets(newAlphabets);
    updateAlphabets(newAlphabets);

    if (type === 'emojis') setNewEmoji("");
    else setNewLetter("");
  };

  const handleDelete = (type: keyof Alphabets, value: string) => {
    // TODO: Add a confirmation dialog for a better UX
    const newAlphabets = { ...alphabets, [type]: alphabets[type].filter(item => item !== value) };
    setAlphabets(newAlphabets);
    updateAlphabets(newAlphabets);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">إدارة الايموجي والاحرف</h1>
      <div className="grid md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>قائمة الايقونات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              <Input
                value={newEmoji}
                onChange={(e) => setNewEmoji(e.target.value)}
                placeholder="أضف ايقون جديد"
              />
              <Button onClick={() => handleAdd('emojis')}>إضافة</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {alphabets.emojis.map(emoji => (
                <Badge key={emoji} variant="outline" className="relative pl-6 text-lg">
                  {emoji}
                  <button onClick={() => handleDelete('emojis', emoji)} className="absolute -top-2 -left-2 h-5 w-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center hover:bg-destructive/80">
                    <X size={12} />
                  </button>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>قائمة الحروف</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              <Input
                value={newLetter}
                onChange={(e) => setNewLetter(e.target.value)}
                placeholder="أضف حرف جديد"
              />
              <Button onClick={() => handleAdd('letters')}>إضافة</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {alphabets.letters.map(letter => (
                <Badge key={letter} variant="outline" className="relative pl-6 text-lg">
                  {letter}
                  <button onClick={() => handleDelete('letters', letter)} className="absolute -top-2 -left-2 h-5 w-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center hover:bg-destructive/80">
                    <X size={12} />
                  </button>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
