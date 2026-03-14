import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:animate_do/animate_do.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shifrishan_flutter/views/home_view.dart';
import 'package:shifrishan_flutter/views/calculator_view.dart';

class CustomSidebar extends ConsumerWidget {
  const CustomSidebar({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final stegoVisible = ref.watch(steganographyVisibleProvider);
    final vaultVisible = ref.watch(vaultVisibleProvider);

    return Drawer(
      child: Column(
        children: [
          DrawerHeader(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [Colors.blue.shade800, Colors.blue.shade500],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
            ),
            child: const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(LucideIcons.shieldCheck, color: Colors.white, size: 50),
                  SizedBox(height: 10),
                  Text(
                    'شفرشان',
                    style: TextStyle(color: Colors.white, fontSize: 26, fontWeight: FontWeight.bold, letterSpacing: 1.2),
                  ),
                ],
              ),
            ),
          ),
          Expanded(
            child: ListView(
              padding: EdgeInsets.zero,
              children: [
                _buildItem(ref, context, 'الرئيسية', LucideIcons.home, 'encoder-decoder'),
                if (stegoVisible)
                  _buildItem(ref, context, 'تشفير الصور', LucideIcons.image, 'steganography'),
                if (vaultVisible)
                  _buildItem(ref, context, 'الخزنة السرية', LucideIcons.archive, 'vault'),
                const Divider(indent: 20, endIndent: 20),
                _buildItem(ref, context, 'إدارة الإيموجي', LucideIcons.smile, 'emoji-mgmt'),
                _buildItem(ref, context, 'تاريخ العمليات', LucideIcons.history, 'history'),
                _buildItem(ref, context, 'الإعدادات', LucideIcons.settings, 'settings'),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(20.0),
            child: TextButton.icon(
              onPressed: () => ref.read(isAppUnlockedProvider.notifier).state = false,
              icon: const Icon(LucideIcons.lock, size: 16),
              label: const Text("قفل التطبيق فوراً"),
              style: TextButton.styleFrom(foregroundColor: Colors.grey),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildItem(WidgetRef ref, BuildContext context, String title, IconData icon, String view) {
    final activeView = ref.watch(activeViewProvider);
    final isSelected = activeView == view;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      child: ListTile(
        leading: Icon(icon, color: isSelected ? Colors.blue : null),
        title: Text(
          title,
          style: TextStyle(
            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
            color: isSelected ? Colors.blue : null,
          ),
        ),
        selected: isSelected,
        selectedTileColor: Colors.blue.withOpacity(0.1),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
        onTap: () {
          ref.read(activeViewProvider.notifier).state = view;
          Navigator.pop(context);
        },
      ),
    );
  }
}
