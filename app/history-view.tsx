"use client";

import { useEffect, useState, useRef } from "react";
import { HistoryEntry, getHistory, deleteFromHistory, clearHistory, importHistory } from "@/lib/history";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Copy, Trash2, Upload, Download, CircleX } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export function HistoryView() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "تم النسخ!",
      description: "تم نسخ النص إلى الحافظة.",
    });
  };

  const handleDelete = (id: string) => {
    deleteFromHistory(id);
    setHistory(getHistory()); // Refresh state
    toast({
      title: "تم الحذف",
      description: "تم حذف السجل بنجاح.",
    });
  };

  const handleClearAll = () => {
    clearHistory();
    setHistory([]); // Refresh state
    toast({
      title: "تم مسح السجل",
      description: "تم مسح جميع السجلات بنجاح.",
    });
  };

  const handleExport = () => {
    const historyJson = JSON.stringify(history, null, 2);
    const blob = new Blob([historyJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `shifrishan-history-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({
      title: "تم التصدير",
      description: "تم تصدير السجل كملف JSON.",
    });
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') throw new Error("File is not text");
        const importedData = JSON.parse(text);
        if (importHistory(importedData)) {
          setHistory(getHistory());
          toast({
            title: "تم الاستيراد بنجاح",
            description: "تم استيراد ودمج سجلاتك الجديدة.",
          });
        } else {
           throw new Error("Invalid history file format");
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "خطأ في الاستيراد",
          description: "الملف غير صالح أو تالف. يرجى التحقق من الملف والمحاولة مرة أخرى.",
        });
      }
    };
    reader.readAsText(file);
    // Reset file input
    if(fileInputRef.current) fileInputRef.current.value = "";
  };

  const truncateText = (text: string, length = 50) => {
    return text.length > length ? `${text.substring(0, length)}...` : text;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>سجل التشفير</CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} disabled={history.length === 0}>
            <Download className="ml-2 h-4 w-4" />
            تصدير
          </Button>
          <Button variant="outline" size="sm" onClick={handleImportClick}>
            <Upload className="ml-2 h-4 w-4" />
            استيراد
          </Button>
          <input type="file" ref={fileInputRef} onChange={handleFileImport} accept=".json" className="hidden" />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={history.length === 0}>
                <CircleX className="ml-2 h-4 w-4" />
                مسح الكل
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>هل أنت متأكد تمامًا؟</AlertDialogTitle>
                <AlertDialogDescription>
                  هذا الإجراء لا يمكن التراجع عنه. سيؤدي هذا إلى حذف جميع سجلات التشفير الخاصة بك بشكل دائم.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearAll}>نعم، قم بالمسح</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardHeader>
      <CardContent>
        {history.length > 0 ? (
          <TooltipProvider>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>النوع</TableHead>
                  <TableHead>النص الأصلي</TableHead>
                  <TableHead>الناتج</TableHead>
                  <TableHead>الوقت</TableHead>
                  <TableHead>إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.mode === 'encode' ? 'تشفير' : 'فك تشفير'}</TableCell>
                    <TableCell>
                      <Tooltip>
                        <TooltipTrigger>{truncateText(item.inputText)}</TooltipTrigger>
                        <TooltipContent><p className="max-w-xs break-words">{item.inputText}</p></TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Tooltip>
                        <TooltipTrigger>{truncateText(item.outputText)}</TooltipTrigger>
                        <TooltipContent><p className="max-w-xs break-words">{item.outputText}</p></TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell>{new Date(item.timestamp).toLocaleString('ar-EG')}</TableCell>
                    <TableCell className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleCopy(item.outputText)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TooltipProvider>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p>لا توجد سجلات لعرضها.</p>
            <p className="text-sm">ابدأ بالتشفير أو فك التشفير وستظهر عملياتك هنا!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
