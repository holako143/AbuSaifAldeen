import pako from 'pako';
import { encryptAES, decryptAES, encryptMultiple, decryptMultiple } from "../lib/crypto";

export type EncryptionType = 'aes256';

// --- Tag Character & Zero-Width Steganography Logic ---

// Unicode Tag Characters (U+E0020 - U+E007E)
// Tag characters are officially defined by the Unicode Consortium as invisible non-rendering metadata tags.
// They are 100% invisible on all operating systems (iOS, Android, Windows, macOS) and are preserved 100% reliably
// when copied and pasted into social media chat inputs (WhatsApp, Telegram, X/Twitter, Instagram, etc.).
const TAG_START = 0xe0000;
const TAG_SPACE = 0xe0020; // Represents byte 0x20 (' ') or byte value offset
const TAG_END = 0xe007f;

const ZERO_WIDTH_0 = '\u200C'; // Zero Width Non-Joiner
const ZERO_WIDTH_1 = '\u200E'; // Left-To-Right Mark

const ALL_ZERO_WIDTH_CHARS = ['\u200C', '\u200E', '\u200B', '\u200F', '\u200D', '\u2060', '\uFEFF'];
const VARIATION_SELECTOR_START = 0xfe00;
const VARIATION_SELECTOR_END = 0xfe0f;
const VARIATION_SELECTOR_SUPPLEMENT_START = 0xe0100;
const VARIATION_SELECTOR_SUPPLEMENT_END = 0xe01ef;

const isTagChar = (code: number): boolean => {
    return code >= TAG_START && code <= TAG_END;
};

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
    if (code === undefined) return false;
    return isTagChar(code) || isLegacyVariationSelector(code);
};

const isMessageStartChar = (char: string): boolean => {
    if (isZeroWidthChar(char)) return false;
    const code = char.codePointAt(0);
    if (code === undefined) return false;
    if (isTagChar(code) || isStandardVariationSelector(code) || isLegacyVariationSelector(code)) return false;
    return true;
};

/**
 * Converts bytes to 4-bit Unicode Tag Characters (U+E0020 - U+E002F).
 * Each byte (0-255) is converted to 2 tag characters: high nibble and low nibble.
 */
function bytesToTagString(bytes: Uint8Array): string {
    let result = "";
    for (let i = 0; i < bytes.length; i++) {
        const byte = bytes[i];
        const highNibble = (byte >> 4) & 0x0F;
        const lowNibble = byte & 0x0F;
        result += String.fromCodePoint(TAG_SPACE + highNibble) + String.fromCodePoint(TAG_SPACE + lowNibble);
    }
    return result;
}

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

/**
 * Converts bytes to 4-bit Standard Unicode Variation Selectors (U+FE00 - U+FE0F / VS1 - VS16).
 * Standard variation selectors are native Unicode font modifiers that NEVER render question marks or box symbols.
 */
function bytesToVsString(bytes: Uint8Array): string {
    let result = "";
    for (let i = 0; i < bytes.length; i++) {
        const byte = bytes[i];
        const highNibble = (byte >> 4) & 0x0F;
        const lowNibble = byte & 0x0F;
        result += String.fromCodePoint(VARIATION_SELECTOR_START + highNibble) + String.fromCodePoint(VARIATION_SELECTOR_START + lowNibble);
    }
    return result;
}

function encodeToEmoji(emoji: string, text: string): string {
    // Compress unencrypted text with max deflate compression (level 9) for ultra-compact payloads
    const compressed = pako.deflate(text, { level: 9 });
    const vsPayload = bytesToVsString(compressed);
    // Attach standard Variation Selector payload directly AFTER the base emoji
    return emoji + vsPayload;
}

