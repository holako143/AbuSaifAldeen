import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shifrishan_flutter/views/home_view.dart';
import 'package:animate_do/animate_do.dart';

final isAppUnlockedProvider = StateProvider<bool>((ref) => false);

class CalculatorView extends StatefulWidget {
  const CalculatorView({super.key});

  @override
  State<CalculatorView> createState() => _CalculatorViewState();
}

class _CalculatorViewState extends State<CalculatorView> {
  String _display = '0';
  String _input = '';
  int _equalClickCount = 0;
  DateTime? _lastEqualClick;

  void _onPressed(String label) {
    setState(() {
      if (label == 'C') {
        _display = '0';
        _input = '';
        _equalClickCount = 0;
      } else if (label == '=') {
        final now = DateTime.now();
        if (_input == '143') {
          if (_lastEqualClick != null && now.difference(_lastEqualClick!) < const Duration(seconds: 2)) {
            _equalClickCount++;
          } else {
            _equalClickCount = 1;
          }
          _lastEqualClick = now;

          if (_equalClickCount >= 2) {
             // UNLOCK REAL APP
             ProviderScope.containerOf(context).read(isAppUnlockedProvider.notifier).state = true;
          }
        }
        // Normal calc logic would go here
      } else {
        if (_display == '0') {
          _display = label;
          _input = label;
        } else {
          _display += label;
          _input += label;
        }
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: Container(
                alignment: Alignment.bottomRight,
                padding: const EdgeInsets.all(24),
                child: Text(
                  _display,
                  style: const TextStyle(color: Colors.white, fontSize: 60, fontWeight: FontWeight.w300),
                ),
              ),
            ),
            _buildKeypad(),
          ],
        ),
      ),
    );
  }

  Widget _buildKeypad() {
    final List<List<String>> keys = [
      ['C', '±', '%', '÷'],
      ['7', '8', '9', '×'],
      ['4', '5', '6', '-'],
      ['1', '2', '3', '+'],
      ['0', '.', '=']
    ];

    return Column(
      children: keys.map((row) {
        return Row(
          children: row.map((key) {
            return _buildButton(key);
          }).toList(),
        );
      }).toList(),
    );
  }

  Widget _buildButton(String label) {
    final isOperator = ['÷', '×', '-', '+', '='].contains(label);
    final isSpecial = ['C', '±', '%'].contains(label);

    return Expanded(
      flex: label == '0' ? 2 : 1,
      child: Padding(
        padding: const EdgeInsets.all(8.0),
        child: InkWell(
          onTap: () => _onPressed(label),
          borderRadius: BorderRadius.circular(50),
          child: Container(
            height: 70,
            decoration: BoxDecoration(
              shape: label == '0' ? BoxShape.rectangle : BoxShape.circle,
              borderRadius: label == '0' ? BorderRadius.circular(50) : null,
              color: isOperator ? Colors.orange : (isSpecial ? Colors.grey : Colors.grey.shade900),
            ),
            alignment: Alignment.center,
            child: Text(
              label,
              style: TextStyle(
                color: isSpecial ? Colors.black : Colors.white,
                fontSize: 28,
                fontWeight: FontWeight.bold
              ),
            ),
          ),
        ),
      ),
    );
  }
}
