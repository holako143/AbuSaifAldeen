"use client"

import pako from 'pako';

// ============== Crypto Helpers (AES-GCM with Compression) =================

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

// Compresses and then encrypts data using AES-GCM
async function encrypt(text: string, password: string): Promise<string> {
  const enc = new TextEncoder();
  const compressedData = pako.deflate(enc.encode(text));

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await getDerivedKey(password, salt);
  const encryptedContent = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    key,
    compressedData
  );

  const encryptedBytes = new Uint8Array(encryptedContent);
  const resultBuffer = new Uint8Array(salt.length + iv.length + encryptedBytes.length);
  resultBuffer.set(salt, 0);
  resultBuffer.set(iv, salt.length);
  resultBuffer.set(encryptedBytes, salt.length + iv.length);

  return btoa(String.fromCharCode.apply(null, Array.from(resultBuffer)));
}

// Decrypts and then decompresses data
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

  const decompressedData = pako.inflate(new Uint8Array(decryptedContent));
  const dec = new TextDecoder();
  return dec.decode(decompressedData);
}


// ============== EmojiCipher =================

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

const emojiCipherEncode = async (text: string, options: { password?: string, emoji?: string }): Promise<string> => {
    let contentToEncode = text;
    // If password is provided, encrypt the text. Otherwise, just use the plain text.
    if (options.password && options.password.length > 0) {
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
    chars.shift(); // Remove the leading emoji

    for (const char of chars) {
        const byte = fromVariationSelector(char.codePointAt(0)!);
        if (byte !== null) decodedBytes.push(byte);
    }

    const decodedText = new TextDecoder().decode(new Uint8Array(decodedBytes));

    // If a password is provided, assume the content is encrypted and try to decrypt.
    if (options.password && options.password.length > 0) {
      return await decrypt(decodedText, options.password);
    }

    return decodedText;
}

// ============== Base64 with Compression =================

const base64Encode = (text: string): Promise<string> => {
  return new Promise((resolve) => {
    const compressed = pako.deflate(text);
    const binaryString = String.fromCharCode(...Array.from(compressed));
    resolve(btoa(binaryString));
  });
}

const base64Decode = (text: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const binaryString = atob(text);
      const charData = binaryString.split('').map((x) => x.charCodeAt(0));
      const binData = new Uint8Array(charData);
      const decompressed = pako.inflate(binData, { to: 'string' });
      resolve(decompressed);
    } catch (error) {
      reject(error);
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
