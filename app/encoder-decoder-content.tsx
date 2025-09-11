"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Copy, Share } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { decode, encode } from "./encoding";
import { EmojiSelector } from "@/components/emoji-selector";
import { addToHistory } from "@/lib/history";
import { getCustomAlphabetList, getCustomEmojiList } from "@/lib/emoji-storage";

export function Base64EncoderDecoderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const mode = searchParams.get("mode") || "encode";
  const [inputText, setInputText] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState("😀");
  const [outputText, setOutputText] = useState("");
  const [errorText, setErrorText] = useState("");
  const [copyButtonText, setCopyButtonText] = useState("Copy");
  const [showShare, setShowShare] = useState(false);
  const [defaultTab, setDefaultTab] = useState("emoji");

  const emojiList = useMemo(() => getCustomEmojiList(), []);
  const alphabetList = useMemo(() => getCustomAlphabetList(), []);

  useEffect(() => {
    const storedPreference = localStorage.getItem("shifrishan-default-mode");
    if (storedPreference) {
      setDefaultTab(storedPreference);
    }
    // Set initial selected emoji from the current list
    setSelectedEmoji(emojiList[1] || "😀");
  }, [emojiList]);

  const updateMode = (newMode: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("mode", newMode);
    router.replace(`?${params.toString()}`);
  };

  useEffect(() => {
    if (inputText.trim() === "") {
      setOutputText("");
      setErrorText("");
      return;
    }

    try {
      const isEncoding = mode === "encode";
      const output = isEncoding ? encode(selectedEmoji, inputText) : decode(inputText);
      setOutputText(output);
      setErrorText("");

      if (output) {
        addToHistory({
          inputText,
          outputText: output,
          mode: isEncoding ? "encode" : "decode",
        });
      }

    } catch (e) {
      setOutputText("");
      setErrorText(`Error ${mode === "encode" ? "encoding" : "decoding"}: Invalid input`);
    }
  }, [mode, selectedEmoji, inputText]);

  const handleModeToggle = (checked: boolean) => {
    updateMode(checked ? "encode" : "decode");
    setInputText("");
  };

  useEffect(() => {
    if (!searchParams.has("mode")) {
      updateMode("encode");
    }
    if (typeof navigator !== "undefined" && navigator.share) {
      setShowShare(true);
    }
  }, [searchParams]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ text: outputText }).catch(console.error);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(outputText).then(() => {
      setCopyButtonText("Copied!");
      setTimeout(() => setCopyButtonText("Copy"), 2000);
    }, console.error);
  };

  const isEncoding = mode === "encode";

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">التشفير وفك التشفير</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm sm:text-base text-center">شفر الي تشتيه وانبسط 😋</p>

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

        <Tabs value={defaultTab} onValueChange={setDefaultTab} className="w-full">
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
              emojiList={emojiList}
              disabled={!isEncoding}
            />
          </TabsContent>
          <TabsContent value="alphabet">
            <EmojiSelector
              onEmojiSelect={setSelectedEmoji}
              selectedEmoji={selectedEmoji}
              emojiList={alphabetList}
              disabled={!isEncoding}
            />
          </TabsContent>
        </Tabs>

        <div className="relative">
          <Textarea
            placeholder="الناتج..."
            value={outputText}
            readOnly
            className="min-h-[100px] pr-24"
          />
          <div className="absolute top-2 left-2 flex flex-col space-y-2">
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
      </CardContent>
    </Card>
  );
}
