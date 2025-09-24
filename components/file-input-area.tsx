"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useTranslation } from "@/hooks/use-translation";
import { File as FileIcon } from "lucide-react";
import { arrayBufferToBase64 } from "@/lib/utils";

interface FileInputAreaProps {
    onFileContentRead: (content: string, name: string) => void;
    isEncoding: boolean;
}

export function FileInputArea({ onFileContentRead, isEncoding }: FileInputAreaProps) {
    const { t } = useTranslation();
    const { toast } = useToast();
    const [fileInfo, setFileInfo] = useState<{name: string, size: number} | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                toast({ variant: "destructive", title: t('fileEncoder.errors.tooLarge') });
                return;
            }
            setFileInfo({ name: file.name, size: file.size });
            const reader = new FileReader();
            reader.onload = (e) => {
                const buffer = e.target?.result as ArrayBuffer;
                onFileContentRead(arrayBufferToBase64(buffer), file.name);
            };
            reader.readAsArrayBuffer(file);
        }
    };

    if (!isEncoding) {
        return (
            <div className="p-4 border-2 border-dashed rounded-lg text-center">
                <p className="text-sm text-muted-foreground">{t('fileEncoder.decryptionPlaceholder')}</p>
            </div>
        );
    }

    return (
        <div className="p-4 border-2 border-dashed rounded-lg text-center space-y-2">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
            <Button onClick={() => fileInputRef.current?.click()}><FileIcon className="ml-2 h-4 w-4" />{t('fileEncoder.selectFile')}</Button>
            {fileInfo && <p className="text-sm text-muted-foreground">{fileInfo.name} ({(fileInfo.size / 1024).toFixed(2)} KB)</p>}
        </div>
    );
}
