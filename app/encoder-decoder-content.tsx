"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { Copy, Share, ClipboardPaste, X, ArrowRightLeft, KeyRound, ShieldCheck, ShieldAlert, Star } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { decode, encode } from "./encoding";
import { EmojiSelector } from "@/components/emoji-selector";
import { addToHistory } from "@/lib/history";
import { addToVault } from "@/lib/vault";
import { getCustomAlphabetList, getCustomEmojiList, promoteListItem, EMOJI_STORAGE_KEY, ALPHABET_STORAGE_KEY } from "@/lib/emoji-storage";
import { useToast } from "@/components/ui/use-toast";
import { useAppContext } from "@/context/app-context";

export function Base64EncoderDecoderContent() {
  const {
    isPasswordEnabled: isPasswordGloballyEnabled,
    encryptionType,
    textToDecode,
    setTextToDecode,
    setActiveView,
    setIsVaultVisible,
    autoCopy
  } = useAppContext();

  const { toast } = useToast();
  const [mode, setModeState] = useState("encode");
  const [inputText, setInputText] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState("😀");
  const [outputText, setOutputText] = useState("");
  const [errorText, setErrorText] = useState("");
  const [defaultTab, setDefaultTab] = useState("emoji");
  const [password, setPassword] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const clickTimeout = useRef<NodeJS.Timeout | null>(null);

  const [emojiList, setEmojiList] = useState(getCustomEmojiList());
  const [alphabetList, setAlphabetList] = useState(getCustomAlphabetList());

  const isEncoding = mode === "encode";

  useEffect(() => {
    const storedPref = localStorage.getItem("shifrishan-default-mode");
    if (storedPref) setDefaultTab(storedPref);
    setSelectedEmoji(emojiList[0] || "😀");
  }, [emojiList]);

  useEffect(() => {
    if (textToDecode) {
      setInputText(textToDecode);
      setModeState("decode");
      setTextToDecode(null);
    }
  }, [textToDecode, setTextToDecode]);

  useEffect(() => {
    const processText = async () => {
      if (inputText.trim() === "") { setOutputText(""); setErrorText(""); return; }
      if (isPasswordGloballyEnabled && !password) { setErrorText("كلمة السر مطلوبة عند تفعيل خيار كلمة السر."); setOutputText(""); return; }

      setIsProcessing(true);
      setErrorText("");
      try {
        const result = isEncoding
          ? await encode({ emoji: selectedEmoji, text: inputText, type: encryptionType, password: isPasswordGloballyEnabled ? password : undefined })
          : await decode({ text: inputText, type: encryptionType, password: isPasswordGloballyEnabled ? password : undefined });

        setOutputText(result);

        if (result && isEncoding) {
          addToHistory({ inputText, outputText: result, mode: isEncoding ? "encode" : "decode" });

          if (autoCopy) {
              navigator.clipboard.writeText(result);
              toast({ title: "تم نسخ الناتج تلقائيًا!"});
          }

          const listKey = defaultTab === 'emoji' ? EMOJI_STORAGE_KEY : ALPHABET_STORAGE_KEY;
          promoteListItem(listKey, selectedEmoji);
          if (defaultTab === 'emoji') {
            setEmojiList(getCustomEmojiList());
          } else {
            setAlphabetList(getCustomAlphabetList());
          }
        } else if (result) {
            addToHistory({ inputText, outputText: result, mode: isEncoding ? "encode" : "decode" });
        }
      } catch (e: any) {
        setOutputText("");
        setErrorText(e.message || `خطأ في ${mode === "encode" ? "التشفير" : "فك التشفير"}`);
      } finally {
        setIsProcessing(false);
      }
    };
    const debounceTimeout = setTimeout(() => { processText(); }, 500);
    return () => clearTimeout(debounceTimeout);
  }, [mode, selectedEmoji, inputText, isPasswordGloballyEnabled, password, encryptionType, defaultTab, autoCopy, toast]);

  const handleModeToggle = (checked: boolean) => setModeState(checked ? "encode" : "decode");
  useEffect(() => { if (typeof navigator !== "undefined" && navigator.share) setShowShare(true); }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(outputText).then(() => {
      toast({ title: "تم نسخ الناتج بنجاح!" });
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
  };

  const handleSaveToVault = () => {
      if (!outputText) return;
      if (inputText.trim() === 'خزنة' && mode === 'decode') return;
      const result = addToVault(outputText);
      if (result) {
          toast({ title: "تم الحفظ في الخزنة!" });
      } else {
          toast({ variant: "destructive", title: "العنصر موجود بالفعل في الخزنة." });
      }
  };

  const handleStarClick = () => {
      if (clickTimeout.current) {
          clearTimeout(clickTimeout.current);
          clickTimeout.current = null;
          if (inputText.trim() === 'خزنة' && mode === 'decode') {
              setIsVaultVisible(true);
              setActiveView('vault');
              toast({ title: "تم إظهار الخزنة السرية في القائمة."});
          } else if (mode !== 'decode') {
              toast({ variant: "default", title: "لإظهار الخزنة", description: "يجب أن تكون في وضع 'فك التشفير' أولاً." });
          }
      } else {
          clickTimeout.current = setTimeout(() => {
              handleSaveToVault();
              clickTimeout.current = null;
          }, 300);
      }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto animate-in">
        <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">التشفير وفك التشفير</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
        <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse">
            <Label htmlFor="mode-toggle">فك التشفير</Label>
            <Switch id="mode-toggle" checked={isEncoding} onCheckedChange={handleModeToggle} />
            <Label htmlFor="mode-toggle">تشفير النص</Label>
        </div>

        {isPasswordGloballyEnabled && (
            <div className="space-y-2 p-3 border rounded-lg animate-in">
            <div className="flex items-center justify-between">
                <Label>كلمة السر مفعلة</Label>
                {encryptionType === 'aes256' && <div className="flex items-center gap-1 text-xs text-blue-500"><ShieldCheck className="h-4 w-4"/><span>AES-256</span></div>}
                {encryptionType === 'simple' && <div className="flex items-center gap-1 text-xs text-amber-500"><ShieldAlert className="h-4 w-4"/><span>Salt</span></div>}
            </div>
            <div className="relative pt-2">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type="password" placeholder="أدخل كلمة السر هنا..." value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10"/>
            </div>
            </div>
        )}

        <div>
            <Textarea placeholder="اكتب النص المراد تشفيره" value={inputText} onChange={(e) => setInputText(e.target.value)} className="min-h-[120px]"/>
            <div className="flex justify-center items-center gap-2 mt-2">
                <Button variant="ghost" size="icon" onClick={handlePaste}><ClipboardPaste className="h-5 w-5" /></Button>
                <Button variant="ghost" size="icon" onClick={handleClear} disabled={!inputText} className="text-red-500"><X className="h-5 w-5" /></Button>
            </div>
        </div>

        {isEncoding && (
            <Tabs value={defaultTab} onValueChange={setDefaultTab} className="w-full animate-in">
                <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="emoji" disabled={!isEncoding}>الايقونات</TabsTrigger>
                <TabsTrigger value="alphabet" disabled={!isEncoding}>الحروف</TabsTrigger>
                </TabsList>
                <TabsContent value="emoji"><EmojiSelector onEmojiSelect={setSelectedEmoji} selectedEmoji={selectedEmoji} emojiList={emojiList} disabled={!isEncoding} /></TabsContent>
                <TabsContent value="alphabet"><EmojiSelector onEmojiSelect={setSelectedEmoji} selectedEmoji={selectedEmoji} emojiList={alphabetList} disabled={!isEncoding} /></TabsContent>
            </Tabs>
        )}

        <div>
            <Textarea placeholder={isProcessing ? "جاري المعالجة..." : "الناتج..."} value={outputText} readOnly className="min-h-[120px]" />
            <div className="flex justify-center items-center gap-2 mt-2">
                <Button variant="ghost" size="icon" onClick={handleCopy} disabled={!outputText}><Copy className="h-5 w-5" /></Button>
                {showShare && <Button variant="ghost" size="icon" onClick={() => navigator.share({ text: outputText })} disabled={!outputText}><Share className="h-5 w-5" /></Button>}
                <Button variant="ghost" size="icon" onClick={handleStarClick} className="text-amber-500"><Star className="h-5 w-5" /></Button>
                <Button variant="ghost" size="icon" onClick={handleSwap} disabled={!outputText}><ArrowRightLeft className="h-5 w-5" /></Button>
            </div>
        </div>
        {errorText && <div className="text-red-500 text-center py-2">{errorText}</div>}
        </CardContent>
    </Card>
  );
}
