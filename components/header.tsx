"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useTheme } from "next-themes"
import { Menu, Moon, Sun, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sidebar } from "./sidebar"

export function Header() {
  const [isSidebarOpen, setSidebarOpen] = useState(false)
  const { setTheme, theme } = useTheme()

  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen)

  return (
    <>
      <header className="flex items-center justify-between p-4 border-b bg-background sticky top-0 z-50">
      {/* Right side of header */}
      <div className="flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2">
          <Package className="h-8 w-8" />
          <h1 className="text-xl font-bold">AbuSaifAldeen</h1>
        </Link>
      </div>

      {/* Left side of header */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
        <Button variant="ghost" size="icon" onClick={toggleSidebar}>
          <Menu className="h-6 w-6" />
          <span className="sr-only">Open sidebar</span>
        </Button>
      </div>
    </header>
    <Sidebar isOpen={isSidebarOpen} setIsOpen={setSidebarOpen} />
    </>
  )
}
