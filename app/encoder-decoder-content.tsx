"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Share, ClipboardPaste, X, ArrowRightLeft, KeyRound, ShieldCheck, ShieldAlert, Star, Loader2, Check } from "lucide-react";
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
import { useAppContext } from "@/components/app-provider";
import { AddToVaultDialog } from "@/components/add-to-vault-dialog";
import { useTranslation } from "@/hooks/use-translation";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function Base64EncoderDecoderContent() {
  const {
    isPasswordEnabled: isPasswordGloballyEnabled,
    textToDecode,
    setTextToDecode,
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
  const [isCopied, setIsCopied] = useState(false);

  const [emojiList, setEmojiList] = useState<string[] | null>(null);
  const [alphabetList, setAlphabetList] = useState<string[] | null>(null);

  const isEncoding = mode === "encode";

  useEffect(() => {
    const fetchLists = async () => {
        const [emojis, alphabets] = await Promise.all([
            getCustomEmojiList(),
            getCustomAlphabetList()
        ]);
        setEmojiList(emojis);
        setAlphabetList(alphabets);
        setSelectedEmoji(emojis[0] || "😀");
    };
    fetchLists();

    const storedPref = localStorage.getItem("shifrishan-default-mode");
    if (storedPref) setDefaultTab(storedPref);
  }, []);

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
          await addToHistory({ inputText, outputText: result, mode: isEncoding ? "encode" : "decode" });

          if (autoCopy) {
              navigator.clipboard.writeText(result);
              toast({ title: t('toasts.autoCopySuccess')});
          }
        } else if (result) {
            await addToHistory({ inputText, outputText: result, mode: isEncoding ? "encode" : "decode" });
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
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
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

  if (!emojiList || !alphabetList) {
      return (
          <div className="flex justify-center items-center h-96">
              <Loader2 className="h-12 w-12 animate-spin" />
          </div>
      )
  }

  return (
    <Card className="w-full max-w-2xl mx-auto animate-in">
        <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">{t('encoderDecoder.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
        <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse">
            <Label htmlFor="mode-toggle" className="text-muted-foreground">{t('encoderDecoder.decodeLabel')}</Label>
            <Switch id="mode-toggle" checked={isEncoding} onCheckedChange={handleModeToggle} aria-label={isEncoding ? t('encoderDecoder.encodeLabel') : t('encoderDecoder.decodeLabel')} />
            <Label htmlFor="mode-toggle" className="text-muted-foreground">{t('encoderDecoder.encodeLabel')}</Label>
        </div>

        <AnimatePresence>
        {isPasswordGloballyEnabled && (
            <motion.div
              layout
              initial={{ opacity: 0, y: -20, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -20, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="space-y-4 p-4 border rounded-lg overflow-hidden"
            >
              <div className="flex items-center justify-between">
                  <Label className="font-semibold text-lg">{t('encoderDecoder.layers.title')}</Label>
                  <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">{t('encoderDecoder.layers.count', { count: passwords.filter(p => p.value).length })}</span>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-500 bg-blue-500/10 px-2 py-1 rounded-full"><ShieldCheck className="h-4 w-4"/><span>AES-256</span></div>
                  </div>
              </div>
              <div className="space-y-3 pt-2">
                {passwords.map((p, index) => (
                  <motion.div
                    key={p.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-2"
                  >
                    <div className="relative flex-grow">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        type="password"
                        placeholder={t('encoderDecoder.passwordLayerPlaceholder', { layer: index + 1 })}
                        value={p.value}
                        onChange={(e) => {
                          const newPasswords = [...passwords];
                          newPasswords[index].value = e.target.value;
                          setPasswords(newPasswords);
                        }}
                        className="pl-10 h-11"
                      />
                    </div>
                    {passwords.length > 1 && (
                      <Button variant="ghost" size="icon" onClick={() => setPasswords(passwords.filter(item => item.id !== p.id))} aria-label={t('encoderDecoder.a11y.removeLayer')}>
                        <X className="h-5 w-5 text-red-500/80 hover:text-red-500 transition-colors"/>
                      </Button>
                    )}
                  </motion.div>
                ))}
                <Button variant="outline" size="sm" onClick={() => setPasswords([...passwords, {id: Date.now(), value: ''}])}>
                  {t('encoderDecoder.addEncryptionLayer')}
                </Button>
              </div>
            </motion.div>
        )}
        </AnimatePresence>

        <div className="space-y-2">
            <Label className="text-sm font-medium">{isEncoding ? t('encoderDecoder.textToEncode') : t('encoderDecoder.textToDecode')}</Label>
            <Textarea placeholder={t('encoderDecoder.inputTextPlaceholder')} value={inputText} onChange={(e) => setInputText(e.target.value)} className="min-h-[140px] focus:border-primary"/>
            <div className="flex justify-center items-center gap-1 mt-1">
                <Button variant="ghost" size="icon" onClick={handlePaste} aria-label={t('encoderDecoder.a11y.paste')} className="transition-transform hover:scale-110 active:scale-95"><ClipboardPaste className="h-5 w-5" /></Button>
                <Button variant="ghost" size="icon" onClick={handleClear} disabled={!inputText} className="text-red-500 transition-transform hover:scale-110 active:scale-95" aria-label={t('encoderDecoder.a11y.clearInput')}><X className="h-5 w-5" /></Button>
            </div>
        </div>

        <AnimatePresence>
        {isEncoding && (
            <motion.div
              layout
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="w-full overflow-hidden"
            >
              <Tabs value={defaultTab} onValueChange={setDefaultTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="emoji">{t('encoderDecoder.iconsTab')}</TabsTrigger>
                  <TabsTrigger value="alphabet">{t('encoderDecoder.alphabetsTab')}</TabsTrigger>
                  </TabsList>
                  <TabsContent value="emoji" className="pt-4"><EmojiSelector onEmojiSelect={setSelectedEmoji} selectedEmoji={selectedEmoji} emojiList={emojiList} /></TabsContent>
                  <TabsContent value="alphabet" className="pt-4"><EmojiSelector onEmojiSelect={setSelectedEmoji} selectedEmoji={selectedEmoji} emojiList={alphabetList} /></TabsContent>
              </Tabs>
            </motion.div>
        )}
        </AnimatePresence>

        <div className="space-y-2">
            <Label className="text-sm font-medium">{t('encoderDecoder.outputTextLabel')}</Label>
            <div className="relative">
                <Textarea
                    placeholder={t('encoderDecoder.outputTextPlaceholder')}
                    value={outputText}
                    readOnly
                    className="min-h-[140px] bg-muted/40"
                />
                {isProcessing && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                )}
            </div>
            <div className="flex justify-center items-center gap-1 mt-1">
                <Button variant="ghost" size="icon" onClick={handleCopy} disabled={!outputText} aria-label={t('encoderDecoder.a11y.copyOutput')} className="transition-transform hover:scale-110 active:scale-95 w-9 h-9">
                    <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                            key={isCopied ? "check" : "copy"}
                            initial={{ opacity: 0, scale: 0.5, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.5, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            {isCopied ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}
                        </motion.div>
                    </AnimatePresence>
                </Button>
                {showShare && <Button variant="ghost" size="icon" onClick={() => navigator.share({ text: outputText })} disabled={!outputText} aria-label={t('encoderDecoder.a11y.shareOutput')} className="transition-transform hover:scale-110 active:scale-95"><Share className="h-5 w-5" /></Button>}
                <AddToVaultDialog outputText={outputText} mode={isEncoding ? 'encode' : 'decode'} inputText={inputText}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" disabled={!outputText} className="text-amber-500 disabled:text-muted-foreground transition-transform hover:scale-110 active:scale-95" aria-label={t('encoderDecoder.a11y.saveToVault')}><Star className="h-5 w-5" /></Button>
                        </TooltipTrigger>
                        <TooltipContent><p>{t('encoderDecoder.saveToVault')}</p></TooltipContent>
                    </Tooltip>
                </AddToVaultDialog>
                <Button variant="ghost" size="icon" onClick={handleSwap} disabled={!outputText} aria-label={t('encoderDecoder.a11y.swap')} className="transition-transform hover:scale-110 active:scale-95"><ArrowRightLeft className="h-5 w-5" /></Button>
            </div>
        </div>

        <AnimatePresence>
            {errorText && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="text-red-500 text-center p-3 bg-red-500/10 rounded-lg flex items-center justify-center gap-2"
                >
                    <ShieldAlert className="h-5 w-5" />
                    <span>{errorText}</span>
                </motion.div>
            )}
        </AnimatePresence>
        </CardContent>
    </Card>
  );
}
