import { encryptAES, decryptAES, encryptMultiple, decryptMultiple } from "../lib/crypto";

export type EncryptionType = 'simple' | 'aes256';

// --- Variation Selector (Emoji Hiding) Logic ---

const VARIATION_SELECTOR_START = 0xfe00;
const VARIATION_SELECTOR_END = 0xfe0f;
const VARIATION_SELECTOR_SUPPLEMENT_START = 0xe0100;
const VARIATION_SELECTOR_SUPPLEMENT_END = 0xe01ef;

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
    if (type === 'aes256') {
        if (!passwords || passwords.length === 0) throw new Error("Password is required for AES-256 encryption.");
        // Use multiple encryption if more than one password is provided, otherwise use single encryption
        const encryptedText = passwords.length > 1
            ? await encryptMultiple(text, passwords)
            : await encryptAES(text, passwords[0]);
        return encodeToEmoji(emoji, encryptedText);
    }

    // Simple mode (with optional, insecure salt) - only uses the first password if provided
    const textToEncode = passwords && passwords.length > 0 ? `${passwords[0]}::${text}` : text;
    return encodeToEmoji(emoji, textToEncode);
}


interface DecodeParams {
    text: string;
    type: EncryptionType;
    passwords?: string[];
}

export async function decode({ text, type, passwords }: DecodeParams): Promise<string> {
    const hiddenText = decodeFromEmoji(text);

    if (type === 'aes256') {
        if (!passwords || passwords.length === 0) throw new Error("Password is required for AES-256 decryption.");
        // Use multiple decryption if more than one password is provided
        return passwords.length > 1
            ? await decryptMultiple(hiddenText, passwords)
            : await decryptAES(hiddenText, passwords[0]);
    }

    // Simple mode: just return the hidden text
    return hiddenText;
}
