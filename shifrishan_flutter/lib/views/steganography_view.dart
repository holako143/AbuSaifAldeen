import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import 'package:shifrishan_flutter/core/image_steganography.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'dart:typed_data';
import 'package:animate_do/animate_do.dart';

class SteganographyView extends StatefulWidget {
  const SteganographyView({super.key});

  @override
  State<SteganographyView> createState() => _SteganographyViewState();
}

class _SteganographyViewState extends State<SteganographyView> {
  Uint8List? _coverImage;
  Uint8List? _resultImage;
  final TextEditingController _secretController = TextEditingController();
  bool _isProcessing = false;

  Future<void> _pickImage() async {
    final result = await FilePicker.platform.pickFiles(type: FileType.image);
    if (result != null) {
      setState(() {
        _coverImage = result.files.first.bytes;
        _resultImage = null;
      });
    }
  }

  void _hideData() async {
    if (_coverImage == null || _secretController.text.isEmpty) return;

    setState(() => _isProcessing = true);
    try {
      final result = await ImageSteganography.hideData(
        coverImageBytes: _coverImage!,
        data: _secretController.text,
        passwords: [], // Can add multiple password logic here
      );
      setState(() {
        _resultImage = result;
      });
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("تم إخفاء البيانات بنجاح!")));
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("خطأ: $e")));
    } finally {
      setState(() => _isProcessing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return FadeInUp(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            GestureDetector(
              onTap: _pickImage,
              child: Container(
                height: 200,
                width: double.infinity,
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.grey.shade300, style: BorderStyle.solid),
                  borderRadius: BorderRadius.circular(12),
                  color: Colors.grey.shade50,
                ),
                child: _coverImage != null
                  ? ClipRRect(borderRadius: BorderRadius.circular(12), child: Image.memory(_coverImage!, fit: BoxFit.cover))
                  : const Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(LucideIcons.upload, size: 40, color: Colors.blue),
                        SizedBox(height: 10),
                        Text("اضغط لاختيار صورة الغلاف"),
                      ],
                    ),
              ),
            ),
            const SizedBox(height: 20),
            TextField(
              controller: _secretController,
              maxLines: 4,
              decoration: const InputDecoration(
                labelText: "النص السري المراد إخفاؤه",
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 20),
            ElevatedButton.icon(
              onPressed: _isProcessing ? null : _hideData,
              icon: _isProcessing ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2)) : const Icon(LucideIcons.eyeOff),
              label: const Text("تشفير وإخفاء في الصورة"),
              style: ElevatedButton.styleFrom(minimumSize: const Size(double.infinity, 50)),
            ),
            if (_resultImage != null) ...[
              const SizedBox(height: 20),
              const Text("النتيجة:", style: TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 10),
              Image.memory(_resultImage!),
            ]
          ],
        ),
      ),
    );
  }
}
