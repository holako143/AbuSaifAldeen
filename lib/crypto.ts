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

// --- Core Encryption Functions ---

/**
 * Encrypts a Uint8Array using AES-GCM.
 * @param data The binary data to encrypt.
 * @param password The password to use for key derivation.
 * @returns A base64 string representing the encrypted data package.
 */
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

/**
 * Decrypts a base64 string into a Uint8Array.
 * @param encryptedPayload The base64 string containing the encrypted data package.
 * @param password The password to use for key derivation.
 * @returns The original Uint8Array data.
 */
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

// --- Wrappers for Text ---
export const encryptAES = async (plaintext: string, password: string): Promise<string> => {
    const data = new TextEncoder().encode(plaintext);
    return encryptBinary(data, password);
};

export const decryptAES = async (encryptedPayload: string, password: string): Promise<string> => {
    const decrypted = await decryptBinary(encryptedPayload, password);
    return new TextDecoder().decode(decrypted);
};


// --- Multi-layer Encryption ---
export const encryptMultiple = async (data: string | Uint8Array, passwords: string[]): Promise<string> => {
    if (!passwords || passwords.length === 0) {
        throw new Error("Password array cannot be empty for encryption.");
    }

    let currentData = data;
    for (const password of passwords) {
        if (typeof currentData === 'string') {
            currentData = await encryptAES(currentData, password);
        } else {
            currentData = await encryptBinary(currentData, password);
        }
    }
    return currentData as string;
};

export const decryptMultiple = async (ciphertext: string, passwords: string[], outputType: 'string' | 'binary'): Promise<string | Uint8Array> => {
    if (!passwords || passwords.length === 0) {
        throw new Error("Password array cannot be empty for decryption.");
    }

    let currentData = ciphertext;
    const reversedPasswords = passwords.slice().reverse();

    for (let i = 0; i < reversedPasswords.length; i++) {
        const password = reversedPasswords[i];
        const isLastLayer = i === reversedPasswords.length - 1;

        if (isLastLayer && outputType === 'binary') {
            return await decryptBinary(currentData, password);
        } else {
            currentData = await decryptAES(currentData, password);
        }
    }

    return currentData;
};