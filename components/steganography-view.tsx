"use client";

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from '@/hooks/use-translation';
import { hideTextInImage, revealTextFromImage } from '@/lib/steganography';
import { Download, Upload, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useToast } from './ui/use-toast';

export function SteganographyView() {
    const { t } = useTranslation();
    const { toast } = useToast();

    // State for encoding
    const [coverImage, setCoverImage] = useState<File | null>(null);
    const [secretText, setSecretText] = useState('');
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [isEncoding, setIsEncoding] = useState(false);

    // State for decoding
    const [stegoImage, setStegoImage] = useState<File | null>(null);
    const [revealedText, setRevealedText] = useState<string | null>(null);
    const [isDecoding, setIsDecoding] = useState(false);
    const [decodeError, setDecodeError] = useState<string | null>(null);

    const onDropCover = useCallback((acceptedFiles: File[]) => {
        setCoverImage(acceptedFiles[0]);
    }, []);

    const onDropStego = useCallback((acceptedFiles: File[]) => {
        setStegoImage(acceptedFiles[0]);
        setRevealedText(null);
        setDecodeError(null);
    }, []);

    const { getRootProps: getCoverRootProps, getInputProps: getCoverInputProps, isDragActive: isCoverDragActive } = useDropzone({ onDrop: onDropCover, accept: { 'image/*': ['.png', '.jpeg', '.jpg'] }, maxFiles: 1 });
    const { getRootProps: getStegoRootProps, getInputProps: getStegoInputProps, isDragActive: isStegoDragActive } = useDropzone({ onDrop: onDropStego, accept: { 'image/*': ['.png'] }, maxFiles: 1 });

    const handleEncode = async () => {
        if (!coverImage || !secretText) {
            toast({ variant: 'destructive', title: t('steganography.toasts.encodeError'), description: t('steganography.toasts.encodeErrorDesc') });
            return;
        }
        setIsEncoding(true);
        setResultImage(null);
        try {
            const resultDataUrl = await hideTextInImage(coverImage, secretText);
            setResultImage(resultDataUrl);
            toast({ title: t('steganography.toasts.encodeSuccess') });
        } catch (error: any) {
            toast({ variant: 'destructive', title: t('steganography.toasts.encodeFail'), description: error.message });
        } finally {
            setIsEncoding(false);
        }
    };

    const handleDecode = async () => {
        if (!stegoImage) {
            toast({ variant: 'destructive', title: t('steganography.toasts.decodeError'), description: t('steganography.toasts.decodeErrorDesc') });
            return;
        }
        setIsDecoding(true);
        setRevealedText(null);
        setDecodeError(null);
        try {
            const text = await revealTextFromImage(stegoImage);
            setRevealedText(text);
            toast({ title: t('steganography.toasts.decodeSuccess') });
        } catch (error: any) {
            setDecodeError(error.message || t('steganography.toasts.decodeFail'));
            toast({ variant: 'destructive', title: t('steganography.toasts.decodeFail'), description: error.message });
        } finally {
            setIsDecoding(false);
        }
    };

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>{t('steganography.title')}</CardTitle>
                <CardDescription>{t('steganography.description')}</CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="encode" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="encode">{t('steganography.encodeTab')}</TabsTrigger>
                        <TabsTrigger value="decode">{t('steganography.decodeTab')}</TabsTrigger>
                    </TabsList>

                    {/* ENCODE TAB */}
                    <TabsContent value="encode" className="space-y-4 pt-4">
                        <div {...getCoverRootProps()} className={`p-8 border-2 border-dashed rounded-lg text-center cursor-pointer ${isCoverDragActive ? 'border-primary' : ''}`}>
                            <input {...getCoverInputProps()} />
                            <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                            <p className="mt-2">{coverImage ? coverImage.name : t('steganography.dropzoneCover')}</p>
                        </div>
                        <Textarea
                            placeholder={t('steganography.secretPlaceholder')}
                            value={secretText}
                            onChange={(e) => setSecretText(e.target.value)}
                            className="min-h-[120px]"
                        />
                        <Button onClick={handleEncode} disabled={isEncoding || !coverImage || !secretText} className="w-full">
                            {isEncoding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <EyeOff className="mr-2 h-4 w-4" />}
                            {t('steganography.encodeButton')}
                        </Button>
                        {resultImage && (
                            <div className="text-center space-y-2 pt-4">
                                <h3 className="font-semibold">{t('steganography.resultTitle')}</h3>
                                <img src={resultImage} alt="Steganography Result" className="mx-auto max-w-full rounded-lg border" />
                                <a href={resultImage} download="stego-image.png">
                                    <Button variant="outline" className="w-full">
                                        <Download className="mr-2 h-4 w-4" />
                                        {t('steganography.downloadButton')}
                                    </Button>
                                </a>
                            </div>
                        )}
                    </TabsContent>

                    {/* DECODE TAB */}
                    <TabsContent value="decode" className="space-y-4 pt-4">
                        <div {...getStegoRootProps()} className={`p-8 border-2 border-dashed rounded-lg text-center cursor-pointer ${isStegoDragActive ? 'border-primary' : ''}`}>
                            <input {...getStegoInputProps()} />
                            <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                            <p className="mt-2">{stegoImage ? stegoImage.name : t('steganography.dropzoneStego')}</p>
                        </div>
                        <Button onClick={handleDecode} disabled={isDecoding || !stegoImage} className="w-full">
                             {isDecoding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Eye className="mr-2 h-4 w-4" />}
                            {t('steganography.decodeButton')}
                        </Button>
                        {revealedText && (
                            <div className="pt-4 space-y-2">
                                <h3 className="font-semibold">{t('steganography.revealedTitle')}</h3>
                                <Textarea value={revealedText} readOnly className="min-h-[120px] bg-muted" />
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