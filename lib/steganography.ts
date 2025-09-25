"use client";

import pako from 'pako';
import Tar from 'tar-js';
import { encryptMultiple, decryptMultiple } from './crypto';

// --- Helper Functions ---

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
    const tape = new Tar();
    const filePromises = files.map(async (file) => {
        const content = await fileToUint8Array(file);
        tape.append(file.name, content);
    });
    await Promise.all(filePromises);
    return tape.out;
}

async function unarchiveFiles(tarData: Uint8Array): Promise<File[]> {
    const tape = new Tar();
    const files: File[] = [];
    return new Promise((resolve) => {
        tape.on('entry', (header, stream, next) => {
            const chunks: Uint8Array[] = [];
            stream.on('data', (chunk) => chunks.push(chunk));
            stream.on('end', () => {
                const blob = new Blob(chunks, { type: header.type || 'application/octet-stream' });
                const file = new File([blob], header.name, { type: header.type || 'application/octet-stream' });
                files.push(file);
                next();
            });
            stream.resume();
        });
        tape.on('end', () => resolve(files));
        tape.write(tarData);
    });
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

export async function hideFilesInImage(imageFile: File, secretFiles: File[], passwords?: string[]): Promise<string> {
    const canvas = await loadImageToCanvas(imageFile);
    const imageData = getPixelData(canvas);

    const capacity = (imageData.data.length / 4 * 3) / 8; // in bytes
    const archivedData = await archiveFiles(secretFiles);

    if (archivedData.length > capacity * 0.8) { // Leave some headroom
        throw new Error(`Files are too large for this image. Max capacity: ~${(capacity/1024/1024).toFixed(2)}MB`);
    }

    let dataToHide: Uint8Array;
    let payload: Uint8Array;

    if (passwords && passwords.length > 0) {
        const encryptedString = await encryptMultiple(uint8ArrayToString(archivedData), passwords);
        payload = stringToUint8Array(encryptedString);
        dataToHide = new Uint8Array([...IS_ENCRYPTED_FLAG, ...pako.deflate(payload)]);
    } else {
        payload = archivedData;
        dataToHide = new Uint8Array([...IS_NOT_ENCRYPTED_FLAG, ...pako.deflate(payload)]);
    }

    const newPixelData = embedData(imageData.data, dataToHide);
    imageData.data.set(newPixelData);

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error("Could not get canvas context");
    ctx.putImageData(imageData, 0, 0);

    return canvas.toDataURL('image/png');
}

export async function revealFilesFromImage(imageFile: File, passwords?: string[]): Promise<File[]> {
    const canvas = await loadImageToCanvas(imageFile);
    const imageData = getPixelData(canvas);

    const extractedData = extractData(imageData.data);

    const isEncrypted = extractedData[0] === 1;
    const compressedPayload = extractedData.slice(1);

    const payload = pako.inflate(compressedPayload);
    let finalTarData: Uint8Array;

    if (isEncrypted) {
        if (!passwords || passwords.length === 0) {
            throw new Error("This image is password-protected. Please provide the password(s) to reveal the message.");
        }
        const encryptedString = new TextDecoder().decode(payload);
        const decryptedString = await decryptMultiple(encryptedString, passwords);
        finalTarData = new TextEncoder().encode(decryptedString);
    } else {
        finalTarData = payload;
    }

    return await unarchiveFiles(finalTarData);
}

function uint8ArrayToString(arr: Uint8Array): string {
    let str = '';
    for(let i = 0; i < arr.length; i++){
       str += String.fromCharCode(arr[i]);
    }
    return str;
}