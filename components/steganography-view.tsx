"use client";

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from '@/hooks/use-translation';
import { hideFilesInImage, revealFilesFromImage } from '@/lib/steganography';
import { Download, Upload, Eye, EyeOff, Loader2, KeyRound, X, File as FileIcon, Archive, Type } from 'lucide-react';
import { useToast } from './ui/use-toast';
import { ScrollArea } from './ui/scroll-area';

function formatBytes(bytes: number, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function PasswordFields({ passwords, setPasswords }: { passwords: {id: number, value: string}[], setPasswords: (passwords: {id: number, value: string}[]) => void }) {
    const { t } = useTranslation();
    return (
        <div className="space-y-2 p-3 border rounded-lg animate-in">
            <Label className="font-semibold">{t('encoderDecoder.layers.title')}</Label>
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
                        <Button variant="ghost" size="icon" onClick={() => setPasswords(passwords.filter(item => item.id !== p.id))} aria-label={t('encoderDecoder.a11y.removeLayer')}>
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
    )
}

export function SteganographyView() {
    const { t } = useTranslation();
    const { toast } = useToast();

    // Common state
    const [usePassword, setUsePassword] = useState(false);
    const [passwords, setPasswords] = useState([{ id: 1, value: "" }]);

    // Encoding state
    const [hideMode, setHideMode] = useState<'text' | 'files'>('text');
    const [coverImage, setCoverImage] = useState<File | null>(null);
    const [secretText, setSecretText] = useState('');
    const [secretFiles, setSecretFiles] = useState<File[]>([]);
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [isEncoding, setIsEncoding] = useState(false);

    // Decoding state
    const [stegoImage, setStegoImage] = useState<File | null>(null);
    const [revealedFiles, setRevealedFiles] = useState<File[]>([]);
    const [isDecoding, setIsDecoding] = useState(false);
    const [decodeError, setDecodeError] = useState<string | null>(null);

    const onDropCover = useCallback((acceptedFiles: File[]) => setCoverImage(acceptedFiles[0]), []);
    const onDropStego = useCallback((acceptedFiles: File[]) => {
        setStegoImage(acceptedFiles[0]);
        setRevealedFiles([]);
        setDecodeError(null);
    }, []);
    const onDropSecret = useCallback((acceptedFiles: File[]) => setSecretFiles(acceptedFiles), []);

    const { getRootProps: getCoverRootProps, getInputProps: getCoverInputProps } = useDropzone({ onDrop: onDropCover, accept: { 'image/*': ['.png', '.jpeg', '.jpg'] }, maxFiles: 1 });
    const { getRootProps: getStegoRootProps, getInputProps: getStegoInputProps } = useDropzone({ onDrop: onDropStego, accept: { 'image/*': ['.png'] }, maxFiles: 1 });
    const { getRootProps: getSecretRootProps, getInputProps: getSecretInputProps } = useDropzone({ onDrop: onDropSecret });

    const handleEncode = async () => {
        const activePasswords = usePassword ? passwords.map(p => p.value).filter(Boolean) : [];
        let filesToHide: File[] = [];

        if (hideMode === 'text') {
            if (!secretText) {
                toast({ variant: 'destructive', title: t('steganography.toasts.encodeError'), description: t('steganography.toasts.textRequired') });
                return;
            }
            const textFile = new File([secretText], "secret.txt", { type: "text/plain" });
            filesToHide.push(textFile);
        } else {
            if (secretFiles.length === 0) {
                toast({ variant: 'destructive', title: t('steganography.toasts.encodeError'), description: t('steganography.toasts.filesRequired') });
                return;
            }
            filesToHide = secretFiles;
        }

        if (!coverImage) {
            toast({ variant: 'destructive', title: t('steganography.toasts.encodeError'), description: t('steganography.toasts.coverRequired') });
            return;
        }

        if (usePassword && activePasswords.length === 0) {
            toast({ variant: 'destructive', title: t('steganography.toasts.passwordRequired') });
            return;
        }

        setIsEncoding(true);
        setResultImage(null);
        try {
            const resultDataUrl = await hideFilesInImage(coverImage, filesToHide, activePasswords);
            setResultImage(resultDataUrl);
            toast({ title: t('steganography.toasts.encodeSuccess') });
        } catch (error: any) {
            toast({ variant: 'destructive', title: t('steganography.toasts.encodeFail'), description: error.message });
        } finally {
            setIsEncoding(false);
        }
    };

    const handleDecode = async () => {
        const activePasswords = usePassword ? passwords.map(p => p.value).filter(Boolean) : [];
        if (!stegoImage) {
            toast({ variant: 'destructive', title: t('steganography.toasts.decodeError'), description: t('steganography.toasts.decodeErrorDesc') });
            return;
        }

        setIsDecoding(true);
        setRevealedFiles([]);
        setDecodeError(null);
        try {
            const files = await revealFilesFromImage(stegoImage, activePasswords);
            setRevealedFiles(files);
            toast({ title: t('steganography.toasts.decodeSuccess') });
        } catch (error: any) {
            setDecodeError(error.message || t('steganography.toasts.decodeFail'));
            toast({ variant: 'destructive', title: t('steganography.toasts.decodeFail'), description: error.message });
        } finally {
            setIsDecoding(false);
        }
    };

    const handleDownloadAll = async () => {
        const zip = new JSZip();
        revealedFiles.forEach(file => {
            zip.file(file.name, file);
        });
        const blob = await zip.generateAsync({ type: 'blob' });
        saveAs(blob, 'revealed-files.zip');
    };

    const isEncodeButtonDisabled = isEncoding || !coverImage || (hideMode === 'text' ? !secretText : secretFiles.length === 0);

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>{t('steganography.title')}</CardTitle>
                <CardDescription>{t('steganography.descriptionFiles')}</CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="encode" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="encode">{t('steganography.encodeTab')}</TabsTrigger>
                        <TabsTrigger value="decode">{t('steganography.decodeTab')}</TabsTrigger>
                    </TabsList>

                    {/* ENCODE TAB */}
                    <TabsContent value="encode" className="space-y-4 pt-4">
                        <div {...getCoverRootProps()} className="p-4 border-2 border-dashed rounded-lg text-center cursor-pointer">
                            <input {...getCoverInputProps()} />
                            <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                            <p className="mt-2 text-sm">{coverImage ? coverImage.name : t('steganography.dropzoneCover')}</p>
                        </div>

                        <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse">
                            <Label htmlFor="hide-mode-toggle">{t('steganography.hideModeFile')}</Label>
                            <Switch id="hide-mode-toggle" checked={hideMode === 'text'} onCheckedChange={(checked) => setHideMode(checked ? 'text' : 'files')} />
                            <Label htmlFor="hide-mode-toggle">{t('steganography.hideModeText')}</Label>
                        </div>

                        {hideMode === 'text' ? (
                            <Textarea
                                placeholder={t('steganography.secretPlaceholder')}
                                value={secretText}
                                onChange={(e) => setSecretText(e.target.value)}
                                className="min-h-[150px]"
                            />
                        ) : (
                            <>
                                <div {...getSecretRootProps()} className="p-4 border-2 border-dashed rounded-lg text-center cursor-pointer">
                                    <input {...getSecretInputProps()} />
                                    <Archive className="mx-auto h-8 w-8 text-muted-foreground" />
                                    <p className="mt-2 text-sm">{secretFiles.length > 0 ? t('steganography.filesSelected', { count: secretFiles.length }) : t('steganography.dropzoneSecret')}</p>
                                </div>
                                {secretFiles.length > 0 && (
                                    <ScrollArea className="h-32 w-full rounded-md border p-2">
                                        {secretFiles.map((file, i) => (
                                            <div key={i} className="flex items-center justify-between p-1">
                                                <div className="flex items-center gap-2">
                                                    <FileIcon className="h-4 w-4" />
                                                    <span className="text-sm">{file.name}</span>
                                                </div>
                                                <span className="text-xs text-muted-foreground">{formatBytes(file.size)}</span>
                                            </div>
                                        ))}
                                    </ScrollArea>
                                )}
                            </>
                        )}

                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                            <Checkbox id="use-password-encode" checked={usePassword} onCheckedChange={(checked) => setUsePassword(!!checked)} />
                            <Label htmlFor="use-password-encode" className="cursor-pointer">{t('steganography.usePassword')}</Label>
                        </div>
                        {usePassword && <PasswordFields passwords={passwords} setPasswords={setPasswords} />}
                        <Button onClick={handleEncode} disabled={isEncodeButtonDisabled} className="w-full">
                            {isEncoding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <EyeOff className="mr-2 h-4 w-4" />}
                            {t('steganography.encodeButton')}
                        </Button>
                        {resultImage && (
                            <div className="text-center space-y-2 pt-4">
                                <h3 className="font-semibold">{t('steganography.resultTitle')}</h3>
                                <img src={resultImage} alt="Steganography Result" className="mx-auto max-w-full rounded-lg border" />
                                <a href={resultImage} download="stego-image.png">
                                    <Button variant="outline" className="w-full"> <Download className="mr-2 h-4 w-4" /> {t('steganography.downloadButton')} </Button>
                                </a>
                            </div>
                        )}
                    </TabsContent>

                    {/* DECODE TAB */}
                    <TabsContent value="decode" className="space-y-4 pt-4">
                        <div {...getStegoRootProps()} className="p-8 border-2 border-dashed rounded-lg text-center cursor-pointer">
                            <input {...getStegoInputProps()} />
                            <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                            <p className="mt-2">{stegoImage ? stegoImage.name : t('steganography.dropzoneStego')}</p>
                        </div>
                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                            <Checkbox id="use-password-decode" checked={usePassword} onCheckedChange={(checked) => setUsePassword(!!checked)} />
                            <Label htmlFor="use-password-decode" className="cursor-pointer">{t('steganography.usePassword')}</Label>
                        </div>
                        {usePassword && <PasswordFields passwords={passwords} setPasswords={setPasswords} />}
                        <Button onClick={handleDecode} disabled={isDecoding || !stegoImage} className="w-full">
                             {isDecoding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Eye className="mr-2 h-4 w-4" />}
                            {t('steganography.decodeButton')}
                        </Button>
                        {revealedFiles.length > 0 && (
                            <div className="pt-4 space-y-2">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-semibold">{t('steganography.revealedTitle')}</h3>
                                    <Button variant="outline" size="sm" onClick={handleDownloadAll}><Download className="mr-2 h-4 w-4" /> {t('steganography.downloadAll')}</Button>
                                </div>
                                <ScrollArea className="h-40 w-full rounded-md border p-2">
                                {revealedFiles.map((file, i) => (
                                    <div key={i} className="flex items-center justify-between p-1">
                                        <div className="flex items-center gap-2">
                                            <FileIcon className="h-4 w-4" />
                                            <span className="text-sm">{file.name}</span>
                                        </div>
                                        <Button variant="ghost" size="icon" onClick={() => saveAs(file)}><Download className="h-4 w-4"/></Button>
                                    </div>
                                ))}
                                </ScrollArea>
                            </div>
                        )}
                        {decodeError && (
                             <p className="text-red-500 text-center pt-2">{decodeError}</p>
                        )}
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}