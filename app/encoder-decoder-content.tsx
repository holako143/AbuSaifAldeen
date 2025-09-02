"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Copy, Share, ClipboardPaste } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { decode, encode } from "./encoding"
import { EmojiSelector } from "@/components/emoji-selector"
import AES from "crypto-js/aes"
import Utf8 from "crypto-js/enc-utf8"
import { ALPHABET_LIST, EMOJI_LIST } from "./emoji"

export function Base64EncoderDecoderContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Read mode from URL parameters, other state stored locally
  const mode = searchParams.get("mode") || "encode"
  const [inputText, setInputText] = useState<string>("")
  const [selectedEmoji, setSelectedEmoji] = useState<string>("😀")
  const [outputText, setOutputText] = useState("")
  const [errorText, setErrorText] = useState("")
  const [copyButtonText, setCopyButtonText] = useState("Copy")
  const [showShare, setShowShare] = useState(false)
  const [usePassword, setUsePassword] = useState<boolean>(false)
  const [password, setPassword] = useState<string>("")

  // Update URL when mode changes
  const updateMode = (newMode: string) => {
    const params = new URLSearchParams(searchParams)
    params.set("mode", newMode)
    router.replace(`?${params.toString()}`)
  }

  // Load state from localStorage on initial render
  useEffect(() => {
    try {
      const savedInput = localStorage.getItem("inputText")
      if (savedInput) {
        setInputText(savedInput)
      }
      const savedEmoji = localStorage.getItem("selectedEmoji")
      if (savedEmoji) {
        setSelectedEmoji(savedEmoji)
      }
    } catch (error) {
      console.error("Failed to access localStorage", error)
    }
  }, [])

  // Save state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("inputText", inputText)
      localStorage.setItem("selectedEmoji", selectedEmoji)
    } catch (error) {
      console.error("Failed to access localStorage", error)
    }
  }, [inputText, selectedEmoji])

  // Convert input whenever it changes
  useEffect(() => {
    try {
      const isEncoding = mode === "encode"
      if (isEncoding) {
        let textToEncode = inputText
        if (usePassword && password) {
          textToEncode = AES.encrypt(inputText, password).toString()
        }
        const output = encode(selectedEmoji, textToEncode)
        setOutputText(usePassword && password ? "🔐" + output : output)
        setErrorText("")
      } else {
        // Decoding
        if (inputText.startsWith("🔐")) {
          if (!password) {
            setErrorText("الرجاء إدخال كلمة المرور لفك التشفير.")
            setOutputText("")
            return
          }
          const content = inputText.substring(1)
          const decodedFromEmoji = decode(content)
          try {
            const bytes = AES.decrypt(decodedFromEmoji, password)
            const originalText = bytes.toString(Utf8)
            if (!originalText) {
              throw new Error("Invalid password or corrupted data.")
            }
            setOutputText(originalText)
            setErrorText("")
          } catch (err) {
            setErrorText("فشل فك التشفير. الرجاء التحقق من كلمة المرور.")
            setOutputText("")
          }
        } else {
          const output = decode(inputText)
          setOutputText(output)
          setErrorText("")
        }
      }
    } catch (e) {
      setOutputText("")
      setErrorText(`خطأ ${mode === "encode" ? "تشفير" : "فك تشفير"}: مدخل غير صالح`)
    }
  }, [mode, selectedEmoji, inputText, usePassword, password])

  const handleModeToggle = (checked: boolean) => {
    updateMode(checked ? "encode" : "decode")
    setInputText("") // Clear input text when mode changes
  }

  // Handle initial URL state
  useEffect(() => {
    if (!searchParams.has("mode")) {
      updateMode("encode")
    }
    if (navigator.share) {
      setShowShare(true)
    }
  }, [searchParams, updateMode])

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          text: outputText,
        })
        .catch((err) => {
          console.error("Could not share text: ", err)
        })
    }
  }

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      setInputText(text)
    } catch (err) {
      console.error("Failed to read clipboard contents: ", err)
      setErrorText("Failed to paste from clipboard.")
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(outputText).then(
      () => {
        setCopyButtonText("Copied!")
        setTimeout(() => {
          setCopyButtonText("Copy")
        }, 2000)
      },
      (err) => {
        console.error("Could not copy text: ", err)
      },
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
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 left-2 text-gray-500 hover:text-gray-700"
          onClick={handlePaste}
          title="Paste"
        >
          <ClipboardPaste className="h-5 w-5" />
        </Button>
      </div>

      {isEncoding && (
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <Checkbox
            id="password-toggle"
            checked={usePassword}
            onCheckedChange={(checked) => setUsePassword(Boolean(checked))}
          />
          <Label htmlFor="password-toggle">حماية بكلمة سر</Label>
        </div>
      )}
      {((isEncoding && usePassword) || (mode === "decode" && inputText.startsWith("🔐"))) && (
        <div className="relative">
          <Input
            type="password"
            placeholder="أدخل كلمة السر"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pr-4"
          />
        </div>
      )}

      <Tabs defaultValue="emoji" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="emoji" disabled={!isEncoding}>
            الايقونات
          </TabsTrigger>
          <TabsTrigger value="alphabet" disabled={!isEncoding}>
            الحروف
          </TabsTrigger>
        </TabsList>
        <TabsContent value="emoji">
          <EmojiSelector
            onEmojiSelect={setSelectedEmoji}
            selectedEmoji={selectedEmoji}
            emojiList={EMOJI_LIST}
            disabled={!isEncoding}
          />
        </TabsContent>
        <TabsContent value="alphabet">
          <EmojiSelector
            onEmojiSelect={setSelectedEmoji}
            selectedEmoji={selectedEmoji}
            emojiList={ALPHABET_LIST}
            disabled={!isEncoding}
          />
        </TabsContent>
      </Tabs>

      <div className="relative">
        <Textarea
          placeholder={`${isEncoding ? "نتيجة" : "نتيجة"} التشفير`}
          value={outputText}
          readOnly
          className="min-h-[100px] pr-24"
        />
        <div className="absolute top-2 right-2 flex space-x-1">
          {showShare && (
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-500 hover:text-gray-700"
              onClick={handleShare}
              disabled={!outputText}
              title="Share"
            >
              <Share className="h-5 w-5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-500 hover:text-gray-700"
            onClick={handleCopy}
            disabled={!outputText}
            title={copyButtonText}
          >
            <Copy className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {errorText && <div className="text-red-500 text-center">{errorText}</div>}
    </CardContent>
  )
}
