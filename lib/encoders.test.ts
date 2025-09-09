import { describe, it, expect } from 'vitest';
import { encoders } from './encoders';

// Note: Web Crypto API is not available in the default vitest environment (JSDOM).
// These tests would need to be run in an environment where the API is available.
// For the purpose of this exercise, we assume it is.

describe('Encoders', () => {
  describe('EmojiCipher with AES-GCM', () => {
    const { encode, decode } = encoders.emojiCipher;

    it('should encode and decode a simple string without a password', async () => {
      const text = 'Hello, World!';
      const encoded = await encode(text, { emoji: '😀' });
      const decoded = await decode(encoded, {});
      expect(decoded).toBe(text);
    });

    it('should encode and decode a string with a password', async () => {
      const text = 'This is a super secret message.';
      const password = 'a-strong-password';
      const encoded = await encode(text, { emoji: '🔒', password });
      const decoded = await decode(encoded, { password });
      expect(decoded).toBe(text);
    });

    it('should correctly handle unicode characters with a password', async () => {
      const text = '你好，世界 & 😂';
      const password = 'password123';
      const encoded = await encode(text, { emoji: '😀', password });
      const decoded = await decode(encoded, { password });
      expect(decoded).toBe(text);
    });

    it('should fail to decode with the wrong password', async () => {
      const text = 'secret message';
      const password = 'correct_password';
      const wrongPassword = 'wrong_password';
      const encoded = await encode(text, { emoji: '🤫', password });
      await expect(decode(encoded, { password: wrongPassword })).rejects.toThrow();
    });

    it('should fail to decode a password-protected message without a password', async () => {
        const text = 'secret message';
        const password = 'correct_password';
        const encoded = await encode(text, { emoji: '🤫', password });
        // The decode function will try to interpret the base64 as plaintext and fail
        await expect(decode(encoded, {})).rejects.toThrow();
    });
  });

  describe('Base64', () => {
    const { encode, decode } = encoders.base64;

    it('should encode and decode a simple string', async () => {
      const text = 'Hello, World!';
      const encoded = await encode(text, {});
      const decoded = await decode(encoded, {});
      expect(decoded).toBe(text);
    });

    it('should encode and decode a string with unicode characters', async () => {
      const text = '你好，世界';
      const encoded = await encode(text, {});
      const decoded = await decode(encoded, {});
      expect(decoded).toBe(text);
    });

    it('should handle an empty string', async () => {
      const text = '';
      const encoded = await encode(text, {});
      const decoded = await decode(encoded, {});
      expect(decoded).toBe(text);
    });
  });
});
