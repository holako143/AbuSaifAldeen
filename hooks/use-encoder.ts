import { useState, useEffect } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { useAppContext } from "@/components/app-provider";
import { useTranslation } from "@/hooks/use-translation";
import { decode, encode } from "@/app/encoding";
import { addToHistory } from "@/lib/history";
import { isBase64, base64ToBlob } from "@/lib/utils";

export type EncoderMode = 'encode' | 'decode';

export function useEncoder(initialTextToDecode: string | null, onTextToDecode: (text: string | null) => void) {
    const { t } = useTranslation();
    const { isPasswordEnabled: isPasswordGloballyEnabled, autoCopy, isHistoryEnabled } = useAppContext();
    const { toast } = useToast();

    const [mode, setModeState] = useState<EncoderMode>("encode");
    const [inputText, setInputText] = useState("");
    const [fileInputName, setFileInputName] = useState("");
    const [outputText, setOutputText] = useState("");
    const [passwords, setPasswords] = useState([{ id: 1, value: "" }]);
    const [selectedEmoji, setSelectedEmoji] = useState("😀");
    const [isProcessing, setIsProcessing] = useState(false);
    const [errorText, setErrorText] = useState("");
    const [decryptedFileUrl, setDecryptedFileUrl] = useState<string | null>(null);

    useEffect(() => {
        if (initialTextToDecode) {
            setInputText(initialTextToDecode);
            setModeState("decode");
            onTextToDecode(null);
        }
    }, [initialTextToDecode, onTextToDecode]);

    const run = (text: string, currentTab: 'text' | 'file') => {
        const process = async () => {
            if (text.trim() === "") { setOutputText(""); setErrorText(""); return; }
            const activePasswords = passwords.map(p => p.value).filter(Boolean);
            if (isPasswordGloballyEnabled && activePasswords.length === 0) {
                setErrorText(t('encoderDecoder.passwordRequiredError')); setOutputText(""); return;
            }
            setIsProcessing(true); setErrorText(""); setDecryptedFileUrl(null);
            try {
                const result = mode === 'encode'
                    ? await encode({ emoji: selectedEmoji, text, type: 'aes256', passwords: isPasswordGloballyEnabled ? activePasswords : [] })
                    : await decode({ text, type: 'aes256', passwords: isPasswordGloballyEnabled ? activePasswords : [] });
                setOutputText(result);
                if (currentTab === 'file' && mode === 'decode' && result) {
                    if (isBase64(result)) {
                        try {
                            const blob = base64ToBlob(result);
                            setDecryptedFileUrl(URL.createObjectURL(blob));
                        } catch (e) {
                             toast({ variant: "destructive", title: t('fileEncoder.errors.decodeFailed') });
                        }
                    } else {
                        setErrorText(t('fileEncoder.errors.decodeFailed'));
                    }
                }
                if (isHistoryEnabled && result) {
                    const historyInput = currentTab === 'file' ? `file: ${fileInputName}` : text;
                    await addToHistory({ inputText: historyInput, outputText: result, mode });
                }
                if (result && mode === 'encode' && autoCopy) { navigator.clipboard.writeText(result); toast({ title: t('toasts.autoCopySuccess') }); }
            } catch (e: any) {
                setOutputText("");
                const modeText = mode === "encode" ? t('encoderDecoder.encodeError') : t('encoderDecoder.decodeError');
                setErrorText(e.message || t('encoderDecoder.genericError', { mode: modeText }));
            } finally { setIsProcessing(false); }
        };
        process();
    }

    return {
        mode, setModeState,
        inputText, setInputText,
        fileInputName, setFileInputName,
        outputText,
        passwords, setPasswords,
        selectedEmoji, setSelectedEmoji,
        isProcessing,
        errorText,
        decryptedFileUrl, setDecryptedFileUrl,
        runEncoder: run,
    };
}