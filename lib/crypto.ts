import pako from 'pako';
import { chacha20poly1305 } from '@noble/ciphers/chacha.js';
import { pbkdf2Async } from '@noble/hashes/pbkdf2.js';
import { sha256 } from '@noble/hashes/sha2.js';

// --- Utility Functions ---
export const bufferToBase64 = (buffer: ArrayBuffer | Uint8Array): string => {
  const uint8Array = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < uint8Array.length; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  return btoa(binary);
};

export const base64ToBuffer = (base64: string): Uint8Array => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

const deriveKey = async (password: string, salt: Uint8Array): Promise<CryptoKey> => {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
};

// --- Text Encryption ---
export const encryptAES = async (plaintext: string, password: string): Promise<string> => {
    const compressed = pako.deflate(plaintext);
    return encryptBinary(compressed, password);
};

export const decryptAES = async (encryptedPayload: string, password: string): Promise<string> => {
    const decrypted = await decryptBinary(encryptedPayload, password);
    return pako.inflate(decrypted, { to: 'string' });
};

// --- Binary Data Encryption ---
export const encryptBinary = async (data: Uint8Array, password: string): Promise<string> => {
    try {
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const key = await deriveKey(password, salt);
        const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);
        const packed = JSON.stringify({
            ct: bufferToBase64(ciphertext),
            s: bufferToBase64(salt),
            iv: bufferToBase64(iv),
        });
        return btoa(packed);
    } catch (error) {
        console.error("Binary encryption failed:", error);
        throw new Error("Binary encryption failed.");
    }
};

export const decryptBinary = async (encryptedPayload: string, password: string): Promise<Uint8Array> => {
    try {
        const packed = atob(encryptedPayload);
        const { ct, s, iv } = JSON.parse(packed);
        const ciphertext = base64ToBuffer(ct);
        const salt = base64ToBuffer(s);
        const ivBuffer = base64ToBuffer(iv);
        const key = await deriveKey(password, salt);
        const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: ivBuffer }, key, ciphertext);
        return new Uint8Array(decrypted);
    } catch (error) {
        console.error("Binary decryption failed:", error);
        throw new Error("Decryption failed. The password may be incorrect or the data may be corrupt.");
    }
};


// --- Multi-layer Encryption ---
export const encryptMultiple = async (data: string | Uint8Array, passwords: string[]): Promise<string> => {
  if (passwords.length === 0) {
      return typeof data === 'string' ? data : bufferToBase64(data);
  }

  const isBinary = data instanceof Uint8Array;

  if (passwords.length === 1) {
    return isBinary ? encryptBinary(data, passwords[0]) : encryptAES(data, passwords[0]);
  }

  const firstLayerEncrypted = isBinary
    ? await encryptBinary(data, passwords[0])
    : await encryptAES(data, passwords[0]);

  // For subsequent layers, the data is always a string (base64 encoded ciphertext)
  let currentData = firstLayerEncrypted;
  for (let i = 1; i < passwords.length; i++) {
      currentData = await encryptAES(currentData, passwords[i]);
  }

  return currentData;
};

export const decryptMultiple = async (ciphertext: string, passwords: string[], outputType: 'string' | 'binary' = 'string'): Promise<string | Uint8Array> => {
    if (passwords.length === 0) {
        return outputType === 'string' ? ciphertext : base64ToBuffer(ciphertext);
    }

    let currentData = ciphertext;
    for (let i = passwords.length - 1; i > 0; i--) {
        currentData = await decryptAES(currentData, passwords[i]);
    }

    if (outputType === 'string') {
        return await decryptAES(currentData, passwords[0]);
    } else {
        return await decryptBinary(currentData, passwords[0]);
    }
};