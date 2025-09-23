"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { VaultEntry, getVaultItems, removeFromVault, updateVaultOrder, addToVault, updateVaultItem, exportEncryptedVault, importEncryptedVault } from "@/lib/vault";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Copy, Trash2, Lock, Unlock, PlusCircle, Eye, EyeOff, Search, Upload, Download, MoreHorizontal, Pencil, Settings, Loader2, Wand2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { useAppContext } from "@/components/app-provider";
import { useTranslation } from "@/hooks/use-translation";
import { useMediaQuery } from "@/hooks/use-media-query";
import { formatRelativeTime, generatePassword } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { changeMasterPassword } from "@/lib/vault";

function ChangePasswordDialog() {
    const { t } = useTranslation();
    const { masterPassword: globalMasterPassword, setMasterPassword, setIsVaultUnlocked } = useAppContext();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);

    const handlePasswordChange = async () => {
        if (newPassword !== confirmPassword) {
            toast({ variant: "destructive", title: t('settings.vault.errorMismatch') });
            return;
        }
        if (!globalMasterPassword) return;

        setIsLoading(true);
        try {
            await changeMasterPassword(globalMasterPassword, newPassword);
            toast({ title: t('settings.vault.success'), description: t('settings.vault.successDescription') });
            setMasterPassword(null);
            setIsVaultUnlocked(false);
            setNewPassword('');
            setConfirmPassword('');
            setIsOpen(false);
        } catch (error: any) {
            const errorMessage = error.message.includes("decryption failed")
                ? t('settings.vault.errorWrongPassword')
                : error.message;
            toast({ variant: "destructive", title: "Error", description: errorMessage });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="icon"><Settings className="h-4 w-4" /></Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('settings.vault.title')}</DialogTitle>
                    <DialogDescription>{t('settings.vault.description')}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="new-password">{t('settings.vault.newPassword')}</Label>
                        <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirm-password">{t('settings.vault.confirmPassword')}</Label>
                        <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline">{t('vaultPage.editDialog.cancel')}</Button></DialogClose>
                    <Button onClick={handlePasswordChange} disabled={isLoading || !newPassword || !confirmPassword}>
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('settings.vault.button')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export function VaultPage() {
    const { masterPassword: globalMasterPassword, setMasterPassword: setGlobalMasterPassword, setIsVaultUnlocked, locale } = useAppContext();
    const { t } = useTranslation();
    const { toast } = useToast();
    const [items, setItems] = useState<VaultEntry[]>([]);
    const [localMasterPassword, setLocalMasterPassword] = useState('');
    const [isLocked, setIsLocked] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [editingItem, setEditingItem] = useState<VaultEntry | null>(null);
    const [showContent, setShowContent] = useState<Record<string, boolean>>({});
    const [searchQuery, setSearchQuery] = useState('');
    const [itemToDelete, setItemToDelete] = useState<VaultEntry | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const isDesktop = useMediaQuery("(min-width: 768px)");

    useEffect(() => {
        if (globalMasterPassword && isLocked) {
            setLocalMasterPassword(globalMasterPassword);
            handleUnlock(globalMasterPassword);
        }
    }, [globalMasterPassword, isLocked]);

    const filteredItems = useMemo(() => {
        if (!searchQuery) return items;
        const lowercasedQuery = searchQuery.toLowerCase();
        return items.filter(item =>
            item.title.toLowerCase().includes(lowercasedQuery) ||
            (item.tags && item.tags.some(tag => tag.toLowerCase().includes(lowercasedQuery)))
        );
    }, [items, searchQuery]);

    const handleUnlock = async (password: string) => {
        if (!password) {
            setError(t('vaultPage.unlockError'));
            return;
        }
        setIsLoading(true);
        setError('');
        try {
            const vaultItems = await getVaultItems(password);
            setItems(vaultItems);
            setGlobalMasterPassword(password);
            setIsVaultUnlocked(true);
            setIsLocked(false);
            toast({ title: t('vaultPage.toasts.unlockedSuccess') });
        } catch (e: any) {
            setError(e.message);
            setGlobalMasterPassword(null);
            setIsVaultUnlocked(false);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLock = () => {
        setIsLocked(true);
        setLocalMasterPassword('');
        setGlobalMasterPassword(null);
        setIsVaultUnlocked(false);
        setItems([]);
        setError('');
    };

    const handleDelete = async (id: string) => {
        if (!globalMasterPassword) return;
        try {
            await removeFromVault(id, globalMasterPassword);
            setItems(prevItems => prevItems.filter(item => item.id !== id));
            toast({ title: t('vaultPage.toasts.deleteSuccess') });
        } catch (e: any) {
            toast({ variant: "destructive", title: t('vaultPage.toasts.deleteFailed'), description: e.message });
        }
    };

    const handleSaveItem = async (item: { id?: string; title: string; text: string; tags: string[] }) => {
        if (!globalMasterPassword) return false;
        try {
            if (editingItem && editingItem.id) {
                const updatedEntry = { ...editingItem, title: item.title, text: item.text, tags: item.tags };
                await updateVaultItem(updatedEntry, globalMasterPassword);
                setItems(items.map(i => i.id === updatedEntry.id ? updatedEntry : i));
                toast({ title: t('vaultPage.toasts.updateSuccess') });
            } else {
                const newEntry = await addToVault(item.title, item.text, item.tags, globalMasterPassword);
                setItems([newEntry, ...items]);
                toast({ title: t('vaultPage.toasts.addSuccess') });
            }
            setEditingItem(null);
            return true;
        } catch (e: any) {
            toast({ variant: "destructive", title: t('vaultPage.toasts.saveFailed'), description: e.message });
            return false;
        }
    };

    const handleExport = async () => {
        const result = await exportEncryptedVault();
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
        reader.onload = async (e) => {
            try {
                const text = e.target?.result as string;
                const result = await importEncryptedVault(text);
                if (result.success) {
                    handleLock();
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
                        value={localMasterPassword}
                        onChange={(e) => setLocalMasterPassword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleUnlock(localMasterPassword)}
                    />
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <Button onClick={() => handleUnlock(localMasterPassword)} disabled={isLoading} className="w-full">
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('vaultPage.unlockButton')}
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
                    <Button variant="outline" size="icon" onClick={handleExport} aria-label={t('vaultPage.exportButton')}><Download className="h-4 w-4" /></Button>
                    <Button variant="outline" size="icon" onClick={handleImportClick} aria-label={t('vaultPage.importButton')}><Upload className="h-4 w-4" /></Button>
                    <input type="file" ref={fileInputRef} onChange={handleFileImport} accept=".txt" className="hidden" />
                    <ChangePasswordDialog />
                    <Button variant="secondary" onClick={handleLock}>{t('vaultPage.lockButton')}</Button>
                </div>
            </CardHeader>
            <CardContent>
                {filteredItems.length > 0 ? (
                    isDesktop ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[40%]">{t('history.table.original')}</TableHead>
                                    <TableHead>{t('history.table.time')}</TableHead>
                                    <TableHead className="text-right">{t('history.table.actions')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredItems.map(item => (
                                    <Collapsible asChild key={item.id}>
                                        <>
                                            <CollapsibleTrigger asChild>
                                                <TableRow className="cursor-pointer">
                                                    <TableCell className="font-semibold">
                                                        {item.title}
                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                            {item.tags?.map(tag => <Badge key={tag} variant="secondary" onClick={(e) => {e.stopPropagation(); setSearchQuery(tag)}} className="cursor-pointer">{tag}</Badge>)}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>{formatRelativeTime(item.createdAt, locale)}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Button variant="ghost" size="icon" onClick={(e) => {e.stopPropagation(); navigator.clipboard.writeText(item.text).then(() => toast({title: t('vaultPage.toasts.copySuccess')}))}} aria-label={t('vaultPage.mobile.copy')}><Copy className="h-4 w-4" /></Button>
                                                        <ItemEditDialog onSave={handleSaveItem} item={item} triggerButton={<Button variant="ghost" size="icon" onClick={(e) => {e.stopPropagation(); setEditingItem(item);}} aria-label={t('vaultPage.editButton')}><Pencil className="h-4 w-4" /></Button>} />
                                                        <Button onClick={(e) => {e.stopPropagation(); setItemToDelete(item)}} variant="ghost" size="icon" aria-label={t('vaultPage.mobile.delete')}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                                                    </TableCell>
                                                </TableRow>
                                            </CollapsibleTrigger>
                                            <CollapsibleContent asChild>
                                                <tr>
                                                    <td colSpan={3} className="p-2 bg-muted">
                                                        <p className="text-sm text-muted-foreground p-2 break-all">{item.text}</p>
                                                    </td>
                                                </tr>
                                            </CollapsibleContent>
                                        </>
                                    </Collapsible>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="space-y-2">
                            {filteredItems.map(item => (
                                <div key={item.id} className="flex flex-col p-3 border rounded-lg gap-2">
                                    <div className="flex justify-between items-start gap-2">
                                        <div className="flex flex-col gap-1">
                                            <h3 className="font-semibold">{item.title}</h3>
                                            <div className="flex flex-wrap gap-1">
                                                {item.tags?.map(tag => <Badge key={tag} variant="secondary" onClick={(e) => {e.stopPropagation(); setSearchQuery(tag)}} className="cursor-pointer">{tag}</Badge>)}
                                            </div>
                                            <span className="text-xs text-muted-foreground">{formatRelativeTime(item.createdAt, locale)}</span>
                                        </div>
                                        <div className="flex items-center flex-shrink-0">
                                            <Button variant="ghost" size="icon" onClick={() => setShowContent(prev => ({...prev, [item.id]: !prev[item.id]}))} aria-label={showContent[item.id] ? t('vaultPage.mobile.hide') : t('vaultPage.mobile.show')}><Eye className="h-4 w-4"/></Button>
                                            <Button variant="ghost" size="icon" onClick={() => navigator.clipboard.writeText(item.text).then(() => toast({title: t('vaultPage.toasts.copySuccess')}))} aria-label={t('vaultPage.mobile.copy')}><Copy className="h-4 w-4" /></Button>
                                            <ItemEditDialog onSave={handleSaveItem} item={item} triggerButton={<Button variant="ghost" size="icon" onClick={() => setEditingItem(item)} aria-label={t('vaultPage.editButton')}><Pencil className="h-4 w-4" /></Button>} />
                                            <Button onClick={() => setItemToDelete(item)} variant="ghost" size="icon" aria-label={t('vaultPage.mobile.delete')}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                                        </div>
                                    </div>
                                    {showContent[item.id] && <p className="text-sm text-muted-foreground bg-muted p-2 rounded animate-in mt-2 break-all">{item.text}</p>}
                                </div>
                            ))}
                        </div>
                    )
                ) : (
                    <div className="text-center py-12 text-muted-foreground">
                        <p>{searchQuery ? t('vaultPage.noResults') : t('vaultPage.emptyState')}</p>
                        <p className="text-sm">{searchQuery ? t('vaultPage.noResultsDescription') : t('vaultPage.emptyStateDescription')}</p>
                    </div>
                )}
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

function ItemEditDialog({ onSave, item, triggerButton }: { onSave: (item: {id?: string, title: string, text: string, tags: string[]}) => Promise<boolean>, item?: VaultEntry, triggerButton: React.ReactElement }) {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const isDesktop = useMediaQuery("(min-width: 768px)");

    const [title, setTitle] = useState(item?.title || '');
    const [text, setText] = useState(item?.text || '');
    const [tags, setTags] = useState(item?.tags?.join(', ') || '');

    useEffect(() => {
        if (isOpen) {
            setTitle(item?.title || '');
            setText(item?.text || '');
            setTags(item?.tags?.join(', ') || '');
        }
    }, [isOpen, item]);

    const handleSubmit = async () => {
        const tagsArray = tags.split(',').map(t => t.trim()).filter(Boolean);
        const success = await onSave({ id: item?.id, title, text, tags: tagsArray });
        if(success) setIsOpen(false);
    }

    const titleText = item ? t('vaultPage.editDialog.titleEdit') : t('vaultPage.editDialog.titleAdd');
    const description = t('vaultPage.editDialog.description');

    if (isDesktop) {
        return (
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>{triggerButton}</DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{titleText}</DialogTitle>
                        <DialogDescription>{description}</DialogDescription>
                    </DialogHeader>
                    <EditItemForm item={item} onSave={onSave} setIsOpen={setIsOpen} title={title} text={text} tags={tags} setTitle={setTitle} setText={setText} setTags={setTags} />
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Drawer open={isOpen} onOpenChange={setIsOpen}>
            <DrawerTrigger asChild>{triggerButton}</DrawerTrigger>
            <DrawerContent>
                <DrawerHeader className="text-left">
                    <DrawerTitle>{titleText}</DrawerTitle>
                    <DrawerDescription>{description}</DrawerDescription>
                </DrawerHeader>
                <div className="p-4">
                    <EditItemForm item={item} onSave={onSave} setIsOpen={setIsOpen} title={title} text={text} tags={tags} setTitle={setTitle} setText={setText} setTags={setTags} />
                </div>
                <DrawerFooter className="pt-2">
                    <DrawerClose asChild>
                        <Button variant="outline">{t('vaultPage.editDialog.cancel')}</Button>
                    </DrawerClose>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    );
}

function PasswordGenerator({ onGenerate }: { onGenerate: (password: string) => void }) {
    const { t } = useTranslation();
    const [length, setLength] = useState(16);
    const [includeNumbers, setIncludeNumbers] = useState(true);
    const [includeSymbols, setIncludeSymbols] = useState(true);
    const [includeUppercase, setIncludeUppercase] = useState(true);

    const handleGenerate = () => {
        const password = generatePassword({
            length,
            includeNumbers,
            includeSymbols,
            includeUppercase,
            includeLowercase: true // Always include lowercase
        });
        onGenerate(password);
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" size="icon" className="absolute bottom-2 right-2" aria-label={t('vaultPage.generator.title')}>
                    <Wand2 className="h-4 w-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 space-y-4">
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <Label>{t('vaultPage.generator.length')}</Label>
                        <span className="text-sm font-bold">{length}</span>
                    </div>
                    <Slider defaultValue={[16]} value={[length]} min={8} max={64} step={1} onValueChange={(value) => setLength(value[0])} />
                </div>
                <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                        <Checkbox id="include-uppercase" checked={includeUppercase} onCheckedChange={(checked) => setIncludeUppercase(Boolean(checked))} />
                        <label htmlFor="include-uppercase" className="text-sm font-medium leading-none">{t('vaultPage.generator.uppercase')}</label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="include-numbers" checked={includeNumbers} onCheckedChange={(checked) => setIncludeNumbers(Boolean(checked))} />
                        <label htmlFor="include-numbers" className="text-sm font-medium leading-none">{t('vaultPage.generator.numbers')}</label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="include-symbols" checked={includeSymbols} onCheckedChange={(checked) => setIncludeSymbols(Boolean(checked))} />
                        <label htmlFor="include-symbols" className="text-sm font-medium leading-none">{t('vaultPage.generator.symbols')}</label>
                    </div>
                </div>
                <Button onClick={handleGenerate} className="w-full">{t('vaultPage.generator.generate')}</Button>
            </PopoverContent>
        </Popover>
    );
}


function EditItemForm({ item, onSave, setIsOpen, title, text, tags, setTitle, setText, setTags }: { item?: VaultEntry, onSave: (item: {id?: string, title: string, text: string, tags: string[]}) => Promise<boolean>, setIsOpen: (isOpen: boolean) => void, title: string, text: string, tags: string, setTitle: (title: string) => void, setText: (text: string) => void, setTags: (tags: string) => void }) {
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async () => {
        setIsLoading(true);
        const tagsArray = tags.split(',').map(t => t.trim()).filter(Boolean);
        const success = await onSave({ id: item?.id, title, text, tags: tagsArray });
        setIsLoading(false);
        if(success) setIsOpen(false);
    }

    return (
        <>
            <div className="grid gap-4 py-4">
                <Input placeholder={t('vaultPage.editDialog.titlePlaceholder')} value={title} onChange={(e) => setTitle(e.target.value)} />
                <div className="relative">
                    <Textarea placeholder={t('vaultPage.editDialog.contentPlaceholder')} value={text} onChange={(e) => setText(e.target.value)} className="min-h-[100px] pr-12" />
                    <PasswordGenerator onGenerate={setText} />
                </div>
                <Input placeholder={t('vaultPage.editDialog.tagsPlaceholder')} value={tags} onChange={(e) => setTags(e.target.value)} />
            </div>
            <div className="pt-2">
                <Button onClick={handleSubmit} disabled={isLoading || !title || !text} className="w-full">
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('vaultPage.editDialog.save')}
                </Button>
            </div>
        </>
    );
}
