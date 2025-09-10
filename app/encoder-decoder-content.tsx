"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Copy, Share, ClipboardPaste, Trash2 } from "lucide-react"
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
      {errorText && <div className="text-red-500 text-center">{errorText}</div>}
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
    </CardContent>
  )
}
