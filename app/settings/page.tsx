"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

export default function SettingsPage() {
  const { setTheme, theme } = useTheme()

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">الإعدادات</h1>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="theme-selector">الثيم</Label>
          <Select value={theme} onValueChange={setTheme}>
            <SelectTrigger className="w-[180px]" id="theme-selector">
              <SelectValue placeholder="اختر الثيم" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">فاتح</SelectItem>
              <SelectItem value="dark">داكن</SelectItem>
              <SelectItem value="system">نظام</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            اختر المظهر العام للتطبيق.
          </p>
        </div>
      </div>
    </div>
  )
}
