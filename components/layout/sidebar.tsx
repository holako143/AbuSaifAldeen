"use client"

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useSidebar } from '@/hooks/use-sidebar'
import { useIsMobile } from '@/hooks/use-mobile'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Settings, Code, History, Palette } from 'lucide-react'
import { SettingsSidebar } from './settings-sidebar'

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()
  const { isOpen, setOpen } = useSidebar()
  const isMobile = useIsMobile()

  const handleLinkClick = () => {
    if (isMobile) {
      setOpen(false)
    }
  }

  const navItems = [
    { href: '/', label: 'Encoder/Decoder', icon: Code },
    { href: '/history', label: 'History', icon: History },
    { href: '/themes', label: 'Themes', icon: Palette },
  ]

  return (
    <aside className={cn('flex flex-col h-screen bg-card border-r transition-all duration-300', isOpen ? 'w-72' : 'w-20', className)}>
        <div className="flex-1 py-4 px-2 space-y-2 overflow-y-auto">
            <nav className="space-y-1">
                {navItems.map((item) => (
                    <Link key={item.href} href={item.href} onClick={handleLinkClick}>
                        <Button
                            variant={pathname === item.href ? 'secondary' : 'ghost'}
                            className={cn("w-full flex items-center", isOpen ? "justify-start" : "justify-center")}
                        >
                            <item.icon className={cn("h-5 w-5", isOpen && "mr-2")} />
                            <span className={cn(!isOpen && "sr-only")}>{item.label}</span>
                        </Button>
                    </Link>
                ))}
            </nav>

            <div className={cn("px-1", !isOpen && "hidden")}>
                <Accordion type="multiple" className="w-full">
                    <AccordionItem value="settings">
                        <AccordionTrigger>
                            <div className="flex items-center">
                                <Settings className="h-5 w-5 mr-2" />
                                <span>Settings</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent>
                            <SettingsSidebar />
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </div>
        </div>
    </aside>
  )
}
