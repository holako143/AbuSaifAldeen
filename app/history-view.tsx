"use client";

import { useEffect, useState, useRef } from "react";
import { HistoryEntry, getHistory, deleteFromHistory, clearHistory, importHistory } from "@/lib/history";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Copy, Trash2, Upload, Download, CircleX } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";

export function HistoryView() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "تم النسخ!", description: "تم نسخ النص إلى الحافظة." });
  };

  const handleDelete = (id: string) => {
    deleteFromHistory(id);
    setHistory(getHistory());
    toast({ title: "تم الحذف", description: "تم حذف السجل بنجاح." });
  };

  const handleClearAll = () => {
    clearHistory();
    setHistory([]);
    toast({ title: "تم مسح السجل", description: "تم مسح جميع السجلات بنجاح." });
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
    toast({ title: "تم التصدير", description: "تم تصدير السجل كملف JSON." });
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const importedData = JSON.parse(text);
        if (importHistory(importedData)) {
          setHistory(getHistory());
          toast({ title: "تم الاستيراد بنجاح" });
        } else {
           throw new Error("Invalid history file format");
        }
      } catch (error) {
        toast({ variant: "destructive", title: "خطأ في الاستيراد", description: "الملف غير صالح أو تالف." });
      }
    };
    reader.readAsText(file);
    if(fileInputRef.current) fileInputRef.current.value = "";
  };

  const truncateText = (text: string, length = 30) => text.length > length ? `${text.substring(0, length)}...` : text;

  return (
    <Card className="animate-in w-full">
      <CardHeader className="flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
            <CardTitle>سجل التشفير</CardTitle>
            <CardDescription>هنا يمكنك مراجعة عملياتك السابقة.</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} disabled={history.length === 0}><Download className="ml-2 h-4 w-4" />تصدير</Button>
          <Button variant="outline" size="sm" onClick={handleImportClick}><Upload className="ml-2 h-4 w-4" />استيراد</Button>
          <input type="file" ref={fileInputRef} onChange={handleFileImport} accept=".json" className="hidden" />
          <AlertDialog>
            <AlertDialogTrigger asChild><Button variant="destructive" size="sm" disabled={history.length === 0}><CircleX className="ml-2 h-4 w-4" />مسح الكل</Button></AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader><AlertDialogTitle>هل أنت متأكد تمامًا؟</AlertDialogTitle><AlertDialogDescription>هذا الإجراء لا يمكن التراجع عنه.</AlertDialogDescription></AlertDialogHeader>
              <AlertDialogFooter><AlertDialogCancel>إلغاء</AlertDialogCancel><AlertDialogAction onClick={handleClearAll}>نعم، قم بالمسح</AlertDialogAction></AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardHeader>
      <CardContent>
        {history.length > 0 ? (
          <TooltipProvider>
            {/* Desktop View: Table */}
            <Table className="hidden md:table">
              <TableHeader>
                <TableRow>
                  <TableHead>النوع</TableHead><TableHead>النص الأصلي</TableHead><TableHead>الناتج</TableHead><TableHead>الوقت</TableHead><TableHead className="text-right">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell><Badge variant={item.mode === 'encode' ? 'default' : 'secondary'}>{item.mode === 'encode' ? 'تشفير' : 'فك تشفير'}</Badge></TableCell>
                    <TableCell><Tooltip><TooltipTrigger>{truncateText(item.inputText)}</TooltipTrigger><TooltipContent><p className="max-w-xs break-words">{item.inputText}</p></TooltipContent></Tooltip></TableCell>
                    <TableCell><Tooltip><TooltipTrigger>{truncateText(item.outputText)}</TooltipTrigger><TooltipContent><p className="max-w-xs break-words">{item.outputText}</p></TooltipContent></Tooltip></TableCell>
                    <TableCell>{new Date(item.timestamp).toLocaleString('ar-EG')}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleCopy(item.outputText)}><Copy className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {/* Mobile View: Cards */}
            <div className="md:hidden space-y-4">
                {history.map((item) => (
                    <Card key={item.id} className="p-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <Badge variant={item.mode === 'encode' ? 'default' : 'secondary'}>{item.mode === 'encode' ? 'تشفير' : 'فك تشفير'}</Badge>
                                <p className="text-xs text-muted-foreground mt-1">{new Date(item.timestamp).toLocaleString('ar-EG')}</p>
                            </div>
                            <div className="flex">
                                <Button variant="ghost" size="icon" onClick={() => handleCopy(item.outputText)}><Copy className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                            </div>
                        </div>
                        <div className="mt-4 space-y-2">
                            <div>
                                <p className="text-xs font-bold">الأصلي:</p>
                                <p className="text-sm break-words">{item.inputText}</p>
                            </div>
                             <div>
                                <p className="text-xs font-bold">الناتج:</p>
                                <p className="text-sm break-words">{item.outputText}</p>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
          </TooltipProvider>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p>لا توجد سجلات لعرضها.</p>
            <p className="text-sm">ابدأ بالتشفير أو فك التشفير وستظهر عملياتك هنا!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
