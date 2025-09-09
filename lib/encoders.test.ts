import { describe, it, expect } from 'vitest';
import { encoders } from './encoders';

describe('Encoders', () => {
  describe('EmojiCipher', () => {
    const { encode, decode } = encoders.emojiCipher;

    it('should encode and decode a simple string without a password', () => {
      const text = 'Hello, World!';
      const encoded = encode(text, { emoji: '😀' });
      const decoded = decode(encoded, {});
      expect(decoded).toBe(text);
    });

    it('should encode and decode a string with unicode characters', () => {
      const text = '你好，世界';
      const encoded = encode(text, { emoji: '😀' });
      const decoded = decode(encoded, {});
      expect(decoded).toBe(text);
    });

    it('should encode and decode a string with a password', () => {
      const text = 'This is a secret.';
      const password = 'supersecret';
      const encoded = encode(text, { emoji: '😀', password });
      const decoded = decode(encoded, { password });
      expect(decoded).toBe(text);
    });

    it('should correctly handle non-BMP characters (emojis) with a password', () => {
      const text = 'Here is an emoji: 😂';
      const password = 'password123';
      const encoded = encode(text, { emoji: '😀', password });
      const decoded = decode(encoded, { password });
      expect(decoded).toBe(text);
    });

    it('should fail to decode with the wrong password', () => {
      const text = 'secret message';
      const password = 'correct_password';
      const wrongPassword = 'wrong_password';
      const encoded = encode(text, { emoji: '😀', password });
      const decoded = decode(encoded, { password: wrongPassword });
      expect(decoded).not.toBe(text);
    });
  });

  describe('Base64', () => {
    const { encode, decode } = encoders.base64;

    it('should encode and decode a simple string', () => {
      const text = 'Hello, World!';
      const encoded = encode(text, {});
      const decoded = decode(encoded, {});
      expect(decoded).toBe(text);
    });

    it('should encode and decode a string with unicode characters', () => {
      const text = '你好，世界';
      const encoded = encode(text, {});
      const decoded = decode(encoded, {});
      expect(decoded).toBe(text);
    });

    it('should handle an empty string', () => {
      const text = '';
      const encoded = encode(text, {});
      const decoded = decode(encoded, {});
      expect(decoded).toBe(text);
    });
  });

});
