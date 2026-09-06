"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Upload, AlertCircle } from "lucide-react";

export function ForgotPasswordDialog({ onImportClick }: { onImportClick: () => void }) {
  const { t } = useTranslation();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="link" className="mt-2">
          {t('vaultPage.forgotPassword')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('vaultPage.forgotPasswordDialog.title')}</DialogTitle>
          <DialogDescription>
            {t('vaultPage.forgotPasswordDialog.description')}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <p>{t('vaultPage.forgotPasswordDialog.noRecovery')}</p>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t('vaultPage.forgotPasswordDialog.warningTitle')}</AlertTitle>
            <AlertDescription>
              {t('vaultPage.forgotPasswordDialog.warningDescription')}
            </AlertDescription>
          </Alert>
          <p>{t('vaultPage.forgotPasswordDialog.backupInstruction')}</p>
        </div>
        <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-between items-center w-full">
          <DialogClose asChild>
            <Button variant="outline">{t('vaultPage.editDialog.cancel')}</Button>
          </DialogClose>
          <Button onClick={onImportClick} className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            {t('vaultPage.importButton')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
