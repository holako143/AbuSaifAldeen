"use client";

import { useEffect, useState, useMemo } from "react";
import { Copy, Share, ClipboardPaste, X, ArrowRightLeft, KeyRound, ShieldCheck, ShieldAlert } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { decode, encode, EncryptionType } from "./encoding";
import { EmojiSelector } from "@/components/emoji-selector";
import { addToHistory } from "@/lib/history";
import { getCustomAlphabetList, getCustomEmojiList } from "@/lib/emoji-storage";
import { useToast } from "@/components/ui/use-toast";

const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M16.75 13.96c.25.13.43.2.5.28.08.08.16.18.23.28.08.1.15.22.2.35.05.13.08.26.08.4s-.03.28-.08.4-.13.23-.24.32c-.1.1-.23.18-.36.25-.13.08-.28.13-.43.16-.15.03-.3.05-.46.05-.15 0-.3-.02-.46-.05-.15-.03-.3-.08-.46-.13-.15-.05-.3-.12-.46-.2-.15-.08-.3-.16-.46-.25-.15-.1-.3-.2-.46-.3l-.03-.02c-.5-.3-1-1-1.4-1.5-.4-.5-.7-1-1-1.5s-.5-1-.6-1.5c-.1-.5-.1-1-.1-1.5s0-1 .1-1.5.1-.9.3-1.4.3-.9.6-1.3.6-.8 1-1.1.8-.5 1.3-.6c.5-.1 1-.1 1.5-.1s1 0 1.5.1.9.3 1.4.6c.5.3.8.6 1.1 1 .3.4.5.8.6 1.3.1.5.1 1 .1 1.5s0 1-.1 1.5-.1.9-.3 1.4c-.1.5-.3.9-.6 1.3zm-5.2-3.4c-.12 0-.24.02-.36.05-.12.03-.23.08-.34.13-.1.05-.2.1-.3.18-.1.08-.18.15-.25.23-.08.08-.15.15-.2.23-.05.08-.1.15-.13.23-.03.08-.05.15-.05.23s0 .15.02.23c.02.08.05.15.08.22.03.07.08.13.13.2.05.05.1.1.18.15.07.05.15.08.22.1.08.03.15.05.23.05.1 0 .18-.02.28-.05.1-.03.2-.08.28-.13.08-.05.16-.1.25-.16.08-.06.16-.13.23-.2.07-.07.13-.15.2-.22.05-.07.1-.15.13-.23.03-.08.05-.16.05-.25s-.02-.18-.05-.26c-.03-.08-.08-.16-.13-.23-.05-.08-.1-.15-.18-.22-.07-.07-.15-.13-.22-.18-.08-.05-.16-.1-.25-.13-.1-.03-.2-.05-.28-.05z"/>
    </svg>
);

interface EncoderDecoderProps {
  isPasswordGloballyEnabled: boolean;
}

export function Base64EncoderDecoderContent({ isPasswordGloballyEnabled }: EncoderDecoderProps) {
  const { toast } = useToast();
  const [mode, setModeState] = useState("encode");
  const [inputText, setInputText] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState("😀");
  const [outputText, setOutputText] = useState("");
  const [errorText, setErrorText] = useState("");
  const [defaultTab, setDefaultTab] = useState("emoji");
  const [encryptionType, setEncryptionType] = useState<EncryptionType>("simple");
  const [password, setPassword] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showShare, setShowShare] = useState(false);

  const emojiList = useMemo(() => getCustomEmojiList(), []);
  const alphabetList = useMemo(() => getCustomAlphabetList(), []);

  useEffect(() => {
    const storedPref = localStorage.getItem("shifrishan-default-mode");
    if (storedPref) setDefaultTab(storedPref);
    const storedEncType = localStorage.getItem("shifrishan-encryption-type") as EncryptionType;
    if (storedEncType) setEncryptionType(storedEncType);
    setSelectedEmoji(emojiList[1] || "😀");
  }, [emojiList]);

  useEffect(() => {
    const processText = async () => {
      if (inputText.trim() === "") {
        setOutputText("");
        setErrorText("");
        return;
      }
      if (isPasswordGloballyEnabled && !password) {
        setErrorText("كلمة السر مطلوبة عند تفعيل خيار كلمة السر.");
        setOutputText("");
        return;
      }
      setIsProcessing(true);
      setErrorText("");
      try {
        const isEncoding = mode === "encode";
        let result = "";
        if (isEncoding) {
          result = await encode({ emoji: selectedEmoji, text: inputText, type: encryptionType, password: isPasswordGloballyEnabled ? password : undefined });
        } else {
          result = await decode({ text: inputText, type: encryptionType, password: isPasswordGloballyEnabled ? password : undefined });
        }
        setOutputText(result);
        if (result) {
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
  }, [mode, selectedEmoji, inputText, isPasswordGloballyEnabled, password, encryptionType]);

  const handleModeToggle = (checked: boolean) => setModeState(checked ? "encode" : "decode");
  useEffect(() => { if (typeof navigator !== "undefined" && navigator.share) setShowShare(true); }, []);
  const handleShare = () => navigator.share?.({ text: outputText }).catch(console.error);
  const handleWhatsAppShare = () => window.open(`https://wa.me/?text=${encodeURIComponent(outputText)}`, '_blank');
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
  }
  const isEncoding = mode === "encode";

  return (
    <TooltipProvider>
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
            <Textarea placeholder={isEncoding ? "أكتب النص الذي تريد تشفيرة" : "الصق الرمز المشفر"} value={inputText} onChange={(e) => setInputText(e.target.value)} className="min-h-[120px]"/>
            <div className="flex justify-center items-center gap-2 mt-2">
              <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={handlePaste}><ClipboardPaste className="h-5 w-5" /></Button></TooltipTrigger><TooltipContent><p>لصق</p></TooltipContent></Tooltip>
              <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={handleClear} disabled={!inputText} className="text-red-500"><X className="h-5 w-5" /></Button></TooltipTrigger><TooltipContent><p>مسح</p></TooltipContent></Tooltip>
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
            <div className="flex justify-center items-center gap-2 mt-2">
              <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={handleCopy} disabled={!outputText}><Copy className="h-5 w-5" /></Button></TooltipTrigger><TooltipContent><p>نسخ</p></TooltipContent></Tooltip>
              {showShare && <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={handleShare} disabled={!outputText}><Share className="h-5 w-5" /></Button></TooltipTrigger><TooltipContent><p>مشاركة</p></TooltipContent></Tooltip>}
              <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={handleWhatsAppShare} disabled={!outputText} className="text-green-500 hover:text-green-600"><WhatsAppIcon className="h-5 w-5" /></Button></TooltipTrigger><TooltipContent><p>مشاركة عبر واتساب</p></TooltipContent></Tooltip>
              <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={handleSwap} disabled={!outputText}><ArrowRightLeft className="h-5 w-5" /></Button></TooltipTrigger><TooltipContent><p>تبديل</p></TooltipContent></Tooltip>
            </div>
          </div>
          {errorText && <div className="text-red-500 text-center py-2">{errorText}</div>}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
