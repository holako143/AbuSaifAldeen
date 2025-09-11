"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Copy, Share, ClipboardPaste, X, ArrowRightLeft } from "lucide-react";
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
import { useToast } from "@/components/ui/use-toast";


export function Base64EncoderDecoderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const mode = searchParams.get("mode") || "encode";
  const [inputText, setInputText] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState("😀");
  const [outputText, setOutputText] = useState("");
  const [errorText, setErrorText] = useState("");
  const [copyButtonText, setCopyButtonText] = useState("نسخ");
  const [showShare, setShowShare] = useState(false);
  const [defaultTab, setDefaultTab] = useState("emoji");

  const emojiList = useMemo(() => getCustomEmojiList(), []);
  const alphabetList = useMemo(() => getCustomAlphabetList(), []);

  useEffect(() => {
    const storedPreference = localStorage.getItem("shifrishan-default-mode");
    if (storedPreference) {
      setDefaultTab(storedPreference);
    }
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
      setErrorText(`خطأ في ${mode === "encode" ? "التشفير" : "فك التشفير"}: مدخلات غير صالحة`);
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
      setCopyButtonText("تم النسخ!");
      toast({ title: "تم نسخ الناتج بنجاح!" });
      setTimeout(() => setCopyButtonText("نسخ"), 2000);
    }, console.error);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInputText(text);
      toast({ title: "تم اللصق بنجاح!" });
    } catch (error) {
      toast({ variant: "destructive", title: "فشل اللصق", description: "لم نتمكن من قراءة الحافظة. يرجى التحقق من أذونات المتصفح." });
    }
  };

  const handleClear = () => {
    setInputText("");
  };

  const handleSwap = () => {
    if (!outputText) return;
    setInputText(outputText);
    handleModeToggle(mode !== 'encode');
    toast({ title: "تم التبديل!" });
  }

  const isEncoding = mode === "encode";

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">التشفير وفك التشفير</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse">
          <Label htmlFor="mode-toggle">فك التشفير</Label>
          <Switch id="mode-toggle" checked={isEncoding} onCheckedChange={handleModeToggle} />
          <Label htmlFor="mode-toggle">تشفير النص</Label>
        </div>

        <div>
          <Textarea
            placeholder={isEncoding ? "أكتب النص الذي تريد تشفيرة" : "الصق الرمز المشفر"}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="min-h-[120px]"
          />
          <div className="flex justify-end items-center gap-2 mt-2">
            <Button variant="outline" size="sm" onClick={handlePaste}>
              <ClipboardPaste className="ml-2 h-4 w-4" />
              لصق
            </Button>
            <Button variant="destructive" size="sm" onClick={handleClear} disabled={!inputText}>
              <X className="ml-2 h-4 w-4" />
              مسح
            </Button>
          </div>
        </div>

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

        <div>
          <Textarea
            placeholder="الناتج..."
            value={outputText}
            readOnly
            className="min-h-[120px]"
          />
          <div className="flex justify-end items-center gap-2 mt-2">
            <Button variant="outline" size="sm" onClick={handleCopy} disabled={!outputText}>
              <Copy className="ml-2 h-4 w-4" />
              {copyButtonText}
            </Button>
             {showShare && (
              <Button variant="outline" size="sm" onClick={handleShare} disabled={!outputText}>
                <Share className="ml-2 h-4 w-4" />
                مشاركة
              </Button>
            )}
            <Button variant="secondary" size="sm" onClick={handleSwap} disabled={!outputText}>
              <ArrowRightLeft className="ml-2 h-4 w-4" />
              تبديل
            </Button>
          </div>
        </div>

        {errorText && <div className="text-red-500 text-center py-2">{errorText}</div>}
      </CardContent>
    </Card>
  );
}
