import 'dart:convert';
import 'dart:typed_data';
import 'package:image/image.dart' as img;
import 'package:archive/archive.dart';
import 'crypto_service.dart';

class ImageSteganography {
  static final Uint8List _eomDelimiter = utf8.encode("::EOM::");
  static final Uint8List _isEncryptedFlag = Uint8List.fromList([1]);
  static final Uint8List _isNotEncryptedFlag = Uint8List.fromList([0]);

  // --- Core Embed Logic ---

  static Uint8List embedData(img.Image image, Uint8List data) {
    final Uint8List pixels = image.getBytes();
    final List<int> dataWithDelimiter = [...data, ..._eomDelimiter];

    final List<int> dataBits = [];
    for (var byte in dataWithDelimiter) {
      for (var i = 7; i >= 0; i--) {
        dataBits.add((byte >> i) & 1);
      }
    }

    if (dataBits.length > (pixels.length ~/ 4 * 3)) {
      throw Exception("Data is too large to hide in this image.");
    }

    int bitIndex = 0;
    for (int i = 0; i < pixels.length && bitIndex < dataBits.length; i++) {
      if ((i + 1) % 4 == 0) continue;
      pixels[i] = (pixels[i] & 0xFE) | dataBits[bitIndex];
      bitIndex++;
    }

    return pixels;
  }

  static Uint8List extractData(img.Image image) {
    final Uint8List pixels = image.getBytes();
    final List<int> extractedBits = [];

    for (int i = 0; i < pixels.length; i++) {
      if ((i + 1) % 4 == 0) continue;
      extractedBits.add(pixels[i] & 1);
    }

    final List<int> bytes = [];
    for (int i = 0; i < extractedBits.length; i += 8) {
      if (i + 8 > extractedBits.length) break;
      int byte = 0;
      for (int j = 0; j < 8; j++) {
        byte = (byte << 1) | extractedBits[i + j];
      }
      bytes.add(byte);
    }

    final Uint8List bytesArray = Uint8List.fromList(bytes);
    final int delimiterIndex = _findDelimiterIndex(bytesArray, _eomDelimiter);

    if (delimiterIndex == -1) {
      throw Exception("No hidden message found or data is corrupt.");
    }

    return bytesArray.sublist(0, delimiterIndex);
  }

  static int _findDelimiterIndex(Uint8List source, Uint8List delimiter) {
    for (int i = 0; i <= source.length - delimiter.length; i++) {
      bool found = true;
      for (int j = 0; j < delimiter.length; j++) {
        if (source[i + j] != delimiter[j]) {
          found = false;
          break;
        }
      }
      if (found) return i;
    }
    return -1;
  }

  // --- Public API ---

  static Future<Uint8List> hideData({
    required Uint8List coverImageBytes,
    required dynamic data,
    required List<String> passwords,
    bool stripMetadata = true,
  }) async {
    img.Image? image = img.decodeImage(coverImageBytes);
    if (image == null) throw Exception("Could not decode image.");

    // EXIF Stripping (Optimization)
    if (stripMetadata) {
      // Re-encoding without EXIF
      final img.Image newImg = img.Image.from(image);
      image = newImg;
    }

    Uint8List dataToProcess;
    if (data is String) {
      dataToProcess = Uint8List.fromList(utf8.encode(data));
    } else if (data is List<Map<String, dynamic>>) {
      final archive = Archive();
      for (var fileData in data) {
        archive.addFile(ArchiveFile(fileData['name'], (fileData['bytes'] as List<int>).length, fileData['bytes']));
      }
      dataToProcess = Uint8List.fromList(ZipEncoder().encode(archive)!);
    } else {
      dataToProcess = data as Uint8List;
    }

    final crypto = CryptoService();
    final String encryptedDataB64 = await crypto.encryptMultiple(dataToProcess, passwords);

    final flag = passwords.isNotEmpty ? _isEncryptedFlag : _isNotEncryptedFlag;
    final finalPayload = Uint8List.fromList([...flag, ...utf8.encode(encryptedDataB64)]);

    final Uint8List newPixels = embedData(image, finalPayload);

    final img.Image resultImage = img.Image.fromBytes(
      width: image.width,
      height: image.height,
      bytes: newPixels.buffer,
      format: img.Format.uint8,
      numChannels: 4
    );

    return Uint8List.fromList(img.encodePng(resultImage));
  }

  static Future<Map<String, dynamic>> revealData({
    required Uint8List stegoImageBytes,
    required List<String> passwords,
  }) async {
    final img.Image? image = img.decodeImage(stegoImageBytes);
    if (image == null) throw Exception("Could not decode image.");

    final extractedData = extractData(image);
    final bool isEncrypted = extractedData[0] == 1;
    final String b64Payload = utf8.decode(extractedData.sublist(1));

    final crypto = CryptoService();
    final dynamic decryptedData = await crypto.decryptMultiple(
      b64Payload,
      passwords,
      returnBinary: true
    );

    try {
      final archive = ZipDecoder().decodeBytes(decryptedData as Uint8List);
      if (archive.length == 1 && archive.files[0].name == 'secret.txt') {
         return {'text': utf8.decode(archive.files[0].content), 'files': null};
      }
      return {
        'text': null,
        'files': archive.files.map((f) => {'name': f.name, 'bytes': f.content}).toList()
      };
    } catch (e) {
      return {'text': utf8.decode(decryptedData as Uint8List), 'files': null};
    }
  }
}
