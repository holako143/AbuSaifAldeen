"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { Copy, Share, ClipboardPaste, X, ArrowRightLeft, KeyRound, ShieldCheck, ShieldAlert, Star, Loader2, QrCode, Camera, File as FileIcon, Download } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Html5QrcodeScanner, Html5QrcodeScannerState } from "html5-qrcode";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { decode, encode } from "./encoding";
import { EmojiSelector } from "@/components/emoji-selector";
import { addToHistory } from "@/lib/history";
import { getCustomAlphabetList, getCustomEmojiList } from "@/lib/emoji-storage";
import { useToast } from "@/components/ui/use-toast";
import { useAppContext } from "@/components/app-provider";
import { AddToVaultDialog } from "@/components/add-to-vault-dialog";
import { useTranslation } from "@/hooks/use-translation";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

// Helper functions for file processing
const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
};
const base64ToBlob = (base64: string, contentType = '', sliceSize = 512) => {
    const byteCharacters = atob(base64);
    const byteArrays = [];
    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
        const slice = byteCharacters.slice(offset, offset + sliceSize);
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
    }
    return new Blob(byteArrays, { type: contentType });
};

const QR_CODE_SCANNER_ID = "qr-code-scanner-region";

// UI Components
function QrCodeDisplay({ text }: { text: string }) {
    const { t } = useTranslation();
    if (!text) return null;
    return (
        <Dialog>
            <DialogTrigger asChild><Button variant="ghost" size="icon" aria-label={t('encoderDecoder.a11y.showQrCode')}><QrCode className="h-5 w-5" /></Button></DialogTrigger>
            <DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>{t('encoderDecoder.qrCodeTitle')}</DialogTitle></DialogHeader><div className="flex items-center justify-center p-4 bg-white"><QRCodeSVG value={text} size={256} /></div></DialogContent>
        </Dialog>
    );
}

function QrCodeScanner({ onScanSuccess }: { onScanSuccess: (decodedText: string) => void }) {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    useEffect(() => {
        if (!isOpen) return;
        const scanner = new Html5QrcodeScanner(QR_CODE_SCANNER_ID, { fps: 10, qrbox: 250 }, false);
        let didScan = false;
        const handleSuccess = (decodedText: string) => {
            if (didScan) return;
            didScan = true;
            onScanSuccess(decodedText);
            if (scanner.getState() === Html5QrcodeScannerState.SCANNING) scanner.clear().catch(console.error);
            setIsOpen(false);
        };
        scanner.render(handleSuccess, () => {});
        return () => { if (scanner?.getState() === Html5QrcodeScannerState.SCANNING) scanner.clear().catch(console.error); };
    }, [isOpen, onScanSuccess]);
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild><Button variant="ghost" size="icon" aria-label={t('encoderDecoder.a11y.scanQrCode')}><Camera className="h-5 w-5" /></Button></DialogTrigger>
            <DialogContent><DialogHeader><DialogTitle>{t('encoderDecoder.qrScanTitle')}</DialogTitle></DialogHeader><div id={QR_CODE_SCANNER_ID} className="w-full"></div></DialogContent>
        </Dialog>
    );
}

function FileInputArea({ onFileContentRead, isEncoding }: { onFileContentRead: (content: string, name: string) => void, isEncoding: boolean }) {
    const { t } = useTranslation();
    const { toast } = useToast();
    const [fileInfo, setFileInfo] = useState<{name: string, size: number} | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                toast({ variant: "destructive", title: t('fileEncoder.errors.tooLarge') });
                return;
            }
            setFileInfo({ name: file.name, size: file.size });
            const reader = new FileReader();
            reader.onload = (e) => {
                const buffer = e.target?.result as ArrayBuffer;
                onFileContentRead(arrayBufferToBase64(buffer), file.name);
            };
            reader.readAsArrayBuffer(file);
        }
    };

    if (!isEncoding) return null;

    return (
        <div className="p-4 border-2 border-dashed rounded-lg text-center space-y-2">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
            <Button onClick={() => fileInputRef.current?.click()}><FileIcon className="ml-2 h-4 w-4" />{t('fileEncoder.selectFile')}</Button>
            {fileInfo && <p className="text-sm text-muted-foreground">{fileInfo.name} ({(fileInfo.size / 1024).toFixed(2)} KB)</p>}
        </div>
    );
}

