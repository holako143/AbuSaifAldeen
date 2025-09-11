"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EncryptionType } from "@/app/encoding";

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

const encryptionTypes = [
    { value: "simple", label: "إخفاء بسيط (سريع، للمرح)" },
    { value: "aes256", label: "تشفير AES-256 (آمن، يتطلب كلمة سر)" },
]

export function SettingsView() {
  const { theme, setTheme } = useTheme();
  const [encryptionType, setEncryptionType] = useState<EncryptionType>("simple");

  useEffect(() => {
    const storedType = localStorage.getItem("shifrishan-encryption-type");
    if (storedType === 'simple' || storedType === 'aes256') {
      setEncryptionType(storedType);
    }
  }, []);

  const handleEncryptionTypeChange = (value: string) => {
    const type = value as EncryptionType;
    setEncryptionType(type);
    localStorage.setItem("shifrishan-encryption-type", type);
  }

  return (
    <Card className="w-full max-w-2xl mx-auto animate-in">
      <CardHeader>
        <CardTitle>الإعدادات</CardTitle>
        <CardDescription>
          قم بتخصيص مظهر وأمان التطبيق ليتناسب مع تفضيلاتك.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
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
        <div className="space-y-2">
          <Label htmlFor="encryption-type-select">نوع التشفير الافتراضي</Label>
          <Select value={encryptionType} onValueChange={handleEncryptionTypeChange}>
            <SelectTrigger id="encryption-type-select" className="w-full">
              <SelectValue placeholder="اختر نوع التشفير" />
            </SelectTrigger>
            <SelectContent>
              {encryptionTypes.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
           <p className="text-sm text-muted-foreground">
            اختر مستوى الأمان. سيتم استخدام هذا النوع كافتراضي لعمليات التشفير الجديدة.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
