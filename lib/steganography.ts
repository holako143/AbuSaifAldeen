"use client";

import pako from 'pako';

// --- Helper Functions ---

/**
 * Converts a string to a Uint8Array.
 * @param str The string to convert.
 * @returns The resulting Uint8Array.
 */
function stringToUint8Array(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

/**
 * Converts a Uint8Array to a string.
 * @param arr The array to convert.
 * @returns The resulting string.
 */
function uint8ArrayToString(arr: Uint8Array): string {
  return new TextDecoder().decode(arr);
}

/**
 * Loads an image from a File object and draws it onto a canvas.
 * @param file The image file.
 * @returns A promise that resolves with the canvas element.
 */
function loadImageToCanvas(file: File): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error("Could not get canvas context"));
        ctx.drawImage(img, 0, 0);
        resolve(canvas);
      };
      img.onerror = reject;
      img.src = event.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Gets the pixel data from a canvas.
 * @param canvas The canvas element.
 * @returns The ImageData object.
 */
function getPixelData(canvas: HTMLCanvasElement): ImageData {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error("Could not get canvas context");
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

// --- Core Steganography Logic ---

const END_OF_MESSAGE_DELIMITER = "::EOM::";

/**
 * Embeds data into the pixel data of an image.
 * @param originalPixels The original pixel data (rgba array).
 * @param data The data to embed (as a Uint8Array).
 * @returns The modified pixel data.
 */
function embedData(originalPixels: Uint8ClampedArray, data: Uint8Array): Uint8ClampedArray {
    const pixels = new Uint8ClampedArray(originalPixels);
    const dataWithDelimiter = new Uint8Array([...data, ...stringToUint8Array(END_OF_MESSAGE_DELIMITER)]);
    const dataBits: number[] = [];
    dataWithDelimiter.forEach(byte => {
        for (let i = 7; i >= 0; i--) {
            dataBits.push((byte >> i) & 1);
        }
    });

    if (dataBits.length > pixels.length) {
        throw new Error("Data is too large to hide in this image.");
    }

    let bitIndex = 0;
    for (let i = 0; i < pixels.length && bitIndex < dataBits.length; i++) {
        // Skip alpha channel
        if ((i + 1) % 4 === 0) continue;

        pixels[i] = (pixels[i] & 0xFE) | dataBits[bitIndex];
        bitIndex++;
    }

    return pixels;
}


/**
 * Extracts data from the pixel data of an image.
 * @param pixels The pixel data to extract from.
 * @returns The extracted data as a Uint8Array.
 */
function extractData(pixels: Uint8ClampedArray): Uint8Array {
    const extractedBits: number[] = [];
    for (let i = 0; i < pixels.length; i++) {
        // Skip alpha channel
        if ((i + 1) % 4 === 0) continue;
        extractedBits.push(pixels[i] & 1);
    }

    const bytes: number[] = [];
    for (let i = 0; i < extractedBits.length; i += 8) {
        if (i + 8 > extractedBits.length) break;
        const byteString = extractedBits.slice(i, i + 8).join('');
        bytes.push(parseInt(byteString, 2));
    }

    const decodedString = uint8ArrayToString(new Uint8Array(bytes));
    const eomIndex = decodedString.indexOf(END_OF_MESSAGE_DELIMITER);
    if (eomIndex === -1) {
        throw new Error("End-of-message delimiter not found. The image may be corrupt or not contain a message.");
    }

    // Find the byte index of the delimiter
    const delimiterByteIndex = new TextEncoder().encode(decodedString.substring(0, eomIndex)).length;

    return new Uint8Array(bytes.slice(0, delimiterByteIndex));
}


// --- Public API ---

/**
 * Hides a secret message (string) inside an image file.
 * @param imageFile The cover image.
 * @param secretMessage The message to hide.
 * @returns A promise that resolves with the data URL of the new image.
 */
export async function hideTextInImage(imageFile: File, secretMessage: string): Promise<string> {
    const canvas = await loadImageToCanvas(imageFile);
    const imageData = getPixelData(canvas);
    const secretData = pako.deflate(secretMessage);

    const newPixelData = embedData(imageData.data, secretData);
    imageData.data.set(newPixelData);

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error("Could not get canvas context");
    ctx.putImageData(imageData, 0, 0);

    return canvas.toDataURL('image/png');
}

/**
 * Reveals a secret message from an image file.
 * @param imageFile The image containing the secret message.
 * @returns A promise that resolves with the revealed message.
 */
export async function revealTextFromImage(imageFile: File): Promise<string> {
    const canvas = await loadImageToCanvas(imageFile);
    const imageData = getPixelData(canvas);

    const extractedData = extractData(imageData.data);
    const decompressedData = pako.inflate(extractedData, { to: 'string' });

    return decompressedData;
}