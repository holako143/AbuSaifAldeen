"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { useAppContext } from "@/components/app-provider";
import { addToVault } from "@/lib/vault";
import { useTranslation } from "@/hooks/use-translation";
import { useMediaQuery } from "@/hooks/use-media-query";

interface AddToVaultDialogProps {
  outputText: string;
  children: React.ReactNode;
  mode: 'encode' | 'decode';
  inputText: string;
}

function AddToVaultForm({ outputText, onSaveSuccess }: { outputText: string, onSaveSuccess: () => void }) {
    const { masterPassword } = useAppContext();
    const { t } = useTranslation();
    const { toast } = useToast();
    const [title, setTitle] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSave = async () => {
        if (!title) {
            toast({ variant: "destructive", title: t('vaultDialog.toasts.titleRequired') });
            return;
        }
        if (!masterPassword) {
            toast({ variant: "destructive", title: t('vaultDialog.toasts.vaultLocked'), description: t('vaultDialog.toasts.vaultLockedDescription') });
            return;
        }
        setIsLoading(true);
        try {
            await addToVault(title, outputText, [], masterPassword);
            toast({ title: t('vaultDialog.toasts.saveSuccess') });
            onSaveSuccess();
        } catch (e: any) {
            toast({ variant: "destructive", title: t('vaultDialog.toasts.saveFailed'), description: e.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="grid gap-4 py-4">
            <Input
                placeholder={t('vaultDialog.placeholder')}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
            />
            <p className="text-sm text-muted-foreground p-2 border rounded-md bg-muted truncate">
                <span className="font-bold">{t('vaultDialog.contentLabel')}</span> {outputText}
            </p>
            <Button onClick={handleSave} disabled={isLoading} className="w-full">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('vaultDialog.save')}
            </Button>
        </div>
    );
}

export function AddToVaultDialog({ outputText, children, mode, inputText }: AddToVaultDialogProps) {
  const { isVaultUnlocked, setActiveView, setIsVaultVisible } = useAppContext();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const handleOpen = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent default tooltip behavior
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

  const handleDoubleClick = () => {
    if (mode === 'decode' && inputText === 'خزنة') {
      if (isVaultUnlocked) {
        setActiveView('vault');
      } else {
        setIsVaultVisible(true);
        toast({ title: t('vaultDialog.toasts.vaultRevealed'), description: t('vaultDialog.toasts.vaultRevealedDescription') });
      }
    }
  };

  const titleText = t('vaultDialog.title');
  const description = t('vaultDialog.description');

  if (isDesktop) {
      return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild onClick={handleOpen} onDoubleClick={handleDoubleClick}>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{titleText}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <AddToVaultForm outputText={outputText} onSaveSuccess={() => setIsOpen(false)} />
            </DialogContent>
        </Dialog>
      );
  }

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerTrigger asChild onClick={handleOpen} onDoubleClick={handleDoubleClick}>{children}</DrawerTrigger>
        <DrawerContent>
            <DrawerHeader className="text-left">
                <DrawerTitle>{titleText}</DrawerTitle>
                <DrawerDescription>{description}</DrawerDescription>
            </DrawerHeader>
            <div className="p-4">
                <AddToVaultForm outputText={outputText} onSaveSuccess={() => setIsOpen(false)} />
            </div>
            <DrawerFooter className="pt-2">
                <DrawerClose asChild><Button variant="outline">{t('vaultDialog.cancel')}</Button></DrawerClose>
            </DrawerFooter>
        </DrawerContent>
    </Drawer>
  );
}
