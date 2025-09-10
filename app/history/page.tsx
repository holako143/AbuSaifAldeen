"use client"

import { useRef } from "react";
import { HistoryList } from "@/components/settings/history-list";
import { Button } from "@/components/ui/button";
import { useHistory } from "@/hooks/use-history";
import { useToast } from "@/hooks/use-toast";
import { Upload, Download } from "lucide-react";
import { saveAs } from "file-saver";

export default function HistoryPage() {
  const { history, replaceHistory } = useHistory();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    if (history.length === 0) {
      toast({ title: "Nothing to export.", variant: "destructive" });
      return;
    }
    const jsonString = JSON.stringify(history, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    saveAs(blob, "shiffration-history.json");
    toast({ title: "History exported successfully!" });
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const newHistory = JSON.parse(content);
        // Basic validation
        if (Array.isArray(newHistory) && newHistory.every(item => 'id' in item && 'text' in item)) {
          replaceHistory(newHistory);
          toast({ title: "History imported successfully!" });
        } else {
          throw new Error("Invalid file format.");
        }
      } catch (error) {
        toast({
          title: "Import failed.",
          description: "The selected file is not a valid history file.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
    // Reset file input
    if(event.target) event.target.value = '';
  };

  return (
    <div className="container max-w-2xl py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">سجل التشفير</h1>
        <div className="flex space-x-2">
            <Button onClick={handleImportClick} variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Import
            </Button>
            <Button onClick={handleExport} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export
            </Button>
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".json"
                onChange={handleFileChange}
            />
        </div>
      </div>
      <HistoryList />
    </div>
  );
}
