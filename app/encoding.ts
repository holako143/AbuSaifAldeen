// Variation selectors block https://unicode.org/charts/nameslist/n_FE00.html
// VS1..=VS16
const VARIATION_SELECTOR_START = 0xfe00;
const VARIATION_SELECTOR_END = 0xfe0f;

// Variation selectors supplement https://unicode.org/charts/nameslist/n_E0100.html
// VS17..=VS256
const VARIATION_SELECTOR_SUPPLEMENT_START = 0xe0100;
const VARIATION_SELECTOR_SUPPLEMENT_END = 0xe01ef;

function xorCipher(text: string, key: string): string {
  if (!key) return text;
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return result;
}

export function toVariationSelector(byte: number): string | null {
    if (byte >= 0 && byte < 16) {
        return String.fromCodePoint(VARIATION_SELECTOR_START + byte)
    } else if (byte >= 16 && byte < 256) {
        return String.fromCodePoint(VARIATION_SELECTOR_SUPPLEMENT_START + byte - 16)
    } else {
        return null
    }
}

export function fromVariationSelector(codePoint: number): number | null {
    if (codePoint >= VARIATION_SELECTOR_START && codePoint <= VARIATION_SELECTOR_END) {
        return codePoint - VARIATION_SELECTOR_START
    } else if (codePoint >= VARIATION_SELECTOR_SUPPLEMENT_START && codePoint <= VARIATION_SELECTOR_SUPPLEMENT_END) {
        return codePoint - VARIATION_SELECTOR_SUPPLEMENT_START + 16
    } else {
        return null
    }
}

export function encode(emoji: string, text: string, password?: string): string {
    const textToEncode = xorCipher(text, password || '');
    // convert the string to utf-8 bytes
    const bytes = new TextEncoder().encode(textToEncode)
    let encoded = emoji

    for (const byte of bytes) {
        encoded += toVariationSelector(byte)
    }

    return encoded
}

export function decode(text: string, password?: string): string {
    let decodedBytes = []
    const chars = Array.from(text)

    for (const char of chars) {
        const byte = fromVariationSelector(char.codePointAt(0)!)

        if (byte !== null) {
          decodedBytes.push(byte)
        }
    }

    let decodedArray = new Uint8Array(decodedBytes)
    const decodedText = new TextDecoder().decode(decodedArray)
    
    return xorCipher(decodedText, password || '');
}
