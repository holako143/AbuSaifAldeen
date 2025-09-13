"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Wifi, WifiOff, DownloadCloud } from "lucide-react";
import { useToast } from "./ui/use-toast";

type CachingState = "idle" | "caching" | "ready";

export function PwaStatusIcon() {
    const [isMounted, setIsMounted] = useState(false);
    const [cachingState, setCachingState] = useState<CachingState>("idle");
    const [progress, setProgress] = useState(0);
    const [total, setTotal] = useState(0);
    const { toast } = useToast();

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const handleMessage = useCallback((event: MessageEvent) => {
        if (event.data.type === 'PRECACHE_TOTAL_RESPONSE') {
            setProgress(0);
            setTotal(event.data.total);
            if (event.data.total > 0) {
                setCachingState("caching");
            }
        } else if (event.data.type === 'PRECACHE_PROGRESS') {
            setProgress(prev => prev + 1);
        }
    }, []);

    useEffect(() => {
        if (!isMounted) return;

        if ('serviceWorker' in navigator) {
            const updateReadyState = () => {
                setCachingState(navigator.serviceWorker.controller ? "ready" : "idle");
            };

            updateReadyState();

            navigator.serviceWorker.addEventListener('controllerchange', updateReadyState);
            navigator.serviceWorker.addEventListener('message', handleMessage);

            return () => {
                navigator.serviceWorker.removeEventListener('controllerchange', updateReadyState);
                navigator.serviceWorker.removeEventListener('message', handleMessage);
            };
        }
    }, [isMounted, handleMessage]);

    useEffect(() => {
        if (!isMounted) return;

        if (cachingState === 'caching' && total > 0 && progress >= total) {
            setCachingState('ready');
            toast({ title: "اكتمل التخزين!", description: "التطبيق جاهز للعمل بدون إنترنت." });
        }
    }, [isMounted, progress, total, cachingState, toast]);

    const handleIconClick = async () => {
        if (!('serviceWorker' in navigator)) {
            toast({ variant: "destructive", title: "متصفحك لا يدعم هذه الميزة." });
            return;
        }

        toast({ title: "جاري التحقق من وجود تحديثات..." });

        try {
            const registration = await navigator.serviceWorker.getRegistration();
            if (!registration) {
                return;
            }

            await registration.update();

            const newWorker = registration.installing || registration.waiting;
            if (newWorker) {
                const messageChannel = new MessageChannel();
                messageChannel.port1.onmessage = handleMessage;
                newWorker.postMessage({ type: 'GET_PRECACHE_TOTAL' }, [messageChannel.port2]);
            } else if (cachingState !== 'ready' && registration.active) {
                const messageChannel = new MessageChannel();
                messageChannel.port1.onmessage = handleMessage;
                registration.active.postMessage({ type: 'GET_PRECACHE_TOTAL' }, [messageChannel.port2]);
            }

        } catch (error) {
            console.error("Error during PWA update check:", error);
            toast({ variant: "destructive", title: "فشل التحقق من التحديثات." });
        }
    };

    if (!isMounted) {
        // Render a placeholder or nothing on the server and initial client render
        return <div className="h-10 w-10" />; // Placeholder to avoid layout shift
    }

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
