import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../models/daily_record.dart';
import '../models/expense_category.dart';
import '../viewmodels/finance_view_model.dart';
import 'widgets/finance_summary_card.dart';

class ViewFinancesView extends StatelessWidget {
  const ViewFinancesView({super.key});

  @override
  Widget build(BuildContext context) {
    final viewModel = context.watch<FinanceViewModel>();
    final summary = viewModel.summary;

    if (viewModel.records.isEmpty) {
      return const _EmptyFinances();
    }

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
      children: [
        Text(
          '${summary.dayCount}-day summary',
          style: Theme.of(context).textTheme.titleLarge,
        ),
        const SizedBox(height: 12),
        FinanceSummaryCard(
          label: 'Total income',
          amount: summary.totalIncome,
          icon: Icons.trending_up,
          color: const Color(0xFF147D64),
          caption: 'Avg. ${_money(summary.averageDailyIncome)} per day',
        ),
        const SizedBox(height: 10),
        FinanceSummaryCard(
          label: 'Total expenses',
          amount: summary.totalExpenses,
          icon: Icons.trending_down,
          color: const Color(0xFFB54747),
          caption: 'Avg. ${_money(summary.averageDailyExpenses)} per day',
        ),
        const SizedBox(height: 10),
        FinanceSummaryCard(
          label: 'Total savings',
          amount: summary.totalSavings,
          icon: Icons.savings_outlined,
          color: const Color(0xFF3266A8),
          caption: 'Avg. ${_money(summary.averageDailySavings)} per day',
        ),
        const SizedBox(height: 24),
        Text('Daily activity', style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: 12),
        for (final record in viewModel.records) ...[
          _DailyRecordCard(record: record),
          const SizedBox(height: 10),
        ],
      ],
    );
  }

  static String _money(double amount) =>
      NumberFormat.simpleCurrency().format(amount);
}

class _DailyRecordCard extends StatelessWidget {
  const _DailyRecordCard({required this.record});

  final DailyRecord record;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ExpansionTile(
        leading: CircleAvatar(child: Text(DateFormat.d().format(record.date))),
        title: Text(DateFormat.EEEE().format(record.date)),
        subtitle: Text(DateFormat.yMMMd().format(record.date)),
        trailing: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(
              'Income ${_money(record.income)}',
              style: const TextStyle(color: Color(0xFF147D64)),
            ),
            Text(
              'Spent ${_money(record.totalExpenses)}',
              style: const TextStyle(color: Color(0xFFB54747)),
            ),
          ],
        ),
        children: [
          const Divider(height: 1),
          for (final category in ExpenseCategory.values)
            ListTile(
              dense: true,
              title: Text(category.label),
              trailing: Text(_money(record.expensesByCategory[category]!)),
            ),
          ListTile(
            dense: true,
            title: const Text('Savings'),
            trailing: Text(
              _money(record.savings),
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );
  }

  String _money(double amount) => NumberFormat.simpleCurrency().format(amount);
}

class _EmptyFinances extends StatelessWidget {
  const _EmptyFinances();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.receipt_long_outlined,
              size: 64,
              color: Theme.of(context).colorScheme.primary,
            ),
            const SizedBox(height: 16),
            Text(
              'No records yet',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            const Text(
              'Enter today\'s income, categorized expenses, and savings to build your 7-day view.',
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
