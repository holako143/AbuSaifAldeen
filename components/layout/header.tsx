"use client"

import * as React from "react"
import Link from "next/link"
import { useTheme } from "next-themes"
import { Menu, Moon, Sun, RefreshCw } from "lucide-react"
import { SecurityDropdown } from "./security-dropdown"
import { Button } from "@/components/ui/button"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { ShieldCheck } from "lucide-react"

export function Header() {
  const { setTheme, theme } = useTheme()

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
          <SecurityDropdown />
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
                        <AccordionContent className="pr-4">
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
                            <Link href="/security" className="block rounded-md p-2 hover:bg-muted">
                              الأمان
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
