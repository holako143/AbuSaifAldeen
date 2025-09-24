"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Star } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAppContext } from "@/components/app-provider";
import { addToVault } from "@/lib/vault";
import { useTranslation } from "@/hooks/use-translation";

interface AddToVaultDialogProps {
  outputText: string;
  children: React.ReactNode;
  mode: 'encode' | 'decode';
  inputText: string;
}

export function AddToVaultDialog({ outputText, children, mode, inputText }: AddToVaultDialogProps) {
  const { isVaultUnlocked, masterPassword, setActiveView } = useAppContext();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');

  const handleOpen = () => {
    if (!isVaultUnlocked) {
      toast({
        variant: "destructive",
        title: t('vaultDialog.toasts.vaultLocked'),
        description: t('vaultDialog.toasts.vaultLockedDescription'),
        action: <Button onClick={() => setActiveView('vault')}>{t('vaultDialog.toasts.goToVault')}</Button>,
      });
      return;
    }
    if (!outputText) {
        toast({ variant: "destructive", title: t('vaultDialog.toasts.noOutput') });
        return;
    }
    setIsOpen(true);
  };

  const handleSave = async () => {
    if (!title) {
        toast({ variant: "destructive", title: t('vaultDialog.toasts.titleRequired') });
        return;
    }
    if (!masterPassword) {
        toast({ variant: "destructive", title: t('vaultDialog.toasts.vaultLocked'), description: t('vaultDialog.toasts.vaultLockedDescription') });
        return;
    }
    try {
        await addToVault(title, outputText, [], masterPassword);
        toast({ title: t('vaultDialog.toasts.saveSuccess') });
        setIsOpen(false);
        setTitle('');
    } catch (e: any) {
        toast({ variant: "destructive", title: t('vaultDialog.toasts.saveFailed'), description: e.message });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <div onClick={handleOpen}>
            {children}
        </div>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('vaultDialog.title')}</DialogTitle>
          <DialogDescription>{t('vaultDialog.description')}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
            <Input
                placeholder={t('vaultDialog.placeholder')}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
            />
            <p className="text-sm text-muted-foreground p-2 border rounded-md bg-muted truncate">
                <span className="font-bold">{t('vaultDialog.contentLabel')}</span> {outputText}
            </p>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">{t('vaultDialog.cancel')}</Button></DialogClose>
          <Button onClick={handleSave}>{t('vaultDialog.save')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
