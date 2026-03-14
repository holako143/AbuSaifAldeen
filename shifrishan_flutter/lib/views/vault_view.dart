import 'package:flutter/material.dart';
import 'package:animate_do/animate_do.dart';
import 'package:lucide_icons/lucide_icons.dart';

class VaultView extends StatefulWidget {
  const VaultView({super.key});

  @override
  State<VaultView> createState() => _VaultViewState();
}

class _VaultViewState extends State<VaultView> {
  bool _isUnlocked = false;
  final TextEditingController _masterPassController = TextEditingController();

  void _unlock() {
    if (_masterPassController.text.isNotEmpty) {
      setState(() => _isUnlocked = true);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (!_isUnlocked) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              FadeInDown(child: const Icon(LucideIcons.lock, size: 80, color: Colors.blue)),
              const SizedBox(height: 20),
              const Text("الخزنة مقفلة", style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
              const SizedBox(height: 10),
              const Text("أدخل كلمة المرور لفتح الخزنة السرية", textAlign: TextAlign.center),
              const SizedBox(height: 30),
              TextField(
                controller: _masterPassController,
                obscureText: true,
                decoration: const InputDecoration(
                  labelText: "كلمة المرور الرئيسية",
                  prefixIcon: Icon(LucideIcons.key),
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 20),
              ElevatedButton(
                onPressed: _unlock,
                style: ElevatedButton.styleFrom(minimumSize: const Size(double.infinity, 50)),
                child: const Text("فتح الخزنة"),
              )
            ],
          ),
        ),
      );
    }

    return FadeIn(
      child: Scaffold(
        appBar: AppBar(
          title: const Text("خزنتك السرية"),
          actions: [
            IconButton(icon: const Icon(LucideIcons.logOut), onPressed: () => setState(() => _isUnlocked = false)),
          ],
        ),
        body: ListView.builder(
          itemCount: 0, // In real app, bind to Hive
          itemBuilder: (context, index) => ListTile(
            leading: const Icon(LucideIcons.file),
            title: const Text("مثال لعنصر مشفر"),
          ),
        ),
        floatingActionButton: FloatingActionButton(
          onPressed: () {},
          child: const Icon(LucideIcons.plus),
        ),
      ),
    );
  }
}
