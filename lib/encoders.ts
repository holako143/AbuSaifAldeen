"use client"

// ============== Crypto Helpers (AES-GCM) =================

// Derives a key from a password using PBKDF2
async function getDerivedKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

// Encrypts data using AES-GCM
async function encrypt(text: string, password: string): Promise<string> {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await getDerivedKey(password, salt);
  const encryptedContent = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    key,
    enc.encode(text)
  );

  const encryptedBytes = new Uint8Array(encryptedContent);
  // Combine salt, iv, and ciphertext into one buffer
  const resultBuffer = new Uint8Array(salt.length + iv.length + encryptedBytes.length);
  resultBuffer.set(salt, 0);
  resultBuffer.set(iv, salt.length);
  resultBuffer.set(encryptedBytes, salt.length + iv.length);

  // Return as a base64 string
  return btoa(String.fromCharCode.apply(null, Array.from(resultBuffer)));
}

// Decrypts data using AES-GCM
async function decrypt(encryptedData: string, password: string): Promise<string> {
  const decodedData = atob(encryptedData);
  const encryptedBytes = new Uint8Array(decodedData.length).map((_, i) => decodedData.charCodeAt(i));

  const salt = encryptedBytes.slice(0, 16);
  const iv = encryptedBytes.slice(16, 28);
  const data = encryptedBytes.slice(28);

  const key = await getDerivedKey(password, salt);
  const decryptedContent = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv },
    key,
    data
  );

  const dec = new TextDecoder();
  return dec.decode(decryptedContent);
}


// ============== EmojiCipher =================

// Variation selectors block https://unicode.org/charts/nameslist/n_FE00.html
// VS1..=VS16
const VARIATION_SELECTOR_START = 0xfe00;
const VARIATION_SELECTOR_END = 0xfe0f;

// Variation selectors supplement https://unicode.org/charts/nameslist/n_E0100.html
// VS17..=VS256
const VARIATION_SELECTOR_SUPPLEMENT_START = 0xe0100;
const VARIATION_SELECTOR_SUPPLEMENT_END = 0xe01ef;

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

const emojiCipherEncode = async (text: string, options: { password?: string, emoji?: string }): Promise<string> => {
    let contentToEncode = text;
    if (options.password) {
      contentToEncode = await encrypt(text, options.password);
    }

    const bytes = new TextEncoder().encode(contentToEncode);
    let encoded = options.emoji || '😀';

    for (const byte of bytes) {
        encoded += toVariationSelector(byte);
    }

    return encoded;
}

const emojiCipherDecode = async (text: string, options: { password?: string }): Promise<string> => {
    let decodedBytes = [];
    const chars = Array.from(text);

    // Remove the leading emoji
    const emoji = chars.shift();
    if (!emoji) throw new Error("Invalid input: missing emoji.");

    for (const char of chars) {
        const byte = fromVariationSelector(char.codePointAt(0)!);

        if (byte !== null) {
          decodedBytes.push(byte);
        }
    }

    const decodedText = new TextDecoder().decode(new Uint8Array(decodedBytes));

    if (options.password) {
      return await decrypt(decodedText, options.password);
    }

    return decodedText;
}

// ============== Base64 =================

const base64Encode = (text: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const utf8Bytes = new TextEncoder().encode(text);
      const binaryString = String.fromCharCode(...Array.from(utf8Bytes));
      resolve(btoa(binaryString));
    } catch (error) {
      console.error("Base64 encoding failed:", error);
      reject(new Error("Invalid input for Base64 encoding."));
    }
  });
}

const base64Decode = (text: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const binaryString = atob(text);
      const bytes = Uint8Array.from(binaryString, c => c.charCodeAt(0));
      resolve(new TextDecoder().decode(bytes));
    } catch (error) {
      console.error("Base64 decoding failed:", error);
      reject(new Error("Invalid Base64 string."));
    }
  });
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
};

export type Algorithm = keyof typeof encoders;
