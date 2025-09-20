import { expect, test, describe } from 'vitest'
import { encode, decode } from './encoding'
import { EMOJI_LIST } from './emoji'

describe('emoji encoder/decoder (aes256 mode)', () => {
    test('should correctly encode and decode strings in aes256 mode', async () => {
        const testStrings = [
            'Hello, World!',
            'Testing 123',
            'Special chars: !@#$%^&*()',
            'Unicode: 你好，世界',
            '',  // empty string
            ' ' // space only
        ]
        const password = "test-password";

        // Using a slice of the emoji list to prevent timeout in tests
        for (const emoji of EMOJI_LIST.slice(0, 5)) {
            for (const str of testStrings) {
                const encoded = await encode({
                    emoji: emoji,
                    text: str,
                    type: 'aes256',
                    passwords: [password]
                });

                const decoded = await decode({
                    text: encoded,
                    type: 'aes256',
                    passwords: [password]
                });

                expect(decoded).toBe(str)
            }
        }
    })

    test('should correctly encode and decode strings in aes256 mode with salt', async () => {
        const text = "My secret message";
        const salt = "my-password";

        const encoded = await encode({
            emoji: '🤫',
            text: text,
            type: 'aes256',
            passwords: [salt]
        });

        const decoded = await decode({
            text: encoded,
            type: 'aes256',
            passwords: [salt]
        });

        expect(decoded).toBe(text);
    })
})
