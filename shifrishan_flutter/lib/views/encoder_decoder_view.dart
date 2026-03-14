import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shifrishan_flutter/core/emoji_steganography.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:animate_do/animate_do.dart';
import 'package:shifrishan_flutter/views/home_view.dart';

class EncoderDecoderView extends StatefulWidget {
  const EncoderDecoderView({super.key});

  @override
  State<EncoderDecoderView> createState() => _EncoderDecoderViewState();
}

class _EncoderDecoderViewState extends State<EncoderDecoderView> {
  final TextEditingController _inputController = TextEditingController();
  final TextEditingController _outputController = TextEditingController();
  final List<TextEditingController> _passwordControllers = [TextEditingController()];
  bool _isEncoding = true;
  bool _isPasswordEnabled = false;

  void _process() async {
    if (_inputController.text.isEmpty) {
      setState(() => _outputController.text = "");
      return;
    }

    try {
      final List<String> passwords = _isPasswordEnabled
          ? _passwordControllers.map((c) => c.text).where((p) => p.isNotEmpty).toList()
          : [];

      String result;
      if (_isEncoding) {
        result = await EmojiSteganography.encode(
          emoji: "😀",
          text: _inputController.text,
          passwords: passwords
        );
      } else {
        result = await EmojiSteganography.decode(
          text: _inputController.text,
          passwords: passwords
        );
      }

      setState(() {
        _outputController.text = result;
      });
    } catch (e) {
      setState(() => _outputController.text = "");
    }
  }

  @override
  Widget build(BuildContext context) {
    return Consumer(
      builder: (context, ref, child) {
        return SingleChildScrollView(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            children: [
              FadeInDown(
                child: Card(
                  elevation: 4,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                  child: Padding(
                    padding: const EdgeInsets.all(20.0),
                    child: Column(
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text("فك التشفير", style: TextStyle(fontWeight: _isEncoding ? FontWeight.normal : FontWeight.bold)),
                            Switch(
                              value: _isEncoding,
                              onChanged: (val) => setState(() => _isEncoding = val),
                              activeColor: Colors.blue,
                            ),
                            Text("تشفير", style: TextStyle(fontWeight: _isEncoding ? FontWeight.bold : FontWeight.normal)),
                          ],
                        ),
                        const SizedBox(height: 20),
                        TextField(
                          controller: _inputController,
                          maxLines: 4,
                          decoration: InputDecoration(
                            labelText: "أدخل النص المراد معالجته",
                            hintText: "اكتب هنا...",
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(15)),
                            prefixIcon: const Icon(LucideIcons.type),
                          ),
                          onChanged: (_) => _process(),
                        ),
                        const SizedBox(height: 15),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                          children: [
                            IconButton(
                              icon: const Icon(LucideIcons.clipboard),
                              onPressed: () {}, // Implement paste
                              tooltip: "لصق",
                            ),
                            IconButton(
                              icon: const Icon(LucideIcons.trash2, color: Colors.red),
                              onPressed: () => setState(() => _inputController.clear()),
                              tooltip: "مسح",
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 20),
              FadeInUp(
                child: Card(
                  elevation: 2,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                  color: Theme.of(context).colorScheme.secondaryContainer.withOpacity(0.3),
                  child: Padding(
                    padding: const EdgeInsets.all(20.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text("الناتج:", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                            GestureDetector(
                              onDoubleTap: () {
                                if (!_isEncoding && (_inputController.text == 'إخفاء' || _inputController.text == 'hide')) {
                                  ref.read(steganographyVisibleProvider.notifier).state = true;
                                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("تم كشف تبويب الصور! 🖼️")));
                                }
                                if (!_isEncoding && _inputController.text == 'خزنة') {
                                  ref.read(vaultVisibleProvider.notifier).state = true;
                                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("تم كشف الخزنة السرية! 🔐")));
                                }
                              },
                              child: const Icon(LucideIcons.star, color: Colors.amber, size: 24),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        TextField(
                          controller: _outputController,
                          maxLines: 4,
                          readOnly: true,
                          decoration: InputDecoration(
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(15)),
                            filled: true,
                            fillColor: Theme.of(context).colorScheme.surface,
                          ),
                        ),
                        const SizedBox(height: 10),
                        ElevatedButton.icon(
                          onPressed: () {}, // Implement copy
                          icon: const Icon(LucideIcons.copy),
                          label: const Text("نسخ الناتج"),
                          style: ElevatedButton.styleFrom(
                            minimumSize: const Size(double.infinity, 45),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      }
    );
  }
}
