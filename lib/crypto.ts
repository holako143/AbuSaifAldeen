import pako from 'pako';
import { chacha20poly1305 } from '@noble/ciphers/chacha.js';
import { pbkdf2Async } from '@noble/hashes/pbkdf2.js';
import { sha256 } from '@noble/hashes/sha2.js';

// Utility to convert buffer to base64 and back
const bufferToBase64 = (buffer: ArrayBuffer | Uint8Array): string => {
  const uint8Array = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return btoa(String.fromCharCode.apply(null, Array.from(uint8Array)));
};

const base64ToBuffer = (base64: string): Uint8Array => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

/**
 * Derives a cryptographic key from a password and salt using PBKDF2.
 * @param password The user's password.
 * @param salt A random salt.
 * @returns A CryptoKey object.
 */
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
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000, // A standard number of iterations
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
};

/**
 * Compresses and encrypts a plaintext string using AES-GCM.
 * @param plaintext The text to encrypt.
 * @param password The password to use for key derivation.
 * @returns A base64 string containing the ciphertext, salt, and IV.
 */
export const encryptAES = async (plaintext: string, password: string): Promise<string> => {
  try {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(password, salt);

    // Compress the plaintext before encryption
    const compressed = pako.deflate(plaintext);

    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      compressed
    );

    // Package salt, iv, and ciphertext together
    const packed = JSON.stringify({
      ct: bufferToBase64(ciphertext),
      s: bufferToBase64(salt),
      iv: bufferToBase64(iv),
    });

    return btoa(packed);
  } catch (error) {
    console.error("Encryption failed:", error);
    throw new Error("Encryption failed. Please check the console for details.");
  }
};

/**
 * Decrypts and decompresses a ciphertext string using AES-GCM.
 * @param encryptedPayload The base64 string containing the encrypted data package.
 * @param password The password to use for key derivation.
 * @returns The original plaintext.
 */
export const decryptAES = async (encryptedPayload: string, password: string): Promise<string> => {
  try {
    const packed = atob(encryptedPayload);
    const { ct, s, iv } = JSON.parse(packed);

    const ciphertext = base64ToBuffer(ct);
    const salt = base64ToBuffer(s);
    const ivBuffer = base64ToBuffer(iv);

    const key = await deriveKey(password, salt);

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: ivBuffer },
      key,
      ciphertext
    );

    // Decompress the result after decryption
    const decompressed = pako.inflate(new Uint8Array(decrypted), { to: 'string' });
    return decompressed;
  } catch (error) {
    console.error("Decryption failed:", error);
    throw new Error("Decryption failed. The password may be incorrect or the data may be corrupt.");
  }
};

/**
 * Encrypts a plaintext string using a flexible multi-layer scheme.
 * - 1 password: Standard AES-256
 * - 2 passwords: Hybrid AES-256 + ChaCha20
 * - 3+ passwords: Hybrid + additional AES-256 layers
 * @param plaintext The text to encrypt.
 * @param passwords An array of passwords.
 * @returns A base64 string representing the final encrypted layer.
 */
export const encryptMultiple = async (plaintext: string, passwords: string[]): Promise<string> => {
  if (passwords.length === 0) {
    throw new Error("Password array cannot be empty.");
  }

  if (passwords.length === 1) {
    return encryptAES(plaintext, passwords[0]);
  }

  // 2 passwords: Perform hybrid encryption
  const aesPassword = passwords[0];
  const chachaPassword = passwords[1];
  const enc = new TextEncoder();

  const aesEncryptedB64 = await encryptAES(plaintext, aesPassword);

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const nonce = crypto.getRandomValues(new Uint8Array(12));
  const key = await pbkdf2Async(sha256, enc.encode(chachaPassword), salt, { c: 100000, dkLen: 32 });
  const chachaCipher = chacha20poly1305(key, nonce);
  const chachaEncrypted = chachaCipher.encrypt(enc.encode(aesEncryptedB64));

  let finalPayload = JSON.stringify({
    hybrid: true,
    ct: bufferToBase64(chachaEncrypted),
    s: bufferToBase64(salt),
    n: bufferToBase64(nonce),
  });

  // 3+ passwords: Add additional AES layers
  if (passwords.length > 2) {
    const additionalPasswords = passwords.slice(2);
    for (const password of additionalPasswords) {
      finalPayload = await encryptAES(finalPayload, password);
    }
  }

  return btoa(finalPayload);
};

/**
 * Decrypts a ciphertext string that was encrypted with multiple layers.
 * @param ciphertext The final ciphertext.
 * @param passwords An array of passwords for decryption.
 * @returns The original plaintext.
 */
export const decryptMultiple = async (ciphertext: string, passwords: string[]): Promise<string> => {
    if (passwords.length === 0) {
        throw new Error("Password array cannot be empty.");
    }

    if (passwords.length === 1) {
        return decryptAES(ciphertext, passwords[0]);
    }

    let currentCiphertext = atob(ciphertext);

    // 3+ passwords: Decrypt outer AES layers first
    if (passwords.length > 2) {
        const additionalPasswords = passwords.slice(2).reverse();
        for (const password of additionalPasswords) {
            currentCiphertext = await decryptAES(currentCiphertext, password);
        }
    }

    // Now, we should have the hybrid payload
    let packed;
    try {
      packed = JSON.parse(currentCiphertext);
    } catch (e) {
      // This could happen if a 2-layer non-hybrid password is used on a hybrid payload.
      // Or if it's a legacy payload. Let's try legacy decryption.
      const firstDecryption = await decryptAES(atob(ciphertext), passwords[1]);
      return await decryptAES(firstDecryption, passwords[0]);
    }

    // Check if it's a hybrid payload
    if (packed.hybrid) {
        const aesPassword = passwords[0];
        const chachaPassword = passwords[1];
        const dec = new TextDecoder();

        const { ct, s, n } = packed;
        const chachaEncrypted = base64ToBuffer(ct);
        const salt = base64ToBuffer(s);
        const nonce = base64ToBuffer(n);
        const key = await pbkdf2Async(sha256, new TextEncoder().encode(chachaPassword), salt, { c: 100000, dkLen: 32 });
        const chachaCipher = chacha20poly1305(key, nonce);
        const aesEncryptedB64Bytes = chachaCipher.decrypt(chachaEncrypted);
        const aesEncryptedB64 = dec.decode(aesEncryptedB64Bytes);

        return decryptAES(aesEncryptedB64, aesPassword);
    } else {
        // Fallback for legacy 2-password AES encryption (or other non-hybrid JSON)
        const firstDecryption = await decryptAES(atob(ciphertext), passwords[1]);
        return await decryptAES(firstDecryption, passwords[0]);
    }
};
