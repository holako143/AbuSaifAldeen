import { WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center">
      <WifiOff className="w-16 h-16 mb-4" />
      <h1 className="text-2xl font-bold mb-2">أنت غير متصل بالإنترنت</h1>
      <p className="text-lg">
        يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.
      </p>
    </div>
  );
}
