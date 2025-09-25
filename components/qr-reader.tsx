"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeScannerState } from "html5-qrcode";
import { useTranslation } from "@/hooks/use-translation";
import { Button } from "./ui/button";
import { Camera, Upload, XCircle } from "lucide-react";

interface QrReaderProps {
  onScanSuccess: (decodedText: string) => void;
}

export function QrReader({ onScanSuccess }: QrReaderProps) {
  const { t } = useTranslation();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const QR_READER_ID = "qr-reader-container";

  useEffect(() => {
    return () => {
      // Cleanup scanner when component unmounts
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  const startCameraScan = async () => {
    setError(null);
    setIsScanning(true);

    // Ensure the container is visible before starting
    setTimeout(async () => {
      try {
        const qrScanner = new Html5Qrcode(QR_READER_ID);
        scannerRef.current = qrScanner;

        const cameras = await Html5Qrcode.getCameras();
        if (!cameras || cameras.length === 0) {
          throw new Error(t('qrCode.reader.noCameras'));
        }

        await qrScanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            onScanSuccess(decodedText);
            stopScan();
          },
          (errorMessage) => {
            // This callback is called frequently, so we don't set an error state here.
            // console.warn(`QR Code scan error: ${errorMessage}`);
          }
        );
      } catch (err: any) {
        console.error("Camera scan failed:", err);
        setError(err.message || t('qrCode.reader.cameraError'));
        setIsScanning(false);
      }
    }, 100);
  };

  const stopScan = () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      scannerRef.current.stop()
        .then(() => setIsScanning(false))
        .catch(err => {
            console.error("Failed to stop scanner:", err);
            setIsScanning(false); // Force state update
        });
    } else {
      setIsScanning(false);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setError(null);
      const qrScanner = new Html5Qrcode(QR_READER_ID, true); // Use verbose mode for file scan
      try {
        const decodedText = await qrScanner.scanFile(file, false);
        onScanSuccess(decodedText);
      } catch (err: any) {
        setError(err.message || t('qrCode.reader.fileScanError'));
      } finally {
        // Reset file input
        if(fileInputRef.current) fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="w-full max-w-md mx-auto text-center p-4 border rounded-lg">
      <div id={QR_READER_ID} className={`w-full ${!isScanning ? 'hidden' : ''}`}></div>

      {!isScanning && (
        <div className="space-y-4">
            <h3 className="text-lg font-medium">{t('qrCode.reader.title')}</h3>
            <p className="text-sm text-muted-foreground">{t('qrCode.reader.prompt')}</p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Button onClick={startCameraScan}>
                    <Camera className="mr-2 h-4 w-4" />
                    {t('qrCode.reader.scanWithCamera')}
                </Button>
                <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="mr-2 h-4 w-4" />
                    {t('qrCode.reader.uploadImage')}
                </Button>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                />
            </div>
        </div>
      )}

      {isScanning && (
        <Button onClick={stopScan} variant="destructive" className="mt-4">
            <XCircle className="mr-2 h-4 w-4" />
            {t('qrCode.reader.stopScan')}
        </Button>
      )}

      {error && <p className="text-red-500 mt-4">{error}</p>}
    </div>
  );
}