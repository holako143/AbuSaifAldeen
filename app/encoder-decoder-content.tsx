"use client"

import { useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Download, Eye, EyeOff } from "lucide-react"
import QRCode from "react-qr-code"
import { saveAs } from 'file-saver';
import { saveSvgAsPng } from 'save-svg-as-png';
import { QrScanner } from "@/components/qr-scanner"
import { CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { encoders } from "@/lib/encoders"
import { EmojiSelector } from "@/components/emoji-selector"
import { useEmojiList } from "@/hooks/use-emoji-list"
import { useToast } from "@/hooks/use-toast"
import { useSecurity } from "@/hooks/use-security"
import { Input } from "@/components/ui/input"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { TextAreaWithControls } from "./components/text-area-with-controls"
import { useAppStore } from "@/hooks/use-app-store"

export function Base64EncoderDecoderContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { emojis, alphabet } = useEmojiList()
  const { settings: securitySettings } = useSecurity()
  const passwordInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const qrCodeContainerRef = useRef<HTMLDivElement>(null)

  const {
    inputText, setInputText,
    outputText, setOutputText,
    errorText, setErrorText,
    selectedEmoji, setSelectedEmoji,
    algorithm,
    copyButtonText, setCopyButtonText,
    isPasswordDialogOpen, setIsPasswordDialogOpen,
    isQrDialogOpen, setIsQrDialogOpen,
    isScannerOpen, setIsScannerOpen,
    showPassword, setShowPassword,
    autoDecodeQr,
    clearOutput,
  } = useAppStore();

  const mode = searchParams.get("mode") || "encode"
  const isEncoding = mode === "encode"

  const updateMode = (newMode: string) => {
    const params = new URLSearchParams(searchParams)
    params.set("mode", newMode)
    router.replace(`?${params.toString()}`)
  }

  useEffect(() => {
    if (!searchParams.has("mode")) {
      updateMode("encode")
    }
    const textFromHistory = searchParams.get("text")
    if (textFromHistory) {
      setInputText(textFromHistory)
    }
  }, [searchParams])

  useEffect(() => {
    const encoder = encoders[algorithm]
    const options: { emoji?: string; password?: string } = {}
    if (encoder.requiresEmoji) options.emoji = selectedEmoji

    if (isEncoding) {
      if (encoder.requiresPassword && securitySettings.isPasswordEnabled) {
        if (!securitySettings.password) {
          setErrorText("Password is set in settings, but it is empty.")
          return
        }
        options.password = securitySettings.password
      }
      try {
        const result = encoder.encode(inputText, options)
        setOutputText(result)
      } catch (e: any) {
        setErrorText(e.message)
      }
    } else { // Decoding
      if (!inputText) {
        clearOutput()
        return
      }
      try {
        const result = encoder.decode(inputText, options)
        setOutputText(result)
      } catch (e: any) {
        if (encoder.requiresPassword) {
          setIsPasswordDialogOpen(true)
          setErrorText("This might be password protected.")
        } else {
          setErrorText(e.message)
        }
      }
    }
  }, [mode, selectedEmoji, inputText, securitySettings, algorithm])

  const handlePasswordSubmit = () => {
    const password = passwordInputRef.current?.value
    if (!password) {
      toast({ title: "Password is required.", variant: "destructive" })
      return
    }
    try {
      const encoder = encoders[algorithm]
      const decoded = encoder.decode(inputText, { password })
      setOutputText(decoded)
      toast({ title: "Decoded successfully with password!" })
    } catch (e) {
      setErrorText("Failed to decode. The password may be incorrect.")
      toast({ title: "Decoding Failed", description: "Incorrect password or corrupted data.", variant: "destructive"})
    }
    setIsPasswordDialogOpen(false)
  }

  const handleModeToggle = (checked: boolean) => {
    updateMode(checked ? "encode" : "decode")
    setInputText("")
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ text: outputText }).catch((err) => console.error("Could not share text: ", err))
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(outputText).then(
      () => {
        setCopyButtonText("Copied!")
        setTimeout(() => setCopyButtonText("Copy"), 2000)
      },
      (err) => console.error("Could not copy text: ", err)
    )
  }

  const handleSwap = () => {
    if (!outputText) return;
    setInputText(outputText);
    updateMode('decode');
  }

  const handleDownload = () => {
    if (!outputText) {
      toast({ title: "Nothing to download.", variant: "destructive" });
      return;
    }
    const blob = new Blob([outputText], { type: "text/plain" });
    saveAs(blob, "shiffration-output.txt");
    toast({ title: "Output downloaded!" });
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result;
      if (typeof content === 'string') {
        setInputText(content)
        toast({ title: "File loaded successfully!" });
      } else {
        toast({ title: "Failed to read file.", description: "File content is not text.", variant: "destructive" });
      }
    };
    reader.onerror = () => {
      toast({ title: "Error reading file.", variant: "destructive" });
    }
    reader.readAsText(file);
  }

  const handleSaveQrCode = () => {
    const svgElement = qrCodeContainerRef.current?.querySelector('svg');
    if (svgElement) {
      saveSvgAsPng(svgElement, 'shiffration-qr-code.png', { scale: 5 });
      toast({ title: "QR Code saved!" });
    } else {
      toast({ title: "Error generating QR code image.", variant: "destructive" });
    }
  };

  const handleQrScanSuccess = (decodedText: string) => {
    setIsScannerOpen(false);
    if (autoDecodeQr) {
      try {
        const encoder = encoders[algorithm];
        const options: { password?: string } = {};
        if (encoder.requiresPassword && securitySettings.isPasswordEnabled) {
          options.password = securitySettings.password;
        }
        const result = encoder.decode(decodedText, options);
        setOutputText(result);
        toast({ title: "QR Code Scanned & Decoded!", description: "Result has been placed in the output box." });
      } catch(e: any) {
        setErrorText(e.message);
        toast({ title: "QR Decode Failed", description: "Could not decode the QR content.", variant: "destructive" });
      }
    } else {
      setInputText(decodedText);
      toast({ title: "QR Code Scanned!", description: "Content has been placed in the input box." });
    }
  };

  return (
    <CardContent className="space-y-4">
      <div className="flex items-center justify-center space-x-2">
        <Label htmlFor="mode-toggle">فك التشفير</Label>
        <Switch id="mode-toggle" checked={isEncoding} onCheckedChange={handleModeToggle} />
        <Label htmlFor="mode-toggle">تشفير النص</Label>
      </div>

      <TextAreaWithControls
        id="input"
        value={inputText}
        placeholder={isEncoding ? "أكتب النص الذي تريد تشفيرة" : "الصق الرمز المشفر"}
        isReadOnly={false}
        isEncoding={isEncoding}
        charCount={inputText.length}
        byteCount={new TextEncoder().encode(inputText).length}
        onValueChange={setInputText}
        onClear={() => setInputText('')}
        onPaste={async () => setInputText(await navigator.clipboard.readText())}
        onFileSelect={handleFileSelect}
        onScan={() => setIsScannerOpen(true)}
        fileInputRef={fileInputRef}
      />

      {algorithm === 'emojiCipher' && (
        <Tabs defaultValue="emoji" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="emoji" disabled={!isEncoding}>الايقونات</TabsTrigger>
            <TabsTrigger value="alphabet" disabled={!isEncoding}>الحروف</TabsTrigger>
          </TabsList>
          <TabsContent value="emoji">
            <EmojiSelector onEmojiSelect={setSelectedEmoji} selectedEmoji={selectedEmoji} emojiList={emojis.list} disabled={!isEncoding} />
          </TabsContent>
          <TabsContent value="alphabet">
            <EmojiSelector onEmojiSelect={setSelectedEmoji} selectedEmoji={selectedEmoji} emojiList={alphabet.list} disabled={!isEncoding} />
          </TabsContent>
        </Tabs>
      )}

      <TextAreaWithControls
        id="output"
        value={outputText}
        placeholder={`${isEncoding ? "نتيجة" : "نتيجة"} التشفير`}
        isReadOnly={true}
        isEncoding={isEncoding}
        charCount={outputText.length}
        byteCount={new TextEncoder().encode(outputText).length}
        onCopy={handleCopy}
        onSwap={handleSwap}
        onDownload={handleDownload}
        onShare={handleShare}
        onGenerateQr={() => setIsQrDialogOpen(true)}
        copyButtonText={copyButtonText}
        fileInputRef={fileInputRef}
      />

      {errorText && <div className="text-red-500 text-center">{errorText}</div>}

      <AlertDialog open={isQrDialogOpen} onOpenChange={setIsQrDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>QR Code</AlertDialogTitle>
          </AlertDialogHeader>
          <div ref={qrCodeContainerRef} className="p-4 bg-white rounded-lg flex items-center justify-center">
            {outputText && <QRCode value={outputText} size={256} />}
          </div>
          <AlertDialogFooter>
            <Button onClick={handleSaveQrCode}>
              <Download className="mr-2 h-4 w-4" />
              Save
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
              onScanSuccess={handleQrScanSuccess}
              onScanError={(error) => {
                console.error("QR Scan Error: ", error);
                toast({ title: "QR Scan Error", description: error, variant: "destructive" });
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
