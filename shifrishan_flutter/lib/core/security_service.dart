import 'package:flutter/material.dart';
import 'package:local_auth/local_auth.dart';
import 'package:shifrishan_flutter/core/storage_service.dart';

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

  // --- Panic Mode Logic ---

  Future<void> triggerPanicMode() async {
    // Clear all sensitive data
    // In a real app, this would wipe Hive boxes
    debugPrint("Panic Mode Triggered: Wiping all data...");
  }

  // --- Decoy Vault Logic ---

  bool isDecoyPassword(String password) {
    final decoyPass = _storage.getSetting('decoy_password');
    return decoyPass != null && password == decoyPass;
  }
}
