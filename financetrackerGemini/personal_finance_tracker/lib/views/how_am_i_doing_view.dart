// Feature 3 View: Displays financial health insights and cumulative metrics.
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../viewmodels/finance_view_model.dart';

class HowAmIDoingView extends StatelessWidget {
  const HowAmIDoingView({super.key});

  @override
  Widget build(BuildContext context) {
    final vm = context.watch<FinanceViewModel>();

    return Scaffold(
      appBar: AppBar(title: const Text('How Am I Doing?')),
      body: vm.records.isEmpty
          ? const Center(
              child: Padding(
                padding: EdgeInsets.all(24.0),
                child: Text(
                  'Add at least one daily record in "Enter Data" to analyze your financial health.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Colors.grey, fontSize: 16),
                ),
              ),
            )
          : ListView(
              padding: const EdgeInsets.all(16.0),
              children: [
                Card(
                  elevation: 2,
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '7-Day Cumulative Metrics',
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                fontWeight: FontWeight.bold,
                              ),
                        ),
                        const Divider(),
                        _metricRow('Days Logged', '${vm.dayCount} / 7'),
                        _metricRow('Avg Daily Income', '\$${vm.avgDailyIncome.toStringAsFixed(2)}'),
                        _metricRow('Avg Daily Expenses', '\$${vm.avgDailyExpenses.toStringAsFixed(2)}'),
                        _metricRow('Avg Daily Savings', '\$${vm.avgDailySavings.toStringAsFixed(2)}'),
                        const SizedBox(height: 8),
                        _metricRow(
                          'Expense-to-Income Ratio',
                          vm.cumulativeIncome > 0
                              ? '${((vm.cumulativeExpenses / vm.cumulativeIncome) * 100).toStringAsFixed(1)}%'
                              : 'N/A',
                        ),
                        _metricRow(
                          'Savings-to-Income Ratio',
                          vm.cumulativeIncome > 0
                              ? '${((vm.cumulativeSavings / vm.cumulativeIncome) * 100).toStringAsFixed(1)}%'
                              : 'N/A',
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                const Text(
                  'Financial Insights',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                ...vm.insights.map((msg) {
                  final isPositive = msg.contains('saving well') || msg.contains('balanced');
                  return Card(
                    color: isPositive ? Colors.green.shade50 : Colors.red.shade50,
                    margin: const EdgeInsets.symmetric(vertical: 6.0),
                    child: ListTile(
                      leading: Icon(
                        isPositive ? Icons.check_circle : Icons.warning_amber_rounded,
                        color: isPositive ? Colors.green.shade700 : Colors.red.shade700,
                        size: 30,
                      ),
                      title: Text(
                        msg,
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          color: isPositive ? Colors.green.shade900 : Colors.red.shade900,
                        ),
                      ),
                    ),
                  );
                }),
              ],
            ),
    );
  }

  Widget _metricRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontSize: 14)),
          Text(value, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }
}