function decodeFromEmoji(text: string): string {
    if (!text) return "";

    const vsNibbles: number[] = [];
    const tagNibbles: number[] = [];
    const legacyTagBytes: number[] = [];
    const zeroWidthChars: string[] = [];
    const legacyVsBytes: number[] = [];

    const iterator = text[Symbol.iterator]();

    for (const char of iterator) {
        const code = char.codePointAt(0);
        if (code === undefined) continue;

        if (code >= VARIATION_SELECTOR_START && code <= VARIATION_SELECTOR_END) {
            // Standard Variation Selector (U+FE00 - U+FE0F) -> 4-bit nibble (0..15)
            vsNibbles.push(code - VARIATION_SELECTOR_START);
        } else if (code >= TAG_SPACE && code <= TAG_SPACE + 15) {
            tagNibbles.push(code - TAG_SPACE);
        } else if (isTagChar(code)) {
            legacyTagBytes.push(code - TAG_START);
        } else if (isZeroWidthChar(char)) {
            zeroWidthChars.push(char);
        } else if (isLegacyVariationSelector(code)) {
            const byte = fromVariationSelector(code);
            if (byte !== null) legacyVsBytes.push(byte);
        }
    }

    // Safeguard for base emoji variation selectors (like \uFE0F in ❤️):
    // If vsNibbles has an odd length and starts with 15 (VS16) or 14 (VS15), shift it off
    if (vsNibbles.length % 2 !== 0 && (vsNibbles[0] === 15 || vsNibbles[0] === 14)) {
        vsNibbles.shift();
    }

    let decodedBytes: Uint8Array | null = null;

    if (vsNibbles.length > 0 && vsNibbles.length % 2 === 0) {
        // Standard Variation Selector 4-bit Nibbles (2 variation selectors = 1 byte)
        const bytes: number[] = [];
        for (let i = 0; i < vsNibbles.length; i += 2) {
            const highNibble = vsNibbles[i];
            const lowNibble = vsNibbles[i + 1];
            bytes.push((highNibble << 4) | lowNibble);
        }
        decodedBytes = new Uint8Array(bytes);
    } else if (tagNibbles.length > 0 && tagNibbles.length % 2 === 0) {
        // 4-bit Tag Character Payload
        const bytes: number[] = [];
        for (let i = 0; i < tagNibbles.length; i += 2) {
            const highNibble = tagNibbles[i];
            const lowNibble = tagNibbles[i + 1];
            bytes.push((highNibble << 4) | lowNibble);
        }
        decodedBytes = new Uint8Array(bytes);
    } else if (legacyTagBytes.length > 0) {
        decodedBytes = new Uint8Array(legacyTagBytes);
    } else if (zeroWidthChars.length > 0) {
        const uniqueChars = new Set(zeroWidthChars);
        const isBase4 = zeroWidthChars.includes('\u200F') || uniqueChars.size > 2 || (zeroWidthChars.length % 8 !== 0);

        if (!isBase4 && zeroWidthChars.length % 8 === 0) {
            const isZwjBinary = zeroWidthChars.includes('\u200D');
            const isLrmBinary = zeroWidthChars.includes('\u200E');
            const bit1Char = isZwjBinary ? '\u200D' : (isLrmBinary ? '\u200E' : '\u200C');
            const bytes: number[] = [];
            for (let i = 0; i < zeroWidthChars.length; i += 8) {
                let byte = 0;
                for (let b = 0; b < 8; b++) {
                    const char = zeroWidthChars[i + b];
                    const bit = char === bit1Char ? 1 : 0;
                    byte = (byte << 1) | bit;
                }
                bytes.push(byte);
            }
            decodedBytes = new Uint8Array(bytes);
        } else if (zeroWidthChars.length % 4 === 0) {
            const BASE4_MAP: Record<string, number> = {
                '\u200B': 0, '\u200C': 1, '\u200E': 2, '\u200F': 3, '\u200D': 2, '\u2060': 3,
            };
            const bytes: number[] = [];
            for (let i = 0; i < zeroWidthChars.length; i += 4) {
                const b0 = BASE4_MAP[zeroWidthChars[i]];
                const b1 = BASE4_MAP[zeroWidthChars[i + 1]];
                const b2 = BASE4_MAP[zeroWidthChars[i + 2]];
                const b3 = BASE4_MAP[zeroWidthChars[i + 3]];
                if (b0 !== undefined && b1 !== undefined && b2 !== undefined && b3 !== undefined) {
                    bytes.push((b0 << 6) | (b1 << 4) | (b2 << 2) | b3);
                }
            }
            decodedBytes = new Uint8Array(bytes);
        }
    } else if (legacyVsBytes.length > 0) {
        decodedBytes = new Uint8Array(legacyVsBytes);
    }

    if (!decodedBytes || decodedBytes.length === 0) return "";

    // Try decompressing pako deflate payload first, fallback to raw UTF-8 string decoding
    try {
        return pako.inflate(decodedBytes, { to: 'string' });
    } catch (e) {
        return new TextDecoder().decode(decodedBytes);
    }
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
            if (!hiddenText) continue;

            if (type !== 'aes256') {
                throw new Error(`Unsupported encryption type: ${type}`);
            }

            if (!passwords || passwords.length === 0) {
                // If the hidden payload is an encrypted JSON string (contains ct, s, iv) but no password was provided, throw a clear password error
                if (hiddenText.startsWith('{"ct":') || hiddenText.startsWith('eyJ')) {
                    throw new Error("هذا النص المرمز محمي بكلمة مرور. يرجى تفعيل كلمة المرور وإدخالها لفك التشفير.");
                }
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
