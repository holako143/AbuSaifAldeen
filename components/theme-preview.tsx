"use client"

import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"

interface ThemePreviewProps {
  themeName: string;
}

export function ThemePreview({ themeName }: ThemePreviewProps) {
  const { theme, setTheme } = useTheme();

  const colors = [
    'bg-primary',
    'bg-secondary',
    'bg-accent',
    'bg-card',
  ];

  return (
    <div className="space-y-2">
      <Card className={cn("w-full transition-all", themeName)}>
        <CardHeader>
            <CardTitle className="capitalize">{themeName}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex -space-x-2 rtl:space-x-reverse">
                {colors.map((colorClass) => (
                    <div
                    key={colorClass}
                    className={cn("w-8 h-8 rounded-full border-2 border-card", colorClass)}
                    />
                ))}
            </div>
            <Button
              onClick={() => setTheme(themeName)}
              size="sm"
              disabled={theme === themeName}
            >
              {theme === themeName && <Check className="w-4 h-4 mr-2" />}
              Apply
            </Button>
          </div>
          <div className="p-2 rounded-md bg-background">
            <p className="text-sm text-foreground">
              This is how the {themeName} theme looks.
            </p>
            <Button size="sm" variant="secondary" className="mt-2">
                Sample Button
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
