import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:animate_do/animate_do.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shifrishan_flutter/views/encoder_decoder_view.dart';
import 'package:shifrishan_flutter/views/steganography_view.dart';
import 'package:shifrishan_flutter/views/vault_view.dart';
import 'package:shifrishan_flutter/views/settings_view.dart';
import 'package:shifrishan_flutter/widgets/custom_sidebar.dart';

final activeViewProvider = StateProvider<String>((ref) => 'encoder-decoder');
final steganographyVisibleProvider = StateProvider<bool>((ref) => false);
final vaultVisibleProvider = StateProvider<bool>((ref) => false);

class HomeView extends ConsumerWidget {
  const HomeView({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final activeView = ref.watch(activeViewProvider);
    final scaffoldKey = GlobalKey<ScaffoldState>();

    return Scaffold(
      key: scaffoldKey,
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        flexibleSpace: Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                Theme.of(context).colorScheme.surface.withOpacity(0.8),
                Theme.of(context).colorScheme.surface.withOpacity(0.1),
              ],
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
            ),
          ),
        ),
        title: FadeInDown(
          child: GestureDetector(
            onDoubleTap: () {
               ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text("تم تفعيل وضع الأمان العالي 🛡️")),
              );
            },
            child: Row(
              children: [
                const Icon(LucideIcons.shieldCheck, color: Colors.blue, size: 28),
                const SizedBox(width: 10),
                Text(
                  'شفرشان',
                  style: GoogleFonts.notoKufiArabic(fontWeight: FontWeight.bold, fontSize: 20),
                ),
              ],
            ),
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.menu),
            onPressed: () => scaffoldKey.currentState?.openEndDrawer(),
          ),
        ],
        centerTitle: false,
      ),
      endDrawer: const CustomSidebar(),
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              Theme.of(context).colorScheme.primaryContainer.withOpacity(0.2),
              Theme.of(context).colorScheme.surface,
            ],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: SafeArea(
          child: AnimatedSwitcher(
            duration: const Duration(milliseconds: 400),
            transitionBuilder: (Widget child, Animation<double> animation) {
              return FadeTransition(opacity: animation, child: child);
            },
            child: _buildContent(activeView),
          ),
        ),
      ),
    );
  }

  Widget _buildContent(String view) {
    switch (view) {
      case 'encoder-decoder':
        return const EncoderDecoderView();
      case 'steganography':
        return const SteganographyView();
      case 'vault':
        return const VaultView();
      case 'settings':
        return const SettingsView();
      default:
        return const EncoderDecoderView();
    }
  }
}
