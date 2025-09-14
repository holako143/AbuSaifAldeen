"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { HistoryEntry, getHistory, deleteFromHistory, clearHistory, importHistory } from "@/lib/history";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Copy, Trash2, Upload, Download, CircleX, Send } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useAppContext } from "@/context/app-context";
import { useTranslation } from "@/hooks/use-translation";

type FilterType = "all" | "encode" | "decode";

export function HistoryView() {
  const { setActiveView, setTextToDecode, locale } = useAppContext();
  const { t } = useTranslation();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [filter, setFilter] = useState<FilterType>("all");
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  const filteredHistory = useMemo(() => {
    if (filter === "all") return history;
    return history.filter((item) => item.mode === filter);
  }, [history, filter]);

  const handleSendToDecoder = (text: string) => {
    setTextToDecode(text);
    setActiveView('encoder-decoder');
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: t('history.toasts.copied'), description: t('history.toasts.copiedDescription') });
  };

  const handleDelete = (id: string) => {
    deleteFromHistory(id);
    setHistory(getHistory());
    toast({ title: t('history.toasts.deleted'), description: t('history.toasts.deletedDescription') });
  };

  const handleClearAll = () => {
    clearHistory();
    setHistory([]);
    toast({ title: t('history.toasts.cleared'), description: t('history.toasts.clearedDescription') });
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
    toast({ title: t('history.toasts.exported'), description: t('history.toasts.exportedDescription') });
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
          toast({ title: t('history.toasts.imported') });
        } else { throw new Error("Invalid history file format"); }
      } catch (error) {
        toast({ variant: "destructive", title: t('history.toasts.importError'), description: t('history.toasts.importErrorDescription') });
      }
    };
    reader.readAsText(file);
    if(fileInputRef.current) fileInputRef.current.value = "";
  };

  const truncateText = (text: string, length = 30) => text.length > length ? `${text.substring(0, length)}...` : text;
  const localeString = locale === 'ar' ? 'ar-EG' : 'en-US';

  return (
    <Card className="animate-in w-full">
      <CardHeader className="flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
            <CardTitle>{t('history.title')}</CardTitle>
            <CardDescription>{t('history.description')}</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} disabled={history.length === 0}><Download className="ml-2 h-4 w-4" />{t('history.export')}</Button>
          <Button variant="outline" size="sm" onClick={handleImportClick}><Upload className="ml-2 h-4 w-4" />{t('history.import')}</Button>
          <input type="file" ref={fileInputRef} onChange={handleFileImport} accept=".json" className="hidden" />
          <AlertDialog>
            <AlertDialogTrigger asChild><Button variant="destructive" size="sm" disabled={history.length === 0}><CircleX className="ml-2 h-4 w-4" />{t('history.clearAll')}</Button></AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader><AlertDialogTitle>{t('history.clearConfirmTitle')}</AlertDialogTitle><AlertDialogDescription>{t('history.clearConfirmDescription')}</AlertDialogDescription></AlertDialogHeader>
              <AlertDialogFooter><AlertDialogCancel>{t('history.cancel')}</AlertDialogCancel><AlertDialogAction onClick={handleClearAll}>{t('history.confirmClear')}</AlertDialogAction></AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex justify-center my-4">
            <ToggleGroup type="single" value={filter} onValueChange={(value: FilterType) => value && setFilter(value)} defaultValue="all">
              <ToggleGroupItem value="all" aria-label="Toggle all">{t('history.filterAll')}</ToggleGroupItem>
              <ToggleGroupItem value="encode" aria-label="Toggle encode">{t('history.filterEncode')}</ToggleGroupItem>
              <ToggleGroupItem value="decode" aria-label="Toggle decode">{t('history.filterDecode')}</ToggleGroupItem>
            </ToggleGroup>
        </div>
        {filteredHistory.length > 0 ? (
          <TooltipProvider>
            <Table className="hidden md:table">
              <TableHeader>
                <TableRow>
                  <TableHead>{t('history.table.type')}</TableHead><TableHead>{t('history.table.original')}</TableHead><TableHead>{t('history.table.output')}</TableHead><TableHead>{t('history.table.time')}</TableHead><TableHead className="text-right">{t('history.table.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHistory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell><Badge variant={item.mode === 'encode' ? 'default' : 'secondary'}>{t(`history.filter${item.mode.charAt(0).toUpperCase() + item.mode.slice(1)}`)}</Badge></TableCell>
                    <TableCell><Tooltip><TooltipTrigger>{truncateText(item.inputText)}</TooltipTrigger><TooltipContent><p className="max-w-xs break-words">{item.inputText}</p></TooltipContent></Tooltip></TableCell>
                    <TableCell><Tooltip><TooltipTrigger>{truncateText(item.outputText)}</TooltipTrigger><TooltipContent><p className="max-w-xs break-words">{item.outputText}</p></TooltipContent></Tooltip></TableCell>
                    <TableCell>{new Date(item.timestamp).toLocaleString(localeString)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleSendToDecoder(item.outputText)}><Send className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleCopy(item.outputText)}><Copy className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="md:hidden space-y-4">
                {filteredHistory.map((item) => (
                    <Card key={item.id} className="p-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <Badge variant={item.mode === 'encode' ? 'default' : 'secondary'}>{t(`history.filter${item.mode.charAt(0).toUpperCase() + item.mode.slice(1)}`)}</Badge>
                                <p className="text-xs text-muted-foreground mt-1">{new Date(item.timestamp).toLocaleString(localeString)}</p>
                            </div>
                            <div className="flex">
                                <Button variant="ghost" size="icon" onClick={() => handleSendToDecoder(item.outputText)}><Send className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" onClick={() => handleCopy(item.outputText)}><Copy className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                            </div>
                        </div>
                        <div className="mt-4 space-y-2">
                            <div><p className="text-xs font-bold">{t('history.mobile.original')}</p><p className="text-sm break-words">{item.inputText}</p></div>
                             <div><p className="text-xs font-bold">{t('history.mobile.output')}</p><p className="text-sm break-words">{item.outputText}</p></div>
                        </div>
                    </Card>
                ))}
            </div>
          </TooltipProvider>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p>{t('history.empty.noRecords')}</p>
            <p className="text-sm">{filter === 'all' ? t('history.empty.startUsing') : t('history.empty.noFilterMatch')}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
