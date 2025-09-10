"use client"

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Settings, Code, History, Palette } from 'lucide-react'
import { SettingsSidebar } from './settings-sidebar'

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
    closeSidebar: () => void;
}

export function Sidebar({ className, closeSidebar }: SidebarProps) {
  const pathname = usePathname()

  const navItems = [
    { href: '/', label: 'Encoder/Decoder', icon: Code },
    { href: '/history', label: 'History', icon: History },
    { href: '/themes', label: 'Themes', icon: Palette },
  ]

  return (
    <div className={cn('flex flex-col h-full bg-card p-4', className)}>
        <nav className="space-y-1">
            {navItems.map((item) => (
                <Link key={item.href} href={item.href} onClick={closeSidebar}>
                    <Button
                        variant={pathname === item.href ? 'secondary' : 'ghost'}
                        className="w-full justify-start"
                    >
                        <item.icon className="mr-2 h-5 w-5" />
                        <span>{item.label}</span>
                    </Button>
                </Link>
            ))}
        </nav>

        <div className="mt-4">
            <Accordion type="multiple" className="w-full">
                <AccordionItem value="settings">
                    <AccordionTrigger>
                        <div className="flex items-center">
                            <Settings className="mr-2 h-5 w-5" />
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
  )
}
