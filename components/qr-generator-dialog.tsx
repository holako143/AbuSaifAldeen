"use client";

import { useEffect, useRef, useState } from "react";
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
import { Download, QrCode } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

interface QrGeneratorDialogProps {
  text: string;
  disabled?: boolean;
}

export function QrGeneratorDialog({ text, disabled }: QrGeneratorDialogProps) {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen && text && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, text, {
        width: 256,
        margin: 2,
        errorCorrectionLevel: "H",
      })
        .catch(err => {
          console.error("Failed to generate QR code:", err);
        });
    }
  }, [isOpen, text]);

  const handleDownload = () => {
    if (canvasRef.current) {
      const link = document.createElement("a");
      link.download = "qrcode.png";
      link.href = canvasRef.current.toDataURL("image/png");
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
            <p>{t('qrCode.generate.tooltip')}</p>
        </TooltipContent>
      </Tooltip>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('qrCode.generate.title')}</DialogTitle>
        </DialogHeader>
        <div className="flex items-center justify-center p-4">
          <canvas ref={canvasRef} />
        </div>
        <DialogFooter>
          <Button onClick={handleDownload} className="w-full">
            <Download className="mr-2 h-4 w-4" />
            {t('qrCode.generate.download')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}