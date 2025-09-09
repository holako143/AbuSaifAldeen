"use client"

import { useEffect } from 'react';
import { Html5QrcodeScanner, QrcodeErrorCallback, QrcodeSuccessCallback } from 'html5-qrcode';

interface QrScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanError?: (errorMessage: string) => void;
}

const QR_SCANNER_ELEMENT_ID = "qr-reader";

export function QrScanner({ onScanSuccess, onScanError }: QrScannerProps) {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      QR_SCANNER_ELEMENT_ID,
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        rememberLastUsedCamera: true,
      },
      false // verbose
    );

    const handleSuccess: QrcodeSuccessCallback = (decodedText, decodedResult) => {
      scanner.clear();
      onScanSuccess(decodedText);
    };

    const handleError: QrcodeErrorCallback = (errorMessage) => {
      const isNotFound = errorMessage.includes("No MultiFormat Readers");
      if (!isNotFound && onScanError) {
        onScanError(errorMessage);
      }
    };

    scanner.render(handleSuccess, handleError);

    return () => {
      // Cleanup function to stop the scanner
      scanner.clear().catch(error => {
        console.error("Failed to clear html5-qrcode-scanner.", error);
      });
    };
  }, [onScanSuccess, onScanError]);

  return <div id={QR_SCANNER_ELEMENT_ID} />;
}
