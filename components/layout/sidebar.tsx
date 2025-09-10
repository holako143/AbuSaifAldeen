"use client"

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useSidebar } from '@/hooks/use-sidebar'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
  } from "@/components/ui/accordion"
import { Lock, Settings, Code, History, Palette, QrCode } from 'lucide-react'
import { SettingsSidebar } from './settings-sidebar'

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()
  const { isOpen } = useSidebar()

  const navItems = [
    { href: '/', label: 'Encoder/Decoder', icon: Code },
    { href: '/history', label: 'History', icon: History },
    { href: '/themes', label: 'Themes', icon: Palette },
  ]

  return (
    <div className={cn('flex flex-col h-screen bg-card border-r transition-all duration-300', isOpen ? 'w-80' : 'w-20', className)}>
        <div className="flex-1 py-4 px-2 space-y-2 overflow-y-auto">
            <TooltipProvider delayDuration={0}>
                <nav className="space-y-2">
                    {navItems.map((item) => (
                        <Tooltip key={item.href}>
                        <TooltipTrigger asChild>
                            <Link href={item.href}>
                            <Button
                                variant={pathname === item.href ? 'secondary' : 'ghost'}
                                className={cn("w-full", isOpen ? "justify-start" : "justify-center")}
                            >
                                <item.icon className={cn("h-5 w-5", isOpen && "mr-2")} />
                                {isOpen && <span>{item.label}</span>}
                            </Button>
                            </Link>
                        </TooltipTrigger>
                        {!isOpen && (
                            <TooltipContent side="right">
                            {item.label}
                            </TooltipContent>
                        )}
                        </Tooltip>
                    ))}
                </nav>

                <div className={cn("px-2", !isOpen && "hidden")}>
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

            </TooltipProvider>
        </div>
    </div>
  )
}
