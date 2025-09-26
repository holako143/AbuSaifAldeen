"use client";

import pako from 'pako';
import JSZip from 'jszip';
import { encryptMultiple, decryptMultiple, bufferToBase64, base64ToBuffer } from './crypto';
import { v4 as uuidv4 } from 'uuid';

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

// --- Steganography Core Logic ---

const MAGIC_BYTES = stringToUint8Array("SHFR"); // 4 bytes
// Metadata structure:
// MAGIC_BYTES (4) | SET_ID (36) | CHUNK_INDEX (4) | TOTAL_CHUNKS (4) | PAYLOAD
const META_SIZE = 4 + 36 + 4 + 4;

function embedData(originalPixels: Uint8ClampedArray, data: Uint8Array): Uint8ClampedArray {
    const pixels = new Uint8ClampedArray(originalPixels);
    const dataBits: number[] = [];
    data.forEach(byte => {
        for (let i = 7; i >= 0; i--) {
            dataBits.push((byte >> i) & 1);
        }
    });

    if (dataBits.length > (pixels.length / 4 * 3)) {
        throw new Error("Data chunk is too large for this image.");
    }

    let bitIndex = 0;
    for (let i = 0; i < pixels.length && bitIndex < dataBits.length; i++) {
        if ((i + 1) % 4 === 0) continue;
        pixels[i] = (pixels[i] & 0xFE) | dataBits[bitIndex];
        bitIndex++;
    }

    return pixels;
}

function extractData(pixels: Uint8ClampedArray): { setId: string, chunkIndex: number, totalChunks: number, payload: Uint8Array } {
    const extractedBytes: number[] = [];
    let bitCount = 0;
    let currentByte = 0;

    for (let i = 0; i < pixels.length; i++) {
        if ((i + 1) % 4 === 0) continue;

        currentByte = (currentByte << 1) | (pixels[i] & 1);
        bitCount++;

        if (bitCount === 8) {
            extractedBytes.push(currentByte);
            currentByte = 0;
            bitCount = 0;
            // Stop reading after extracting metadata to check magic bytes
            if (extractedBytes.length === META_SIZE) {
                const header = new Uint8Array(extractedBytes);
                const magic = new TextDecoder().decode(header.slice(0, 4));
                if (magic !== 'SHFR') {
                    throw new Error("Not a valid steganography image: magic bytes mismatch.");
                }
            }
        }
    }

    const allData = new Uint8Array(extractedBytes);
    const setId = new TextDecoder().decode(allData.slice(4, 40));
    const view = new DataView(allData.buffer);
    const chunkIndex = view.getUint32(40);
    const totalChunks = view.getUint32(44);
    const payload = allData.slice(META_SIZE);

    return { setId, chunkIndex, totalChunks, payload };
}

// --- Public API ---

const IS_ENCRYPTED_FLAG = new Uint8Array([1]);
const IS_NOT_ENCRYPTED_FLAG = new Uint8Array([0]);
const IS_BINARY_FLAG = new Uint8Array([1]);
const IS_TEXT_FLAG = new Uint8Array([0]);

export async function hideDataInImage(imageFile: File, data: string | File[], passwords?: string[]): Promise<string[]> {
    const canvas = await loadImageToCanvas(imageFile);
    const imageData = getPixelData(canvas);
    const capacity = Math.floor(((imageData.data.length / 4) * 3) / 8) - META_SIZE;

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

    const taggedData = new Uint8Array(dataTypeFlag.length + encryptionFlag.length + dataToEmbed.length);
    taggedData.set(dataTypeFlag, 0);
    taggedData.set(encryptionFlag, dataTypeFlag.length);
    taggedData.set(dataToEmbed, dataTypeFlag.length + encryptionFlag.length);

    const totalChunks = Math.ceil(taggedData.length / capacity);
    const setId = uuidv4();
    const resultImageUrls: string[] = [];

    for (let i = 0; i < totalChunks; i++) {
        const chunk = taggedData.slice(i * capacity, (i + 1) * capacity);

        const meta = new ArrayBuffer(META_SIZE);
        const metaView = new DataView(meta);
        const setIdBytes = new TextEncoder().encode(setId);

        new Uint8Array(meta).set(MAGIC_BYTES, 0);
        new Uint8Array(meta).set(setIdBytes, 4);
        metaView.setUint32(40, i);
        metaView.setUint32(44, totalChunks);

        const finalPayload = new Uint8Array(META_SIZE + chunk.length);
        finalPayload.set(new Uint8Array(meta), 0);
        finalPayload.set(chunk, META_SIZE);

        const newPixelData = embedData(imageData.data, finalPayload);
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) throw new Error("Could not create temp canvas context");
        const newImageData = new ImageData(newPixelData, canvas.width, canvas.height);
        tempCtx.putImageData(newImageData, 0, 0);
        resultImageUrls.push(tempCanvas.toDataURL('image/png'));
    }

    return resultImageUrls;
}

export async function revealDataFromImage(imageFiles: File[], passwords?: string[]): Promise<{ files: File[] | null, text: string | null }> {
    const chunks = new Map<number, Uint8Array>();
    let totalChunks = -1;
    let setId = '';

    for (const imageFile of imageFiles) {
        const canvas = await loadImageToCanvas(imageFile);
        const imageData = getPixelData(canvas);
        const extracted = extractData(imageData.data);

        if (!setId) {
            setId = extracted.setId;
            totalChunks = extracted.totalChunks;
        } else if (extracted.setId !== setId) {
            throw new Error("Image set ID mismatch. Please select images from the same set.");
        }

        if (chunks.has(extracted.chunkIndex)) {
            throw new Error(`Duplicate chunk index found: ${extracted.chunkIndex}. Please check your files.`);
        }
        chunks.set(extracted.chunkIndex, extracted.payload);
    }

    if (chunks.size !== totalChunks) {
        throw new Error(`Missing chunks. Expected ${totalChunks}, but received ${chunks.size}.`);
    }

    const sortedChunks = Array.from(chunks.keys()).sort((a, b) => a - b).map(key => chunks.get(key)!);
    const combinedPayload = new Uint8Array(sortedChunks.reduce((acc, chunk) => acc + chunk.length, 0));
    let offset = 0;
    for(const chunk of sortedChunks) {
        combinedPayload.set(chunk, offset);
        offset += chunk.length;
    }

    const dataTypeFlag = combinedPayload[0];
    const isEncrypted = combinedPayload[1] === 1;
    const payload = combinedPayload.slice(2);

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