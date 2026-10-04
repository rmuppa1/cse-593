import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/daily_record.dart';
import '../models/expense_category.dart';
import '../viewmodels/finance_view_model.dart';
import 'widgets/finance_summary_card.dart';

class ViewFinancesView extends StatelessWidget {
  const ViewFinancesView({super.key});

  @override
  Widget build(BuildContext context) {
    final vm = context.watch<FinanceViewModel>();
    final records = vm.records;
    if (records.isEmpty) {
      return const Center(child: Text('No data yet. Add a day first.'));
    }
    final s = vm.summary;
    final theme = Theme.of(context);
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text('Last ${s.dayCount} day(s)', style: theme.textTheme.titleMedium),
        const SizedBox(height: 8),
        GridView.count(
          crossAxisCount: 3,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          childAspectRatio: 1.1,
          children: [
            FinanceSummaryCard(
                label: 'Income', amount: s.totalIncome, color: Colors.green),
            FinanceSummaryCard(
                label: 'Expenses', amount: s.totalExpenses, color: Colors.red),
            FinanceSummaryCard(
                label: 'Savings', amount: s.totalSavings, color: Colors.blue),
          ],
        ),
        const SizedBox(height: 8),
        Text('Daily income vs. expenses', style: theme.textTheme.titleMedium),
        const SizedBox(height: 8),
        _BarChart(records: records),
        const SizedBox(height: 16),
        Text('Spending by category', style: theme.textTheme.titleMedium),
        for (final c in ExpenseCategory.values)
          ListTile(
            dense: true,
            title: Text(c.label),
            trailing: Text(formatDollars(s.categoryTotals[c] ?? 0)),
          ),
        const Divider(),
        Text('Daily history', style: theme.textTheme.titleMedium),
        for (final r in records.reversed)
          ListTile(
            title: Text('${r.date.month}/${r.date.day}/${r.date.year}'),
            subtitle: Text('Income ${formatDollars(r.income)} • '
                'Expenses ${formatDollars(r.totalExpenses)} • '
                'Savings ${formatDollars(r.savings)}'),
          ),
      ],
    );
  }
}

class _BarChart extends StatelessWidget {
  final List<DailyRecord> records;

  const _BarChart({required this.records});

  @override
  Widget build(BuildContext context) {
    var maxVal = 0.0;
    for (final r in records) {
      if (r.income > maxVal) maxVal = r.income;
      if (r.totalExpenses > maxVal) maxVal = r.totalExpenses;
    }
    if (maxVal == 0) maxVal = 1;
    const chartHeight = 120.0;

    Widget bar(double v, Color color) => Container(
          width: 12,
          height: chartHeight * v / maxVal,
          margin: const EdgeInsets.symmetric(horizontal: 1),
          color: color,
        );

    return Column(
      children: [
        SizedBox(
          height: chartHeight + 20,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              for (final r in records)
                Column(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        bar(r.income, Colors.green),
                        bar(r.totalExpenses, Colors.red),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text('${r.date.month}/${r.date.day}',
                        style: Theme.of(context).textTheme.labelSmall),
                  ],
                ),
            ],
          ),
        ),
        const SizedBox(height: 4),
        const Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.square, size: 12, color: Colors.green),
            Text(' Income   '),
            Icon(Icons.square, size: 12, color: Colors.red),
            Text(' Expenses'),
          ],
        ),
      ],
    );
  }
}
