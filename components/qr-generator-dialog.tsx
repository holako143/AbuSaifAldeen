"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import pako from 'pako';
import { bufferToBase64 } from "@/lib/crypto";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerFooter,
  DrawerClose
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";
import { Download, QrCode, Loader2, Share2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useToast } from "./ui/use-toast";

interface QrGeneratorDialogProps {
  text: string;
  disabled?: boolean;
}

function QrCodeContent({ qrDataUrl, isLoading, onDownload, onShare, showShare }: { qrDataUrl: string | null, isLoading: boolean, onDownload: () => void, onShare: () => void, showShare: boolean }) {
  const { t } = useTranslation();
  return (
    <>
        <div className="flex items-center justify-center p-4 min-h-[256px]">
          {isLoading && <Loader2 className="h-12 w-12 animate-spin" />}
          {!isLoading && qrDataUrl && (
            <img src={qrDataUrl} alt="Generated QR Code" width={256} height={256} />
          )}
        </div>
        <DrawerFooter className="pt-2 sm:pt-0">
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={onDownload} className="w-full" disabled={!qrDataUrl}>
                <Download className="mr-2 h-4 w-4" />
                {t('qrCode.generate.download')}
            </Button>
            {showShare && (
                <Button onClick={onShare} variant="outline" className="w-full" disabled={!qrDataUrl}>
                    <Share2 className="mr-2 h-4 w-4" />
                    {t('qrCode.generate.share')}
                </Button>
            )}
          </div>
        </DrawerFooter>
    </>
  );
}

export function QrGeneratorDialog({ text, disabled }: QrGeneratorDialogProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  useEffect(() => {
    if (typeof navigator !== "undefined" && typeof navigator.share === 'function') {
        setShowShare(true);
    }
  }, []);

  useEffect(() => {
    if (isOpen && text) {
      setIsLoading(true);
      setQrDataUrl(null);
      try {
        const prefixedText = `shfr://${text}`;
        const compressed = pako.deflate(prefixedText);
        const base64Data = bufferToBase64(compressed);

        QRCode.toDataURL(base64Data, {
            width: 256,
            margin: 2,
            errorCorrectionLevel: "H",
        })
        .then(url => {
            setQrDataUrl(url);
        })
        .catch(err => {
            console.error("Failed to generate QR code:", err);
        })
        .finally(() => {
            setIsLoading(false);
        });
      } catch (error) {
        console.error("Failed to process and generate QR code:", error);
        setIsLoading(false);
      }
    }
  }, [isOpen, text]);

  const handleDownload = () => {
    if (qrDataUrl) {
      const link = document.createElement("a");
      link.download = "qrcode.png";
      link.href = qrDataUrl;
      link.click();
    }
  };

  const handleShare = async () => {
    if (!qrDataUrl) return;
    try {
        const response = await fetch(qrDataUrl);
        const blob = await response.blob();
        const file = new File([blob], 'qrcode.png', { type: 'image/png' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
                files: [file],
                title: t('qrCode.generate.shareTitle'),
            });
        } else {
            throw new Error("Cannot share files on this browser.");
        }
    } catch (error) {
        console.error("Share failed:", error);
        toast({ variant: 'destructive', title: t('qrCode.generate.shareFailed') });
    }
  };

  const triggerButton = (
    <Button variant="ghost" size="icon" disabled={disabled} aria-label={t('qrCode.generate.ariaLabel')}>
        <QrCode className="h-5 w-5" />
    </Button>
  );

  const contentProps = {
    qrDataUrl,
    isLoading,
    onDownload: handleDownload,
    onShare: handleShare,
    showShare
  };

  if (isDesktop) {
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <DialogTrigger asChild>{triggerButton}</DialogTrigger>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{t('qrCode.generate.tooltip')}</p>
                </TooltipContent>
            </Tooltip>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{t('qrCode.generate.title')}</DialogTitle>
                </DialogHeader>
                <QrCodeContent {...contentProps} />
            </DialogContent>
        </Dialog>
    );
  }

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <Tooltip>
            <TooltipTrigger asChild>
                <DrawerTrigger asChild>{triggerButton}</DrawerTrigger>
            </TooltipTrigger>
            <TooltipContent>
                    <p>{t('qrCode.generate.tooltip')}</p>
            </TooltipContent>
        </Tooltip>
        <DrawerContent>
            <DrawerHeader className="text-left">
                <DrawerTitle>{t('qrCode.generate.title')}</DrawerTitle>
            </DrawerHeader>
            <QrCodeContent {...contentProps} />
        </DrawerContent>
    </Drawer>
  );
}