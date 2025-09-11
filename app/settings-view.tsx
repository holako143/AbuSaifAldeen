"use client";

import { useTheme } from "next-themes";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const themes = [
  { value: "light", label: "فاتح" },
  { value: "dark", label: "داكن" },
  { value: "system", label: "النظام" },
  { value: "theme-zinc", label: "رصاصي" },
  { value: "theme-slate", label: "أردوازي" },
  { value: "theme-stone", label: "حجري" },
  { value: "theme-orange", label: "برتقالي" },
  { value: "theme-rose", label: "وردي" },
  { value: "theme-green", label: "أخضر" },
  { value: "theme-blue", label: "أزرق" },
  { value: "theme-violet", label: "بنفسجي" },
  { value: "theme-yellow", label: "أصفر" },
];

export function SettingsView() {
  const { theme, setTheme } = useTheme();

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>الإعدادات</CardTitle>
        <CardDescription>
          قم بتخصيص مظهر التطبيق ليتناسب مع تفضيلاتك.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="theme-select">مظهر التطبيق (الثيم)</Label>
          <Select value={theme} onValueChange={setTheme}>
            <SelectTrigger id="theme-select" className="w-full">
              <SelectValue placeholder="اختر ثيمًا" />
            </SelectTrigger>
            <SelectContent>
              {themes.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            اختر المظهر الذي تفضله. سيتم حفظ اختيارك تلقائيًا.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
