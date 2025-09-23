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
                    type: 'aes' // No password, should just encode
                });

                const decoded = await decode({
                    text: encoded,
                    type: 'aes' // No password, should just decode
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
            type: 'aes',
            passwords: [password],
            algorithm: 'AES-GCM', // Test with default
            keySize: 256
        });

        const decoded = await decode({
            text: encoded,
            type: 'aes',
            passwords: [password]
        });

        // The final decoded text should be the original secret message
        expect(decoded).toBe(text);
    })
})
