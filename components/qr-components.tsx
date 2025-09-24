"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { useTranslation } from "@/hooks/use-translation";
import { useMediaQuery } from "@/hooks/use-media-query";
import { QrCode, Camera, Download, Share } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Html5QrcodeScanner, Html5QrcodeScannerState } from "html5-qrcode";

const QR_CODE_SCANNER_ID = "qr-code-scanner-region";

function QrCodeDisplayDialog({ text, trigger }: { text: string, trigger: React.ReactNode }) {
    const { t } = useTranslation();
    const qrRef = useRef<HTMLDivElement>(null);
    const [isOpen, setIsOpen] = useState(false);
    const isDesktop = useMediaQuery("(min-width: 768px)");

    const handleDownload = () => {
        if (!qrRef.current) return;
        const svgElement = qrRef.current.querySelector("svg");
        if (!svgElement) return;

        const svgData = new XMLSerializer().serializeToString(svgElement);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const img = new Image();
        img.onload = () => {
            canvas.width = 256;
            canvas.height = 256;
            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            const pngFile = canvas.toDataURL("image/png");
            const downloadLink = document.createElement("a");
            downloadLink.download = "shifrishan-qrcode.png";
            downloadLink.href = pngFile;
            downloadLink.click();
        };
        img.src = "data:image/svg+xml;base64," + btoa(svgData);
    };

    const handleShare = async () => {
        if (!qrRef.current || !navigator.share) return;
        const svgElement = qrRef.current.querySelector("svg");
        if (!svgElement) return;

        const svgData = new XMLSerializer().serializeToString(svgElement);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const img = new Image();
        img.onload = async () => {
            canvas.width = 256;
            canvas.height = 256;
            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            canvas.toBlob(async (blob) => {
                if (!blob) return;
                try {
                    await navigator.share({
                        files: [new File([blob], "qrcode.png", { type: "image/png" })],
                        title: t('encoderDecoder.qrCodeTitle'),
                    });
                } catch (error) {
                    console.error('Error sharing', error);
                }
            }, 'image/png');
        };
        img.src = "data:image/svg+xml;base64," + btoa(svgData);
    };

    const title = t('encoderDecoder.qrCodeTitle');
    const content = (
        <>
            <div ref={qrRef} className="flex items-center justify-center p-4 bg-white rounded-lg">
                <QRCodeSVG value={text} size={256} />
            </div>
            <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={handleDownload}><Download className="ml-2 h-4 w-4" />{t('fileEncoder.downloadButton')}</Button>
                {navigator.share && <Button onClick={handleShare}><Share className="ml-2 h-4 w-4" />{t('encoderDecoder.a11y.shareOutput')}</Button>}
            </div>
        </>
    );

    if (isDesktop) {
        return (
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>{trigger}</DialogTrigger>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
                    {content}
                </DialogContent>
            </Dialog>
        );
    }
    return (
        <Drawer open={isOpen} onOpenChange={setIsOpen}>
            <DrawerTrigger asChild>{trigger}</DrawerTrigger>
            <DrawerContent>
                <DrawerHeader className="text-left"><DrawerTitle>{title}</DrawerTitle></DrawerHeader>
                <div className="p-4">{content}</div>
                <DrawerFooter className="pt-2"><DrawerClose asChild><Button variant="outline">{t('vaultDialog.cancel')}</Button></DrawerClose></DrawerFooter>
            </DrawerContent>
        </Drawer>
    );
}

function QrCodeScannerDialog({ onScanSuccess, trigger }: { onScanSuccess: (decodedText: string) => void, trigger: React.ReactNode }) {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const isDesktop = useMediaQuery("(min-width: 768px)");

    useEffect(() => {
        if (!isOpen) return;
        const timeoutId = setTimeout(() => {
            const scanner = new Html5QrcodeScanner(QR_CODE_SCANNER_ID, { fps: 10, qrbox: 250 }, false);
            let didScan = false;
            const handleSuccess = (decodedText: string) => {
                if (didScan) return;
                didScan = true;
                onScanSuccess(decodedText);
                if (scanner.getState() === Html5QrcodeScannerState.SCANNING) scanner.clear().catch(console.error);
                setIsOpen(false);
            };
            const handleError = (error: any) => {};
            try {
                scanner.render(handleSuccess, handleError);
            } catch (err) {
                console.error("Failed to render QR Code Scanner:", err);
                setIsOpen(false);
            }
            return () => { if (scanner?.getState() === Html5QrcodeScannerState.SCANNING) scanner.clear().catch(console.error); };
        }, 100);
        return () => clearTimeout(timeoutId);
    }, [isOpen, onScanSuccess]);

    const title = t('encoderDecoder.qrScanTitle');

    if (isDesktop) {
        return (
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>{trigger}</DialogTrigger>
                <DialogContent>
                    <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
                    <div id={QR_CODE_SCANNER_ID} className="w-full"></div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Drawer open={isOpen} onOpenChange={setIsOpen}>
            <DrawerTrigger asChild>{trigger}</DrawerTrigger>
            <DrawerContent>
                <DrawerHeader className="text-left"><DrawerTitle>{title}</DrawerTitle></DrawerHeader>
                <div className="p-4"><div id={QR_CODE_SCANNER_ID} className="w-full"></div></div>
                <DrawerFooter className="pt-2"><DrawerClose asChild><Button variant="outline">{t('vaultDialog.cancel')}</Button></DrawerClose></DrawerFooter>
            </DrawerContent>
        </Drawer>
    );
}

export { QrCodeDisplayDialog, QrCodeScannerDialog };
