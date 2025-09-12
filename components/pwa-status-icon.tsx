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
            toast({ title: "اكتمل التحقق.", description: "إذا كان هناك تحديث، سيتم تطبيقه في الخلفية." });
        } catch (error) {
            toast({ variant: "destructive", title: "فشل التحقق من التحديثات." });
        } finally {
            // Reset the checking state after a delay to avoid a stuck spinner
            setTimeout(() => {
                if (navigator.serviceWorker.controller) {
                    setStatus('ready');
                } else {
                    setStatus('idle');
                }
            }, 3000);
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
