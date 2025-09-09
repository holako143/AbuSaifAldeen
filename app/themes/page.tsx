import { ThemeSwitcher } from "@/components/settings/theme-switcher";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ThemesPage() {
  return (
    <div className="container max-w-2xl py-8">
      <h1 className="text-3xl font-bold mb-6">الثيمات</h1>
      <Card className="card-hover-effect">
        <CardHeader>
          <CardTitle>اختر الثيم المفضل لديك</CardTitle>
        </CardHeader>
        <CardContent>
          <ThemeSwitcher />
        </CardContent>
      </Card>
    </div>
  );
}
