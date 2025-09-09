"use client"

import * as React from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { useEncoderState } from "@/hooks/use-encoder-state"
import { useToast } from "@/hooks/use-toast"
import { FileUp, Camera, ClipboardPaste, Trash2 } from "lucide-react"

interface InputAreaProps {
  setIsScannerOpen: (isOpen: boolean) => void;
}

export function InputArea({ setIsScannerOpen }: InputAreaProps) {
  const { inputText, setInputText, mode } = useEncoderState();
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const isEncoding = mode === 'encode';

  const handleClear = () => setInputText("");

  const handlePaste = () => {
    navigator.clipboard.readText().then(
      (text) => setInputText(text),
      (err) => console.error("Failed to read clipboard contents: ", err)
    );
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result;
      if (typeof content === 'string') {
        setInputText(content);
        toast({ title: "File loaded successfully!" });
      } else {
        toast({ title: "Failed to read file.", description: "File content is not text.", variant: "destructive" });
      }
    };
    reader.onerror = () => {
      toast({ title: "Error reading file.", variant: "destructive" });
    };
    reader.readAsText(file);
  };

  return (
    <div>
      <Textarea
        placeholder={isEncoding ? "أكتب النص الذي تريد تشفيرة" : "الصق الرمز المشفر"}
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        className="min-h-[100px]"
      />
      <div className="flex justify-center items-center space-x-2 mt-2">
        <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} title="Upload File">
          <FileUp className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => setIsScannerOpen(true)} title="Scan QR Code">
          <Camera className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={handlePaste} title="Paste">
          <ClipboardPaste className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleClear} disabled={!inputText} title="Clear">
          <Trash2 className="h-5 w-5" />
        </Button>
      </div>
      <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
    </div>
  );
}
