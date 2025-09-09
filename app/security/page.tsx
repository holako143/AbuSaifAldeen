import { SecuritySettings } from "@/components/settings/security-settings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SecurityPage() {
  return (
    <div className="container max-w-2xl py-8">
      <h1 className="text-3xl font-bold mb-6">الأمان</h1>
      <Card className="card-hover-effect">
        <CardHeader>
          <CardTitle>تأمين التشفير</CardTitle>
        </CardHeader>
        <CardContent>
          <SecuritySettings />
        </CardContent>
      </Card>
    </div>
  );
}
