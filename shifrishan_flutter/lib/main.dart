import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shifrishan_flutter/views/home_view.dart';
import 'package:shifrishan_flutter/views/calculator_view.dart';
import 'package:shifrishan_flutter/core/storage_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final storage = StorageService();
  await storage.init();

  runApp(
    const ProviderScope(
      child: ShifrishanApp(),
    ),
  );
}

class ShifrishanApp extends ConsumerWidget {
  const ShifrishanApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isUnlocked = ref.watch(isAppUnlockedProvider);

    return MaterialApp(
      title: 'Shifrishan',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF3b82f6),
          brightness: Brightness.light,
        ),
        textTheme: GoogleFonts.notoKufiArabicTextTheme(),
      ),
      darkTheme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF3b82f6),
          brightness: Brightness.dark,
        ),
        textTheme: GoogleFonts.notoKufiArabicTextTheme(),
      ),
      themeMode: ThemeMode.system,
      home: AnimatedSwitcher(
        duration: const Duration(milliseconds: 800),
        child: isUnlocked ? const HomeView() : const CalculatorView(),
      ),
    );
  }
}
