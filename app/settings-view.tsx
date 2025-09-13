"use client";

import { useTheme } from "next-themes";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

// A new, more visual theme switcher component
function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  const themes = [
    { name: "فاتح", value: "light", class: "bg-gray-100" },
    { name: "داكن", value: "dark", class: "bg-gray-800" },
    { name: "غسق", value: "theme-dusk", class: "theme-dusk-gradient" },
    { name: "محيط", value: "theme-oceanic", class: "theme-oceanic-gradient" },
    { name: "سراب", value: "theme-mirage", class: "theme-mirage-gradient" },
    { name: "ساكورا", value: "theme-sakura", class: "theme-sakura-gradient" },
    { name: "مصفوفة", value: "theme-matrix", class: "theme-matrix-gradient" },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">الثيمات القياسية</h3>
        <p className="text-sm text-muted-foreground">
          مظاهر بسيطة وفعالة للتركيز.
        </p>
        <div className="flex flex-wrap gap-4 mt-4">
          {themes.slice(0, 2).map((t) => (
            <ThemeCard key={t.value} {...t} />
          ))}
           <div className="w-24 h-24"> {/* Placeholder for system theme */}
             <button
                onClick={() => setTheme('system')}
                className={cn(
                  "w-full h-full rounded-lg border-2 flex flex-col items-center justify-center transition-all",
                  theme === 'system' ? "border-primary scale-105" : "border-muted hover:border-muted-foreground",
                )}
              >
                <div className="h-10 w-16 rounded-md bg-gradient-to-br from-gray-100 from-50% to-gray-800 to-50%"></div>
                <span className="mt-2 text-sm font-medium">النظام</span>
              </button>
           </div>
        </div>
      </div>
      <Separator />
      <div>
        <h3 className="text-lg font-medium">الثيمات المميزة</h3>
        <p className="text-sm text-muted-foreground">
          مظاهر حيوية مع خلفيات متحركة.
        </p>
        <div className="flex flex-wrap gap-4 mt-4">
          {themes.slice(2).map((t) => (
            <ThemeCard key={t.value} {...t} />
          ))}
        </div>
      </div>
    </div>
  );

  function ThemeCard({ name, value, class: themeClass }: { name: string, value: string, class: string }) {
    const isSelected = theme === value;
    return (
      <div className="w-24">
        <button
          onClick={() => setTheme(value)}
          className={cn(
            "w-full h-24 rounded-lg border-2 flex items-center justify-center transition-all relative overflow-hidden",
            isSelected ? "border-primary ring-2 ring-primary" : "border-muted hover:border-muted-foreground",
          )}
        >
          <div className={cn("h-full w-full", themeClass)} />
           {isSelected && (
            <div className="absolute inset-0 bg-primary/30 flex items-center justify-center">
                <Check className="h-6 w-6 text-primary-foreground" />
            </div>
           )}
        </button>
        <p className="text-center text-sm font-medium mt-2">{name}</p>
      </div>
    );
  }
}

// Add gradient classes to a utility file or here if not present
// For now, let's just define them in globals.css which is already done.
// This is just a placeholder for the theme card background
const themeGradients = `
.theme-dusk-gradient { background: linear-gradient(-45deg, #230a44, #4a1a6c, #82268a, #b8329d); }
.theme-oceanic-gradient { background: linear-gradient(-45deg, #022c43, #053f5e, #115173, #247ba0); }
.theme-mirage-gradient { background: linear-gradient(-45deg, #4d3618, #a06d3a, #e0a96d, #f5d3a9); }
.theme-sakura-gradient { background: linear-gradient(45deg, #fde9f2, #f8c8dc, #f4a8c6, #f088b0); }
.theme-matrix-gradient { background-color: #000; background-image: radial-gradient(#0f0 1px, transparent 1px), radial-gradient(#0f0 1px, #000 1px); background-size: 20px 20px; background-position: 0 0, 10px 10px; }
`;


export function SettingsView() {
  return (
    <Card className="w-full max-w-4xl mx-auto animate-in">
      <CardHeader>
        <CardTitle>الإعدادات</CardTitle>
        <CardDescription>
          قم بتخصيص مظهر وهوية التطبيق ليتناسب مع تفضيلاتك وأسلوبك.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <ThemeSwitcher />
        {/* Other settings can be added here in the future */}
      </CardContent>
    </Card>
  );
}
