import { encryptAES, decryptAES, encryptMultiple, decryptMultiple } from "../lib/crypto";

export type EncryptionType = 'aes256';

// --- Variation Selector (Emoji Hiding) Logic ---

const VARIATION_SELECTOR_START = 0xfe00;
const VARIATION_SELECTOR_END = 0xfe0f;
const VARIATION_SELECTOR_SUPPLEMENT_START = 0xe0100;
const VARIATION_SELECTOR_SUPPLEMENT_END = 0xe01ef;

const isVariationSelector = (code: number): boolean => {
    return (code >= VARIATION_SELECTOR_START && code <= VARIATION_SELECTOR_END) ||
           (code >= VARIATION_SELECTOR_SUPPLEMENT_START && code <= VARIATION_SELECTOR_SUPPLEMENT_END);
};

function toVariationSelector(byte: number): string | null {
    if (byte >= 0 && byte < 16) return String.fromCodePoint(VARIATION_SELECTOR_START + byte);
    if (byte >= 16 && byte < 256) return String.fromCodePoint(VARIATION_SELECTOR_SUPPLEMENT_START + byte - 16);
    return null;
}

function fromVariationSelector(codePoint: number): number | null {
    if (codePoint >= VARIATION_SELECTOR_START && codePoint <= VARIATION_SELECTOR_END) return codePoint - VARIATION_SELECTOR_START;
    if (codePoint >= VARIATION_SELECTOR_SUPPLEMENT_START && codePoint <= VARIATION_SELECTOR_SUPPLEMENT_END) return codePoint - VARIATION_SELECTOR_SUPPLEMENT_START + 16;
    return null;
}

function encodeToEmoji(emoji: string, text: string): string {
    const bytes = new TextEncoder().encode(text);
    let encoded = emoji;
    for (const byte of bytes) {
        encoded += toVariationSelector(byte);
    }
    return encoded;
}

function decodeFromEmoji(text: string): string {
    if (!text) return "";
    const decoded = [];

    // Using an iterator to correctly handle multi-byte grapheme clusters
    const iterator = text[Symbol.iterator]();

    // The first item is the base emoji. We discard it.
    iterator.next();

    for (const char of iterator) {
        const byte = fromVariationSelector(char.codePointAt(0)!);
        // If we hit a non-data character, we can assume it's the end of our data.
        if (byte === null) {
            break;
        }
        decoded.push(byte);
    }

    const decodedArray = new Uint8Array(decoded);
    return new TextDecoder().decode(decodedArray);
}


// --- Main Controller Functions ---

interface EncodeParams {
    emoji: string;
    text: string;
    type: EncryptionType;
    passwords?: string[];
}

export async function encode({ emoji, text, type, passwords }: EncodeParams): Promise<string> {
    if (type !== 'aes256') {
        throw new Error(`Unsupported encryption type: ${type}`);
    }
    if (!passwords || passwords.length === 0) {
        // If no password, just encode the text directly without encryption.
        return encodeToEmoji(emoji, text);
    }

    // Use multiple encryption if more than one password is provided, otherwise use single encryption
    const encryptedText = passwords.length > 1
        ? await encryptMultiple(text, passwords)
        : await encryptAES(text, passwords[0]);
    return encodeToEmoji(emoji, encryptedText);
}


interface DecodeParams {
    text: string;
    type: EncryptionType;
    passwords?: string[];
}

export async function decode({ text, type, passwords }: DecodeParams): Promise<string> {
    // 1. Split the input text into potential messages.
    // A new message starts with a non-variation-selector character (the base emoji).
    const messages: string[] = [];
    let currentMessage = "";
    for (const char of text) {
        // Use codePointAt for multi-byte characters
        const code = char.codePointAt(0);
        if (code && !isVariationSelector(code)) {
            // It's a base character, so the previous message (if any) has ended.
            if (currentMessage) messages.push(currentMessage);
            currentMessage = char; // Start a new message.
        } else {
            currentMessage += char; // It's part of the current message's data.
        }
    }
    if (currentMessage) messages.push(currentMessage); // Add the last message.

    // 2. Process each message individually.
    const decodedLines = [];
    for (const message of messages) {
        if (!message.trim()) continue;

        try {
            const hiddenText = decodeFromEmoji(message);

            if (type !== 'aes256') {
                throw new Error(`Unsupported encryption type: ${type}`);
            }

            if (!passwords || passwords.length === 0) {
                decodedLines.push(hiddenText);
            } else {
                const decryptedText = passwords.length > 1
                    ? await decryptMultiple(hiddenText, passwords)
                    : await decryptAES(hiddenText, passwords[0]);
                decodedLines.push(decryptedText);
            }
        } catch (e) {
            // If one message fails, the whole operation fails.
            // This is to prevent partially correct output which could be misleading.
            throw e;
        }
    }

    return decodedLines.join('\n');
}
