"use client";

import { useEffect } from 'react';
import { useToast } from './ui/use-toast';

export function PwaDiagnostics() {
    const { toast } = useToast();

    useEffect(() => {
        if (
            typeof window !== 'undefined' &&
            'serviceWorker' in navigator &&
            window.workbox !== undefined
        ) {
            const wb = window.workbox;

            // A common listener for all service worker states
            wb.addEventListener('message', (event) => {
                console.log(`Event ${event.type} is triggered.`, event);
                // Potentially show a toast for specific messages
            });

            wb.addEventListener('installed', (event) => {
                console.log(`Event ${event.type} is triggered.`, event);
                toast({
                    title: "PWA: تم التثبيت",
                    description: `تم تثبيت عامل خدمة جديد. جاهز للتفعيل. هل هو جديد؟ ${event.isUpdate ? 'نعم' : 'لا'}`
                });
            });

            wb.addEventListener('waiting', (event) => {
                console.log(`Event ${event.type} is triggered.`, event);
                toast({
                    title: "PWA: في الانتظار",
                    description: "عامل خدمة جديد في انتظار التفعيل."
                });
            });

            wb.addEventListener('controlling', (event) => {
                console.log(`Event ${event.type} is triggered.`, event);
                 toast({
                    title: "PWA: تم التحكم",
                    description: `عامل الخدمة يتحكم الآن بالصفحة. هل هو جديد؟ ${event.isUpdate ? 'نعم' : 'لا'}`
                });
            });

            wb.addEventListener('activated', (event) => {
                console.log(`Event ${event.type} is triggered.`, event);
                toast({
                    title: "PWA: تم التفعيل",
                    description: `تم تفعيل عامل الخدمة. هل هو جديد؟ ${event.isUpdate ? 'نعم' : 'لا'}`
                });
            });

            // Don't forget to throw an error if registration fails
            wb.register().catch((error) => {
                console.error('Service worker registration failed:', error);
                toast({
                    variant: "destructive",
                    title: "PWA: فشل التسجيل",
                    description: "فشل تسجيل عامل الخدمة."
                });
            });

            toast({ title: "PWA: تم إعداد التشخيص.", description: "أدوات التشخيص الآن تستمع للأحداث." });
        }
    }, [toast]);

    // This is a diagnostic component, it doesn't render anything.
    return null;
}
