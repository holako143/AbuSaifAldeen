import { EmojiManager } from "@/components/settings/emoji-manager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ManagePage() {
  return (
    <div className="container max-w-2xl py-8">
      <h1 className="text-3xl font-bold mb-6">إدارة الرموز</h1>
      <Card className="card-hover-effect">
        <CardHeader>
          <CardTitle>إدارة الرموز التعبيرية والأحرف</CardTitle>
        </CardHeader>
        <CardContent>
          <EmojiManager />
        </CardContent>
      </Card>
    </div>
  );
}
