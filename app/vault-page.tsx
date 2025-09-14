"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { VaultEntry, getVaultItems, removeFromVault, updateVaultOrder, addToVault, updateVaultItem, exportEncryptedVault, importEncryptedVault } from "@/lib/vault";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Copy, Trash2, Lock, Unlock, PlusCircle, Eye, EyeOff, Search, Upload, Download, MoreHorizontal, Pencil } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { useAppContext } from "@/components/app-provider";
import { useTranslation } from "@/hooks/use-translation";
import { useMediaQuery } from "@/hooks/use-media-query";
import { formatRelativeTime } from "@/lib/utils";

export function VaultPage() {
    const { setMasterPassword: setGlobalMasterPassword, setIsVaultUnlocked, locale } = useAppContext();
    const { t } = useTranslation();
    const { toast } = useToast();
    const [items, setItems] = useState<VaultEntry[]>([]);
    const [masterPassword, setMasterPassword] = useState('');
    const [isLocked, setIsLocked] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [editingItem, setEditingItem] = useState<VaultEntry | null>(null);
    const [showContent, setShowContent] = useState<Record<string, boolean>>({});
    const [searchQuery, setSearchQuery] = useState('');
    const [itemToDelete, setItemToDelete] = useState<VaultEntry | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const isDesktop = useMediaQuery("(min-width: 768px)");

    const filteredItems = useMemo(() => {
        if (!searchQuery) return items;
        return items.filter(item => item.title.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [items, searchQuery]);

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

    const handleExport = () => {
        const result = exportEncryptedVault();
        if (result.success) {
            toast({ title: t('vaultPage.toasts.exportSuccess') });
        } else if (result.messageKey) {
            toast({ variant: "destructive", title: t(result.messageKey) });
        }
    };

    const handleImportClick = () => fileInputRef.current?.click();

    const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result as string;
                const result = importEncryptedVault(text);
                if (result.success) {
                    handleLock(); // Lock the vault to force re-authentication with new password
                    toast({ title: t('vaultPage.toasts.importSuccess') });
                } else if (result.message) {
                    toast({ variant: "destructive", title: t('vaultPage.toasts.importError'), description: result.message });
                }
            } catch (error) {
                toast({ variant: "destructive", title: t('vaultPage.toasts.importError'), description: t('vaultPage.toasts.importErrorInvalid') });
            }
        };
        reader.readAsText(file);
        if (fileInputRef.current) fileInputRef.current.value = "";
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
            <CardHeader className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                    <CardTitle className="text-2xl flex items-center gap-2"><Unlock /> {t('vaultPage.unlockedTitle')}</CardTitle>
                    <CardDescription>{t('vaultPage.unlockedDescription')}</CardDescription>
                </div>
                <div className="flex w-full md:w-auto gap-2">
                     <div className="relative flex-grow">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={t('vaultPage.searchPlaceholder', { count: items.length })}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 w-full"
                        />
                    </div>
                    <ItemEditDialog onSave={handleSaveItem} triggerButton={<Button><PlusCircle className="ml-2 h-4 w-4" /> {t('vaultPage.addNewItem')}</Button>} />
                    <Button variant="outline" size="icon" onClick={handleExport}><Download className="h-4 w-4" /></Button>
                    <Button variant="outline" size="icon" onClick={handleImportClick}><Upload className="h-4 w-4" /></Button>
                    <input type="file" ref={fileInputRef} onChange={handleFileImport} accept=".txt" className="hidden" />
                    <Button variant="secondary" onClick={handleLock}>{t('vaultPage.lockButton')}</Button>
                </div>
            </CardHeader>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    {filteredItems.length > 0 ? filteredItems.map(item => (
                        <div key={item.id} className="flex flex-col p-3 border rounded-lg gap-2">
                            <div className="flex justify-between items-center gap-2">
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <h3 className="font-semibold truncate">{item.title}</h3>
                                    <span className="text-xs text-muted-foreground whitespace-nowrap">•</span>
                                    <span className="text-xs text-muted-foreground whitespace-nowrap">{formatRelativeTime(item.createdAt, locale)}</span>
                                </div>
                                <div className="flex items-center flex-shrink-0">
                                    <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => setShowContent(prev => ({...prev, [item.id]: !prev[item.id]}))}><span className="sr-only">{showContent[item.id] ? t('vaultPage.mobile.hide') : t('vaultPage.mobile.show')}</span>{showContent[item.id] ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}</Button></TooltipTrigger><TooltipContent>{showContent[item.id] ? t('vaultPage.mobile.hide') : t('vaultPage.mobile.show')}</TooltipContent></Tooltip>
                                    <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => navigator.clipboard.writeText(item.text).then(() => toast({title: t('vaultPage.toasts.copySuccess')}))}><Copy className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>{t('vaultPage.mobile.copy')}</TooltipContent></Tooltip>
                                    <ItemEditDialog onSave={handleSaveItem} item={item} triggerButton={<Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon"><Pencil className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>{t('vaultPage.editButton')}</TooltipContent></Tooltip>} />
                                    <Tooltip><TooltipTrigger asChild><Button onClick={() => setItemToDelete(item)} variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-red-500" /></Button></TooltipTrigger><TooltipContent>{t('vaultPage.mobile.delete')}</TooltipContent></Tooltip>
                                </div>
                            </div>
                            {showContent[item.id] && <p className="text-sm text-muted-foreground bg-muted p-2 rounded animate-in mt-2 break-all">{item.text}</p>}
                        </div>
                    )) : (
                        <div className="text-center py-12 text-muted-foreground">
                            <p>{searchQuery ? t('vaultPage.noResults') : t('vaultPage.emptyState')}</p>
                            <p className="text-sm">{searchQuery ? t('vaultPage.noResultsDescription') : t('vaultPage.emptyStateDescription')}</p>
                        </div>
                    )}
                </div>
                <AlertDialog open={itemToDelete !== null} onOpenChange={(open) => !open && setItemToDelete(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>{t('vaultPage.deleteConfirmTitle')}</AlertDialogTitle>
                            <AlertDialogDescription>{t('vaultPage.deleteConfirmDescription')}</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setItemToDelete(null)}>{t('vaultPage.editDialog.cancel')}</AlertDialogCancel>
                            <AlertDialogAction onClick={() => {if(itemToDelete) handleDelete(itemToDelete.id); setItemToDelete(null);}}>{t('vaultPage.deleteConfirmAction')}</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardContent>
        </Card>
    );
}

