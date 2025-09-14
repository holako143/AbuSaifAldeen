import { encryptAES, decryptAES, encryptMultiple, decryptMultiple } from "../lib/crypto";

export type EncryptionType = 'aes256';

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
    const lines = text.split('\n');
    const decodedLines = [];

    for (const line of lines) {
        if (!line.trim()) {
            decodedLines.push('');
            continue;
        }

        // We will process each line. If any line fails, the entire process fails.
        // This is simpler than trying to return partial results and is safer.
        const hiddenText = decodeFromEmoji(line);

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
    }

    return decodedLines.join('\n');
}
