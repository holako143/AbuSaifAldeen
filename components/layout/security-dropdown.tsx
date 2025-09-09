"use client"

import * as React from "react"
import { useSecurity } from "@/hooks/use-security"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Shield, Eye, EyeOff } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function SecurityDropdown() {
  const { settings, setSettings } = useSecurity()
  const { toast } = useToast()
  const [localPassword, setLocalPassword] = React.useState(settings.password || "")
  const [showPassword, setShowPassword] = React.useState(false)

  const handleSave = () => {
    setSettings({ ...settings, password: localPassword })
    toast({ title: "تم حفظ إعدادات الأمان!" })
  }

  const handleCheckedChange = (checked: boolean) => {
    setSettings({ ...settings, isPasswordEnabled: checked })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Shield className={`h-5 w-5 ${settings.isPasswordEnabled ? 'text-primary' : ''}`} />
          <span className="sr-only">Security Settings</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 p-2" align="end">
        <DropdownMenuLabel>الحماية بكلمة مرور</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="enable-password"
              checked={settings.isPasswordEnabled}
              onCheckedChange={handleCheckedChange}
            />
            <Label htmlFor="enable-password">تفعيل كلمة المرور</Label>
          </div>
        </DropdownMenuItem>
        {settings.isPasswordEnabled && (
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            <div className="w-full space-y-2">
              <div className="relative">
                <Input
                  id="password-input"
                  type={showPassword ? "text" : "password"}
                  placeholder="أدخل كلمة المرور..."
                  value={localPassword}
                  onChange={(e) => setLocalPassword(e.target.value)}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-1/2 right-2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <Button onClick={handleSave} className="w-full">
                حفظ كلمة المرور
              </Button>
            </div>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
