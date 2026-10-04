import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/financial_calculator.dart';
import '../viewmodels/finance_view_model.dart';
import 'widgets/finance_summary_card.dart';

class HowAmIDoingView extends StatelessWidget {
  const HowAmIDoingView({super.key});

  static (IconData, Color) _style(InsightType t) => switch (t) {
        InsightType.overspending => (Icons.warning_amber, Colors.red),
        InsightType.balanced => (Icons.balance, Colors.orange),
        InsightType.savingWell => (Icons.thumb_up, Colors.green),
        InsightType.needsAttention => (Icons.info_outline, Colors.blueGrey),
        InsightType.noData => (Icons.hourglass_empty, Colors.grey),
      };

  String _pct(double ratio) => '${(ratio * 100).toStringAsFixed(1)}% of income';

  @override
  Widget build(BuildContext context) {
    final vm = context.watch<FinanceViewModel>();
    final insight = vm.insight;
    final s = vm.summary;
    final (icon, color) = _style(insight.type);
    final theme = Theme.of(context);
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Card(
          color: color.withValues(alpha: 0.12),
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              children: [
                Icon(icon, size: 56, color: color),
                const SizedBox(height: 12),
                Text(
                  insight.message,
                  textAlign: TextAlign.center,
                  style: theme.textTheme.headlineSmall
                      ?.copyWith(color: color, fontWeight: FontWeight.bold),
                ),
              ],
            ),
          ),
        ),
        if (s.dayCount > 0) ...[
          const SizedBox(height: 16),
          Text('Based on ${s.dayCount} day(s) of data',
              style: theme.textTheme.titleMedium),
          const SizedBox(height: 8),
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            childAspectRatio: 1.6,
            children: [
              FinanceSummaryCard(
                  label: 'Avg daily income', amount: s.avgDailyIncome),
              FinanceSummaryCard(
                label: 'Avg daily expenses',
                amount: s.avgDailyExpenses,
                color: Colors.red,
                badge: _pct(s.expenseRatio),
              ),
              FinanceSummaryCard(
                label: 'Avg daily savings',
                amount: s.avgDailySavings,
                color: Colors.blue,
                badge: _pct(s.savingsRatio),
              ),
            ],
          ),
        ],
      ],
    );
  }
}
