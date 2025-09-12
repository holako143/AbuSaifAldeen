"use client";

import { useEffect, useState, useMemo } from "react";
import { Copy, Share, ClipboardPaste, X, ArrowRightLeft, KeyRound, ShieldCheck, ShieldAlert, Star } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { decode, encode, EncryptionType } from "./encoding";
import { EmojiSelector } from "@/components/emoji-selector";
import { addToHistory } from "@/lib/history";
import { addToVault } from "@/lib/vault";
import { getCustomAlphabetList, getCustomEmojiList } from "@/lib/emoji-storage";
import { useToast } from "@/components/ui/use-toast";
import { VaultView } from "./vault-view";

interface EncoderDecoderProps {
  isPasswordGloballyEnabled: boolean;
  encryptionType: EncryptionType;
}

export function Base64EncoderDecoderContent({ isPasswordGloballyEnabled, encryptionType }: EncoderDecoderProps) {
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
  const [isVaultOpen, setIsVaultOpen] = useState(false);

  const emojiList = useMemo(() => getCustomEmojiList(), []);
  const alphabetList = useMemo(() => getCustomAlphabetList(), []);

  useEffect(() => {
    const storedPref = localStorage.getItem("shifrishan-default-mode");
    if (storedPref) setDefaultTab(storedPref);
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

  const handleSaveToVault = () => {
      if (!outputText) return;
      const result = addToVault(outputText);
      if (result) {
          toast({ title: "تم الحفظ في الخزنة!" });
      } else {
          toast({ variant: "destructive", title: "العنصر موجود بالفعل في الخزنة." });
      }
  }

  const isEncoding = mode === "encode";

  return (
    <TooltipProvider>
        <Dialog open={isVaultOpen} onOpenChange={setIsVaultOpen}>
            <Card className="w-full max-w-2xl mx-auto animate-in">
                <CardHeader>
                    <DialogTrigger asChild>
                        <button onDoubleClick={() => setIsVaultOpen(true)}>
                            <CardTitle className="text-2xl font-bold text-center cursor-pointer">التشفير وفك التشفير</CardTitle>
                        </button>
                    </DialogTrigger>
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
                    <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={handleSaveToVault} disabled={!outputText} className="text-amber-500"><Star className="h-5 w-5" /></Button></TooltipTrigger><TooltipContent><p>حفظ في الخزنة</p></TooltipContent></Tooltip>
                    <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={handleSwap} disabled={!outputText}><ArrowRightLeft className="h-5 w-5" /></Button></TooltipTrigger><TooltipContent><p>تبديل</p></TooltipContent></Tooltip>
                    </div>
                </div>
                {errorText && <div className="text-red-500 text-center py-2">{errorText}</div>}
                </CardContent>
            </Card>
            <DialogContent className="p-0 max-w-2xl h-4/5 flex flex-col">
                <VaultView />
            </DialogContent>
        </Dialog>
    </TooltipProvider>
  );
}
