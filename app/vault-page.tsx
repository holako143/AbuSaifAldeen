"use client";

import { useEffect, useState } from "react";
import { VaultEntry, getVaultItems, removeFromVault, updateVaultOrder, addToVault, updateVaultItem } from "@/lib/vault";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Copy, Trash2, Lock, Unlock, PlusCircle, Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { useAppContext } from "@/context/app-context";
import { useTranslation } from "@/hooks/use-translation";

export function VaultPage() {
    const { setMasterPassword: setGlobalMasterPassword, setIsVaultUnlocked } = useAppContext();
    const { t } = useTranslation();
    const { toast } = useToast();
    const [items, setItems] = useState<VaultEntry[]>([]);
    const [masterPassword, setMasterPassword] = useState('');
    const [isLocked, setIsLocked] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [editingItem, setEditingItem] = useState<VaultEntry | null>(null);
    const [showContent, setShowContent] = useState<Record<string, boolean>>({});

    const handleUnlock = async () => {
        if (!masterPassword) {
            setError(t('vaultPage.unlockError'));
            return;
        }
        setIsLoading(true);
        setError('');
        try {
            const vaultItems = await getVaultItems(masterPassword);
            setItems(vaultItems);
            setGlobalMasterPassword(masterPassword);
            setIsVaultUnlocked(true);
            setIsLocked(false);
            toast({ title: t('vaultPage.toasts.unlockedSuccess') });
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLock = () => {
        setIsLocked(true);
        setMasterPassword('');
        setGlobalMasterPassword(null);
        setIsVaultUnlocked(false);
        setItems([]);
        setError('');
    };

    const handleDelete = async (id: string) => {
        try {
            await removeFromVault(id, masterPassword);
            setItems(items.filter(item => item.id !== id));
            toast({ title: t('vaultPage.toasts.deleteSuccess') });
        } catch (e: any) {
            toast({ variant: "destructive", title: t('vaultPage.toasts.deleteFailed'), description: e.message });
        }
    };

    const handleSaveItem = async (item: { id?: string; title: string; text: string }) => {
        try {
            if (editingItem && editingItem.id) { // Update existing
                const updatedEntry = { ...editingItem, title: item.title, text: item.text };
                await updateVaultItem(updatedEntry, masterPassword);
                setItems(items.map(i => i.id === updatedEntry.id ? updatedEntry : i));
                toast({ title: t('vaultPage.toasts.updateSuccess') });
            } else { // Add new
                const newEntry = await addToVault(item.title, item.text, masterPassword);
                setItems([newEntry, ...items]);
                toast({ title: t('vaultPage.toasts.addSuccess') });
            }
            setEditingItem(null);
            return true; // Indicate success for closing dialog
        } catch (e: any) {
            toast({ variant: "destructive", title: t('vaultPage.toasts.saveFailed'), description: e.message });
            return false;
        }
    };

    if (isLocked) {
        return (
            <Card className="w-full max-w-md mx-auto animate-in">
                <CardHeader>
                    <CardTitle className="text-2xl flex items-center gap-2"><Lock /> {t('vaultPage.unlockTitle')}</CardTitle>
                    <CardDescription>{t('vaultPage.unlockDescription')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Input
                        type="password"
                        placeholder={t('vaultPage.masterPasswordPlaceholder')}
                        value={masterPassword}
                        onChange={(e) => setMasterPassword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                    />
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <Button onClick={handleUnlock} disabled={isLoading} className="w-full">
                        {isLoading ? t('vaultPage.unlocking') : t('vaultPage.unlockButton')}
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full animate-in">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-2xl flex items-center gap-2"><Unlock /> {t('vaultPage.unlockedTitle')}</CardTitle>
                    <CardDescription>{t('vaultPage.unlockedDescription')}</CardDescription>
                </div>
                <div className="flex gap-2">
                    <ItemEditDialog onSave={handleSaveItem} triggerButton={<Button><PlusCircle className="ml-2 h-4 w-4" /> {t('vaultPage.addNewItem')}</Button>} />
                    <Button variant="secondary" onClick={handleLock}>{t('vaultPage.lockButton')}</Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    {items.length > 0 ? items.map(item => (
                        <div key={item.id} className="flex flex-col p-3 border rounded-lg gap-2">
                            <div className="flex justify-between items-center">
                                <h3 className="font-semibold">{item.title}</h3>
                                <div className="flex items-center">
                                    <Button variant="ghost" size="icon" onClick={() => setShowContent(prev => ({...prev, [item.id]: !prev[item.id]}))}>
                                        {showContent[item.id] ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => navigator.clipboard.writeText(item.text).then(() => toast({title: t('vaultPage.toasts.copySuccess')}))}><Copy className="h-4 w-4" /></Button>
                                    <ItemEditDialog onSave={handleSaveItem} item={item} triggerButton={<Button variant="ghost" size="icon">{t('vaultPage.editButton')}</Button>} />
                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                                </div>
                            </div>
                            {showContent[item.id] && (
                                <p className="text-sm text-muted-foreground bg-muted p-2 rounded animate-in">{item.text}</p>
                            )}
                        </div>
                    )) : (
                        <div className="text-center py-12 text-muted-foreground">
                            <p>{t('vaultPage.emptyState')}</p>
                            <p className="text-sm">{t('vaultPage.emptyStateDescription')}</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

function ItemEditDialog({ onSave, item, triggerButton }: { onSave: (item: {id?: string, title: string, text: string}) => Promise<boolean>, item?: VaultEntry, triggerButton: React.ReactElement }) {
    const { t } = useTranslation();
    const [title, setTitle] = useState(item?.title || '');
    const [text, setText] = useState(item?.text || '');
    const [isOpen, setIsOpen] = useState(false);

    const handleSubmit = async () => {
        const success = await onSave({ id: item?.id, title, text });
        if(success) setIsOpen(false);
    }

    // Reset form when dialog opens with new item data
    useEffect(() => {
        if (isOpen) {
            setTitle(item?.title || '');
            setText(item?.text || '');
        }
    }, [isOpen, item]);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{triggerButton}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{item ? t('vaultPage.editDialog.titleEdit') : t('vaultPage.editDialog.titleAdd')}</DialogTitle>
                    <DialogDescription>{t('vaultPage.editDialog.description')}</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <Input placeholder={t('vaultPage.editDialog.titlePlaceholder')} value={title} onChange={(e) => setTitle(e.target.value)} />
                    <Textarea placeholder={t('vaultPage.editDialog.contentPlaceholder')} value={text} onChange={(e) => setText(e.target.value)} className="min-h-[100px]" />
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline">{t('vaultPage.editDialog.cancel')}</Button></DialogClose>
                    <Button onClick={handleSubmit}>{t('vaultPage.editDialog.save')}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
