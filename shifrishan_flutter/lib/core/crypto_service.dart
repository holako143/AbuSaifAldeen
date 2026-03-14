import 'dart:convert';
import 'dart:typed_data';
import 'dart:math';
import 'package:cryptography/cryptography.dart';
import 'package:archive/archive.dart';

class CryptoService {
  static final CryptoService _instance = CryptoService._internal();
  factory CryptoService() => _instance;
  CryptoService._internal();

  final _aesGcm = AesGcm.with256bits();
  final _pbkdf2 = Pbkdf2(
    macAlgorithm: Hmac(sha256),
    iterations: 100000,
    bits: 256,
  );

  // --- Helper Functions ---

  String _bufferToBase64(List<int> bytes) => base64.encode(bytes);
  Uint8List _base64ToBuffer(String b64) => base64.decode(b64);

  Uint8List _getRandomValues(int length) {
    final random = Random.secure();
    return Uint8List.fromList(List.generate(length, (_) => random.nextInt(256)));
  }

  // --- Core Encryption ---

  Future<String> encryptBinary(List<int> data, String password) async {
    final salt = _getRandomValues(16);
    final iv = _getRandomValues(12);

    final secretKey = await _pbkdf2.deriveKeyFromPassword(
      password: password,
      nonce: salt,
    );

    final secretBox = await _aesGcm.encrypt(
      data,
      secretKey: secretKey,
      nonce: iv,
    );

    // Concatenate ciphertext and mac to match WebCrypto's output
    final combinedCipherText = Uint8List.fromList([
      ...secretBox.cipherText,
      ...secretBox.mac.bytes,
    ]);

    final packed = json.encode({
      'ct': _bufferToBase64(combinedCipherText),
      's': _bufferToBase64(salt),
      'iv': _bufferToBase64(iv),
    });

    return _bufferToBase64(utf8.encode(packed));
  }

  Future<Uint8List> decryptBinary(String encryptedPayload, String password) async {
    try {
      final packedJson = utf8.decode(_base64ToBuffer(encryptedPayload));
      final Map<String, dynamic> packed = json.decode(packedJson);

      final combinedCt = _base64ToBuffer(packed['ct']!);
      final salt = _base64ToBuffer(packed['s']!);
      final iv = _base64ToBuffer(packed['iv']!);

      // WebCrypto appends 16-byte tag at the end
      final ct = combinedCt.sublist(0, combinedCt.length - 16);
      final macBytes = combinedCt.sublist(combinedCt.length - 16);

      final secretKey = await _pbkdf2.deriveKeyFromPassword(
        password: password,
        nonce: salt,
      );

      final secretBox = SecretBox(ct, nonce: iv, mac: Mac(macBytes));

      final decrypted = await _aesGcm.decrypt(
        secretBox,
        secretKey: secretKey,
      );

      return Uint8List.fromList(decrypted);
    } catch (e) {
      throw Exception("Decryption failed. Incorrect password or corrupt data.");
    }
  }

  // --- Text Encryption with Compression ---

  Future<String> encryptAES(String plaintext, String password) async {
    // Web version uses pako.deflate (zlib)
    final compressed = ZLibEncoder().encode(utf8.encode(plaintext));
    return encryptBinary(compressed, password);
  }

  Future<String> decryptAES(String encryptedPayload, String password) async {
    final decrypted = await decryptBinary(encryptedPayload, password);
    // Web version uses pako.inflate
    final decompressed = ZLibDecoder().decodeBytes(decrypted);
    return utf8.decode(decompressed);
  }

  // --- Multi-layer Encryption ---

  Future<String> encryptMultiple(dynamic data, List<String> passwords) async {
    if (passwords.isEmpty) {
      if (data is String) return data;
      return _bufferToBase64(data);
    }

    String currentData;
    if (data is List<int>) {
      currentData = await encryptBinary(data, passwords[0]);
    } else {
      currentData = await encryptAES(data as String, passwords[0]);
    }

    for (int i = 1; i < passwords.length; i++) {
      currentData = await encryptAES(currentData, passwords[i]);
    }

    return currentData;
  }

  Future<dynamic> decryptMultiple(String ciphertext, List<String> passwords, {bool returnBinary = false}) async {
    if (passwords.isEmpty) {
      return returnBinary ? _base64ToBuffer(ciphertext) : ciphertext;
    }

    String currentData = ciphertext;
    for (int i = passwords.length - 1; i > 0; i--) {
      currentData = await decryptAES(currentData, passwords[i]);
    }

    if (returnBinary) {
      return await decryptBinary(currentData, passwords[0]);
    } else {
      return await decryptAES(currentData, passwords[0]);
    }
  }
}
