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
import { getCustomAlphabetList, getCustomEmojiList, promoteListItem, EMOJI_STORAGE_KEY, ALPHABET_STORAGE_KEY } from "@/lib/emoji-storage";
import { useToast } from "@/components/ui/use-toast";
import { useAppContext } from "@/context/app-context";
import { AddToVaultDialog } from "@/components/add-to-vault-dialog";
import { useTranslation } from "@/hooks/use-translation";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function Base64EncoderDecoderContent() {
  const {
    isPasswordEnabled: isPasswordGloballyEnabled,
    textToDecode,
    setTextToDecode,
    setActiveView,
    setIsVaultVisible,
    autoCopy
  } = useAppContext();
  const { t } = useTranslation();

  const { toast } = useToast();
  const [mode, setModeState] = useState("encode");
  const [inputText, setInputText] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState("😀");
  const [outputText, setOutputText] = useState("");
  const [errorText, setErrorText] = useState("");
  const [defaultTab, setDefaultTab] = useState("emoji");
  const [passwords, setPasswords] = useState([{ id: 1, value: "" }]);
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

      const activePasswords = passwords.map(p => p.value).filter(Boolean);
      if (isPasswordGloballyEnabled && activePasswords.length === 0) {
        setErrorText(t('encoderDecoder.passwordRequiredError'));
        setOutputText("");
        return;
      }

      setIsProcessing(true);
      setErrorText("");
      try {
        const result = isEncoding
          ? await encode({ emoji: selectedEmoji, text: inputText, type: 'aes256', passwords: isPasswordGloballyEnabled ? activePasswords : [] })
          : await decode({ text: inputText, type: 'aes256', passwords: isPasswordGloballyEnabled ? activePasswords : [] });

        setOutputText(result);

        if (result && isEncoding) {
          addToHistory({ inputText, outputText: result, mode: isEncoding ? "encode" : "decode" });

          if (autoCopy) {
              navigator.clipboard.writeText(result);
              toast({ title: t('toasts.autoCopySuccess')});
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
        const modeText = mode === "encode" ? t('encoderDecoder.encodeError') : t('encoderDecoder.decodeError');
        setErrorText(e.message || t('encoderDecoder.genericError', { mode: modeText }));
      } finally {
        setIsProcessing(false);
      }
    };
    const debounceTimeout = setTimeout(() => { processText(); }, 500);
    return () => clearTimeout(debounceTimeout);
  }, [mode, selectedEmoji, inputText, isPasswordGloballyEnabled, passwords, autoCopy, toast, t]);

  const handleModeToggle = (checked: boolean) => setModeState(checked ? "encode" : "decode");
  useEffect(() => { if (typeof navigator !== "undefined" && navigator.share) setShowShare(true); }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(outputText).then(() => {
      toast({ title: t('toasts.copySuccess') });
    }, console.error);
  };
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInputText(text);
      toast({ title: t('toasts.pasteSuccess') });
    } catch (error) {
      toast({ variant: "destructive", title: t('toasts.pasteFailed') });
    }
  };
  const handleClear = () => setInputText("");
  const handleSwap = () => {
    if (!outputText) return;
    setInputText(outputText);
    handleModeToggle(mode !== 'encode');
    toast({ title: t('toasts.swapped') });
  };

  return (
    <Card className="w-full max-w-2xl mx-auto animate-in">
        <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">{t('encoderDecoder.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
        <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse">
            <Label htmlFor="mode-toggle">{t('encoderDecoder.decodeLabel')}</Label>
            <Switch id="mode-toggle" checked={isEncoding} onCheckedChange={handleModeToggle} />
            <Label htmlFor="mode-toggle">{t('encoderDecoder.encodeLabel')}</Label>
        </div>

        {isPasswordGloballyEnabled && (
            <div className="space-y-2 p-3 border rounded-lg animate-in">
            <div className="flex items-center justify-between">
                <Label>{t('encoderDecoder.passwordEnabledLabel')}</Label>
                <div className="flex items-center gap-1 text-xs text-blue-500"><ShieldCheck className="h-4 w-4"/><span>AES-256</span></div>
            </div>
            <div className="space-y-2 pt-2">
              {passwords.map((p, index) => (
                <div key={p.id} className="flex items-center gap-2">
                  <div className="relative flex-grow">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="password"
                      placeholder={t('encoderDecoder.passwordLayerPlaceholder', { layer: index + 1 })}
                      value={p.value}
                      onChange={(e) => {
                        const newPasswords = [...passwords];
                        newPasswords[index].value = e.target.value;
                        setPasswords(newPasswords);
                      }}
                      className="pl-10"
                    />
                  </div>
                  {passwords.length > 1 && (
                    <Button variant="ghost" size="icon" onClick={() => setPasswords(passwords.filter(item => item.id !== p.id))}>
                      <X className="h-4 w-4 text-red-500"/>
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => setPasswords([...passwords, {id: Date.now(), value: ''}])}>
                {t('encoderDecoder.addEncryptionLayer')}
              </Button>
            </div>
        </div>
        )}

        <div>
            <Textarea placeholder={t('encoderDecoder.inputTextPlaceholder')} value={inputText} onChange={(e) => setInputText(e.target.value)} className="min-h-[120px]"/>
            <div className="flex justify-center items-center gap-2 mt-2">
                <Button variant="ghost" size="icon" onClick={handlePaste}><ClipboardPaste className="h-5 w-5" /></Button>
                <Button variant="ghost" size="icon" onClick={handleClear} disabled={!inputText} className="text-red-500"><X className="h-5 w-5" /></Button>
            </div>
        </div>

        {isEncoding && (
            <Tabs value={defaultTab} onValueChange={setDefaultTab} className="w-full animate-in">
                <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="emoji" disabled={!isEncoding}>{t('encoderDecoder.iconsTab')}</TabsTrigger>
                <TabsTrigger value="alphabet" disabled={!isEncoding}>{t('encoderDecoder.alphabetsTab')}</TabsTrigger>
                </TabsList>
                <TabsContent value="emoji"><EmojiSelector onEmojiSelect={setSelectedEmoji} selectedEmoji={selectedEmoji} emojiList={emojiList} disabled={!isEncoding} /></TabsContent>
                <TabsContent value="alphabet"><EmojiSelector onEmojiSelect={setSelectedEmoji} selectedEmoji={selectedEmoji} emojiList={alphabetList} disabled={!isEncoding} /></TabsContent>
            </Tabs>
        )}

        <div>
            <Textarea placeholder={isProcessing ? t('encoderDecoder.processingPlaceholder') : t('encoderDecoder.outputTextPlaceholder')} value={outputText} readOnly className="min-h-[120px]" />
            <div className="flex justify-center items-center gap-2 mt-2">
                <Button variant="ghost" size="icon" onClick={handleCopy} disabled={!outputText}><Copy className="h-5 w-5" /></Button>
                {showShare && <Button variant="ghost" size="icon" onClick={() => navigator.share({ text: outputText })} disabled={!outputText}><Share className="h-5 w-5" /></Button>}
                <AddToVaultDialog outputText={outputText} mode={isEncoding ? 'encode' : 'decode'} inputText={inputText}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-amber-500"><Star className="h-5 w-5" /></Button>
                        </TooltipTrigger>
                        <TooltipContent><p>{t('encoderDecoder.saveToVault')}</p></TooltipContent>
                    </Tooltip>
                </AddToVaultDialog>
                <Button variant="ghost" size="icon" onClick={handleSwap} disabled={!outputText}><ArrowRightLeft className="h-5 w-5" /></Button>
            </div>
        </div>
        {errorText && <div className="text-red-500 text-center py-2">{errorText}</div>}
        </CardContent>
    </Card>
  );
}
