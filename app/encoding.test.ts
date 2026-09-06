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

    test('should maintain backward compatibility with legacy variation selector encoded payloads', async () => {
        // Legacy variation selector payload encoding "Hi" without encryption
        const legacyEncoded = "😀" + String.fromCodePoint(0xe0138) + String.fromCodePoint(0xe0159);

        const decoded = await decode({
            text: legacyEncoded,
            type: 'aes256'
        });

        expect(decoded).toBe("Hi");
    })
})
