// Utility to convert buffer to base64 and back
const bufferToBase64 = (buffer: ArrayBuffer): string => {
  return btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(buffer))));
};

const base64ToBuffer = (base64: string): ArrayBuffer => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
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

    const key = await deriveKey(password, salt as Uint8Array);
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
