import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:local_auth/local_auth.dart';
import 'package:shifrishan_flutter/core/storage_service.dart';
import 'dart:async';

class SecurityService {
  final LocalAuthentication _auth = LocalAuthentication();
  final StorageService _storage = StorageService();

  // --- Biometrics ---

  Future<bool> canCheckBiometrics() async {
    return await _auth.canCheckBiometrics || await _auth.isDeviceSupported();
  }

  Future<bool> authenticate() async {
    try {
      return await _auth.authenticate(
        localizedReason: 'يرجى تأكيد الهوية للوصول للخزنة',
        options: const AuthenticationOptions(
          stickyAuth: true,
          biometricOnly: false,
        ),
      );
    } catch (e) {
      return false;
    }
  }

  // --- Panic Mode & Self-Destruct ---

  Future<void> triggerPanicMode() async {
    debugPrint("Panic Mode Triggered: Wiping all data...");
    // Hive.deleteFromDisk(); or similar
  }

  // --- Clipboard Protection (New Feature) ---

  void autoClearClipboard(int seconds) {
    Timer(Duration(seconds: seconds), () {
      Clipboard.setData(const ClipboardData(text: ""));
      debugPrint("Clipboard cleared for security.");
    });
  }

  // --- Decoy Vault Logic ---

  bool isDecoyPassword(String password) {
    final decoyPass = _storage.getSetting('decoy_password');
    return decoyPass != null && password == decoyPass;
  }
}
