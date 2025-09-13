"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Wifi, WifiOff, DownloadCloud } from "lucide-react";
import { useToast } from "./ui/use-toast";

type CachingState = "idle" | "caching" | "ready";

export function PwaStatusIcon() {
    const [cachingState, setCachingState] = useState<CachingState>("idle");
    const [progress, setProgress] = useState(0);
    const [total, setTotal] = useState(0);
    const { toast } = useToast();

    const handleMessage = useCallback((event: MessageEvent) => {
        console.log('[PWA-Icon] Received message:', event.data);
        if (event.data.type === 'PRECACHE_TOTAL_RESPONSE') {
            // Reset progress when we get a new total
            setProgress(0);
            setTotal(event.data.total);
            if (event.data.total > 0) {
                console.log('[PWA-Icon] State -> caching');
                setCachingState("caching");
            }
        } else if (event.data.type === 'PRECACHE_PROGRESS') {
            setProgress(prev => prev + 1);
        }
    }, []);

    useEffect(() => {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            const updateReadyState = () => {
                if(navigator.serviceWorker.controller) {
                    console.log('[PWA-Icon] State -> ready (controller found)');
                    setCachingState("ready");
                } else {
                    console.log('[PWA-Icon] State -> idle (no controller)');
                    setCachingState("idle");
                }
            };

            updateReadyState();

            navigator.serviceWorker.addEventListener('controllerchange', updateReadyState);
            navigator.serviceWorker.addEventListener('message', handleMessage);

            return () => {
                navigator.serviceWorker.removeEventListener('controllerchange', updateReadyState);
                navigator.serviceWorker.removeEventListener('message', handleMessage);
            };
        }
    }, [handleMessage]);

    useEffect(() => {
        console.log(`[PWA-Icon] Progress update: ${progress}/${total}, State: ${cachingState}`);
        if (cachingState === 'caching' && total > 0 && progress >= total) {
            console.log('[PWA-Icon] Caching complete. State -> ready');
            setCachingState('ready');
            toast({ title: "اكتمل التخزين!", description: "التطبيق جاهز للعمل بدون إنترنت." });
        }
    }, [progress, total, cachingState, toast]);

    const handleIconClick = async () => {
        if (!('serviceWorker' in navigator)) {
            toast({ variant: "destructive", title: "متصفحك لا يدعم هذه الميزة." });
            return;
        }

        toast({ title: "جاري التحقق من وجود تحديثات..." });

        try {
            const registration = await navigator.serviceWorker.getRegistration();
            if (!registration) {
                toast({ variant: "destructive", title: "فشل الحصول على تسجيل عامل الخدمة." });
                return;
            }

            // Manually trigger an update check. This will trigger the 'install' event in sw.js
            await registration.update();

            // After update, the new SW might be in waiting. Let's ask it for the total.
            const newWorker = registration.installing || registration.waiting;
            if (newWorker) {
                console.log('[PWA-Icon] Found new worker, asking for total precache items.');
                const messageChannel = new MessageChannel();
                messageChannel.port1.onmessage = handleMessage;
                newWorker.postMessage({ type: 'GET_PRECACHE_TOTAL' }, [messageChannel.port2]);
            } else {
                console.log('[PWA-Icon] No new worker found after update check. App is likely up to date.');
            }

        } catch (error) {
            console.error("Error during PWA update check:", error);
            toast({ variant: "destructive", title: "فشل التحقق من التحديثات." });
        }
    };

    const renderIcon = () => {
        switch (cachingState) {
            case 'caching':
                return (
                    <div className="relative h-[1.2rem] w-[1.2rem] flex justify-center items-center">
                        <DownloadCloud className="h-full w-full" />
                        <span className="absolute text-xs font-bold text-primary" style={{ fontSize: '0.6rem' }}>
                            {progress}
                        </span>
                    </div>
                );
            case 'ready':
                return <Wifi className="h-[1.2rem] w-[1.2rem] text-green-500" />;
            case 'idle':
            default:
                return <WifiOff className="h-[1.2rem] w-[1.2rem]" />;
        }
    };

    const getTooltipText = () => {
        switch (cachingState) {
            case 'caching':
                return `جاري تحميل الملفات... (${progress}/${total})`;
            case 'ready':
                return "التطبيق جاهز للعمل بدون إنترنت";
            case 'idle':
            default:
                return "اضغط لتفعيل وضع عدم الاتصال";
        }
    }

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={handleIconClick}>
                        {renderIcon()}
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{getTooltipText()}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
