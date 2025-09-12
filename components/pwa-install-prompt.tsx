"use client";

import { useEffect, useState } from 'react';
import { useToast } from './ui/use-toast';
import { Button } from './ui/button';
import { Download } from 'lucide-react';

// Define the event type for BeforeInstallPromptEvent
interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{
        outcome: 'accepted' | 'dismissed';
        platform: string;
    }>;
    prompt(): Promise<void>;
}

export function PwaInstallPrompt() {
    const [installPromptEvent, setInstallPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
    const { toast, dismiss } = useToast();

    useEffect(() => {
        const handleBeforeInstallPrompt = (event: Event) => {
            event.preventDefault();
            setInstallPromptEvent(event as BeforeInstallPromptEvent);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    useEffect(() => {
        if (installPromptEvent) {
            const { id } = toast({
                title: "تثبيت التطبيق",
                description: "هل تريد تثبيت 'شفريشن' على جهازك للوصول السريع؟",
                duration: Infinity, // Keep the toast open until dismissed
                action: (
                    <Button onClick={() => handleInstallClick(id)}>
                        <Download className="ml-2 h-4 w-4" />
                        تثبيت
                    </Button>
                ),
            });
        }
    }, [installPromptEvent, toast]);

    const handleInstallClick = async (toastId: string | number) => {
        if (!installPromptEvent) {
            return;
        }

        // Show the browser's installation prompt
        installPromptEvent.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await installPromptEvent.userChoice;

        if (outcome === 'accepted') {
            toast({ title: "تم التثبيت بنجاح!", description: "يمكنك الآن تشغيل التطبيق من شاشتك الرئيسية." });
        } else {
            toast({ title: "تم الإلغاء", description: "يمكنك تثبيت التطبيق لاحقًا من إعدادات المتصفح." });
        }

        // The prompt can only be used once, so clear it.
        setInstallPromptEvent(null);
        // Dismiss the initial toast
        dismiss(toastId);
    };

    // This component doesn't render anything itself, it just handles the logic.
    return null;
}
