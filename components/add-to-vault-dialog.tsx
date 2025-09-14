"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Star } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAppContext } from "@/context/app-context";
import { addToVault } from "@/lib/vault";

interface AddToVaultDialogProps {
  outputText: string;
  children: React.ReactNode;
}

export function AddToVaultDialog({ outputText, children }: AddToVaultDialogProps) {
  const { isVaultUnlocked, masterPassword, setActiveView } = useAppContext();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');

  const handleOpen = () => {
    if (!isVaultUnlocked) {
      toast({
        variant: "destructive",
        title: "الخزنة مقفلة",
        description: "الرجاء فتح الخزنة أولاً من صفحة الخزنة.",
        action: <Button onClick={() => setActiveView('vault')}>الانتقال للخزنة</Button>,
      });
      return;
    }
    if (!outputText) {
        toast({ variant: "destructive", title: "لا يوجد ناتج للحفظ" });
        return;
    }
    setIsOpen(true);
  };

  const handleSave = async () => {
    if (!title || !outputText || !masterPassword) {
        toast({ variant: "destructive", title: "الرجاء إدخال عنوان." });
        return;
    }
    try {
        await addToVault(title, outputText, masterPassword);
        toast({ title: "تم الحفظ في الخزنة بنجاح!" });
        setIsOpen(false);
        setTitle('');
    } catch (e: any) {
        toast({ variant: "destructive", title: "فشل الحفظ", description: e.message });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <div onClick={handleOpen}>
            {children}
        </div>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>إضافة إلى الخزنة</DialogTitle>
          <DialogDescription>أدخل عنواناً لهذا العنصر المحفوظ.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
            <Input
                placeholder="عنوان العنصر (مثال: مفتاح API لموقعي)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
            />
            <p className="text-sm text-muted-foreground p-2 border rounded-md bg-muted truncate">
                <span className="font-bold">المحتوى:</span> {outputText}
            </p>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">إلغاء</Button></DialogClose>
          <Button onClick={handleSave}>حفظ</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
