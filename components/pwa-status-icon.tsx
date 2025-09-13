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
        if (event.data.type === 'PRECACHE_TOTAL_RESPONSE') {
            setTotal(event.data.total);
            if (event.data.total > 0) {
                setCachingState("caching");
            }
        } else if (event.data.type === 'PRECACHE_PROGRESS') {
            setProgress(prev => prev + 1);
        }
    }, []);

    useEffect(() => {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator && navigator.serviceWorker.controller) {
            // If a service worker is already in control, we assume it's ready.
            setCachingState("ready");
        }

        const controllerChangeHandler = () => {
            setCachingState(navigator.serviceWorker.controller ? "ready" : "idle");
        };

        navigator.serviceWorker?.addEventListener('controllerchange', controllerChangeHandler);
        navigator.serviceWorker?.addEventListener('message', handleMessage);

        return () => {
            navigator.serviceWorker?.removeEventListener('controllerchange', controllerChangeHandler);
            navigator.serviceWorker?.removeEventListener('message', handleMessage);
        };
    }, [handleMessage]);


    useEffect(() => {
        if (cachingState === 'caching' && total > 0 && progress === total) {
            setCachingState('ready');
            toast({ title: "اكتمل التخزين!", description: "التطبيق جاهز للعمل بدون إنترنت." });
        }
    }, [progress, total, cachingState, toast]);

    const handleIconClick = async () => {
        if (!('serviceWorker' in navigator) || !navigator.serviceWorker.ready) {
            toast({ variant: "destructive", title: "متصفحك لا يدعم هذه الميزة." });
            return;
        }

        toast({ title: "جاري التحقق من وجود تحديثات..." });

        try {
            const registration = await navigator.serviceWorker.ready;

            // This logic asks the service worker for the total number of files to precache.
            const messageChannel = new MessageChannel();
            messageChannel.port1.onmessage = handleMessage;
            registration.active?.postMessage({ type: 'GET_PRECACHE_TOTAL' }, [messageChannel.port2]);

            // Manually trigger an update check.
            await registration.update();

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
