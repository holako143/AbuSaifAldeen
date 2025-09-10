"use client"

import { useAppStore } from "@/hooks/use-app-store"
import { encoders } from "@/lib/encoders"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"

export function SettingsSidebar() {
  const { algorithm, setAlgorithm, autoDecodeQr, toggleAutoDecodeQr } = useAppStore();

  return (
    <div className="p-4 space-y-6">
      <div>
        <h3 className="text-lg font-medium">Algorithm</h3>
        <Select value={algorithm} onValueChange={setAlgorithm}>
          <SelectTrigger aria-label="Algorithm">
            <SelectValue placeholder="Select an algorithm" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(encoders).map(([key, { name }]) => (
              <SelectItem key={key} value={key}>{name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      <div>
        <h3 className="text-lg font-medium">QR Code</h3>
        <div className="flex items-center space-x-2 mt-2">
          <Checkbox
            id="auto-decode-qr"
            checked={autoDecodeQr}
            onCheckedChange={toggleAutoDecodeQr}
          />
          <Label htmlFor="auto-decode-qr" className="cursor-pointer">
            Auto-decode on scan
          </Label>
        </div>
      </div>
    </div>
  )
}
