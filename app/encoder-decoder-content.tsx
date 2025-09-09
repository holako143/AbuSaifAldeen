"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { encoders } from "@/lib/encoders"
import { useAlgorithm } from "@/hooks/use-algorithm"
import { useEncoderState } from "@/hooks/use-encoder-state"
import { useSecurity } from "@/hooks/use-security"
import { useEmojiList } from "@/hooks/use-emoji-list"
import { useHistory } from "@/hooks/use-history"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EmojiSelector } from "@/components/emoji-selector"
import { Input } from "@/components/ui/input"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import QRCode from "react-qr-code"
import { QrScanner } from "@/components/qr-scanner"
import { Button } from "@/components/ui/button"
import { Download, Share2 } from "lucide-react"

import { MainControls } from "@/components/encoder/main-controls"
import { InputArea } from "@/components/encoder/input-area"
import { OutputArea } from "@/components/encoder/output-area"

export function Base64EncoderDecoderContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { addHistoryItem } = useHistory()

  const { algorithm } = useAlgorithm()
  const { settings: securitySettings } = useSecurity()
  const { lists, activeList, setActiveListId } = useEmojiList()
  const {
    inputText, outputText, setOutputText,
    errorText, setErrorText,
    mode, setMode,
    selectedEmoji, setSelectedEmoji
  } = useEncoderState();

  const passwordInputRef = useRef<HTMLInputElement>(null)
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const [isQrDialogOpen, setIsQrDialogOpen] = useState(false)
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showShare, setShowShare] = useState(false)

  // Effect to sync URL with mode state
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (params.get('mode') !== mode) {
      params.set('mode', mode);
      router.replace(`?${params.toString()}`);
    }
  }, [mode, router, searchParams]);

  // Effect to set initial state from URL params
  useEffect(() => {
    const modeFromParams = searchParams.get("mode")
    if (modeFromParams === 'encode' || modeFromParams === 'decode') {
      if (mode !== modeFromParams) {
        setMode(modeFromParams);
      }
    }
  }, [searchParams, mode, setMode]);

  // Main encoding/decoding effect
  useEffect(() => {
    const encoder = encoders[algorithm];
    const runEncode = async () => {
      const options: { emoji?: string; password?: string } = {};
      if (encoder.requiresEmoji) {
        options.emoji = selectedEmoji;
      }
      if (encoder.requiresPassword && securitySettings.isPasswordEnabled) {
        if (!securitySettings.password) {
          setOutputText("");
          setErrorText("Password is set in settings, but it is empty.");
          return;
        }
        options.password = securitySettings.password;
      }
      const output = await encoder.encode(inputText, options);
      setOutputText(output);
      setErrorText("");
      if (inputText) {
        addHistoryItem({ text: inputText, result: output, mode: 'encode', algorithm, emoji: selectedEmoji });
      }
    };

    const runDecode = async () => {
      if (!inputText) {
        setOutputText("");
        setErrorText("");
        return;
      }
      try {
        const output = await encoder.decode(inputText, {});
        setOutputText(output);
        setErrorText("");
        if (inputText) {
          addHistoryItem({ text: inputText, result: output, mode: 'decode', algorithm });
        }
      } catch (e) {
        if (encoder.requiresPassword) {
          setIsPasswordDialogOpen(true);
          setOutputText("");
          setErrorText("This might be password protected. Please enter the password.");
        } else {
          setOutputText("");
          setErrorText("Decoding failed.");
          toast({ title: "Decoding Failed", variant: "destructive" });
        }
      }
    };

    if (mode === 'encode') {
      runEncode();
    } else {
      runDecode();
    }
  }, [inputText, mode, algorithm, selectedEmoji, securitySettings, setOutputText, setErrorText, toast, setIsPasswordDialogOpen]);

  const handlePasswordSubmit = async () => {
    const password = passwordInputRef.current?.value
    if (!password) {
      toast({ title: "Password is required.", variant: "destructive" })
      return
    }
    try {
      const encoder = encoders[algorithm]
      const decoded = await encoder.decode(inputText, { password })
      setOutputText(decoded)
      setErrorText("")
      toast({ title: "Decoded successfully with password!" })
    } catch (e) {
      setOutputText("")
      setErrorText("Failed to decode. The password may be incorrect.")
      toast({ title: "Decoding Failed", description: "Incorrect password or corrupted data.", variant: "destructive"})
    }
    setIsPasswordDialogOpen(false)
  }

  const getQrCodeAsPng = (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const svgContainer = document.getElementById('qr-code-container');
      const svgElement = svgContainer?.querySelector('svg');
      if (!svgElement) {
        resolve(null);
        return;
      }
      const canvas = document.createElement('canvas');
      const padding = 20;
      const size = 256;
      canvas.width = size + padding * 2;
      canvas.height = size + padding * 2;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(null);
        return;
      }
      const xml = new XMLSerializer().serializeToString(svgElement);
      const img = new Image();
      img.onload = () => {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, padding, padding, size, size);
        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/png');
      };
      img.src = 'data:image/svg+xml;base64,' + window.btoa(xml);
    });
  }

  const handleSaveQrCode = async () => {
    const blob = await getQrCodeAsPng();
    if (!blob) {
      toast({ title: "Error generating QR code image.", variant: "destructive" });
      return;
    }
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'shiffration-qr-code.png';
    link.click();
    URL.revokeObjectURL(url);
    toast({ title: "QR Code saved!" });
  }

  const handleShareQrCode = async () => {
    const blob = await getQrCodeAsPng();
    if (!blob) {
      toast({ title: "Error generating QR code image.", variant: "destructive" });
      return;
    }
    try {
      const file = new File([blob], "shiffration-qr-code.png", { type: "image/png" });
      await navigator.share({
        title: "Shiffration QR Code",
        text: "Check out this encrypted message!",
        files: [file],
      });
    } catch (error) {
      console.error("Share failed:", error);
      toast({ title: "Share failed.", description: "Could not share the QR code.", variant: "destructive" });
    }
  }

  const isEncoding = mode === 'encode';

  return (
    <CardContent className="space-y-4">
      <MainControls />

      <InputArea
        setIsScannerOpen={setIsScannerOpen}
        setIsPasswordDialogOpen={setIsPasswordDialogOpen}
      />

      <div className="text-sm text-muted-foreground text-right -mt-2">
        {inputText.length} characters, {new TextEncoder().encode(inputText).length} bytes
      </div>

      {isEncoding && algorithm === 'emojiCipher' && (
        <div className="space-y-2">
          <Label>اختر قائمة الرموز</Label>
          <Select value={activeList?.id} onValueChange={(id) => setActiveListId(id)}>
            <SelectTrigger>
              <SelectValue placeholder="Select a symbol list" />
            </SelectTrigger>
            <SelectContent>
              {lists.map(list => (
                <SelectItem key={list.id} value={list.id}>{list.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <EmojiSelector
            onEmojiSelect={setSelectedEmoji}
            selectedEmoji={selectedEmoji}
            emojiList={activeList?.symbols || []}
            disabled={false}
          />
        </div>
      )}

      <OutputArea
        setIsQrDialogOpen={setIsQrDialogOpen}
        setShowShare={setShowShare}
        showShare={showShare}
      />

      {errorText && <div className="text-red-500 text-center">{errorText}</div>}

      {/* Dialogs */}
      <AlertDialog open={isQrDialogOpen} onOpenChange={setIsQrDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>QR Code</AlertDialogTitle>
          </AlertDialogHeader>
          <div id="qr-code-container" className="p-4 bg-white rounded-lg flex items-center justify-center">
            {outputText && <QRCode value={outputText} size={256} />}
          </div>
          <AlertDialogFooter>
            <Button variant="outline" onClick={handleShareQrCode} disabled={!navigator.share}>
              <Share2 className="mr-2 h-4 w-4" /> Share
            </Button>
            <Button onClick={handleSaveQrCode}>
              <Download className="mr-2 h-4 w-4" /> Save
            </Button>
            <AlertDialogCancel>Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Password Required</AlertDialogTitle>
            <AlertDialogDescription>
              This content appears to be password protected. Please enter the password to decode it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="relative">
            <Input
              ref={passwordInputRef}
              type={showPassword ? "text" : "password"}
              placeholder="Enter password..."
              onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute top-1/2 right-2 -translate-y-1/2 h-7 w-7"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handlePasswordSubmit}>Decode</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={isScannerOpen} onOpenChange={setIsScannerOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Scan QR Code</AlertDialogTitle>
          </AlertDialogHeader>
          {isScannerOpen && (
            <QrScanner
              onScanSuccess={(text) => {
                setMode('decode');
                setInputText(text);
                setIsScannerOpen(false);
                toast({ title: "QR Code Scanned!", description: "Content has been placed in the input box." });
              }}
              onScanError={(error) => {
                console.error("QR Scan Error: ", error);
              }}
            />
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </CardContent>
  )
}
