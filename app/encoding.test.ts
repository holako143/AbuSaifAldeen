import { expect, test, describe } from 'vitest'
import { encode, decode } from './encoding'
import { EMOJI_LIST } from './emoji'

describe('emoji encoder/decoder (simple mode)', () => {
    test('should correctly encode and decode strings in simple mode', async () => {
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
                    type: 'simple'
                });

                const decoded = await decode({
                    text: encoded,
                    type: 'simple'
                });

                expect(decoded).toBe(str)
            }
        }
    })

    test('should correctly encode and decode strings in simple mode with salt', async () => {
        const text = "My secret message";
        const salt = "my-password";
        const expectedDecoded = `${salt}::${text}`;

        const encoded = await encode({
            emoji: '🤫',
            text: text,
            type: 'simple',
            password: salt
        });

        const decoded = await decode({
            text: encoded,
            type: 'simple',
            password: salt
        });

        expect(decoded).toBe(expectedDecoded);
    })
})
