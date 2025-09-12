import { encryptAES, decryptAES } from "../lib/crypto";

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
    password?: string;
}

export async function encode({ emoji, text, type, password }: EncodeParams): Promise<string> {
    if (type === 'aes256') {
        if (!password) throw new Error("Password is required for AES-256 encryption.");
        const encryptedText = await encryptAES(text, password);
        return encodeToEmoji(emoji, encryptedText);
    }

    // Simple mode (with optional, insecure salt)
    const textToEncode = password ? `${password}::${text}` : text;
    return encodeToEmoji(emoji, textToEncode);
}


interface DecodeParams {
    text: string;
    type: EncryptionType;
    password?: string;
}

export async function decode({ text, type, password }: DecodeParams): Promise<string> {
    const hiddenText = decodeFromEmoji(text);

    if (type === 'aes256') {
        if (!password) throw new Error("Password is required for AES-256 decryption.");
        return await decryptAES(hiddenText, password);
    }

    // Simple mode: just return the hidden text
    return hiddenText;
}
