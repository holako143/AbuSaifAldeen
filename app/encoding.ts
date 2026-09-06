import { encryptAES, decryptAES, encryptMultiple, decryptMultiple } from "../lib/crypto";

export type EncryptionType = 'aes256';

// --- Zero-Width & Variation Selector (Emoji Hiding) Logic ---

// Universal Zero-Width characters that NEVER display question marks ('?') or boxes ('[]') on ANY device or chat app (WhatsApp, Telegram, iOS, Android, Windows)
// \u200B = Zero Width Space (0), \u200C = Zero Width Non-Joiner (1)
const ZERO_WIDTH_0 = '\u200B';
const ZERO_WIDTH_1 = '\u200C';

// Legacy zero-width characters mapping for backward decoding support (Base-4 and Base-2)
const BASE4_MAP: Record<string, number> = {
    '\u200C': 0,
    '\u200B': 1,
    '\u200E': 2,
    '\u200F': 3,
    '\u200D': 2,
    '\u2060': 3,
};

const ALL_ZERO_WIDTH_CHARS = ['\u200B', '\u200C', '\u200E', '\u200F', '\u200D', '\u2060', '\uFEFF'];

const VARIATION_SELECTOR_START = 0xfe00;
const VARIATION_SELECTOR_END = 0xfe0f;
const VARIATION_SELECTOR_SUPPLEMENT_START = 0xe0100;
const VARIATION_SELECTOR_SUPPLEMENT_END = 0xe01ef;

const isZeroWidthChar = (char: string): boolean => {
    return ALL_ZERO_WIDTH_CHARS.includes(char);
};

const isLegacyVariationSelector = (code: number): boolean => {
    return code >= VARIATION_SELECTOR_SUPPLEMENT_START && code <= VARIATION_SELECTOR_SUPPLEMENT_END;
};

const isStandardVariationSelector = (code: number): boolean => {
    return code >= VARIATION_SELECTOR_START && code <= VARIATION_SELECTOR_END;
};

const isHiddenDataChar = (char: string): boolean => {
    if (isZeroWidthChar(char)) return true;
    const code = char.codePointAt(0);
    return code !== undefined ? isLegacyVariationSelector(code) : false;
};

const isMessageStartChar = (char: string): boolean => {
    if (isZeroWidthChar(char)) return false;
    const code = char.codePointAt(0);
    if (code === undefined) return false;
    if (isStandardVariationSelector(code) || isLegacyVariationSelector(code)) return false;
    return true;
};

function byteToZeroWidthBinary(byte: number): string {
    let result = "";
    for (let i = 7; i >= 0; i--) {
        const bit = (byte >> i) & 1;
        result += bit === 1 ? ZERO_WIDTH_1 : ZERO_WIDTH_0;
    }
    return result;
}

function fromVariationSelector(codePoint: number): number | null {
    if (codePoint >= VARIATION_SELECTOR_SUPPLEMENT_START && codePoint <= VARIATION_SELECTOR_SUPPLEMENT_END) {
        return codePoint - VARIATION_SELECTOR_SUPPLEMENT_START + 16;
    }
    return null;
}

function encodeToEmoji(emoji: string, text: string): string {
    const bytes = new TextEncoder().encode(text);
    let encoded = emoji;
    for (const byte of bytes) {
        encoded += byteToZeroWidthBinary(byte);
    }
    return encoded;
}

function decodeFromEmoji(text: string): string {
    if (!text) return "";

    const hiddenChars: string[] = [];
    let hasBinaryZeroWidth = false;
    let hasBase4ZeroWidth = false;
    let hasLegacyVs = false;

    const iterator = text[Symbol.iterator]();

    for (const char of iterator) {
        if (isZeroWidthChar(char)) {
            hiddenChars.push(char);
            if (char === ZERO_WIDTH_0 || char === ZERO_WIDTH_1) {
                hasBinaryZeroWidth = true;
            } else {
                hasBase4ZeroWidth = true;
            }
        } else {
            const code = char.codePointAt(0);
            if (code !== undefined && isLegacyVariationSelector(code)) {
                hiddenChars.push(char);
                hasLegacyVs = true;
            }
        }
    }

    if (hiddenChars.length === 0) return "";

    let decodedBytes: Uint8Array;

    if (!hasBase4ZeroWidth && hasBinaryZeroWidth && hiddenChars.length % 8 === 0) {
        // Binary (Base-2) decoding using U+200B and U+200C
        const bytes: number[] = [];
        for (let i = 0; i < hiddenChars.length; i += 8) {
            let byte = 0;
            for (let b = 0; b < 8; b++) {
                const char = hiddenChars[i + b];
                const bit = char === ZERO_WIDTH_1 ? 1 : 0;
                byte = (byte << 1) | bit;
            }
            bytes.push(byte);
        }
        decodedBytes = new Uint8Array(bytes);
    } else if (hasBase4ZeroWidth || hasBinaryZeroWidth) {
        // Legacy Base-4 decoding
        const bytes: number[] = [];
        for (let i = 0; i < hiddenChars.length; i += 4) {
            if (i + 3 < hiddenChars.length) {
                const b0 = BASE4_MAP[hiddenChars[i]];
                const b1 = BASE4_MAP[hiddenChars[i + 1]];
                const b2 = BASE4_MAP[hiddenChars[i + 2]];
                const b3 = BASE4_MAP[hiddenChars[i + 3]];
                if (b0 !== undefined && b1 !== undefined && b2 !== undefined && b3 !== undefined) {
                    const byte = (b0 << 6) | (b1 << 4) | (b2 << 2) | b3;
                    bytes.push(byte);
                }
            }
        }
        decodedBytes = new Uint8Array(bytes);
    } else if (hasLegacyVs) {
        const bytes: number[] = [];
        for (const char of hiddenChars) {
            const code = char.codePointAt(0);
            if (code !== undefined) {
                const byte = fromVariationSelector(code);
                if (byte !== null) {
                    bytes.push(byte);
                }
            }
        }
        decodedBytes = new Uint8Array(bytes);
    } else {
        return "";
    }

    return new TextDecoder().decode(decodedBytes);
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
    // A new message starts with a base emoji/character (not a zero-width char or variation selector).
    const messages: string[] = [];
    let currentMessage = "";
    for (const char of text) {
        if (isMessageStartChar(char)) {
            // It's a base character, so the previous message (if any) has ended.
            if (currentMessage) messages.push(currentMessage);
            currentMessage = char; // Start a new message.
        } else {
            currentMessage += char; // It's part of the current message (base emoji variation selector or hidden payload).
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
