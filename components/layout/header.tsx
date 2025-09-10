"use client"

import Link from "next/link"
import { useTheme } from "next-themes"
import { Menu, Moon, Sun, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSidebar } from "@/hooks/use-sidebar"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Sidebar } from "./sidebar"

export function Header() {
  const { setTheme, theme } = useTheme()
  const { isOpen, setOpen } = useSidebar()

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "orange" : "dark")
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        {/* This div will be on the right in RTL */}
        <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2" onClick={() => setOpen(false)}>
                <ShieldCheck className="h-6 w-6" />
                <span className="font-bold">
                شفريشن
                </span>
            </Link>
        </div>

        {/* This nav will be on the left in RTL */}
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
          <Sheet open={isOpen} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="ml-2">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle Sidebar</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="right" className="p-0">
                <Sidebar />
            </SheetContent>
          </Sheet>
        </nav>
      </div>
    </header>
  )
}
