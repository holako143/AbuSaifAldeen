import { encryptAES, decryptAES, encryptMultiple, decryptMultiple } from "../lib/crypto";

export type EncryptionType = 'aes256';

// --- Zero-Width & Variation Selector (Emoji Hiding) Logic ---

// 100% invisible Zero-Width characters that render cleanly without boxes or question marks across all mobile devices, OS, and browsers
// Using U+200B, U+200C, U+200D, U+2060 (All highly reliable zero-width invisible formatting characters)
const ZERO_WIDTH_CHARS = ['\u200B', '\u200C', '\u200D', '\u2060'];

const ZERO_WIDTH_MAP: Record<string, number> = {
    '\u200B': 0, // Zero Width Space
    '\u200C': 1, // Zero Width Non-Joiner
    '\u200D': 2, // Zero Width Joiner
    '\u2060': 3, // Word Joiner
};

const VARIATION_SELECTOR_START = 0xfe00;
const VARIATION_SELECTOR_END = 0xfe0f;
const VARIATION_SELECTOR_SUPPLEMENT_START = 0xe0100;
const VARIATION_SELECTOR_SUPPLEMENT_END = 0xe01ef;

const isZeroWidthChar = (char: string): boolean => {
    return ZERO_WIDTH_CHARS.includes(char);
};

const isVariationSelector = (code: number): boolean => {
    return (code >= VARIATION_SELECTOR_START && code <= VARIATION_SELECTOR_END) ||
           (code >= VARIATION_SELECTOR_SUPPLEMENT_START && code <= VARIATION_SELECTOR_SUPPLEMENT_END);
};

const isHiddenDataChar = (char: string): boolean => {
    if (isZeroWidthChar(char)) return true;
    const code = char.codePointAt(0);
    return code !== undefined ? isVariationSelector(code) : false;
};

function byteToZeroWidth(byte: number): string {
    const p0 = (byte >> 6) & 3;
    const p1 = (byte >> 4) & 3;
    const p2 = (byte >> 2) & 3;
    const p3 = byte & 3;
    return ZERO_WIDTH_CHARS[p0] + ZERO_WIDTH_CHARS[p1] + ZERO_WIDTH_CHARS[p2] + ZERO_WIDTH_CHARS[p3];
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
        encoded += byteToZeroWidth(byte);
    }
    return encoded;
}

function decodeFromEmoji(text: string): string {
    if (!text) return "";

    // The first character is the base emoji. Skip the first character to avoid treating emoji variation selectors (like \uFE0F) as payload.
    const iterator = text[Symbol.iterator]();
    iterator.next(); // Skip base emoji

    const hiddenChars: string[] = [];
    let hasZeroWidth = false;
    let hasLegacyVs = false;

    for (const char of iterator) {
        if (isZeroWidthChar(char)) {
            hiddenChars.push(char);
            hasZeroWidth = true;
        } else {
            const code = char.codePointAt(0);
            if (code !== undefined && isVariationSelector(code)) {
                hiddenChars.push(char);
                hasLegacyVs = true;
            }
        }
    }

    if (hiddenChars.length === 0) return "";

    let decodedBytes: Uint8Array;

    if (hasZeroWidth) {
        const bytes: number[] = [];
        for (let i = 0; i < hiddenChars.length; i += 4) {
            if (i + 3 < hiddenChars.length) {
                const b0 = ZERO_WIDTH_MAP[hiddenChars[i]];
                const b1 = ZERO_WIDTH_MAP[hiddenChars[i + 1]];
                const b2 = ZERO_WIDTH_MAP[hiddenChars[i + 2]];
                const b3 = ZERO_WIDTH_MAP[hiddenChars[i + 3]];
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
    // A new message starts with a base character (not zero-width and not variation selector).
    const messages: string[] = [];
    let currentMessage = "";
    for (const char of text) {
        if (!isHiddenDataChar(char)) {
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
