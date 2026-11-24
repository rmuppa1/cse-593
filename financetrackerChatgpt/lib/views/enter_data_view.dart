import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
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
  late final Map<ExpenseCategory, TextEditingController> _expenseControllers;
  DateTime _selectedDate = DateTime.now();

  @override
  void initState() {
    super.initState();
    _expenseControllers = {
      for (final category in ExpenseCategory.values)
        category: TextEditingController(),
    };
    for (final controller in _expenseControllers.values) {
      controller.addListener(_refreshTotal);
    }
  }

  void _refreshTotal() => setState(() {});

  double get _totalExpenses => _expenseControllers.values.fold(
    0,
    (total, controller) => total + (double.tryParse(controller.text) ?? 0),
  );

  @override
  void dispose() {
    _incomeController.dispose();
    _savingsController.dispose();
    for (final controller in _expenseControllers.values) {
      controller.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Form(
      key: _formKey,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
        children: [
          _DateSelector(date: _selectedDate, onPressed: _selectDate),
          const SizedBox(height: 20),
          Text(
            'Income & savings',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 12),
          _MoneyField(
            controller: _incomeController,
            label: 'Total income',
            icon: Icons.trending_up,
            required: true,
          ),
          const SizedBox(height: 12),
          _MoneyField(
            controller: _savingsController,
            label: 'Savings',
            icon: Icons.savings_outlined,
            required: true,
          ),
          const SizedBox(height: 24),
          Row(
            children: [
              Expanded(
                child: Text(
                  'Expenses by category',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
              ),
              Text(
                NumberFormat.simpleCurrency().format(_totalExpenses),
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  color: Theme.of(context).colorScheme.error,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            'Your total expenses are calculated from these categories.',
            style: Theme.of(context).textTheme.bodySmall,
          ),
          const SizedBox(height: 12),
          for (final category in ExpenseCategory.values) ...[
            _MoneyField(
              controller: _expenseControllers[category]!,
              label: category.label,
              icon: _iconFor(category),
            ),
            const SizedBox(height: 12),
          ],
          const SizedBox(height: 8),
          FilledButton.icon(
            onPressed: _submit,
            icon: const Icon(Icons.check_circle_outline),
            label: const Padding(
              padding: EdgeInsets.symmetric(vertical: 14),
              child: Text('Save daily record'),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _selectDate() async {
    final today = DateUtils.dateOnly(DateTime.now());
    final selected = await showDatePicker(
      context: context,
      initialDate: DateUtils.dateOnly(_selectedDate),
      firstDate: today.subtract(const Duration(days: 6)),
      lastDate: today,
      helpText: 'Select one of the most recent 7 days',
    );
    if (selected != null) setState(() => _selectedDate = selected);
  }

  void _submit() {
    if (!_formKey.currentState!.validate()) return;
    FocusScope.of(context).unfocus();

    context.read<FinanceViewModel>().saveRecord(
      date: _selectedDate,
      income: double.parse(_incomeController.text),
      savings: double.parse(_savingsController.text),
      expensesByCategory: {
        for (final category in ExpenseCategory.values)
          category: double.tryParse(_expenseControllers[category]!.text) ?? 0,
      },
    );

    _incomeController.clear();
    _savingsController.clear();
    for (final controller in _expenseControllers.values) {
      controller.clear();
    }
    setState(() => _selectedDate = DateTime.now());
    ScaffoldMessenger.of(context)
        .showSnackBar(const SnackBar(content: Text('Daily record saved.')));
  }

  IconData _iconFor(ExpenseCategory category) => switch (category) {
    ExpenseCategory.food => Icons.restaurant_outlined,
    ExpenseCategory.entertainment => Icons.movie_outlined,
    ExpenseCategory.transportation => Icons.directions_car_outlined,
    ExpenseCategory.rentMortgage => Icons.home_outlined,
    ExpenseCategory.miscellaneous => Icons.more_horiz,
  };
}

class _DateSelector extends StatelessWidget {
  const _DateSelector({required this.date, required this.onPressed});

  final DateTime date;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return Card(
      color: Theme.of(context).colorScheme.primaryContainer,
      child: ListTile(
        leading: const Icon(Icons.calendar_today_outlined),
        title: const Text('Record date'),
        subtitle: Text(DateFormat.yMMMMd().format(date)),
        trailing: const Icon(Icons.edit_calendar_outlined),
        onTap: onPressed,
      ),
    );
  }
}

class _MoneyField extends StatelessWidget {
  const _MoneyField({
    required this.controller,
    required this.label,
    required this.icon,
    this.required = false,
  });

  final TextEditingController controller;
  final String label;
  final IconData icon;
  final bool required;

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: controller,
      keyboardType: const TextInputType.numberWithOptions(decimal: true),
      inputFormatters: [
        FilteringTextInputFormatter.allow(RegExp(r'^\d*\.?\d{0,2}')),
      ],
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: Icon(icon),
        prefixText: r'$ ',
      ),
      validator: (value) {
        if ((value == null || value.trim().isEmpty) && required) {
          return 'Enter an amount';
        }
        if (value != null &&
            value.isNotEmpty &&
            double.tryParse(value) == null) {
          return 'Enter a valid amount';
        }
        return null;
      },
    );
  }
}
