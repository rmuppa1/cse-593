import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../models/expense_category.dart';
import '../viewmodels/finance_view_model.dart';

class EnterDataView extends StatefulWidget {
  const EnterDataView({super.key});

  @override
  State<EnterDataView> createState() => _EnterDataViewState();
}

class _EnterDataViewState extends State<EnterDataView> {
  final _formKey = GlobalKey<FormState>();
  final _income = TextEditingController();
  final _savings = TextEditingController();
  final _expenses = {
    for (final c in ExpenseCategory.values) c: TextEditingController(),
  };
  DateTime _date = DateTime.now();

  @override
  void dispose() {
    _income.dispose();
    _savings.dispose();
    for (final c in _expenses.values) {
      c.dispose();
    }
    super.dispose();
  }

  double _parse(TextEditingController c) => double.tryParse(c.text.trim()) ?? 0;

  String? _validate(String? v, {bool required = false}) {
    final t = v?.trim() ?? '';
    if (t.isEmpty) return required ? 'Required' : null;
    final n = double.tryParse(t);
    if (n == null) return 'Enter a valid number';
    if (n < 0) return 'Must not be negative';
    return null;
  }

  Future<void> _pickDate() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: _date,
      firstDate: now.subtract(const Duration(days: 6)),
      lastDate: now,
    );
    if (picked != null) setState(() => _date = picked);
  }

  void _submit() {
    if (!_formKey.currentState!.validate()) return;
    context.read<FinanceViewModel>().addRecord(
          date: _date,
          income: _parse(_income),
          savings: _parse(_savings),
          expenses: {
            for (final e in _expenses.entries) e.key: _parse(e.value),
          },
        );
    _formKey.currentState!.reset();
    _income.clear();
    _savings.clear();
    for (final c in _expenses.values) {
      c.clear();
    }
    ScaffoldMessenger.of(context)
        .showSnackBar(const SnackBar(content: Text('Daily record saved')));
  }

  Widget _field(String label, TextEditingController c, {bool required = false}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextFormField(
        controller: c,
        decoration: InputDecoration(
          labelText: label,
          prefixText: '\$ ',
          border: const OutlineInputBorder(),
        ),
        keyboardType: const TextInputType.numberWithOptions(decimal: true),
        inputFormatters: [
          FilteringTextInputFormatter.allow(RegExp(r'^\d*\.?\d{0,2}')),
        ],
        validator: (v) => _validate(v, required: required),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final d = _date;
    return Form(
      key: _formKey,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          ListTile(
            contentPadding: EdgeInsets.zero,
            leading: const Icon(Icons.calendar_today),
            title: Text('Date: ${d.month}/${d.day}/${d.year}'),
            trailing: TextButton(
                onPressed: _pickDate, child: const Text('Change')),
          ),
          _field('Total Income', _income, required: true),
          _field('Savings for the day', _savings, required: true),
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 8),
            child: Text('Expenses',
                style: Theme.of(context).textTheme.titleMedium),
          ),
          for (final e in _expenses.entries) _field(e.key.label, e.value),
          FilledButton(onPressed: _submit, child: const Text('Save')),
        ],
      ),
    );
  }
}
