import { describe, it, expect } from 'vitest';
import { encryptAES, decryptAES, encryptMultiple, decryptMultiple } from '../lib/crypto';

describe('Encryption Schemes', () => {
  const plaintext = 'This is a top secret message for the new hybrid system!';

  it('should correctly handle 1-layer AES encryption', async () => {
    const passwords = ['password123'];
    const encrypted = await encryptMultiple(plaintext, passwords);
    const decrypted = await decryptMultiple(encrypted, passwords);
    expect(decrypted).toBe(plaintext);
  });

  it('should correctly handle 2-layer hybrid (AES + ChaCha20) encryption', async () => {
    const passwords = ['aes-password-1', 'chacha-password-2'];
    const encrypted = await encryptMultiple(plaintext, passwords);
    const decrypted = await decryptMultiple(encrypted, passwords);
    expect(decrypted).toBe(plaintext);
  });

  it('should correctly handle 3-layer (AES + ChaCha20 + AES) encryption', async () => {
    const passwords = ['aes-pass-1', 'chacha-pass-2', 'aes-pass-3'];
    const encrypted = await encryptMultiple(plaintext, passwords);
    const decrypted = await decryptMultiple(encrypted, passwords);
    expect(decrypted).toBe(plaintext);
  });

  it('should correctly handle 4-layer (AES + ChaCha20 + AES + AES) encryption', async () => {
    const passwords = ['p1', 'p2', 'p3', 'p4'];
    const encrypted = await encryptMultiple(plaintext, passwords);
    const decrypted = await decryptMultiple(encrypted, passwords);
    expect(decrypted).toBe(plaintext);
  });

  it('should fail to decrypt 3-layer with wrong 3rd password', async () => {
    const correctPasswords = ['p1', 'p2', 'p3'];
    const wrongPasswords = ['p1', 'p2', 'wrong-p3'];
    const encrypted = await encryptMultiple(plaintext, correctPasswords);
    await expect(decryptMultiple(encrypted, wrongPasswords)).rejects.toThrow();
  });

  it('should fail to decrypt 3-layer with wrong 2nd password', async () => {
    const correctPasswords = ['p1', 'p2', 'p3'];
    const wrongPasswords = ['p1', 'wrong-p2', 'p3'];
    const encrypted = await encryptMultiple(plaintext, correctPasswords);
    await expect(decryptMultiple(encrypted, wrongPasswords)).rejects.toThrow();
  });

  it('should fail to decrypt 3-layer with wrong 1st password', async () => {
    const correctPasswords = ['p1', 'p2', 'p3'];
    const wrongPasswords = ['wrong-p1', 'p2', 'p3'];
    const encrypted = await encryptMultiple(plaintext, correctPasswords);
    await expect(decryptMultiple(encrypted, wrongPasswords)).rejects.toThrow();
  });
});
