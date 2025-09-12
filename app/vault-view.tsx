"use client";

import { useEffect, useState, useRef } from "react";
import { VaultEntry, getVaultItems, removeFromVault, updateVaultItems } from "@/lib/vault";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { Copy, Trash2, GripVertical, Download, Upload } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export function VaultView() {
    const { toast } = useToast();
    const [items, setItems] = useState<VaultEntry[]>([]);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

    useEffect(() => {
        setItems(getVaultItems());
    }, []);

    // Drag and Drop State
    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, position: number) => {
        dragItem.current = position;
    };

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, position: number) => {
        dragOverItem.current = position;
    };

    const handleDragEnd = () => {
        if (dragItem.current !== null && dragOverItem.current !== null) {
            const newItems = [...items];
            const draggedItemContent = newItems.splice(dragItem.current, 1)[0];
            newItems.splice(dragOverItem.current, 0, draggedItemContent);
            dragItem.current = null;
            dragOverItem.current = null;
            setItems(newItems);
            updateVaultItems(newItems); // Persist the new order
        }
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: "تم نسخ العنصر!" });
    };

    const handleDelete = (id: string) => {
        removeFromVault(id);
        setItems(getVaultItems());
        toast({ title: "تم حذف العنصر." });
    };

    const handleSelectionChange = (id: string, checked: boolean) => {
        const newSelection = new Set(selectedItems);
        if (checked) {
            newSelection.add(id);
        } else {
            newSelection.delete(id);
        }
        setSelectedItems(newSelection);
    }

    const handleExport = () => {
        const itemsToExport = selectedItems.size > 0
            ? items.filter(item => selectedItems.has(item.id))
            : items;

        if (itemsToExport.length === 0) {
            toast({ variant: "destructive", title: "لم يتم تحديد أي عناصر للتصدير." });
            return;
        }

        const dataStr = JSON.stringify(itemsToExport, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        const a = document.createElement('a');
        a.href = dataUri;
        a.download = "shifrishan-vault.json";
        a.click();
        toast({ title: "تم تصدير العناصر المحددة." });
    }

    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b">
                <h2 className="text-lg font-semibold">خزنة التشفير</h2>
                <p className="text-sm text-muted-foreground">هنا يمكنك حفظ وإدارة المخرجات المهمة.</p>
            </div>

            <div className="p-4 flex justify-end gap-2 border-b">
                <Button variant="outline" size="sm" onClick={handleExport} disabled={items.length === 0}>
                    <Download className="ml-2 h-4 w-4" />
                    تصدير {selectedItems.size > 0 ? `(${selectedItems.size})` : '(الكل)'}
                </Button>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-4 space-y-2">
                    {items.length > 0 ? items.map((item, index) => (
                        <div
                            key={item.id}
                            className="flex items-center gap-2 p-2 border rounded-lg"
                            draggable
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragEnter={(e) => handleDragEnter(e, index)}
                            onDragEnd={handleDragEnd}
                            onDragOver={(e) => e.preventDefault()}
                        >
                            <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                            <Checkbox
                                checked={selectedItems.has(item.id)}
                                onCheckedChange={(checked) => handleSelectionChange(item.id, !!checked)}
                            />
                            <p className="flex-1 text-sm truncate">{item.text}</p>
                            <Button variant="ghost" size="icon" onClick={() => handleCopy(item.text)}><Copy className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                        </div>
                    )) : (
                        <div className="text-center py-12 text-muted-foreground">
                            <p>الخزنة فارغة.</p>
                            <p className="text-sm">احفظ العناصر من الواجهة الرئيسية لتظهر هنا.</p>
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}
