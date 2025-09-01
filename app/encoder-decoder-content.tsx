"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Copy, Share } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { decode, encode } from "./encoding"
import { EmojiSelector } from "@/components/emoji-selector"
import { ALPHABET_LIST, EMOJI_LIST } from "./emoji"

export function Base64EncoderDecoderContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Read mode from URL parameters, other state stored locally
  const mode = searchParams.get("mode") || "encode"
  const [inputText, setInputText] = useState("")
  const [selectedEmoji, setSelectedEmoji] = useState("😀")
  const [outputText, setOutputText] = useState("")
  const [errorText, setErrorText] = useState("")
  const [copyButtonText, setCopyButtonText] = useState("Copy")
  const [showShare, setShowShare] = useState(false)

  // Update URL when mode changes
  const updateMode = (newMode: string) => {
    const params = new URLSearchParams(searchParams)
    params.set("mode", newMode)
    router.replace(`?${params.toString()}`)
  }

  // Convert input whenever it changes
  useEffect(() => {
    try {
      const isEncoding = mode === "encode"
      const output = isEncoding ? encode(selectedEmoji, inputText) : decode(inputText)
      setOutputText(output)
      setErrorText("")
    } catch (e) {
      setOutputText("")
      setErrorText(`Error ${mode === "encode" ? "encoding" : "decoding"}: Invalid input`)
    }
  }, [mode, selectedEmoji, inputText])

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

      <Textarea
        placeholder={isEncoding ? "أكتب النص الذي تريد تشفيرة" : "الصق الرمز المشفر"}
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        className="min-h-[100px]"
      />

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
          placeholder={`${isEncoding ? "Encoded" : "Decoded"} output`}
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
