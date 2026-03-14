import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:animate_do/animate_do.dart';

class SettingsView extends StatefulWidget {
  const SettingsView({super.key});

  @override
  State<SettingsView> createState() => _SettingsViewState();
}

class _SettingsViewState extends State<SettingsView> {
  bool _preventScreenshots = true;
  bool _biometricEnabled = false;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          FadeInLeft(
            child: const Text(
              "إعدادات الأمان المتقدمة",
              style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
            ),
          ),
          const SizedBox(height: 20),
          Card(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
            child: Column(
              children: [
                SwitchListTile(
                  title: const Text("منع لقطات الشاشة"),
                  subtitle: const Text("يمنع تصوير أو تسجيل شاشة التطبيق لمزيد من الخصوصية"),
                  value: _preventScreenshots,
                  onChanged: (val) => setState(() => _preventScreenshots = val),
                  secondary: const Icon(LucideIcons.shieldAlert, color: Colors.red),
                ),
                const Divider(),
                SwitchListTile(
                  title: const Text("المصادقة الحيوية"),
                  subtitle: const Text("استخدام بصمة الأصبع أو الوجه لفتح الخزنة"),
                  value: _biometricEnabled,
                  onChanged: (val) => setState(() => _biometricEnabled = val),
                  secondary: const Icon(LucideIcons.fingerprint, color: Colors.blue),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          FadeInLeft(
            delay: const Duration(milliseconds: 200),
            child: const Text(
              "إجراءات الطوارئ",
              style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.red),
            ),
          ),
          const SizedBox(height: 20),
          Card(
            color: Colors.red.shade50,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15), side: BorderSide(color: Colors.red.shade200)),
            child: ListTile(
              title: const Text("إعداد وضع الطوارئ", style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold)),
              subtitle: const Text("تحديد إجراءات المسح الذاتي عند الخطر"),
              leading: const Icon(LucideIcons.zap, color: Colors.red),
              trailing: const Icon(LucideIcons.chevronLeft),
              onTap: () {},
            ),
          ),
          const SizedBox(height: 40),
          Center(
            child: Text(
              "تطبيق شفرشان - جميع الحقوق محفوظة",
              style: TextStyle(color: Colors.grey.shade500, fontSize: 12),
            ),
          )
        ],
      ),
    );
  }
}
