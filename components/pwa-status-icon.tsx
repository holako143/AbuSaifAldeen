"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Wifi, WifiOff, CheckCircle } from "lucide-react";
import { useToast } from "./ui/use-toast";

export function PwaStatusIcon() {
    const [isOfflineReady, setIsOfflineReady] = useState(false);
    const [isChecking, setIsChecking] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        // This effect runs once on mount to check the initial state
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            // If a service worker is already controlling the page, it's ready for offline use.
            if (navigator.serviceWorker.controller) {
                setIsOfflineReady(true);
            }
            // Listen for when a new service worker takes control.
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                setIsOfflineReady(true);
            });
        }
    }, []);

    const handleIconClick = async () => {
        if (!('serviceWorker' in navigator)) {
            toast({ variant: "destructive", title: "متصفحك لا يدعم هذه الميزة." });
            return;
        }

        setIsChecking(true);
        toast({ title: "جاري التحقق من وجود تحديثات..." });

        try {
            // Get the service worker registration.
            const registration = await navigator.serviceWorker.ready;
            // Manually check for updates on the server.
            await registration.update();

            // The update process happens in the background. The 'controllerchange'
            // event will fire if a new worker takes control.
            toast({ title: "اكتمل التحقق.", description: "إذا كان هناك تحديث، سيتم تطبيقه في الخلفية." });

        } catch (error) {
            toast({ variant: "destructive", title: "فشل التحقق من التحديثات." });
        } finally {
            setTimeout(() => setIsChecking(false), 2000);
        }
    };

    let icon = <WifiOff className="h-[1.2rem] w-[1.2rem]" />;
    let tooltipText = "التطبيق ليس جاهزًا للعمل بدون إنترنت. اضغط للتحضير.";

    if (isOfflineReady) {
        icon = <Wifi className="h-[1.2rem] w-[1.2rem] text-green-500" />;
        tooltipText = "التطبيق جاهز للعمل بدون إنترنت.";
    }

    if (isChecking) {
        icon = <CheckCircle className="h-[1.2rem] w-[1.2rem] animate-pulse" />;
        tooltipText = "جاري التحقق...";
    }

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={handleIconClick} disabled={isChecking}>
                    {icon}
                </Button>
            </TooltipTrigger>
            <TooltipContent>
                <p>{tooltipText}</p>
            </TooltipContent>
        </Tooltip>
    );
}
