"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Wifi, WifiOff, Loader2 } from "lucide-react";
import { useToast } from "./ui/use-toast";
import { cn } from "@/lib/utils";

type PwaStatus = 'idle' | 'checking' | 'ready';

export function PwaStatusIcon() {
    const [status, setStatus] = useState<PwaStatus>('idle');
    const { toast } = useToast();

    useEffect(() => {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            const updateStatus = () => {
                if (navigator.serviceWorker.controller) {
                    setStatus('ready');
                } else {
                    setStatus('idle');
                }
            };

            updateStatus();
            navigator.serviceWorker.addEventListener('controllerchange', updateStatus);

            return () => {
                navigator.serviceWorker.removeEventListener('controllerchange', updateStatus);
            };
        }
    }, []);

    const handleIconClick = async () => {
        if (!('serviceWorker' in navigator) || !navigator.serviceWorker.register) {
            toast({ variant: "destructive", title: "متصفحك لا يدعم هذه الميزة." });
            return;
        }

        setStatus('checking');
        toast({ title: "جاري تجهيز التطبيق للعمل أوفلاين..." });

        try {
            const registration = await navigator.serviceWorker.ready;
            await registration.update();
            // The 'controllerchange' event listener will handle setting the status to 'ready'
            // if an update is found and activated.
            toast({ title: "اكتمل التحضير.", description: "التطبيق الآن يجب أن يعمل بدون إنترنت." });
            // We might already be ready, the event listener handles the final state.
        } catch (error) {
            toast({ variant: "destructive", title: "فشل تجهيز التطبيق." });
            setStatus('idle'); // Revert status on failure
        }
    };

    const isDisabled = status === 'checking' || status === 'ready';
    let icon;
    let tooltipText;

    switch (status) {
        case 'checking':
            icon = <Loader2 className="h-[1.2rem] w-[1.2rem] animate-spin" />;
            tooltipText = "جاري التجهيز...";
            break;
        case 'ready':
            icon = <Wifi className="h-[1.2rem] w-[1.2rem] text-green-500" />;
            tooltipText = "التطبيق جاهز للعمل بدون إنترنت.";
            break;
        case 'idle':
        default:
            icon = <WifiOff className="h-[1.2rem] w-[1.2rem]" />;
            tooltipText = "تجهيز التطبيق للعمل بدون إنترنت";
            break;
    }

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={handleIconClick} disabled={isDisabled}>
                    {icon}
                </Button>
            </TooltipTrigger>
            <TooltipContent>
                <p>{tooltipText}</p>
            </TooltipContent>
        </Tooltip>
    );
}
