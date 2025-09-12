"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Wifi, WifiOff } from "lucide-react";
import { useToast } from "./ui/use-toast";

export function PwaStatusIcon() {
    const [isReady, setIsReady] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            const updateReadyState = () => {
                setIsReady(!!navigator.serviceWorker.controller);
            };

            updateReadyState();
            navigator.serviceWorker.addEventListener('controllerchange', updateReadyState);

            return () => {
                navigator.serviceWorker.removeEventListener('controllerchange', updateReadyState);
            };
        }
    }, []);

    const handleIconClick = async () => {
        if (!('serviceWorker' in navigator) || !navigator.serviceWorker.register) {
            toast({ variant: "destructive", title: "متصفحك لا يدعم هذه الميزة." });
            return;
        }

        toast({ title: "جاري التحقق من وجود تحديثات للتطبيق..." });

        try {
            const registration = await navigator.serviceWorker.ready;
            await registration.update();
            toast({ title: "اكتمل التحقق.", description: "سيتم تطبيق أي تحديثات جديدة عند إعادة تشغيل التطبيق." });
        } catch (error) {
            toast({ variant: "destructive", title: "فشل التحقق من التحديثات." });
        }
    };

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={handleIconClick}>
                    {isReady
                        ? <Wifi className="h-[1.2rem] w-[1.2rem] text-green-500" />
                        : <WifiOff className="h-[1.2rem] w-[1.2rem]" />
                    }
                </Button>
            </TooltipTrigger>
            <TooltipContent>
                <p>{isReady ? "التطبيق جاهز للعمل بدون إنترنت" : "اضغط للتحقق من تحديثات الأوفلاين"}</p>
            </TooltipContent>
        </Tooltip>
    );
}
