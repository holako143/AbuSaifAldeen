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
 * Encrypts a plaintext string using AES-GCM.
 * @param plaintext The text to encrypt.
 * @param password The password to use for key derivation.
 * @returns A base64 string containing the ciphertext, salt, and IV.
 */
export const encryptAES = async (plaintext: string, password: string): Promise<string> => {
  try {
    const salt = crypto.getRandomValues(new Uint8Array(16)); // 16-byte salt
    const iv = crypto.getRandomValues(new Uint8Array(12)); // 12-byte IV for AES-GCM
    const key = await deriveKey(password, salt);
    const enc = new TextEncoder();

    const ciphertext = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      enc.encode(plaintext)
    );

    // Package salt, iv, and ciphertext together
    const packed = JSON.stringify({
      ct: bufferToBase64(ciphertext),
      s: bufferToBase64(salt),
      iv: bufferToBase64(iv),
    });

    return btoa(packed); // Base64 encode the whole package
  } catch (error) {
    console.error("Encryption failed:", error);
    throw new Error("Encryption failed. Please check the console for details.");
  }
};

/**
 * Decrypts a ciphertext string using AES-GCM.
 * @param encryptedPayload The base64 string containing the encrypted data package.
 * @param password The password to use for key derivation.
 * @returns The original plaintext.
 */
export const decryptAES = async (encryptedPayload: string, password: string): Promise<string> => {
  try {
    // Unpack the data
    const packed = atob(encryptedPayload);
    const { ct, s, iv } = JSON.parse(packed);

    const ciphertext = base64ToBuffer(ct);
    const salt = base64ToBuffer(s);
    const ivBuffer = base64ToBuffer(iv);

    const key = await deriveKey(password, salt);
    const dec = new TextDecoder();

    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: ivBuffer,
      },
      key,
      ciphertext
    );

    return dec.decode(decrypted);
  } catch (error) {
    console.error("Decryption failed:", error);
    throw new Error("Decryption failed. The password may be incorrect or the data may be corrupt.");
  }
};

/**
 * Encrypts a plaintext string using a hybrid AES-256-GCM + ChaCha20-Poly1305 scheme.
 * @param plaintext The text to encrypt.
 * @param passwords An array of passwords. Expects two: [aes_password, chacha_password].
 * @returns A base64 string representing the final hybrid encrypted layer.
 */
export const encryptMultiple = async (plaintext: string, passwords: string[]): Promise<string> => {
  if (passwords.length < 2) {
    // If only one password, fall back to standard AES encryption for single-layer mode.
    return encryptAES(plaintext, passwords[0]);
  }
  const aesPassword = passwords[0];
  const chachaPassword = passwords[1];
  const enc = new TextEncoder();

  // 1. Encrypt with AES-GCM
  const aesEncryptedB64 = await encryptAES(plaintext, aesPassword);

  // 2. Encrypt the AES output with ChaCha20-Poly1305
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const nonce = crypto.getRandomValues(new Uint8Array(12));
  const key = await pbkdf2Async(sha256, enc.encode(chachaPassword), salt, { c: 100000, dkLen: 32 });
  const chachaCipher = chacha20poly1305(key, nonce);
  const chachaEncrypted = chachaCipher.encrypt(enc.encode(aesEncryptedB64));

  // 3. Pack the ChaCha20 payload and a marker for hybrid encryption
  const packed = JSON.stringify({
    hybrid: true,
    ct: bufferToBase64(chachaEncrypted),
    s: bufferToBase64(salt),
    n: bufferToBase64(nonce),
  });

  return btoa(packed);
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

    let packed;
    try {
      packed = JSON.parse(atob(ciphertext));
    } catch (e) {
      // If it's not valid JSON, it must be a legacy (single AES) encrypted blob.
      return decryptAES(ciphertext, passwords.slice().reverse()[0]);
    }

    // Check if it's a hybrid payload
    if (packed.hybrid) {
        if (passwords.length < 2) {
            throw new Error("Hybrid decryption requires two passwords.");
        }
        const aesPassword = passwords[0];
        const chachaPassword = passwords[1];
        const enc = new TextEncoder();
        const dec = new TextDecoder();

        // 1. Unpack and decrypt the ChaCha20 layer
        const { ct, s, n } = packed;
        const chachaEncrypted = base64ToBuffer(ct);
        const salt = base64ToBuffer(s);
        const nonce = base64ToBuffer(n);
        const key = await pbkdf2Async(sha256, enc.encode(chachaPassword), salt, { c: 100000, dkLen: 32 });
        const chachaCipher = chacha20poly1305(key, nonce);
        const aesEncryptedB64Bytes = chachaCipher.decrypt(chachaEncrypted);
        const aesEncryptedB64 = dec.decode(aesEncryptedB64Bytes);

        // 2. Decrypt the AES layer
        return decryptAES(aesEncryptedB64, aesPassword);
    } else {
        // Fallback for legacy multi-password AES encryption
        let currentCiphertext = ciphertext;
        for (const password of passwords.slice().reverse()) {
            currentCiphertext = await decryptAES(currentCiphertext, password);
        }
        return currentCiphertext;
    }
};
