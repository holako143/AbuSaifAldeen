"use client"

import React from "react"
import Link from "next/link"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"

interface SidebarProps {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
}

export function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>القائمة</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col space-y-4 mt-8">
          <Link href="/" className="text-lg p-2 rounded-md hover:bg-muted" onClick={() => setIsOpen(false)}>
            التشفير
          </Link>
          <Link href="/history" className="text-lg p-2 rounded-md hover:bg-muted" onClick={() => setIsOpen(false)}>
            سجل التشفير
          </Link>
          <Link href="/alphabets" className="text-lg p-2 rounded-md hover:bg-muted" onClick={() => setIsOpen(false)}>
            الايموجي والاحرف
          </Link>
          <Link href="/settings" className="text-lg p-2 rounded-md hover:bg-muted" onClick={() => setIsOpen(false)}>
            الإعدادات
          </Link>
        </nav>
      </SheetContent>
    </Sheet>
  )
}
