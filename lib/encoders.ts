// ============== EmojiCipher =================
// This is a custom cipher that encodes data into a base emoji plus a series of
// Unicode variation selectors. This allows embedding data within a string that
// still looks like a single emoji.

// The Unicode variation selectors are non-rendering characters that modify the
// appearance of the preceding character. We are using them here to store data.

// Variation selectors block: U+FE00 to U+FE0F (VS1-VS16)
const VARIATION_SELECTOR_START = 0xfe00;
const VARIATION_SELECTOR_END = 0xfe0f;

// Variation selectors supplement block: U+E0100 to U+E01EF (VS17-VS256)
const VARIATION_SELECTOR_SUPPLEMENT_START = 0xe0100;
const VARIATION_SELECTOR_SUPPLEMENT_END = 0xe01ef;

/**
 * Applies a simple XOR cipher to a byte array.
 * @param data The data to encrypt/decrypt.
 * @param key The key to use for the XOR operation.
 * @returns The result of the XOR operation.
 */
function xorCipherOnBytes(data: Uint8Array, key: string): Uint8Array {
  if (!key) return data;
  const keyBytes = new TextEncoder().encode(key);
  if (keyBytes.length === 0) return data;
  const result = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    result[i] = data[i] ^ keyBytes[i % keyBytes.length];
  }
  return result;
}

/**
 * Converts a byte (0-255) into a corresponding Unicode variation selector character.
 * @param byte The byte to convert.
 * @returns A string containing the variation selector, or null if the byte is out of range.
 */
function toVariationSelector(byte: number): string | null {
    if (byte >= 0 && byte < 16) {
        // VS1-VS16
        return String.fromCodePoint(VARIATION_SELECTOR_START + byte)
    } else if (byte >= 16 && byte < 256) {
        // VS17-VS256
        return String.fromCodePoint(VARIATION_SELECTOR_SUPPLEMENT_START + byte - 16)
    } else {
        return null
    }
}

/**
 * Converts a Unicode variation selector code point back into a byte.
 * @param codePoint The code point of the character to convert.
 * @returns The byte value (0-255), or null if the code point is not a variation selector.
 */
function fromVariationSelector(codePoint: number): number | null {
    if (codePoint >= VARIATION_SELECTOR_START && codePoint <= VARIATION_SELECTOR_END) {
        return codePoint - VARIATION_SELECTOR_START
    } else if (codePoint >= VARIATION_SELECTOR_SUPPLEMENT_START && codePoint <= VARIATION_SELECTOR_SUPPLEMENT_END) {
        return codePoint - VARIATION_SELECTOR_SUPPLEMENT_START + 16
    } else {
        return null
    }
}

const emojiCipherEncode = (text: string, options: { password?: string, emoji?: string }): string => {
    if (text.length === 0) {
        return options.emoji || '😀';
    }
    const bytes = new TextEncoder().encode(text);
    const encryptedBytes = xorCipherOnBytes(bytes, options.password || '');
    let encoded = options.emoji || '😀';

    for (const byte of encryptedBytes) {
        const selector = toVariationSelector(byte);
        if (selector) {
            encoded += selector;
        }
    }
    return encoded;
}

const emojiCipherDecode = (text: string, options: { password?: string }): string => {
    const chars = Array.from(text);
    if (chars.length <= 1) {
        return "";
    }

    const decodedBytes: number[] = [];
    // The first character is the base emoji, so we skip it.
    for (const char of chars.slice(1)) {
        const byte = fromVariationSelector(char.codePointAt(0)!);
        if (byte !== null) {
          decodedBytes.push(byte);
        }
    }

    const encryptedBytes = new Uint8Array(decodedBytes);
    const decryptedBytes = xorCipherOnBytes(encryptedBytes, options.password || '');

    try {
        // Use fatal: true to throw an error on invalid UTF-8 sequences.
        // This helps detect if the password was wrong, but it's not a guarantee.
        return new TextDecoder('utf-8', { fatal: true }).decode(decryptedBytes);
    } catch (e) {
        throw new Error("Decoding failed. The data may be corrupted or the password incorrect.");
    }
}

// ============== Base64 =================

const base64Encode = (text: string): string => {
  try {
    const bytes = new TextEncoder().encode(text);
    const binary = Array.from(bytes).map(byte => String.fromCharCode(byte)).join('');
    return btoa(binary);
  } catch (error) {
    throw new Error("Failed to encode to Base64.");
  }
}

const base64Decode = (text: string): string => {
  try {
    const binary = atob(text);
    const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch (error) {
    throw new Error("Invalid Base64 string.");
  }
}

// ============== URL =================

const urlEncode = (text: string): string => {
  return encodeURIComponent(text);
}

const urlDecode = (text: string): string => {
  try {
    return decodeURIComponent(text);
  } catch (error) {
    throw new Error("Invalid URL component.");
  }
}

// ============== Encoders Object =================

export const encoders = {
  emojiCipher: {
    name: "EmojiCipher",
    encode: emojiCipherEncode,
    decode: emojiCipherDecode,
    requiresEmoji: true,
    requiresPassword: true,
  },
  base64: {
    name: "Base64",
    encode: base64Encode,
    decode: base64Decode,
    requiresEmoji: false,
    requiresPassword: false,
  },
  url: {
    name: "URL",
    encode: urlEncode,
    decode: urlDecode,
    requiresEmoji: false,
    requiresPassword: false,
  },
};

export type Algorithm = keyof typeof encoders;
