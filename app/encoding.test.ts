import { expect, test, describe } from 'vitest'
import { encode, decode } from './encoding'
import { EMOJI_LIST } from './emoji'

describe('emoji encoder/decoder', () => {
    test('should correctly encode and decode strings without encryption', async () => {
        const testStrings = [
            'Hello, World!',
            'Testing 123',
            'Special chars: !@#$%^&*()',
            'Unicode: 你好，世界',
            '',  // empty string
            ' ' // space only
        ]

        for (const emoji of EMOJI_LIST) {
            for (const str of testStrings) {
                const encoded = await encode({
                    emoji: emoji,
                    text: str,
                    type: 'aes256' // No password, should just encode
                });

                const decoded = await decode({
                    text: encoded,
                    type: 'aes256' // No password, should just decode
                });

                expect(decoded).toBe(str)
            }
        }
    })

    test('should correctly encode and decode strings with AES encryption', async () => {
        const text = "My very secret message!";
        const password = "strong-password-123";

        const encoded = await encode({
            emoji: '🤫',
            text: text,
            type: 'aes256',
            passwords: [password]
        });

        const decoded = await decode({
            text: encoded,
            type: 'aes256',
            passwords: [password]
        });

        // The final decoded text should be the original secret message
        expect(decoded).toBe(text);
    })

    test('encoded emoji string should not contain visible non-emoji or variation selector supplement characters', async () => {
        const text = "Test zero-width clean display";
        const emoji = "🚀";

        const encoded = await encode({
            emoji: emoji,
            text: text,
            type: 'aes256'
        });

        // Ensure no characters in the supplementary variation selector range (0xE0100 - 0xE01EF) are present
        for (const char of encoded) {
            const code = char.codePointAt(0)!;
            expect(code >= 0xe0100 && code <= 0xe01ef).toBe(false);
        }

        const decoded = await decode({
            text: encoded,
            type: 'aes256'
        });
        expect(decoded).toBe(text);
    })

    test('should decode correctly even if user trims spaces or pastes with surrounding whitespace', async () => {
        const text = "Message with surrounding spaces test";
        const encoded = await encode({
            emoji: "🔑",
            text: text,
            type: 'aes256'
        });

        // Add surrounding whitespace and trim it, mimicking copying/pasting in chat apps
        const paddedText = `   \n\t ${encoded} \n  `;
        const decoded = await decode({
            text: paddedText.trim(),
            type: 'aes256'
        });

        expect(decoded).toBe(text);
    })

    test('should correctly encode and decode when base emoji contains variation selector 16 (e.g. ❤️ or ⚠️)', async () => {
        const text = "Secret message behind heart emoji";
        const emojiWithVS16 = "❤️"; // Contains \u2764 and \uFE0F

        const encoded = await encode({
            emoji: emojiWithVS16,
            text: text,
            type: 'aes256'
        });

        const decoded = await decode({
            text: encoded,
            type: 'aes256'
        });

        expect(decoded).toBe(text);
    })

    test('should encode and decode extremely long multi-line texts (3000+ lines / millions of chars) with 100% data integrity', async () => {
        const lines = [];
        for (let i = 1; i <= 3000; i++) {
            lines.push(`Line ${i}: وهذا نص تجريبي ضخم جداً يحتوي على آلاف الكلمات والجمل لضمان دقة وسلامة البيانات 100% دون أي فقدان أو مشاكل في المتصفح أو التطبيقات.`);
        }
        const longText = lines.join('\n');

        const encoded = await encode({
            emoji: '🔑',
            text: longText,
            type: 'aes256',
            passwords: ['secretPass123']
        });

        const decoded = await decode({
            text: encoded,
            type: 'aes256',
            passwords: ['secretPass123']
        });

        expect(decoded).toBe(longText);
    })

    test('should maintain backward compatibility with legacy variation selector encoded payloads', async () => {
        // Legacy variation selector payload encoding "Hi" without encryption
        const legacyEncoded = "😀" + String.fromCodePoint(0xe0138) + String.fromCodePoint(0xe0159);

        const decoded = await decode({
            text: legacyEncoded,
            type: 'aes256'
        });

        expect(decoded).toBe("Hi");
    })

    test('should encode and decode with Option 1 (bracket framing)', async () => {
        const secret = "Top secret message inside brackets";
        const encoded = await encode({
            emoji: "🔑",
            text: secret,
            type: 'aes256',
            useBrackets: true
        });

        expect(encoded.startsWith("⟦")).toBe(true);
        expect(encoded.endsWith("⟧")).toBe(true);

        const decoded = await decode({
            text: encoded,
            type: 'aes256'
        });

        expect(decoded).toBe(secret);
    })

    test('should encode and decode with Option 2 (cover text steganography)', async () => {
        const secret = "Covert operation payload";
        const coverText = "مساء الخير أتمنى لك يوماً سعيداً وموفقاً";

        const encoded = await encode({
            emoji: "🔑",
            text: secret,
            type: 'aes256',
            coverText: coverText
        });

        expect(encoded).toContain("مساء الخير");

        const decoded = await decode({
            text: encoded,
            type: 'aes256'
        });

        expect(decoded).toBe(secret);
    })
})
