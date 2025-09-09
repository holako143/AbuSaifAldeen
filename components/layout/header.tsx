"use client"

import * as React from "react"
import Link from "next/link"
import { useTheme } from "next-themes"
import { Menu, Moon, Sun, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { ShieldCheck, Eye, EyeOff } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAlgorithm } from "@/hooks/use-algorithm"
import { encoders, Algorithm } from "@/lib/encoders"
import { useSecurity } from "@/hooks/use-security"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function Header() {
  const { setTheme, theme } = useTheme()
  const { algorithm, setAlgorithm } = useAlgorithm()
  const { settings, setSettings } = useSecurity()
  const [showPassword, setShowPassword] = React.useState(false)

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings({ ...settings, password: e.target.value })
  }

  const handleCheckedChange = (checked: boolean) => {
    setSettings({ ...settings, isPasswordEnabled: checked })
  }

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light")
  }

  const handleReset = () => {
    window.location.reload()
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center">
          <Link href="/" className="flex items-center space-x-2">
            <ShieldCheck className="h-6 w-6" />
            <span className="font-bold">
              شفريشن
            </span>
          </Link>
        </div>

        <nav className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            title="Toggle theme"
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleReset}
            title="Reset"
          >
            <RefreshCw className="h-5 w-5" />
            <span className="sr-only">Reset</span>
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" title="Open menu">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent>
              <div className="px-4 py-6">
                <nav className="grid gap-4">
                  <Link href="/" className="flex items-center space-x-2 rounded-md p-2 hover:bg-muted">
                    <span>التشفير</span>
                  </Link>
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="settings">
                        <AccordionTrigger className="p-2 hover:bg-muted rounded-md">الإعدادات</AccordionTrigger>
                        <AccordionContent className="pr-4 space-y-2">
                          <div className="p-2">
                            <label htmlFor="algorithm-select" className="text-sm font-medium">نوع التشفير</label>
                            <Select value={algorithm} onValueChange={(value) => setAlgorithm(value as Algorithm)}>
                              <SelectTrigger id="algorithm-select" className="w-full mt-1">
                                <SelectValue placeholder="Algorithm" />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.keys(encoders).map((key) => (
                                  <SelectItem key={key} value={key}>{encoders[key as Algorithm].name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="p-2 space-y-2">
                            <label className="text-sm font-medium">الأمان</label>
                            <div className="flex items-center space-x-2 pt-2">
                              <Checkbox
                                id="enable-password"
                                checked={settings.isPasswordEnabled}
                                onCheckedChange={handleCheckedChange}
                              />
                              <Label htmlFor="enable-password">تفعيل كلمة المرور</Label>
                            </div>
                            {settings.isPasswordEnabled && (
                              <div className="relative">
                                <Input
                                  id="password-input"
                                  type={showPassword ? "text" : "password"}
                                  placeholder="أدخل كلمة المرور..."
                                  value={settings.password || ''}
                                  onChange={handlePasswordChange}
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
                            )}
                          </div>
                          <nav className="grid gap-2">
                            <Link href="/themes" className="block rounded-md p-2 hover:bg-muted">
                              الثيمات
                            </Link>
                            <Link href="/history" className="block rounded-md p-2 hover:bg-muted">
                              سجل التشفير
                            </Link>
                            <Link href="/manage" className="block rounded-md p-2 hover:bg-muted">
                              إدارة الرموز
                            </Link>
                          </nav>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </nav>
      </div>
    </header>
  )
}
