import { describe, it, expect } from 'vitest';
import { encryptAES, decryptAES, encryptMultiple, decryptMultiple } from '../lib/crypto';

describe('Standard Encryption (AES)', () => {
  it('should encrypt and decrypt a message successfully', async () => {
    const plaintext = 'This is a standard AES test.';
    const password = 'test-password';
    const encrypted = await encryptAES(plaintext, password);
    const decrypted = await decryptAES(encrypted, password);
    expect(decrypted).toBe(plaintext);
  });

  it('should fail to decrypt with the wrong password', async () => {
    const plaintext = 'This is a standard AES test.';
    const correctPassword = 'test-password';
    const wrongPassword = 'wrong-password';
    const encrypted = await encryptAES(plaintext, correctPassword);
    await expect(decryptAES(encrypted, wrongPassword)).rejects.toThrow();
  });
});

describe('Hybrid Encryption (AES + ChaCha20)', () => {
  it('should encrypt and decrypt a message successfully with two passwords', async () => {
    const plaintext = 'This is a top secret message for the hybrid system.';
    const passwords = ['aes-password-1', 'chacha-password-2'];
    const encrypted = await encryptMultiple(plaintext, passwords);
    const decrypted = await decryptMultiple(encrypted, passwords);
    expect(decrypted).toBe(plaintext);
  });

  it('should fall back to standard AES if only one password is provided', async () => {
    const plaintext = 'This should be standard AES.';
    const passwords = ['only-one-password'];
    const encrypted = await encryptMultiple(plaintext, passwords);
    const decrypted = await decryptMultiple(encrypted, passwords);
    expect(decrypted).toBe(plaintext);
  });

  it('should fail to decrypt if ChaCha20 password is wrong', async () => {
    const plaintext = 'Secret message.';
    const correctPasswords = ['aes-password-1', 'chacha-password-2'];
    const wrongPasswords = ['aes-password-1', 'wrong-chacha-password'];
    const encrypted = await encryptMultiple(plaintext, correctPasswords);
    await expect(decryptMultiple(encrypted, wrongPasswords)).rejects.toThrow();
  });

  it('should fail to decrypt if AES password is wrong', async () => {
    const plaintext = 'Secret message.';
    const correctPasswords = ['aes-password-1', 'chacha-password-2'];
    const wrongPasswords = ['wrong-aes-password', 'chacha-password-2'];
    const encrypted = await encryptMultiple(plaintext, correctPasswords);
    await expect(decryptMultiple(encrypted, wrongPasswords)).rejects.toThrow();
  });

  it('should throw an error if no passwords are provided for decryption', async () => {
    const plaintext = 'This will fail.';
    const correctPasswords = ['aes-password-1', 'chacha-password-2'];
    const encrypted = await encryptMultiple(plaintext, correctPasswords);
    await expect(decryptMultiple(encrypted, [])).rejects.toThrow('Password array cannot be empty.');
  });
});
