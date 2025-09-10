"use client"

import { useEffect, useReducer, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Download, Eye, EyeOff, Share2 } from "lucide-react"
import QRCode from "react-qr-code"
import { QrScanner } from "@/components/qr-scanner"
import { CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { encoders, Algorithm } from "@/lib/encoders"
import { EmojiSelector } from "@/components/emoji-selector"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { TextAreaWithControls } from "./components/text-area-with-controls"
import { initialState, reducer } from "./reducer"

export function Base64EncoderDecoderContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { addHistoryItem } = useHistory()
  const { toast } = useToast()
  const { emojis, alphabet } = useEmojiList()
  const { settings: securitySettings } = useSecurity()
  const passwordInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const qrCodeContainerRef = useRef<HTMLDivElement>(null)

  const [state, dispatch] = useReducer(reducer, initialState)
  const {
    inputText,
    outputText,
    errorText,
    selectedEmoji,
    algorithm,
    copyButtonText,
    isPasswordDialogOpen,
    isQrDialogOpen,
    isScannerOpen,
    showPassword,
  } = state

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
      dispatch({ type: 'SET_INPUT_TEXT', payload: textFromHistory })
    }
  }, [searchParams])

  useEffect(() => {
    const encoder = encoders[algorithm]
    const options: { emoji?: string; password?: string } = {}
    if (encoder.requiresEmoji) options.emoji = selectedEmoji

    if (isEncoding) {
      if (encoder.requiresPassword && securitySettings.isPasswordEnabled) {
        if (!securitySettings.password) {
          dispatch({ type: 'SET_ERROR', payload: "Password is set in settings, but it is empty." })
          return
        }
        options.password = securitySettings.password
      }
      try {
        const result = encoder.encode(inputText, options)
        dispatch({ type: 'ENCODE_SUCCESS', payload: result })
      } catch (e: any) {
        dispatch({ type: 'SET_ERROR', payload: e.message })
      }
    } else { // Decoding
      if (!inputText) {
        dispatch({ type: 'CLEAR_OUTPUT' })
        return
      }
      try {
        const result = encoder.decode(inputText, options)
        dispatch({ type: 'DECODE_SUCCESS', payload: result })
      } catch (e: any) {
        if (encoder.requiresPassword) {
          dispatch({ type: 'REQUEST_PASSWORD' })
        } else {
          dispatch({ type: 'SET_ERROR', payload: e.message })
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
      dispatch({ type: 'DECODE_SUCCESS', payload: decoded })
      toast({ title: "Decoded successfully with password!" })
    } catch (e) {
      dispatch({ type: 'SET_ERROR', payload: "Failed to decode. The password may be incorrect." })
      toast({ title: "Decoding Failed", description: "Incorrect password or corrupted data.", variant: "destructive"})
    }
    dispatch({ type: 'CLOSE_PASSWORD_DIALOG' })
  }

  const handleModeToggle = (checked: boolean) => {
    updateMode(checked ? "encode" : "decode")
    dispatch({ type: 'SET_INPUT_TEXT', payload: "" })
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ text: outputText }).catch((err) => console.error("Could not share text: ", err))
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(outputText).then(
      () => {
        dispatch({ type: 'SET_COPY_BUTTON_TEXT', payload: "Copied!" })
        setTimeout(() => dispatch({ type: 'SET_COPY_BUTTON_TEXT', payload: "Copy" }), 2000)
      },
      (err) => console.error("Could not copy text: ", err)
    )
  }

  const handleSave = () => {
    if (!outputText) {
      toast({ title: "Nothing to save.", variant: "destructive" });
      return;
    }
    addHistoryItem({
      text: inputText,
      result: outputText,
      mode: mode as 'encode' | 'decode',
      emoji: selectedEmoji
    });
    toast({ title: "Saved to history!" });
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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result;
      if (typeof content === 'string') {
        dispatch({ type: 'SET_INPUT_TEXT', payload: content })
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
      const svgElement = qrCodeContainerRef.current?.querySelector('svg');
      if (!svgElement) return resolve(null);

      const canvas = document.createElement('canvas');
      const padding = 20;
      const { width, height } = svgElement.getBBox();
      canvas.width = width + padding * 2;
      canvas.height = height + padding * 2;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(null);

      const xml = new XMLSerializer().serializeToString(svgElement);
      const img = new Image();
      img.onload = () => {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, padding, padding);
        canvas.toBlob((blob) => resolve(blob), 'image/png');
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

  return (
    <CardContent className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm sm:text-base">شفر الي تشتيه وانبسط 😋 </p>
        <Select value={algorithm} onValueChange={(value) => dispatch({ type: 'SET_ALGORITHM', payload: value as Algorithm })}>
          <SelectTrigger className="w-[180px]" aria-label="Algorithm">
            <SelectValue placeholder="Algorithm" />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(encoders).map((key) => (
              <SelectItem key={key} value={key}>{encoders[key as Algorithm].name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
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
        onValueChange={(value) => dispatch({ type: 'SET_INPUT_TEXT', payload: value })}
        onClear={() => dispatch({ type: 'SET_INPUT_TEXT', payload: '' })}
        onPaste={async () => dispatch({ type: 'SET_INPUT_TEXT', payload: await navigator.clipboard.readText() })}
        onFileSelect={handleFileSelect}
        onScan={() => dispatch({ type: 'SET_SCANNER_OPEN', payload: true })}
        fileInputRef={fileInputRef}
      />

      {algorithm === 'emojiCipher' && (
        <Tabs defaultValue="emoji" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="emoji" disabled={!isEncoding}>الايقونات</TabsTrigger>
            <TabsTrigger value="alphabet" disabled={!isEncoding}>الحروف</TabsTrigger>
          </TabsList>
          <TabsContent value="emoji">
            <EmojiSelector onEmojiSelect={(emoji) => dispatch({ type: 'SET_EMOJI', payload: emoji })} selectedEmoji={selectedEmoji} emojiList={emojis.list} disabled={!isEncoding} />
          </TabsContent>
          <TabsContent value="alphabet">
            <EmojiSelector onEmojiSelect={(emoji) => dispatch({ type: 'SET_EMOJI', payload: emoji })} selectedEmoji={selectedEmoji} emojiList={alphabet.list} disabled={!isEncoding} />
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
        onSave={handleSave}
        onDownload={handleDownload}
        onShare={handleShare}
        onGenerateQr={() => dispatch({ type: 'SET_QR_DIALOG_OPEN', payload: true })}
        copyButtonText={copyButtonText}
        fileInputRef={fileInputRef} // Not used for output, but prop is required
      />

      {errorText && <div className="text-red-500 text-center">{errorText}</div>}

      <AlertDialog open={isQrDialogOpen} onOpenChange={(isOpen) => dispatch({ type: 'SET_QR_DIALOG_OPEN', payload: isOpen })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>QR Code</AlertDialogTitle>
          </AlertDialogHeader>
          <div ref={qrCodeContainerRef} className="p-4 bg-white rounded-lg flex items-center justify-center">
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

      <AlertDialog open={isPasswordDialogOpen} onOpenChange={(isOpen) => dispatch({ type: 'SET_PASSWORD_DIALOG_OPEN', payload: isOpen })}>
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
              onClick={() => dispatch({ type: 'TOGGLE_SHOW_PASSWORD' })}
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

      <AlertDialog open={isScannerOpen} onOpenChange={(isOpen) => dispatch({ type: 'SET_SCANNER_OPEN', payload: isOpen })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Scan QR Code</AlertDialogTitle>
          </AlertDialogHeader>
          {isScannerOpen && (
            <QrScanner
              onScanSuccess={(text) => {
                dispatch({ type: 'SET_INPUT_TEXT', payload: text })
                dispatch({ type: 'SET_SCANNER_OPEN', payload: false })
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
