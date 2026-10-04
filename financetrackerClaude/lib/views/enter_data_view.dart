import 'package:flutter/material.dart';
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

  String? _validateAmount(String? v, {bool required = false}) {
    final text = v?.trim() ?? '';
    if (text.isEmpty) return required ? 'Required' : null;
    final n = double.tryParse(text);
    if (n == null) return 'Enter a number';
    if (n < 0) return 'Cannot be negative';
    return null;
  }

  double _parse(TextEditingController c) => double.tryParse(c.text.trim()) ?? 0;

  Future<void> _pickDate() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: _date,
      firstDate: now.subtract(const Duration(days: 365)),
      lastDate: now,
    );
    if (picked != null) setState(() => _date = picked);
  }

  void _save() {
    if (!_formKey.currentState!.validate()) return;
    final error = context.read<FinanceViewModel>().submit(
          date: _date,
          income: _parse(_income),
          savings: _parse(_savings),
          expenses: {
            for (final e in _expenses.entries) e.key: _parse(e.value),
          },
        );
    final messenger = ScaffoldMessenger.of(context);
    messenger.hideCurrentSnackBar();
    if (error != null) {
      messenger.showSnackBar(SnackBar(content: Text(error)));
      return;
    }
    messenger.showSnackBar(const SnackBar(content: Text('Day saved')));
    _formKey.currentState!.reset();
    _income.clear();
    _savings.clear();
    for (final c in _expenses.values) {
      c.clear();
    }
  }

  InputDecoration _decoration(String label) => InputDecoration(
        labelText: label,
        prefixText: '\$ ',
        border: const OutlineInputBorder(),
      );

  Widget _amountField(String label, TextEditingController c,
      {bool required = false}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextFormField(
        controller: c,
        decoration: _decoration(label),
        keyboardType: const TextInputType.numberWithOptions(decimal: true),
        validator: (v) => _validateAmount(v, required: required),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final d = _date;
    return Form(
      key: _formKey,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          ListTile(
            contentPadding: EdgeInsets.zero,
            leading: const Icon(Icons.calendar_today),
            title: Text('${d.month}/${d.day}/${d.year}'),
            subtitle: const Text('Date (saving again for a date replaces it)'),
            onTap: _pickDate,
          ),
          _amountField('Total income', _income, required: true),
          Text('Expenses by category', style: theme.textTheme.titleMedium),
          const SizedBox(height: 8),
          for (final c in ExpenseCategory.values)
            _amountField(c.label, _expenses[c]!),
          _amountField('Savings for the day', _savings, required: true),
          FilledButton.icon(
            onPressed: _save,
            icon: const Icon(Icons.save),
            label: const Text('Save'),
          ),
        ],
      ),
    );
  }
}
