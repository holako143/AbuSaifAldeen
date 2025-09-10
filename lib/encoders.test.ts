import { describe, it, expect } from 'vitest';
import { encoders } from './encoders';

describe('Encoders', () => {
  describe('EmojiCipher', () => {
    const { encode, decode } = encoders.emojiCipher;

    it('should encode and decode a simple ASCII string without a password', () => {
      const text = 'Hello, World!';
      const encoded = encode(text, { emoji: '😀' });
      const decoded = decode(encoded, {});
      expect(decoded).toBe(text);
    });

    it('should encode and decode a string with Unicode characters', () => {
      const text = '你好，世界';
      const encoded = encode(text, { emoji: '🚀' });
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

    it('should correctly handle non-BMP characters (emojis) in the input text', () => {
      const text = 'Here is an emoji: 😂';
      const password = 'password123';
      const encoded = encode(text, { emoji: '😀', password });
      const decoded = decode(encoded, { password });
      expect(decoded).toBe(text);
    });

    it('should produce a different result when decoding with the wrong password', () => {
      const text = 'secret message';
      const password = 'correct_password';
      const wrongPassword = 'wrong_password';
      const encoded = encode(text, { emoji: '😀', password });
      const decoded = decode(encoded, { password: wrongPassword });
      expect(decoded).not.toBe(text);
    });

    it('should handle an empty string', () => {
        const text = '';
        const encoded = encode(text, { emoji: '😀' });
        const decoded = decode(encoded, {});
        expect(decoded).toBe(text);
    });

    it('should return an empty string for an invalid emoji cipher string', () => {
        const invalidText = 'just a regular string';
        const decoded = decode(invalidText, {});
        expect(decoded).toBe('');
    });
  });

  describe('Base64', () => {
    const { encode, decode } = encoders.base64;

    it('should encode and decode a simple string', () => {
      const text = 'Hello, World!';
      const encoded = encode(text);
      const decoded = decode(encoded);
      expect(decoded).toBe(text);
    });

    it('should correctly encode and decode a string with Unicode characters', () => {
      const text = '你好，世界';
      const encoded = encode(text);
      const decoded = decode(encoded);
      expect(decoded).toBe(text);
    });

    it('should correctly encode and decode a string with emojis', () => {
        const text = 'Hello 😂 World';
        const encoded = encode(text);
        const decoded = decode(encoded);
        expect(decoded).toBe(text);
    });

    it('should handle an empty string', () => {
      const text = '';
      const encoded = encode(text);
      const decoded = decode(encoded);
      expect(decoded).toBe(text);
    });

    it('should throw an error for an invalid base64 string', () => {
        const invalidBase64 = 'this is not base64!!!';
        expect(() => decode(invalidBase64)).toThrow('Invalid Base64 string.');
    });
  });

  describe('URL', () => {
    const { encode, decode } = encoders.url;

    it('should encode and decode a string with special characters', () => {
      const text = 'https://example.com/?q=a b&c=d';
      const encoded = encode(text);
      const decoded = decode(encoded);
      expect(decoded).toBe(text);
    });

    it('should encode and decode a simple string', () => {
      const text = 'hello world';
      const encoded = encode(text);
      const decoded = decode(encoded);
      expect(decoded).toBe(text);
    });

    it('should handle an empty string', () => {
      const text = '';
      const encoded = encode(text);
      const decoded = decode(encoded);
      expect(decoded).toBe(text);
    });

    it('should throw an error for an invalid URL component', () => {
        const invalidUrlComponent = '%E0%A4%A';
        expect(() => decode(invalidUrlComponent)).toThrow('Invalid URL component.');
    });
  });
});
