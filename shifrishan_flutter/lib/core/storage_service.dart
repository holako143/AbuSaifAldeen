import 'package:hive_flutter/hive_flutter.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'dart:convert';
import 'package:cryptography/cryptography.dart';

class StorageService {
  static const String _historyBoxName = 'history';
  static const String _vaultBoxName = 'vault';
  static const String _settingsBoxName = 'settings';

  final _secureStorage = const FlutterSecureStorage();

  Future<void> init() async {
    await Hive.initFlutter();
    await Hive.openBox(_historyBoxName);
    await Hive.openBox(_settingsBoxName);
    await Hive.openBox(_vaultBoxName);
  }

  // --- History Management ---

  List<dynamic> getHistory() {
    final box = Hive.box(_historyBoxName);
    return box.values.toList().reversed.toList();
  }

  Future<void> addToHistory(Map<String, dynamic> entry) async {
    final box = Hive.box(_historyBoxName);
    await box.add({
      ...entry,
      'timestamp': DateTime.now().millisecondsSinceEpoch,
    });
    // Keep only last 50 items
    if (box.length > 50) {
      await box.deleteAt(0);
    }
  }

  // --- Vault Management (Encrypted) ---

  Future<void> saveVaultData(String encryptedBlob, String passwordHash) async {
    final box = Hive.box(_vaultBoxName);
    await box.put('main', encryptedBlob);
    await box.put('hash', passwordHash);
  }

  Future<Map<String, String?>> getVaultData() async {
    final box = Hive.box(_vaultBoxName);
    return {
      'main': box.get('main') as String?,
      'hash': box.get('hash') as String?,
    };
  }

  // --- Settings Management ---

  dynamic getSetting(String key, {dynamic defaultValue}) {
    final box = Hive.box(_settingsBoxName);
    return box.get(key, defaultValue: defaultValue);
  }

  Future<void> setSetting(String key, dynamic value) async {
    final box = Hive.box(_settingsBoxName);
    await box.put(key, value);
  }

  // --- Secure Keys (for Biometrics/Auto-unlock) ---

  Future<void> saveSecureKey(String key, String value) async {
    await _secureStorage.write(key: key, value: value);
  }

  Future<String?> getSecureKey(String key) async {
    return await _secureStorage.read(key: key);
  }
}
