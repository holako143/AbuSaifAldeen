"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Copy, Share, ClipboardPaste, Trash2, QrCode, Camera, Download, Share2 } from "lucide-react"
import QRCode from "react-qr-code"
import { QrScanner } from "@/components/qr-scanner"
import { Textarea } from "@/components/ui/textarea"
import { CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { decode, encode } from "./encoding"
import { EmojiSelector } from "@/components/emoji-selector"
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
  const [isQrCodeTooLong, setIsQrCodeTooLong] = useState(false)

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
      const decoded = decode(inputText, password)
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
    if (isEncoding) {
      const password = securitySettings.isPasswordEnabled ? securitySettings.password : undefined
      if (securitySettings.isPasswordEnabled && !password) {
        setOutputText("")
        setErrorText("Password is set in settings, but it is empty.")
        return
      }
      const output = encode(selectedEmoji, inputText, password)
      setOutputText(output)
      setErrorText("")
    } else { // Decoding
      if (!inputText) {
        setOutputText("")
        setErrorText("")
        return
      }
      try {
        const output = decode(inputText)
        setOutputText(output)
        setErrorText("")
      } catch (e) {
        // Decoding failed, assume it's password protected
        setIsPasswordDialogOpen(true)
        setOutputText("")
        setErrorText("This might be password protected. Please enter the password.")
      }
    }
  }, [mode, selectedEmoji, inputText, securitySettings])

  useEffect(() => {
    const QR_CODE_MAX_BYTES = 2800;
    const byteSize = new TextEncoder().encode(outputText).length;
    setIsQrCodeTooLong(byteSize > QR_CODE_MAX_BYTES);
  }, [outputText]);

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

  const handleClear = () => setInputText("")

  const handlePaste = () => {
    navigator.clipboard.readText().then(
      (text) => setInputText(text),
      (err) => console.error("Failed to read clipboard contents: ", err)
    )
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
      const { width, height } = svgElement.getBBox();
      canvas.width = width + padding * 2;
      canvas.height = height + padding * 2;
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
        ctx.drawImage(img, padding, padding);
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
      <p className="text-sm sm:text-base">شفر الي تشتيه وانبسط 😋 </p>
      <div className="flex items-center justify-center space-x-2">
        <Label htmlFor="mode-toggle">فك التشفير</Label>
        <Switch id="mode-toggle" checked={isEncoding} onCheckedChange={handleModeToggle} />
        <Label htmlFor="mode-toggle">تشفير النص</Label>
      </div>
      <div className="relative">
        <Textarea
          placeholder={isEncoding ? "أكتب النص الذي تريد تشفيرة" : "الصق الرمز المشفر"}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="min-h-[100px] pl-12"
        />
        <div className="absolute top-2 left-2 flex flex-col">
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
      </div>
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
      <div className="relative">
        <Textarea
          placeholder={`${isEncoding ? "نتيجة" : "نتيجة"} التشفير`}
          value={outputText}
          readOnly
          className="min-h-[100px] pl-12"
        />
        <div className="absolute top-2 left-2 flex flex-col">
          <Button variant="ghost" size="icon" onClick={() => setIsQrDialogOpen(true)} disabled={!outputText || isQrCodeTooLong} title="Generate QR Code">
            <QrCode className="h-5 w-5" />
          </Button>
          {showShare && (
            <Button variant="ghost" size="icon" onClick={handleShare} disabled={!outputText} title="Share">
              <Share className="h-5 w-5" />
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={handleCopy} disabled={!outputText} title={copyButtonText}>
            <Copy className="h-5 w-5" />
          </Button>
        </div>
      </div>
      {isQrCodeTooLong && <div className="text-orange-600 text-sm text-center">النص الناتج طويل جدًا ولا يمكن تمثيله في رمز QR واحد.</div>}
      {errorText && <div className="text-red-500 text-center">{errorText}</div>}
      <AlertDialog open={isQrDialogOpen} onOpenChange={setIsQrDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>QR Code</AlertDialogTitle>
            <AlertDialogDescription>
              This QR code contains the encoded output. You can save or share it.
            </AlertDialogDescription>
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
          <Input
            ref={passwordInputRef}
            type="password"
            placeholder="Enter password..."
            onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
          />
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
            <AlertDialogDescription>
              Point your camera at a QR code to scan its content into the input box.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {isScannerOpen && (
            <QrScanner
              onScanSuccess={(text) => {
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
