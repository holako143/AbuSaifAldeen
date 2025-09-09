"use client"

import { useSecurity } from "@/hooks/use-security"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

export function SecuritySettings() {
  const { settings, updateSettings } = useSecurity()
  const { toast } = useToast()

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateSettings({ password: e.target.value })
  }

  const handleToggle = (checked: boolean) => {
    if (!checked && settings.password) {
      // For security, clear password when disabling
      updateSettings({ isPasswordEnabled: false, password: "" })
      toast({ title: "Password protection disabled and password cleared."})
    } else {
      updateSettings({ isPasswordEnabled: checked })
    }
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Switch
          id="security-toggle"
          checked={settings.isPasswordEnabled}
          onCheckedChange={handleToggle}
        />
        <Label htmlFor="security-toggle">تفعيل كلمة المرور</Label>
      </div>

      {settings.isPasswordEnabled && (
        <div className="space-y-2">
          <Label htmlFor="password-input">كلمة المرور</Label>
          <Input
            id="password-input"
            type="password"
            value={settings.password}
            onChange={handlePasswordChange}
            placeholder="أدخل كلمة المرور"
          />
          <p className="text-xs text-muted-foreground">
            سيتم استخدام كلمة المرور هذه لتشفير وفك تشفير النص.
          </p>
        </div>
      )}
    </div>
  )
}
