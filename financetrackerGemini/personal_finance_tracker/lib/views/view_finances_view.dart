// Feature 2 View: Displays the 7-day activity history and cumulative summary cards.
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../viewmodels/finance_view_model.dart';
import 'widgets/finance_summary_card.dart';

class ViewFinancesView extends StatelessWidget {
  const ViewFinancesView({super.key});

  void _confirmClear(BuildContext context, FinanceViewModel vm) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Clear Entire Daily Log?'),
        content: const Text(
          'Are you sure you want to clear all in-memory records? This action cannot be undone.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Cancel'),
          ),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () {
              vm.clearAllRecords();
              Navigator.of(ctx).pop();
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('All daily records have been cleared.'),
                  backgroundColor: Colors.redAccent,
                ),
              );
            },
            child: const Text('Clear All'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final vm = context.watch<FinanceViewModel>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('View My Finances (7 Days)'),
        actions: [
          if (vm.records.isNotEmpty)
            IconButton(
              icon: const Icon(Icons.delete_sweep),
              tooltip: 'Clear Entire Daily Log',
              onPressed: () => _confirmClear(context, vm),
            ),
        ],
      ),
      body: vm.records.isEmpty
          ? const Center(
              child: Padding(
                padding: EdgeInsets.all(24.0),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.receipt_long, size: 64, color: Colors.grey),
                    SizedBox(height: 12),
                    Text(
                      'No financial data entered yet.\nUse "Enter Data" to log your daily figures.',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: Colors.grey, fontSize: 16),
                    ),
                  ],
                ),
              ),
            )
          : ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.fromLTRB(16.0, 16.0, 16.0, 48.0),
              children: [
                Text(
                  '7-Day Cumulative Summary (${vm.dayCount}/7 days)',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                FinanceSummaryCard(
                  title: 'Cumulative Income',
                  amount: vm.cumulativeIncome,
                  color: Colors.green,
                  icon: Icons.trending_up,
                ),
                FinanceSummaryCard(
                  title: 'Cumulative Expenses',
                  amount: vm.cumulativeExpenses,
                  color: Colors.red,
                  icon: Icons.trending_down,
                ),
                FinanceSummaryCard(
                  title: 'Cumulative Savings',
                  amount: vm.cumulativeSavings,
                  color: Colors.blue,
                  icon: Icons.account_balance_wallet,
                ),
                const SizedBox(height: 20),
                const Text(
                  'Category Spending Breakdown',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                Card(
                  elevation: 1,
                  child: Column(
                    children: vm.cumulativeExpensesByCategory.entries.map((entry) {
                      return ListTile(
                        dense: true,
                        leading: const Icon(Icons.circle, size: 12, color: Colors.teal),
                        title: Text(entry.key.displayName),
                        trailing: Text(
                          '\$${entry.value.toStringAsFixed(2)}',
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                        ),
                      );
                    }).toList(),
                  ),
                ),
                const SizedBox(height: 20),
                const Text(
                  'Daily Log (Sliding 7-Day Window)',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                ...vm.records.asMap().entries.map(
                  (entry) {
                    final index = entry.key + 1;
                    final r = entry.value;
                    return Card(
                      child: ListTile(
                        leading: CircleAvatar(
                          child: Text('$index'),
                        ),
                        title: Text('Day $index Entry'),
                        subtitle: Text(
                          'Income: \$${r.totalIncome.toStringAsFixed(2)} | '
                          'Expenses: \$${r.totalExpenses.toStringAsFixed(2)}\n'
                          'Savings: \$${r.savings.toStringAsFixed(2)}',
                        ),
                      ),
                    );
                  },
                ),
              ],
            ),
    );
  }
}
