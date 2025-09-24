"use client";

import { useEffect, useState } from "react";
import { Copy, Share, ClipboardPaste, X, ArrowRightLeft, KeyRound, ShieldCheck, Star, Loader2, Download, QrCode, Camera } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmojiSelector } from "@/components/emoji-selector";
import { useAppContext } from "@/components/app-provider";
import { AddToVaultDialog } from "@/components/add-to-vault-dialog";
import { useTranslation } from "@/hooks/use-translation";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { QrCodeDisplayDialog, QrCodeScannerDialog } from "@/components/qr-components";
import { FileInputArea } from "@/components/file-input-area";
import { useEncoder } from "@/hooks/use-encoder";
import { useAppLists } from "@/hooks/use-app-lists";

export function Base64EncoderDecoderContent() {
    const { t } = useTranslation();
    const { isPasswordEnabled: isPasswordGloballyEnabled, textToDecode, setTextToDecode } = useAppContext();

    const { emojiList, alphabetList, isLoading: areListsLoading } = useAppLists();
    const {
        mode, setModeState,
        inputText, setInputText,
        fileInputName, setFileInputName,
        outputText,
        passwords, setPasswords,
        selectedEmoji, setSelectedEmoji,
        isProcessing,
        errorText,
        decryptedFileUrl, setDecryptedFileUrl,
        runEncoder,
    } = useEncoder(textToDecode, setTextToDecode);

    const [activeTab, setActiveTab] = useState("text");
    const [showShare, setShowShare] = useState(false);

    const isEncoding = mode === "encode";

    useEffect(() => {
        if (typeof navigator !== "undefined" && typeof navigator.share === 'function') setShowShare(true);
    }, []);

    useEffect(() => {
        // Debounced call to the encoder logic from the hook
        const debounceTimeout = setTimeout(() => runEncoder(inputText, activeTab as 'text' | 'file'), 500);
        return () => clearTimeout(debounceTimeout);
    }, [inputText, runEncoder, activeTab]);

    const handleFileContentRead = (content: string, name: string) => {
        setInputText(content);
        setFileInputName(name);
    }

    const handleClear = () => {
        setInputText("");
        setFileInputName("");
        if (decryptedFileUrl) {
            URL.revokeObjectURL(decryptedFileUrl);
            setDecryptedFileUrl(null);
        }
    }

    if (areListsLoading) {
        return <div className="flex justify-center items-center h-96"><Loader2 className="h-12 w-12 animate-spin" /></div>
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
                    <QrCodeScannerDialog onScanSuccess={(text) => {setInputText(text); setActiveTab('text');}} trigger={<Button variant="ghost" size="icon" aria-label={t('encoderDecoder.a11y.scanQrCode')}><Camera className="h-5 w-5" /></Button>} />
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
                        <QrCodeDisplayDialog text={outputText} trigger={<Button variant="ghost" size="icon" aria-label={t('encoderDecoder.a11y.showQrCode')}><QrCode className="h-5 w-5" /></Button>} />
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