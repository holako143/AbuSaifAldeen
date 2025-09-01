import { expect, test, describe } from 'vitest'
import { encode, decode } from './encoding'
import { EMOJI_LIST } from './emoji'

describe('emoji encoder/decoder', () => {
    test('should correctly encode and decode strings', () => {
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
                const encoded = encode(emoji, str)
                const decoded = decode(encoded)

                // Ensure decoding returns the original string
                expect(decoded).toBe(str)

                // Ensure encoded string only contains emojis (optional test)
                // expect(encoded).toMatch(/^[\p{Emoji}]+$/u)
            }
        }
    })
})
