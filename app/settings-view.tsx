"use client";

import { useTheme } from "next-themes";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function SettingsView() {
  const { theme, setTheme } = useTheme();

  return (
    <Card className="w-full max-w-2xl mx-auto animate-in">
      <CardHeader>
        <CardTitle>الإعدادات</CardTitle>
        <CardDescription>
          قم بتخصيص مظهر التطبيق ليتناسب مع تفضيلاتك.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="space-y-2">
          <Label>مظهر التطبيق (الثيم)</Label>
          <div className="flex gap-2">
            <Button variant={theme === 'light' ? 'default' : 'outline'} onClick={() => setTheme("light")}>
              فاتح
            </Button>
            <Button variant={theme === 'dark' ? 'default' : 'outline'} onClick={() => setTheme("dark")}>
              داكن
            </Button>
             <Button variant={theme === 'system' ? 'default' : 'outline'} onClick={() => setTheme("system")}>
              النظام
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            اختر بين المظهر الفاتح أو الداكن، أو اجعله يتبع إعدادات النظام.
          </p>
        </div>
        {/* Other settings can be added here in the future */}
      </CardContent>
    </Card>
  );
}
