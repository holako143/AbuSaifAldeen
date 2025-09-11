"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Copy, Share, ClipboardPaste, X, ArrowRightLeft, KeyRound, ShieldCheck, ShieldAlert } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { decode, encode, EncryptionType } from "./encoding";
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

  const [encryptionType, setEncryptionType] = useState<EncryptionType>("simple");
  const [isPasswordEnabled, setIsPasswordEnabled] = useState(false);
  const [password, setPassword] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const emojiList = useMemo(() => getCustomEmojiList(), []);
  const alphabetList = useMemo(() => getCustomAlphabetList(), []);

  useEffect(() => {
    const storedPref = localStorage.getItem("shifrishan-default-mode");
    if (storedPref) setDefaultTab(storedPref);

    const storedEncType = localStorage.getItem("shifrishan-encryption-type") as EncryptionType;
    if (storedEncType) setEncryptionType(storedEncType);

    setSelectedEmoji(emojiList[1] || "😀");
  }, [emojiList]);

  const updateMode = (newMode: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("mode", newMode);
    router.replace(`?${params.toString()}`);
  };

  useEffect(() => {
    const processText = async () => {
      if (inputText.trim() === "") {
        setOutputText("");
        setErrorText("");
        return;
      }

      // For AES, a password is not optional
      if (encryptionType === 'aes256' && isPasswordEnabled && !password) {
        setErrorText("كلمة السر مطلوبة لتشفير AES-256.");
        setOutputText("");
        return;
      }

      setIsProcessing(true);
      setErrorText("");

      try {
        const isEncoding = mode === "encode";
        let result = "";

        if (isEncoding) {
          result = await encode({
            emoji: selectedEmoji,
            text: inputText,
            type: encryptionType,
            password: isPasswordEnabled ? password : undefined,
          });
        } else {
          result = await decode({
            text: inputText,
            type: encryptionType,
            password: isPasswordEnabled ? password : undefined,
          });
        }

        setOutputText(result);
        if (result) {
          addToHistory({
            inputText,
            outputText: result,
            mode: isEncoding ? "encode" : "decode",
          });
        }
      } catch (e: any) {
        setOutputText("");
        setErrorText(e.message || `خطأ في ${mode === "encode" ? "التشفير" : "فك التشفير"}`);
      } finally {
        setIsProcessing(false);
      }
    };

    const debounceTimeout = setTimeout(() => {
        processText();
    }, 500); // 500ms debounce

    return () => clearTimeout(debounceTimeout);

  }, [mode, selectedEmoji, inputText, isPasswordEnabled, password, encryptionType]);

  const handleModeToggle = (checked: boolean) => {
    updateMode(checked ? "encode" : "decode");
    setInputText("");
  };

  const handleShare = () => navigator.share?.({ text: outputText }).catch(console.error);

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
      toast({ variant: "destructive", title: "فشل اللصق" });
    }
  };

  const handleClear = () => setInputText("");

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

        <div className="space-y-2 p-3 border rounded-lg">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <Switch id="password-toggle" checked={isPasswordEnabled} onCheckedChange={setIsPasswordEnabled} />
                    <Label htmlFor="password-toggle">استخدام كلمة سر</Label>
                </div>
                {encryptionType === 'aes256' && (
                    <div className="flex items-center gap-1 text-xs text-blue-500">
                        <ShieldCheck className="h-4 w-4"/>
                        <span>AES-256</span>
                    </div>
                )}
                 {encryptionType === 'simple' && isPasswordEnabled && (
                    <div className="flex items-center gap-1 text-xs text-amber-500">
                        <ShieldAlert className="h-4 w-4"/>
                        <span>Salt</span>
                    </div>
                )}
            </div>
            {isPasswordEnabled && (
                <div className="relative pt-2">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="password"
                        placeholder="أدخل كلمة السر هنا..."
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10"
                    />
                </div>
            )}
        </div>

        <div>
          <Textarea
            placeholder={isEncoding ? "أكتب النص الذي تريد تشفيرة" : "الصق الرمز المشفر"}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="min-h-[120px]"
          />
          <div className="flex justify-end items-center gap-2 mt-2">
            <Button variant="outline" size="sm" onClick={handlePaste}><ClipboardPaste className="ml-2 h-4 w-4" />لصق</Button>
            <Button variant="destructive" size="sm" onClick={handleClear} disabled={!inputText}><X className="ml-2 h-4 w-4" />مسح</Button>
          </div>
        </div>

        <Tabs value={defaultTab} onValueChange={setDefaultTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="emoji" disabled={!isEncoding}>الايقونات</TabsTrigger>
            <TabsTrigger value="alphabet" disabled={!isEncoding}>الحروف</TabsTrigger>
          </TabsList>
          <TabsContent value="emoji"><EmojiSelector onEmojiSelect={setSelectedEmoji} selectedEmoji={selectedEmoji} emojiList={emojiList} disabled={!isEncoding} /></TabsContent>
          <TabsContent value="alphabet"><EmojiSelector onEmojiSelect={setSelectedEmoji} selectedEmoji={selectedEmoji} emojiList={alphabetList} disabled={!isEncoding} /></TabsContent>
        </Tabs>

        <div>
          <Textarea placeholder={isProcessing ? "جاري المعالجة..." : "الناتج..."} value={outputText} readOnly className="min-h-[120px]" />
          <div className="flex justify-end items-center gap-2 mt-2">
            <Button variant="outline" size="sm" onClick={handleCopy} disabled={!outputText}><Copy className="ml-2 h-4 w-4" />{copyButtonText}</Button>
            {showShare && (<Button variant="outline" size="sm" onClick={handleShare} disabled={!outputText}><Share className="ml-2 h-4 w-4" />مشاركة</Button>)}
            <Button variant="secondary" size="sm" onClick={handleSwap} disabled={!outputText}><ArrowRightLeft className="ml-2 h-4 w-4" />تبديل</Button>
          </div>
        </div>

        {errorText && <div className="text-red-500 text-center py-2">{errorText}</div>}
      </CardContent>
    </Card>
  );
}
