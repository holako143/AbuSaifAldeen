"use client";

import pako from 'pako';
import JSZip from 'jszip';
import { encryptMultiple, decryptMultiple, bufferToBase64 } from './crypto';

// --- Helper Functions ---

function stringToUint8Array(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

function dataURLToBlob(dataURL: string): Blob {
  const parts = dataURL.split(',');
  const contentType = parts[0].split(':')[1];
  const raw = window.atob(parts[1]);
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);
  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }
  return new Blob([uInt8Array], { type: contentType });
}

async function fileToUint8Array(file: File): Promise<Uint8Array> {
    const buffer = await file.arrayBuffer();
    return new Uint8Array(buffer);
}

function loadImageToCanvas(file: File): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
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

function getPixelData(canvas: HTMLCanvasElement): ImageData {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error("Could not get canvas context");
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

async function archiveFiles(files: File[]): Promise<Uint8Array> {
    const zip = new JSZip();
    files.forEach(file => {
        zip.file(file.name, file);
    });
    return zip.generateAsync({ type: "uint8array" });
}

async function unarchiveFiles(zipData: Uint8Array): Promise<File[]> {
    const zip = await JSZip.loadAsync(zipData);
    const files: Promise<File>[] = [];
    zip.forEach((relativePath, zipEntry) => {
        const filePromise = zipEntry.async('blob').then(blob => {
            return new File([blob], zipEntry.name, { type: blob.type });
        });
        files.push(filePromise);
    });
    return Promise.all(files);
}


// --- Core Steganography Logic ---

const END_OF_MESSAGE_DELIMITER = stringToUint8Array("::EOM::");

function embedData(originalPixels: Uint8ClampedArray, data: Uint8Array): Uint8ClampedArray {
    const pixels = new Uint8ClampedArray(originalPixels);
    const dataWithDelimiter = new Uint8Array(data.length + END_OF_MESSAGE_DELIMITER.length);
    dataWithDelimiter.set(data, 0);
    dataWithDelimiter.set(END_OF_MESSAGE_DELIMITER, data.length);

    const dataBits: number[] = [];
    dataWithDelimiter.forEach(byte => {
        for (let i = 7; i >= 0; i--) {
            dataBits.push((byte >> i) & 1);
        }
    });

    if (dataBits.length > (pixels.length / 4 * 3)) {
        throw new Error("Data is too large to hide in this image.");
    }

    let bitIndex = 0;
    for (let i = 0; i < pixels.length && bitIndex < dataBits.length; i++) {
        if ((i + 1) % 4 === 0) continue;
        pixels[i] = (pixels[i] & 0xFE) | dataBits[bitIndex];
        bitIndex++;
    }

    return pixels;
}

function findDelimiterIndex(source: Uint8Array, delimiter: Uint8Array): number {
    for (let i = 0; i <= source.length - delimiter.length; i++) {
        let found = true;
        for (let j = 0; j < delimiter.length; j++) {
            if (source[i + j] !== delimiter[j]) {
                found = false;
                break;
            }
        }
        if (found) return i;
    }
    return -1;
}

function extractData(pixels: Uint8ClampedArray): Uint8Array {
    const extractedBits: number[] = [];
    for (let i = 0; i < pixels.length; i++) {
        if ((i + 1) % 4 === 0) continue;
        extractedBits.push(pixels[i] & 1);
    }

    const bytes: number[] = [];
    for (let i = 0; i < extractedBits.length; i += 8) {
        if (i + 8 > extractedBits.length) break;
        const byteString = extractedBits.slice(i, i + 8).join('');
        bytes.push(parseInt(byteString, 2));
    }

    const bytesArray = new Uint8Array(bytes);
    const delimiterIndex = findDelimiterIndex(bytesArray, END_OF_MESSAGE_DELIMITER);

    if (delimiterIndex === -1) {
        throw new Error("End-of-message delimiter not found. The image may be corrupt or not contain a message.");
    }

    return bytesArray.slice(0, delimiterIndex);
}


// --- Public API ---

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary_string = window.atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes;
}

const IS_ENCRYPTED_FLAG = new Uint8Array([1]);
const IS_NOT_ENCRYPTED_FLAG = new Uint8Array([0]);

export async function hideDataInImage(imageFile: File, data: string | File[], passwords?: string[]): Promise<string> {
    const canvas = await loadImageToCanvas(imageFile);
    const imageData = getPixelData(canvas);
    const capacity = (imageData.data.length / 4 * 3) / 8; // in bytes

    let dataToProcess: string | Uint8Array;
    let isBinary = false;

    if (typeof data === 'string') {
        dataToProcess = data;
    } else {
        dataToProcess = await archiveFiles(data);
        isBinary = true;
    }

    let dataToEncrypt: string | Uint8Array = isBinary
        ? dataToProcess
        : pako.deflate(dataToProcess as string);

    let encryptedDataB64: string;
    if (passwords && passwords.length > 0) {
        encryptedDataB64 = await encryptMultiple(dataToEncrypt, passwords);
    } else {
        const dataToEncode = dataToEncrypt instanceof Uint8Array ? dataToEncrypt : new TextEncoder().encode(dataToEncrypt);
        encryptedDataB64 = bufferToBase64(dataToEncode);
    }

    const flag = (passwords && passwords.length > 0) ? IS_ENCRYPTED_FLAG : IS_NOT_ENCRYPTED_FLAG;
    const finalPayload = new Uint8Array([...flag, ...stringToUint8Array(encryptedDataB64)]);

    if (finalPayload.length > capacity * 0.9) {
         throw new Error(`Data is too large for this image. Max capacity: ~${(capacity/1024/1024).toFixed(2)}MB`);
    }

    const newPixelData = embedData(imageData.data, finalPayload);
    imageData.data.set(newPixelData);

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error("Could not get canvas context");
    ctx.putImageData(imageData, 0, 0);

    return canvas.toDataURL('image/png');
}

export async function revealDataFromImage(imageFile: File, passwords?: string[]): Promise<{ files: File[] | null, text: string | null }> {
    const canvas = await loadImageToCanvas(imageFile);
    const imageData = getPixelData(canvas);

    const extractedData = extractData(imageData.data);
    const isEncrypted = extractedData[0] === 1;
    const b64Payload = new TextDecoder().decode(extractedData.slice(1));

    let decryptedData: string | Uint8Array;

    if (isEncrypted) {
        if (!passwords || passwords.length === 0) {
            throw new Error("This image is password-protected. Please provide the password(s) to reveal the message.");
        }
        // We try to decrypt as binary first, as it's the more likely case for files.
        try {
            decryptedData = await decryptMultiple(b64Payload, passwords, 'binary');
        } catch (e) {
            // If binary fails, try as string.
            decryptedData = await decryptMultiple(b64Payload, passwords, 'string');
        }
    } else {
        decryptedData = base64ToBuffer(b64Payload);
    }

    // Attempt to unarchive. If it fails, assume it's text.
    try {
        const files = await unarchiveFiles(decryptedData as Uint8Array);
        // Check if the only file is secret.txt, which means it was originally text
        if (files.length === 1 && files[0].name === 'secret.txt') {
            const text = await files[0].text();
            return { files: null, text: text };
        }
        return { files: files, text: null };
    } catch(e) {
        // If unarchiving fails, it's likely plain text (or encrypted text).
        const decompressedText = pako.inflate(decryptedData as Uint8Array, { to: 'string' });
        return { files: null, text: decompressedText };
    }
}
