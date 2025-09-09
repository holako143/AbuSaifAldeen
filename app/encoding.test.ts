import { expect, test, describe } from 'vitest'
import { encode, decode } from './encoding'
import { EMOJI_LIST } from './emoji'

describe('emoji encoder/decoder', () => {
    const testStrings = [
        'Hello, World!',
        'Testing 123',
        'Unicode: 你好，世界',
        '',
    ]
    const testPassword = 'supersecret'

    test('should correctly encode and decode strings without a password', () => {
        for (const emoji of EMOJI_LIST.slice(0, 3)) { // Test with a subset to speed up
            for (const str of testStrings) {
                const encoded = encode(emoji, str)
                const decoded = decode(encoded)
                expect(decoded).toBe(str)
            }
        }
    })

    test('should correctly encode and decode strings with a password', () => {
        for (const emoji of EMOJI_LIST.slice(0, 3)) { // Test with a subset
            for (const str of testStrings) {
                const encoded = encode(emoji, str, testPassword)
                const decoded = decode(encoded, testPassword)
                expect(decoded).toBe(str)
            }
        }
    })

    test('should fail to decode with an incorrect password', () => {
        const emoji = EMOJI_LIST[0]
        const str = testStrings[0]
        const wrongPassword = 'wrongpassword'

        const encoded = encode(emoji, str, testPassword)
        const decodedWithWrongPassword = decode(encoded, wrongPassword)
        
        expect(decodedWithWrongPassword).not.toBe(str)
    })

    test('should fail to decode without a password if one was used to encode', () => {
        const emoji = EMOJI_LIST[0]
        const str = testStrings[0]

        const encoded = encode(emoji, str, testPassword)
        const decodedWithoutPassword = decode(encoded)

        expect(decodedWithoutPassword).not.toBe(str)
    })
})
