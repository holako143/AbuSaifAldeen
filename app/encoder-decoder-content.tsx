"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Copy, Share, ClipboardPaste, Trash2, QrCode, Camera, Download, Share2, Eye, EyeOff, ArrowUpDown, FileUp, FileDown } from "lucide-react"
import QRCode from "react-qr-code"
import { QrScanner } from "@/components/qr-scanner"
import { Textarea } from "@/components/ui/textarea"
import { CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { encoders, Algorithm } from "@/lib/encoders"
import { EmojiSelector } from "@/components/emoji-selector"
import { useAlgorithm } from "@/hooks/use-algorithm"
import { useEmojiList } from "@/hooks/use-emoji-list"
import { useHistory } from "@/hooks/use-history"
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

export function Base64EncoderDecoderContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { addHistoryItem } = useHistory()
  const { toast } = useToast()
  const { emojis, alphabet } = useEmojiList()
  const { settings: securitySettings } = useSecurity()
  const passwordInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const mode = searchParams.get("mode") || "encode"
  const [inputText, setInputText] = useState("")
  const [selectedEmoji, setSelectedEmoji] = useState("😀")
  const [outputText, setOutputText] = useState("")
  const [errorText, setErrorText] = useState("")
  const [copyButtonText, setCopyButtonText] = useState("Copy")
  const [showShare, setShowShare] = useState(false)
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const [isQrDialogOpen, setIsQrDialogOpen] = useState(false)
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { algorithm } = useAlgorithm()

  const updateMode = (newMode: string) => {
    const params = new URLSearchParams(searchParams)
    params.set("mode", newMode)
    router.replace(`?${params.toString()}`)
  }

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
      setErrorText("")
      toast({ title: "Decoded successfully with password!" })
    } catch (e) {
      setOutputText("")
      setErrorText("Failed to decode. The password may be incorrect.")
      toast({ title: "Decoding Failed", description: "Incorrect password or corrupted data.", variant: "destructive"})
    }
    setIsPasswordDialogOpen(false)
  }

  useEffect(() => {
    const isEncoding = mode === "encode"
    const encoder = encoders[algorithm]

    if (isEncoding) {
      const options: { emoji?: string; password?: string } = {};
      if (encoder.requiresEmoji) {
        options.emoji = selectedEmoji;
      }
      if (encoder.requiresPassword && securitySettings.isPasswordEnabled) {
        if (!securitySettings.password) {
          setOutputText("")
          setErrorText("Password is set in settings, but it is empty.")
          return
        }
        options.password = securitySettings.password
      }
      const output = encoder.encode(inputText, options)
      setOutputText(output)
      setErrorText("")
    } else {
      if (!inputText) {
        setOutputText("")
        setErrorText("")
        return
      }
      try {
        const output = encoder.decode(inputText, {});
        setOutputText(output);
        setErrorText("");
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
    }
  }, [mode, selectedEmoji, inputText, securitySettings, algorithm])

  const handleModeToggle = (checked: boolean) => {
    updateMode(checked ? "encode" : "decode")
    setInputText("")
  }

  useEffect(() => {
    if (!searchParams.has("mode")) {
      updateMode("encode")
    }
    const textFromHistory = searchParams.get("text")
    if (textFromHistory) {
      setInputText(textFromHistory)
    }
    if (navigator.share) {
      setShowShare(true)
    }
  }, [searchParams, updateMode])

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
    setInputText(outputText);
    updateMode(mode === 'encode' ? 'decode' : 'encode');
  }

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
  }

  const handleClear = () => setInputText("")

  const handlePaste = () => {
    navigator.clipboard.readText().then(
      (text) => setInputText(text),
      (err) => console.error("Failed to read clipboard contents: ", err)
    )
  }

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
    }
    reader.readAsText(file);
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
      const size = 256; // Should match the size prop of QRCode component
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

  const isEncoding = mode === "encode"

  return (
    <CardContent className="space-y-4">
      {isEncoding && (
        <div className="flex justify-between items-center">
          <p className="text-sm sm:text-base">شفر الي تشتيه وانبسط 😋 </p>
        </div>
      )}
      <div className="flex items-center justify-center space-x-2">
        <Label htmlFor="mode-toggle">فك التشفير</Label>
        <Switch id="mode-toggle" checked={isEncoding} onCheckedChange={handleModeToggle} />
        <Label htmlFor="mode-toggle">تشفير النص</Label>
      </div>
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
      <div className="text-sm text-muted-foreground text-right -mt-2">
        {inputText.length} characters, {new TextEncoder().encode(inputText).length} bytes
      </div>
      {isEncoding && algorithm === 'emojiCipher' && (
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
      {errorText && <div className="text-red-500 text-center">{errorText}</div>}
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
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
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
              onScanSuccess={(text) => {
                updateMode('decode');
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
