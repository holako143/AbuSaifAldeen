import { HistoryList } from "@/components/settings/history-list";

export default function HistoryPage() {
  return (
    <div className="container max-w-2xl py-8">
      <h1 className="text-3xl font-bold mb-6">سجل التشفير</h1>
      <HistoryList />
    </div>
  );
}