// Main Component
export function Base64EncoderDecoderContent() {
    const { t } = useTranslation();
    const { isPasswordEnabled: isPasswordGloballyEnabled, textToDecode, setTextToDecode, autoCopy, isHistoryEnabled } = useAppContext();
    const { toast } = useToast();

    // Shared State
    const [mode, setModeState] = useState("encode");
    const [inputText, setInputText] = useState("");
    const [fileInputName, setFileInputName] = useState("");
    const [outputText, setOutputText] = useState("");
    const [passwords, setPasswords] = useState([{ id: 1, value: "" }]);
    const [selectedEmoji, setSelectedEmoji] = useState("😀");
    const [isProcessing, setIsProcessing] = useState(false);
    const [errorText, setErrorText] = useState("");
    const [activeTab, setActiveTab] = useState("text");

    // Other State
    const [emojiList, setEmojiList] = useState<string[]>([]);
    const [alphabetList, setAlphabetList] = useState<string[]>([]);
    const [showShare, setShowShare] = useState(false);
    const [decryptedFileUrl, setDecryptedFileUrl] = useState<string | null>(null);

    const isEncoding = mode === "encode";

    useEffect(() => {
        const fetchLists = async () => {
            const [emojis, alphabets] = await Promise.all([getCustomEmojiList(), getCustomAlphabetList()]);
            setEmojiList(emojis);
            setAlphabetList(alphabets);
            setSelectedEmoji(emojis[0] || "😀");
        };
        fetchLists();
        if (typeof navigator !== "undefined" && typeof navigator.share === 'function') setShowShare(true);
    }, []);

    useEffect(() => {
        if (textToDecode) {
            setInputText(textToDecode);
            setActiveTab("text");
            setModeState("decode");
            setTextToDecode(null);
        }
    }, [textToDecode, setTextToDecode]);

    useEffect(() => {
        const process = async () => {
            if (inputText.trim() === "") { setOutputText(""); setErrorText(""); return; }
            const activePasswords = passwords.map(p => p.value).filter(Boolean);
            if (isPasswordGloballyEnabled && activePasswords.length === 0) {
                setErrorText(t('encoderDecoder.passwordRequiredError')); setOutputText(""); return;
            }
            setIsProcessing(true); setErrorText(""); setDecryptedFileUrl(null);
            try {
                const result = isEncoding
                    ? await encode({ emoji: selectedEmoji, text: inputText, type: 'aes256', passwords: isPasswordGloballyEnabled ? activePasswords : [] })
                    : await decode({ text: inputText, type: 'aes256', passwords: isPasswordGloballyEnabled ? activePasswords : [] });
                setOutputText(result);
                if (activeTab === 'file' && !isEncoding && result) {
                    try {
                        const blob = base64ToBlob(result);
                        setDecryptedFileUrl(URL.createObjectURL(blob));
                    } catch (e) {
                         toast({ variant: "destructive", title: t('fileEncoder.errors.decodeFailed') });
                    }
                }
                if (isHistoryEnabled && result) {
                    const historyInput = activeTab === 'file' ? `file: ${fileInputName}` : inputText;
                    await addToHistory({ inputText: historyInput, outputText: result, mode: isEncoding ? "encode" : "decode" });
                }
                if (result && isEncoding && autoCopy) { navigator.clipboard.writeText(result); toast({ title: t('toasts.autoCopySuccess') }); }
            } catch (e: any) {
                setOutputText("");
                const modeText = mode === "encode" ? t('encoderDecoder.encodeError') : t('encoderDecoder.decodeError');
                setErrorText(e.message || t('encoderDecoder.genericError', { mode: modeText }));
            } finally { setIsProcessing(false); }
        };
        const debounceTimeout = setTimeout(process, 500);
        return () => clearTimeout(debounceTimeout);
    }, [inputText, mode, selectedEmoji, passwords, isPasswordGloballyEnabled, autoCopy, toast, t, isHistoryEnabled, activeTab, fileInputName]);

    const handleFileContentRead = (content: string, name: string) => {
        setInputText(content);
        setFileInputName(name);
    }

    const handleClear = () => {
        setInputText("");
        setOutputText("");
        setFileInputName("");
        if (decryptedFileUrl) {
            URL.revokeObjectURL(decryptedFileUrl);
            setDecryptedFileUrl(null);
        }
    }

    return (
        <Card className="w-full sm:max-w-2xl mx-auto animate-in">
            <CardHeader><CardTitle className="text-xl sm:text-2xl font-bold text-center">{t('encoderDecoder.title')}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse">
                    <Label htmlFor="mode-toggle">{t('encoderDecoder.decodeLabel')}</Label>
                    <Switch id="mode-toggle" checked={isEncoding} onCheckedChange={(c) => setModeState(c ? 'encode' : 'decode')} />
                    <Label htmlFor="mode-toggle">{t('encoderDecoder.encodeLabel')}</Label>
                </div>

                {isPasswordGloballyEnabled && (
                    <div className="space-y-2 p-3 border rounded-lg animate-in">
                         <div className="flex items-center justify-between"><Label className="font-semibold">{t('encoderDecoder.layers.title')}</Label><div className="flex items-center gap-2"><span className="text-xs text-muted-foreground">{t('encoderDecoder.layers.count', { count: passwords.filter(p => p.value).length })}</span><div className="flex items-center gap-1 text-xs text-blue-500"><ShieldCheck className="h-4 w-4"/><span>AES-256</span></div></div></div>
                        <div className="space-y-2 pt-2">
                            {passwords.map((p, index) => (
                                <div key={p.id} className="flex items-center gap-2">
                                    <div className="relative flex-grow"><KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input type="password" placeholder={t('encoderDecoder.passwordLayerPlaceholder', { layer: index + 1 })} value={p.value} onChange={(e) => { const newPasswords = [...passwords]; newPasswords[index].value = e.target.value; setPasswords(newPasswords); }} className="pl-10" /></div>
                                    {passwords.length > 1 && (<Button variant="ghost" size="icon" onClick={() => setPasswords(passwords.filter(item => item.id !== p.id))} aria-label={t('encoderDecoder.a11y.removeLayer')}><X className="h-4 w-4 text-red-500"/></Button>)}
                                </div>
                            ))}
                            <Button variant="outline" size="sm" onClick={() => setPasswords([...passwords, {id: Date.now(), value: ''}])}>{t('encoderDecoder.addEncryptionLayer')}</Button>
                            {passwords.length > 0 && (<p className="text-xs text-muted-foreground pt-2">{t('encoderDecoder.layers.hybridHint')}</p>)}
                        </div>
                    </div>
                )}

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2"><TabsTrigger value="text">{t('mainTabs.text')}</TabsTrigger><TabsTrigger value="file">{t('mainTabs.file')}</TabsTrigger></TabsList>
                    <TabsContent value="text" className="pt-4">
                        <Textarea placeholder={t('encoderDecoder.inputTextPlaceholder')} value={inputText} onChange={(e) => setInputText(e.target.value)} className="min-h-[100px] sm:min-h-[120px]"/>
                    </TabsContent>
                    <TabsContent value="file" className="pt-4">
                        <FileInputArea onFileContentRead={handleFileContentRead} isEncoding={isEncoding} />
                    </TabsContent>
                </Tabs>

                <div className="flex justify-center items-center gap-2">
                    <QrCodeScanner onScanSuccess={(text) => {setInputText(text); setActiveTab('text');}} />
                    <Button variant="ghost" size="icon" onClick={async () => {setInputText(await navigator.clipboard.readText()); setActiveTab('text');}} aria-label={t('encoderDecoder.a11y.paste')}><ClipboardPaste className="h-5 w-5" /></Button>
                    <Button variant="ghost" size="icon" onClick={handleClear} disabled={!inputText && !outputText} className="text-red-500" aria-label={t('encoderDecoder.a11y.clearInput')}><X className="h-5 w-5" /></Button>
                </div>

                {isEncoding && (
                    <Tabs defaultValue="emoji" className="w-full animate-in">
                        <TabsList className="grid w-full grid-cols-2"><TabsTrigger value="emoji">{t('encoderDecoder.iconsTab')}</TabsTrigger><TabsTrigger value="alphabet">{t('encoderDecoder.alphabetsTab')}</TabsTrigger></TabsList>
                        <TabsContent value="emoji"><EmojiSelector onEmojiSelect={setSelectedEmoji} selectedEmoji={selectedEmoji} emojiList={emojiList} disabled={!isEncoding} /></TabsContent>
                        <TabsContent value="alphabet"><EmojiSelector onEmojiSelect={setSelectedEmoji} selectedEmoji={selectedEmoji} emojiList={alphabetList} disabled={!isEncoding} /></TabsContent>
                    </Tabs>
                )}

                <div>
                    <Textarea placeholder={isProcessing ? t('encoderDecoder.processingPlaceholder') : t('encoderDecoder.outputTextPlaceholder')} value={outputText} readOnly className="min-h-[100px] sm:min-h-[120px]" />
                    <div className="flex justify-center items-center gap-2 mt-2">
                        <Button variant="ghost" size="icon" onClick={() => navigator.clipboard.writeText(outputText)} disabled={!outputText} aria-label={t('encoderDecoder.a11y.copyOutput')}><Copy className="h-5 w-5" /></Button>
                        <QrCodeDisplay text={outputText} />
                        {showShare && <Button variant="ghost" size="icon" onClick={() => navigator.share({ text: outputText })} disabled={!outputText}><Share className="h-5 w-5" /></Button>}
                        <AddToVaultDialog outputText={outputText} mode={mode} inputText={activeTab === 'file' ? `file: ${fileInputName}` : inputText}><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="text-amber-500" aria-label={t('encoderDecoder.a11y.saveToVault')}><Star className="h-5 w-5" /></Button></TooltipTrigger><TooltipContent><p>{t('encoderDecoder.saveToVault')}</p></TooltipContent></Tooltip></AddToVaultDialog>
                        <Button variant="ghost" size="icon" onClick={() => {if(outputText){setInputText(outputText); setActiveTab('text'); setModeState(m => m === 'encode' ? 'decode' : 'encode');}}} disabled={!outputText} aria-label={t('encoderDecoder.a11y.swap')}><ArrowRightLeft className="h-5 w-5" /></Button>
                    </div>
                </div>

                {decryptedFileUrl && !isEncoding && (
                    <div className="text-center p-4">
                        <a href={decryptedFileUrl} download={fileInputName || 'decrypted-file'}>
                            <Button><Download className="ml-2 h-4 w-4" />{t('fileEncoder.downloadButton')}</Button>
                        </a>
                    </div>
                )}

                {errorText && <div className="text-red-500 text-center py-2">{errorText}</div>}
            </CardContent>
        </Card>
    );
}
