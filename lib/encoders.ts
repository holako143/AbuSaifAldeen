// ============== EmojiCipher =================

// Variation selectors block https://unicode.org/charts/nameslist/n_FE00.html
// VS1..=VS16
const VARIATION_SELECTOR_START = 0xfe00;
const VARIATION_SELECTOR_END = 0xfe0f;

// Variation selectors supplement https://unicode.org/charts/nameslist/n_E0100.html
// VS17..=VS256
const VARIATION_SELECTOR_SUPPLEMENT_START = 0xe0100;
const VARIATION_SELECTOR_SUPPLEMENT_END = 0xe01ef;

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

const emojiCipherEncode = (text: string, options: { password?: string, emoji?: string }): string => {
    const bytes = new TextEncoder().encode(text);
    const encryptedBytes = xorCipherOnBytes(bytes, options.password || '');
    let encoded = options.emoji || '😀';

    for (const byte of encryptedBytes) {
        encoded += toVariationSelector(byte);
    }

    return encoded;
}

const emojiCipherDecode = (text: string, options: { password?: string }): string => {
    let decodedBytes = [];
    const chars = Array.from(text);

    for (const char of chars) {
        const byte = fromVariationSelector(char.codePointAt(0)!);

        if (byte !== null) {
          decodedBytes.push(byte);
        }
    }

    const encryptedBytes = new Uint8Array(decodedBytes);
    const decryptedBytes = xorCipherOnBytes(encryptedBytes, options.password || '');

    return new TextDecoder().decode(decryptedBytes);
}

// ============== Base64 =================

const base64Encode = (text: string): string => {
  try {
    const utf8Bytes = new TextEncoder().encode(text);
    const binaryString = String.fromCharCode(...utf8Bytes);
    return btoa(binaryString);
  } catch (error) {
    console.error("Base64 encoding failed:", error);
    return "Error: Invalid input for Base64 encoding.";
  }
}

const base64Decode = (text: string): string => {
  try {
    const binaryString = atob(text);
    const bytes = Uint8Array.from(binaryString, c => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch (error) {
    console.error("Base64 decoding failed:", error);
    return "Error: Invalid Base64 string.";
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
    console.error("URL decoding failed:", error);
    return "Error: Invalid URL component.";
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
