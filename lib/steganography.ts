"use client";

import pako from 'pako';
import JSZip from 'jszip';
import { encryptMultiple, decryptMultiple, bufferToBase64, base64ToBuffer } from './crypto';

// --- Helper Functions ---

function stringToUint8Array(str: string): Uint8Array {
  return new TextEncoder().encode(str);
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
    zip.forEach((_, zipEntry) => {
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

const IS_ENCRYPTED_FLAG = new Uint8Array([1]);
const IS_NOT_ENCRYPTED_FLAG = new Uint8Array([0]);
const IS_BINARY_FLAG = new Uint8Array([1]);
const IS_TEXT_FLAG = new Uint8Array([0]);

export async function hideDataInImage(imageFile: File, data: string | File[], passwords?: string[]): Promise<string> {
    const canvas = await loadImageToCanvas(imageFile);
    const imageData = getPixelData(canvas);
    const capacity = (imageData.data.length / 4 * 3) / 8;

    let initialData: Uint8Array;
    let dataTypeFlag: Uint8Array;

    if (typeof data === 'string') {
        initialData = new TextEncoder().encode(data);
        dataTypeFlag = IS_TEXT_FLAG;
    } else {
        initialData = await archiveFiles(data);
        dataTypeFlag = IS_BINARY_FLAG;
    }

    const compressedData = pako.deflate(initialData);

    let dataToEmbed: Uint8Array;
    let encryptionFlag = IS_NOT_ENCRYPTED_FLAG;

    if (passwords && passwords.length > 0) {
        const encryptedB64 = await encryptMultiple(compressedData, passwords);
        dataToEmbed = new TextEncoder().encode(encryptedB64);
        encryptionFlag = IS_ENCRYPTED_FLAG;
    } else {
        dataToEmbed = compressedData;
    }

    const finalPayload = new Uint8Array(dataTypeFlag.length + encryptionFlag.length + dataToEmbed.length);
    finalPayload.set(dataTypeFlag, 0);
    finalPayload.set(encryptionFlag, dataTypeFlag.length);
    finalPayload.set(dataToEmbed, dataTypeFlag.length + encryptionFlag.length);

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

    const dataTypeFlag = extractedData[0];
    const isEncrypted = extractedData[1] === 1;
    const payload = extractedData.slice(2);

    let decompressedData: Uint8Array;

    if (isEncrypted) {
        if (!passwords || passwords.length === 0) {
            throw new Error("This image is password-protected. Please provide the password(s) to reveal the message.");
        }
        const encryptedString = new TextDecoder().decode(payload);
        const decryptedData = await decryptMultiple(encryptedString, passwords, 'binary') as Uint8Array;
        decompressedData = pako.inflate(decryptedData);
    } else {
        decompressedData = pako.inflate(payload);
    }

    if (dataTypeFlag === IS_TEXT_FLAG[0]) {
        return { files: null, text: new TextDecoder().decode(decompressedData) };
    } else {
        const files = await unarchiveFiles(decompressedData);
        return { files: files, text: null };
    }
}