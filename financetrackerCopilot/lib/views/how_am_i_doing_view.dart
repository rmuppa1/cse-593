import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/financial_calculator.dart';
import '../viewmodels/finance_view_model.dart';

class HowAmIDoingView extends StatelessWidget {
  const HowAmIDoingView({super.key});

  @override
  Widget build(BuildContext context) {
    final vm = context.watch<FinanceViewModel>();
    final insight = vm.insight;
    final (color, icon) = switch (insight) {
      FinancialInsight.overspending => (Colors.red, Icons.warning_amber),
      FinancialInsight.balanced => (Colors.orange, Icons.balance),
      FinancialInsight.savingWell => (Colors.green, Icons.savings),
      _ => (Colors.grey, Icons.info_outline),
    };
    final hasData = insight != FinancialInsight.noData;

    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Icon(icon, size: 80, color: color),
          const SizedBox(height: 16),
          Text(
            insight.message,
            textAlign: TextAlign.center,
            style: Theme.of(context)
                .textTheme
                .headlineSmall
                ?.copyWith(color: color, fontWeight: FontWeight.bold),
          ),
          if (hasData) ...[
            const SizedBox(height: 24),
            Text(
                'Avg daily expenses: ${(vm.expenseRatio * 100).toStringAsFixed(1)}% of income',
                textAlign: TextAlign.center),
            Text(
                'Avg daily savings: ${(vm.savingsRatio * 100).toStringAsFixed(1)}% of income',
                textAlign: TextAlign.center),
          ],
        ],
      ),
    );
  }
}
