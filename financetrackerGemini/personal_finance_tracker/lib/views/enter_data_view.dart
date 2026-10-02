// Feature 1 View: Form to validate and submit daily income, expenses, category breakdown, and savings.
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
  final _incomeController = TextEditingController();
  final _savingsController = TextEditingController();
  final Map<ExpenseCategory, TextEditingController> _categoryControllers = {
    for (var cat in ExpenseCategory.values) cat: TextEditingController(),
  };

  @override
  void dispose() {
    _incomeController.dispose();
    _savingsController.dispose();
    for (var c in _categoryControllers.values) {
      c.dispose();
    }
    super.dispose();
  }

  void _submitData() {
    if (!_formKey.currentState!.validate()) return;

    final income = double.tryParse(_incomeController.text) ?? 0.0;
    final savings = double.tryParse(_savingsController.text) ?? 0.0;

    final categoryMap = <ExpenseCategory, double>{};
    double totalExpenses = 0.0;

    for (final entry in _categoryControllers.entries) {
      final amount = double.tryParse(entry.value.text) ?? 0.0;
      categoryMap[entry.key] = amount;
      totalExpenses += amount;
    }

    final vm = context.read<FinanceViewModel>();
    final success = vm.addDailyRecord(
      income: income,
      expenses: totalExpenses,
      categoryExpenses: categoryMap,
      savings: savings,
    );

    if (success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Saved record (${vm.dayCount}/7 days tracked). Total Expenses: \$${totalExpenses.toStringAsFixed(2)}',
          ),
          backgroundColor: Colors.teal,
        ),
      );
      _incomeController.clear();
      _savingsController.clear();
      for (var c in _categoryControllers.values) {
        c.clear();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Enter Financial Data')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              TextFormField(
                controller: _incomeController,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                decoration: const InputDecoration(
                  labelText: 'Total Income (\$)',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.attach_money),
                ),
                validator: (v) =>
                    (v == null || double.tryParse(v) == null) ? 'Enter valid income' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _savingsController,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                decoration: const InputDecoration(
                  labelText: 'Savings for the Day (\$)',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.savings),
                ),
                validator: (v) =>
                    (v == null || double.tryParse(v) == null) ? 'Enter valid savings' : null,
              ),
              const SizedBox(height: 20),
              const Text(
                'Expense Categories (\$)',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              ...ExpenseCategory.values.map(
                (category) => Padding(
                  padding: const EdgeInsets.only(bottom: 10.0),
                  child: TextFormField(
                    controller: _categoryControllers[category],
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    decoration: InputDecoration(
                      labelText: category.displayName,
                      border: const OutlineInputBorder(),
                      prefixText: '\$ ',
                    ),
                    validator: (v) =>
                        (v != null && v.isNotEmpty && double.tryParse(v) == null)
                            ? 'Invalid amount'
                            : null,
                  ),
                ),
              ),
              const SizedBox(height: 16),
              ElevatedButton.icon(
                onPressed: _submitData,
                icon: const Icon(Icons.check),
                label: const Text('Save Daily Record', style: TextStyle(fontSize: 16)),
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  backgroundColor: Colors.teal,
                  foregroundColor: Colors.white,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
