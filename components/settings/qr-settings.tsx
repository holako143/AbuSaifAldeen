"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

interface QrSettingsProps {
  autoDecodeQr: boolean;
  onAutoDecodeQrChange: (checked: boolean) => void;
}

export function QrSettings({ autoDecodeQr, onAutoDecodeQrChange }: QrSettingsProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">QR Code Settings</h3>
      <div className="flex items-center space-x-2">
        <Checkbox
          id="auto-decode-qr"
          checked={autoDecodeQr}
          onCheckedChange={onAutoDecodeQrChange}
        />
        <Label htmlFor="auto-decode-qr" className="cursor-pointer">
          Auto-decode QR on scan
        </Label>
      </div>
    </div>
  )
}
