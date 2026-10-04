import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../viewmodels/finance_view_model.dart';
import 'widgets/finance_summary_card.dart';

class ViewFinancesView extends StatelessWidget {
  const ViewFinancesView({super.key});

  @override
  Widget build(BuildContext context) {
    final vm = context.watch<FinanceViewModel>();
    if (vm.records.isEmpty) {
      return const Center(child: Text('No data yet. Enter your first day.'));
    }
    final maxValue = vm.records
        .map((r) => r.income > r.totalExpenses ? r.income : r.totalExpenses)
        .fold(0.0, (a, b) => a > b ? a : b);

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text('Last ${vm.records.length} day(s)',
            style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 8),
        GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          childAspectRatio: 2,
          children: [
            FinanceSummaryCard(
                title: 'Total Income',
                amount: vm.totalIncome,
                color: Colors.green),
            FinanceSummaryCard(
                title: 'Total Expenses',
                amount: vm.totalExpenses,
                color: Colors.red),
            FinanceSummaryCard(
                title: 'Total Savings',
                amount: vm.totalSavings,
                color: Colors.blue),
            FinanceSummaryCard(
                title: 'Avg Daily Expenses', amount: vm.averageDailyExpenses),
          ],
        ),
        const SizedBox(height: 16),
        Text('Spending by Category',
            style: Theme.of(context).textTheme.titleMedium),
        for (final e in vm.categoryTotals.entries)
          ListTile(
            dense: true,
            title: Text(e.key.label),
            trailing: Text('\$${e.value.toStringAsFixed(2)}'),
          ),
        const SizedBox(height: 16),
        Text('Daily History', style: Theme.of(context).textTheme.titleMedium),
        for (final r in vm.records.reversed)
          Card(
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('${r.date.month}/${r.date.day}/${r.date.year}',
                      style: const TextStyle(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  Text('Income: \$${r.income.toStringAsFixed(2)}'),
                  Text('Expenses: \$${r.totalExpenses.toStringAsFixed(2)}'),
                  Text('Savings: \$${r.savings.toStringAsFixed(2)}'),
                  const SizedBox(height: 8),
                  _bar(Colors.green, r.income, maxValue),
                  const SizedBox(height: 4),
                  _bar(Colors.red, r.totalExpenses, maxValue),
                ],
              ),
            ),
          ),
      ],
    );
  }

  Widget _bar(Color color, double value, double max) => LinearProgressIndicator(
        value: max <= 0 ? 0 : value / max,
        color: color,
        minHeight: 8,
      );
}