function ItemEditDialog({ onSave, item, triggerButton }: { onSave: (item: {id?: string, title: string, text: string}) => Promise<boolean>, item?: VaultEntry, triggerButton: React.ReactElement }) {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const isDesktop = useMediaQuery("(min-width: 768px)");

    const title = item ? t('vaultPage.editDialog.titleEdit') : t('vaultPage.editDialog.titleAdd');
    const description = t('vaultPage.editDialog.description');

    if (isDesktop) {
        return (
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>{triggerButton}</DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{title}</DialogTitle>
                        <DialogDescription>{description}</DialogDescription>
                    </DialogHeader>
                    <EditItemForm item={item} onSave={onSave} setIsOpen={setIsOpen} />
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Drawer open={isOpen} onOpenChange={setIsOpen}>
            <DrawerTrigger asChild>{triggerButton}</DrawerTrigger>
            <DrawerContent>
                <DrawerHeader className="text-left">
                    <DrawerTitle>{item ? t('vaultPage.editDialog.titleEdit') : t('vaultPage.editDialog.titleAdd')}</DrawerTitle>
                    <DrawerDescription>{t('vaultPage.editDialog.description')}</DrawerDescription>
                </DrawerHeader>
                <div className="p-4">
                    <EditItemForm item={item} onSave={onSave} setIsOpen={setIsOpen} />
                </div>
            </DrawerContent>
        </Drawer>
    );
}

function EditItemForm({ item, onSave, setIsOpen }: { item?: VaultEntry, onSave: (item: {id?: string, title: string, text: string}) => Promise<boolean>, setIsOpen: (isOpen: boolean) => void }) {
    const { t } = useTranslation();
    const [title, setTitle] = useState(item?.title || '');
    const [text, setText] = useState(item?.text || '');

    const handleSubmit = async () => {
        const success = await onSave({ id: item?.id, title, text });
        if(success) setIsOpen(false);
    }

    useEffect(() => {
        setTitle(item?.title || '');
        setText(item?.text || '');
    }, [item]);

    return (
        <>
            <div className="grid gap-4 py-4">
                <Input placeholder={t('vaultPage.editDialog.titlePlaceholder')} value={title} onChange={(e) => setTitle(e.target.value)} />
                <Textarea placeholder={t('vaultPage.editDialog.contentPlaceholder')} value={text} onChange={(e) => setText(e.target.value)} className="min-h-[100px]" />
            </div>
            <DialogFooter className="pt-2 sm:justify-between gap-2 flex-col-reverse sm:flex-row">
                 <DialogClose asChild>
                    <Button variant="outline" className="w-full">{t('vaultPage.editDialog.cancel')}</Button>
                 </DialogClose>
                 <Button onClick={handleSubmit} className="w-full">{t('vaultPage.editDialog.save')}</Button>
            </DialogFooter>
        </>
    );
}
