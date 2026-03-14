import 'dart:convert';
import 'crypto_service.dart';

class EmojiSteganography {
  static const int variationSelectorStart = 0xfe00;
  static const int variationSelectorEnd = 0xfe0f;
  static const int variationSelectorSupplementStart = 0xe0100;
  static const int variationSelectorSupplementEnd = 0xe01ef;

  static bool isVariationSelector(int code) {
    return (code >= variationSelectorStart && code <= variationSelectorEnd) ||
           (code >= variationSelectorSupplementStart && code <= variationSelectorSupplementEnd);
  }

  static String? toVariationSelector(int byte) {
    if (byte >= 0 && byte < 16) {
      return String.fromCharCode(variationSelectorStart + byte);
    }
    if (byte >= 16 && byte < 256) {
      return String.fromCharCode(variationSelectorSupplementStart + byte - 16);
    }
    return null;
  }

  static int? fromVariationSelector(int codePoint) {
    if (codePoint >= variationSelectorStart && codePoint <= variationSelectorEnd) {
      return codePoint - variationSelectorStart;
    }
    if (codePoint >= variationSelectorSupplementStart && codePoint <= variationSelectorSupplementEnd) {
      return codePoint - variationSelectorSupplementStart + 16;
    }
    return null;
  }

  static String encodeToEmoji(String emoji, String text) {
    final List<int> bytes = utf8.encode(text);
    final StringBuffer buffer = StringBuffer(emoji);

    for (final byte in bytes) {
      final selector = toVariationSelector(byte);
      if (selector != null) {
        buffer.write(selector);
      }
    }
    return buffer.toString();
  }

  static String decodeFromEmoji(String text) {
    if (text.isEmpty) return "";
    final List<int> decodedBytes = [];

    // In Dart, Runes correctly handles multi-byte characters
    final Runes runes = text.runes;
    final Iterator<int> iterator = runes.iterator;

    // Skip the base emoji
    if (iterator.moveNext()) {
      while (iterator.moveNext()) {
        final byte = fromVariationSelector(iterator.current);
        if (byte == null) break;
        decodedBytes.add(byte);
      }
    }

    return utf8.decode(decodedBytes);
  }

  // --- Main Interface ---

  static Future<String> encode({
    required String emoji,
    required String text,
    required List<String> passwords,
  }) async {
    final crypto = CryptoService();
    final String processedText = await crypto.encryptMultiple(text, passwords);
    return encodeToEmoji(emoji, processedText);
  }

  static Future<String> decode({
    required String text,
    required List<String> passwords,
  }) async {
    final crypto = CryptoService();

    // Split text into messages by base characters
    final List<String> messages = [];
    StringBuffer currentMessage = StringBuffer();

    for (final int rune in text.runes) {
      if (!isVariationSelector(rune)) {
        if (currentMessage.isNotEmpty) {
          messages.add(currentMessage.toString());
        }
        currentMessage = StringBuffer(String.fromCharCode(rune));
      } else {
        currentMessage.write(String.fromCharCode(rune));
      }
    }
    if (currentMessage.isNotEmpty) {
      messages.add(currentMessage.toString());
    }

    final List<String> decodedLines = [];
    for (final message in messages) {
      try {
        final String hiddenText = decodeFromEmoji(message);
        final String decryptedText = await crypto.decryptMultiple(hiddenText, passwords);
        decodedLines.add(decryptedText);
      } catch (e) {
        rethrow;
      }
    }

    return decodedLines.join('\n');
  }
}
