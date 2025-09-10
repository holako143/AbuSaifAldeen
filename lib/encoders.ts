// ============== EmojiCipher =================

// Variation selectors block: U+FE00 to U+FE0F (VS1-VS16)
const VARIATION_SELECTOR_START = 0xfe00;
const VARIATION_SELECTOR_END = 0xfe0f;

// Variation selectors supplement block: U+E0100 to U+E01EF (VS17-VS256)
const VARIATION_SELECTOR_SUPPLEMENT_START = 0xe0100;
const VARIATION_SELECTOR_SUPPLEMENT_END = 0xe01ef;

/**
 * Applies a simple XOR cipher to a byte array. This is the correct way to do XOR encryption.
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

function toVariationSelector(byte: number): string | null {
    if (byte >= 0 && byte < 16) {
        return String.fromCodePoint(VARIATION_SELECTOR_START + byte)
    } else if (byte >= 16 && byte < 256) {
        return String.fromCodePoint(VARIATION_SELECTOR_SUPPLEMENT_START + byte - 16)
    } else {
        return null
    }
}

function fromVariationSelector(codePoint: number): number | null {
    if (codePoint >= VARIATION_SELECTOR_START && codePoint <= VARIATION_SELECTOR_END) {
        return codePoint - VARIATION_SELECTOR_START
    } else if (codePoint >= VARIATION_SELECTOR_SUPPLEMENT_START && codePoint <= VARIATION_SELECTOR_SUPPLEMENT_END) {
        return codePoint - VARIATION_SELECTOR_SUPPLEMENT_START + 16
    } else {
        return null
    }
}

// ============== Base64 (Robust implementation) =================
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

// New, correct implementation of emojiCipher
const emojiCipherEncode = (text: string, options: { password?: string, emoji?: string }): string => {
    if (text.length === 0) {
        return options.emoji || '😀';
    }
    // 1. Encode plaintext to an intermediate emoji string
    const plaintextBytes = new TextEncoder().encode(text);
    let emojiString = options.emoji || '😀';
    for (const byte of plaintextBytes) {
        const selector = toVariationSelector(byte);
        if (selector) {
            emojiString += selector;
        }
    }

    // 2. If password is provided, encrypt the emoji string
    if (options.password) {
        // Convert the emoji string to bytes
        const emojiStringBytes = new TextEncoder().encode(emojiString);
        // XOR the bytes with the password
        const encryptedBytes = xorCipherOnBytes(emojiStringBytes, options.password);
        // Return the result as a Base64 string for data integrity
        const binary = Array.from(encryptedBytes).map(byte => String.fromCharCode(byte)).join('');
        return btoa(binary);
    }

    // 3. If no password, return the plain emoji string
    return emojiString;
}

const emojiCipherDecode = (text: string, options: { password?: string }): string => {
    let textToDecode = text;

    // 1. If password is provided, decrypt the input text first
    if (options.password) {
        try {
            // The input must be Base64. Decode it to get the XORed bytes.
            const encryptedBytes = Uint8Array.from(atob(text), c => c.charCodeAt(0));
            // XOR the bytes with the password to get the original emoji string bytes
            const emojiStringBytes = xorCipherOnBytes(encryptedBytes, options.password);
            // Decode the bytes back to the emoji string
            textToDecode = new TextDecoder('utf-8', { fatal: true }).decode(emojiStringBytes);
        } catch (e) {
            throw new Error("Decoding failed. The data may be corrupted or the password incorrect.");
        }
    }

    // 2. Now, decode the (potentially decrypted) emoji string
    const chars = Array.from(textToDecode);
    if (chars.length === 0) return "";

    // The first character should be an emoji, but we can't be sure if the password was wrong.
    // We try to decode anyway.
    const baseEmoji = chars[0];
    const decodedBytes: number[] = [];

    for (const char of chars.slice(1)) {
        const byte = fromVariationSelector(char.codePointAt(0)!);
        if (byte !== null) {
          decodedBytes.push(byte);
        }
    }

    // If we couldn't find any valid variation selectors, and the text was supposed to be protected,
    // it's highly likely the password was wrong.
    if (decodedBytes.length === 0 && options.password && textToDecode.length > 1) {
        throw new Error("Decoding failed. The data may be corrupted or the password incorrect.");
    }

    const decryptedBytes = new Uint8Array(decodedBytes);

    try {
        return new TextDecoder('utf-8', { fatal: true }).decode(decryptedBytes);
    } catch (e) {
        throw new Error("Decoding failed. The data may be corrupted or the password incorrect.");
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
