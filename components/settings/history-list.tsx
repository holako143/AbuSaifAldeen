"use client"

import { useRouter } from "next/navigation"
import { useHistory, type HistoryItem } from "@/hooks/use-history"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2, Copy, ArrowRightLeft, Trash, Share, Upload, Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useEffect, useState, useRef } from "react"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

function isValidHistoryItem(item: any): item is HistoryItem {
  return (
    typeof item === 'object' &&
    item !== null &&
    typeof item.id === 'string' &&
    typeof item.text === 'string' &&
    typeof item.date === 'string' &&
    (item.mode === 'encode' || item.mode === 'decode') &&
    typeof item.result === 'string' &&
    typeof item.algorithm === 'string'
  );
}

import { Input } from "@/components/ui/input"

export function HistoryList() {
  const router = useRouter()
  const { history, deleteHistoryItem, clearHistory, replaceHistory } = useHistory()
  const { toast } = useToast()
  const [showShare, setShowShare] = useState(false)
  const [filter, setFilter] = useState<'all' | 'encode' | 'decode'>('all')
  const [searchTerm, setSearchTerm] = useState("")
  const importInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (navigator.share) {
      setShowShare(true)
    }
  }, [])

  const handleShare = (text: string) => {
    if (navigator.share) {
      navigator.share({ text }).catch((err) => console.error("Could not share", err))
    }
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({ title: "Copied to clipboard!" })
  }

  const handleUse = (item: HistoryItem) => {
    const params = new URLSearchParams()
    params.set("mode", item.mode)
    params.set("text", item.text)
    router.push(`/?${params.toString()}`)
  }

  const handleExport = () => {
    if(history.length === 0) {
      toast({ title: "No history to export.", variant: "destructive" })
      return;
    }
    const dataStr = JSON.stringify(history, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.download = "shiffration-history.json";
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
    toast({ title: "History exported successfully!" });
  }

  const handleImportClick = () => {
    importInputRef.current?.click();
  }

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result;
        if (typeof content !== 'string') throw new Error("File content is not a string.");
        const newHistory = JSON.parse(content);
        
        if (!Array.isArray(newHistory) || !newHistory.every(isValidHistoryItem)) {
          throw new Error("Invalid file format or content.");
        }
        
        replaceHistory(newHistory);
        toast({ title: "History imported successfully!" });
      } catch (error) {
        toast({ title: "Failed to import history.", description: String(error), variant: "destructive" });
      } finally {
        // Reset file input to allow importing the same file again
        if (event.target) {
          event.target.value = "";
        }
      }
    };
    reader.readAsText(file);
  }

  const filteredHistory = history.filter(item => {
    const modeMatch = filter === 'all' || item.mode === filter;
    const searchMatch = searchTerm === "" ||
                        item.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        item.result.toLowerCase().includes(searchTerm.toLowerCase());
    return modeMatch && searchMatch;
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          placeholder="ابحث في السجل..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-xs"
        />
      </div>
      <div className="flex flex-wrap gap-2 items-center">
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          تصدير
        </Button>
        <Button variant="outline" size="sm" onClick={handleImportClick}>
          <Upload className="mr-2 h-4 w-4" />
          استيراد
        </Button>
        <input type="file" ref={importInputRef} onChange={handleImport} accept=".json" className="hidden" />
        <Button variant="destructive" size="sm" onClick={clearHistory}>
          <Trash className="mr-2 h-4 w-4" />
          مسح السجل
        </Button>
      </div>

      <ToggleGroup type="single" value={filter} onValueChange={(value) => setFilter(value || 'all')} className="justify-start">
        <ToggleGroupItem value="all">الكل</ToggleGroupItem>
        <ToggleGroupItem value="encode">سجل التشفير</ToggleGroupItem>
        <ToggleGroupItem value="decode">سجل فك التشفير</ToggleGroupItem>
      </ToggleGroup>

      {filteredHistory.length === 0 ? (
        <p className="pt-4">لا يوجد سجل لعرضه حسب الفلتر المحدد.</p>
      ) : (
        filteredHistory.map((item) => (
          <Card key={item.id} className="card-hover-effect">
            <CardHeader>
              <CardTitle className="text-sm font-normal flex justify-between">
                <span>
                  <span className="font-bold">{item.mode === "encode" ? "تشفير" : "فك تشفير"}</span> - {item.date}
                </span>
                <span className="text-muted-foreground font-mono text-xs">{item.algorithm}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="font-mono text-xs break-all">
                <strong>النص الأصلي:</strong> {item.text}
              </div>
              <div className="font-mono text-xs break-all">
                <strong>النتيجة:</strong> {item.result}
              </div>
              {item.mode === 'encode' && item.emoji && (
                <div className="font-mono text-xs">
                  <strong>الايقونة:</strong> {item.emoji}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              {showShare && (
                <Button variant="ghost" size="icon" title="Share Result" onClick={() => handleShare(item.result)}>
                  <Share className="h-4 w-4" />
                </Button>
              )}
              <Button variant="ghost" size="icon" title="Copy Result" onClick={() => handleCopy(item.result)}>
                <Copy className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" title="Use This Entry" onClick={() => handleUse(item)}>
                <ArrowRightLeft className="h-4 w-4" />
              </Button>
              <Button variant="destructive" size="icon" title="Delete Entry" onClick={() => deleteHistoryItem(item.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        ))
      )}
    </div>
  )
}
