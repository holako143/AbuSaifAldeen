"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";
import { Download, QrCode, Loader2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

interface QrGeneratorDialogProps {
  text: string;
  disabled?: boolean;
  isTextTooLong?: boolean;
}

export function QrGeneratorDialog({ text, disabled, isTextTooLong }: QrGeneratorDialogProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && text) {
      setIsLoading(true);
      setQrDataUrl(null);
      QRCode.toDataURL(text, {
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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" disabled={disabled} aria-label={t('qrCode.generate.ariaLabel')}>
              <QrCode className="h-5 w-5" />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>
            <p>{isTextTooLong ? t('qrCode.generate.tooLongTooltip') : t('qrCode.generate.tooltip')}</p>
        </TooltipContent>
      </Tooltip>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('qrCode.generate.title')}</DialogTitle>
        </DialogHeader>
        <div className="flex items-center justify-center p-4 min-h-[256px]">
          {isLoading && <Loader2 className="h-12 w-12 animate-spin" />}
          {!isLoading && qrDataUrl && (
            <img src={qrDataUrl} alt="Generated QR Code" width={256} height={256} />
          )}
        </div>
        <DialogFooter>
          <Button onClick={handleDownload} className="w-full" disabled={!qrDataUrl}>
            <Download className="mr-2 h-4 w-4" />
            {t('qrCode.generate.download')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}