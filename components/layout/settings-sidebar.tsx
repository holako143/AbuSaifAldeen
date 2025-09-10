"use client"

import { useAppStore } from "@/hooks/use-app-store"
import { useSecurity } from "@/hooks/use-security"
import { encoders } from "@/lib/encoders"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"

export function SettingsSidebar() {
  const { algorithm, setAlgorithm, autoDecodeQr, toggleAutoDecodeQr } = useAppStore();
  const { settings: securitySettings, updateSettings } = useSecurity();

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
        <h3 className="text-lg font-medium">Security</h3>
        <div className="space-y-4 mt-2">
          <div className="flex items-center space-x-2">
            <Switch
              id="password-enabled"
              checked={securitySettings.isPasswordEnabled}
              onCheckedChange={(checked) => updateSettings({ isPasswordEnabled: checked })}
            />
            <Label htmlFor="password-enabled">Enable Password</Label>
          </div>
          {securitySettings.isPasswordEnabled && (
            <div>
              <Label htmlFor="password-input">Password</Label>
              <Input
                id="password-input"
                type="password"
                value={securitySettings.password}
                onChange={(e) => updateSettings({ password: e.target.value })}
                placeholder="Enter password"
              />
            </div>
          )}
        </div>
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
