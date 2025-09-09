"use client"

import * as React from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { useEncoderState } from "@/hooks/use-encoder-state"
import { useToast } from "@/hooks/use-toast"
import { QrCode, Share, ArrowUpDown, FileDown, Copy } from "lucide-react"

interface OutputAreaProps {
  setIsQrDialogOpen: (isOpen: boolean) => void;
  setShowShare: (show: boolean) => void;
  showShare: boolean;
}

export function OutputArea({ setIsQrDialogOpen, setShowShare, showShare }: OutputAreaProps) {
  const {
    outputText,
    setInputText,
    mode, setMode
  } = useEncoderState();
  const { toast } = useToast();
  const [copyButtonText, setCopyButtonText] = React.useState("Copy");
  const isEncoding = mode === 'encode';

  const handleCopy = () => {
    navigator.clipboard.writeText(outputText).then(
      () => {
        setCopyButtonText("Copied!");
        setTimeout(() => setCopyButtonText("Copy"), 2000);
      },
      (err) => console.error("Could not copy text: ", err)
    );
  };

  const handleSwap = () => {
    setInputText(outputText);
    setMode(mode === 'encode' ? 'decode' : 'encode');
  };

  const handleDownload = () => {
    if (!outputText) {
      toast({ title: "Nothing to download.", variant: "destructive" });
      return;
    }
    const blob = new Blob([outputText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = "shiffration-output.txt";
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
    toast({ title: "Output downloaded!" });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ text: outputText }).catch((err) => console.error("Could not share text: ", err));
    }
  };

  React.useEffect(() => {
    if (navigator.share) {
      setShowShare(true);
    }
  }, [setShowShare]);

  return (
    <div>
      <Textarea
        placeholder={`${isEncoding ? "نتيجة" : "نتيجة"} التشفير`}
        value={outputText}
        readOnly
        className="min-h-[100px]"
      />
      <div className="flex justify-center items-center space-x-2 mt-2">
        <Button variant="ghost" size="icon" onClick={() => setIsQrDialogOpen(true)} disabled={!outputText} title="Generate QR Code">
          <QrCode className="h-5 w-5" />
        </Button>
        {showShare && (
          <Button variant="ghost" size="icon" onClick={handleShare} disabled={!outputText} title="Share">
            <Share className="h-5 w-5" />
          </Button>
        )}
        <Button variant="ghost" size="icon" onClick={handleSwap} disabled={!outputText} title="Swap Input and Output">
          <ArrowUpDown className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleDownload} disabled={!outputText} title="Download Output">
          <FileDown className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleCopy} disabled={!outputText} title={copyButtonText}>
          <Copy className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
