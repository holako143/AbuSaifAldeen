"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Wifi, WifiOff, DownloadCloud } from "lucide-react";
import { useToast } from "./ui/use-toast";

type CachingState = "idle" | "caching" | "ready" | "error";

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
            } else {
                // If there's nothing to precache, we can consider it ready
                setCachingState("ready");
            }
        } else if (event.data.type === 'PRECACHE_PROGRESS') {
            setProgress(prev => prev + 1);
        }
    }, []);

    useEffect(() => {
        if (!isMounted || typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

        const wb = (window as any).workbox;
        if (!wb) {
            console.error("Workbox not found. PWA features will be disabled.");
            setCachingState("error");
            return;
        }

        const onControlling = () => setCachingState("ready");
        const onActivated = (event: any) => {
            if (!event.isUpdate) {
                // If it's a fresh install, ask for the total to kick off the progress UI
                wb.messageSW({ type: 'GET_PRECACHE_TOTAL' }).then((reply: any) => {
                    handleMessage({ data: reply } as MessageEvent);
                });
            } else {
                 setCachingState("ready");
            }
        };

        wb.addEventListener('controlling', onControlling);
        wb.addEventListener('activated', onActivated);
        wb.addEventListener('message', handleMessage);

        wb.register().catch((error: Error) => {
            console.error('Service worker registration failed:', error);
            setCachingState("error");
        });

        // Check initial state
        if(navigator.serviceWorker.controller) {
            setCachingState("ready");
        }

        return () => {
            wb.removeEventListener('controlling', onControlling);
            wb.removeEventListener('activated', onActivated);
            wb.removeEventListener('message', handleMessage);
        };
    }, [isMounted, handleMessage]);

    useEffect(() => {
        if (cachingState === 'caching' && total > 0 && progress >= total) {
            setCachingState('ready');
            toast({ title: "اكتمل التخزين!", description: "التطبيق جاهز للعمل بدون إنترنت." });
        }
    }, [progress, total, cachingState, toast]);

    const handleIconClick = () => {
        const wb = (window as any).workbox;
        if (wb) {
            wb.update();
            toast({ title: "جاري البحث عن تحديثات..." });
        }
    };

    if (!isMounted) {
        return <div className="h-10 w-10" />; // Placeholder to avoid layout shift
    }

    const renderIcon = () => {
        switch (cachingState) {
            case 'caching':
                return (
                    <div className="relative h-[1.2rem] w-[1.2rem] flex justify-center items-center">
                        <DownloadCloud className="h-full w-full animate-pulse" />
                        <span className="absolute text-xs font-bold text-primary" style={{ fontSize: '0.6rem' }}>
                            {progress}
                        </span>
                    </div>
                );
            case 'ready':
                return <Wifi className="h-[1.2rem] w-[1.2rem] text-green-500" />;
            case 'error':
                 return <WifiOff className="h-[1.2rem] w-[1.2rem] text-red-500" />;
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
            case 'error':
                return "حدث خطأ في تفعيل وضع عدم الإتصال";
            case 'idle':
            default:
                return "جاري تهيئة وضع عدم الإتصال...";
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
